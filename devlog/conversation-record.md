# Meow Plugin — 开发记录

**日期**: 2026-06-25  
**仓库**: `C:\Users\oem\dev\.obsidian\plugins\meow`

---

## 任务

1. 移除已有的示例逻辑（SampleModal、状态栏、示例命令、全局 DOM 事件、定时器等）
2. 实现 ribbon icon 点击 → 获取选中文字 + 固定提示词 → 通过 OpenAI 兼容 API 发送给 DeepSeek → 返回结果插入光标位置

---

## 改动清单

| 文件 | 操作 | 说明 |
|---|---|---|
| `src/settings.ts` | 重写 | 4 个配置项：`apiKey`（密码框）、`systemPrompt`（文本域）、`apiEndpoint`、`model` |
| `src/api.ts` | 新建 | `callDeepSeek()` — POST 到 OpenAI 兼容端点的 fetch 封装，含错误处理 |
| `src/main.ts` | 重写 | 最小生命周期；cat ribbon icon + `meow-polish` 命令；`polishSelection()` 核心逻辑 |
| `tsconfig.json` | 修改 | 添加 `"moduleResolution": "bundler"`，修复 TS 模块解析 |
| `manifest.json` | 未改 | 已预置为 meow 插件配置 |

### 移除内容

- `SampleModal` 类
- 状态栏文字（`Status bar text`）
- 3 个示例命令（`open-modal-simple`、`replace-selected`、`open-modal-complex`）
- 全局 click DOM 事件 + 5 分钟 interval
- 旧的 `MyPluginSettings` 接口、`DEFAULT_SETTINGS`、`SampleSettingTab`

---

## 最终源代码

### `src/settings.ts`

```ts
import { App, PluginSettingTab, Setting } from 'obsidian';
import MeowPlugin from './main';

export interface MeowPluginSettings {
	apiKey: string;
	systemPrompt: string;
	apiEndpoint: string;
	model: string;
}

export const DEFAULT_SETTINGS: MeowPluginSettings = {
	apiKey: '',
	systemPrompt: 'You are a helpful assistant. Please help polish and improve the following text.',
	apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
	model: 'deepseek-chat',
};

export class MeowSettingTab extends PluginSettingTab {
	plugin: MeowPlugin;

	constructor(app: App, plugin: MeowPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('API key')
			.setDesc('Your DeepSeek API key (stored locally only).')
			.addText((text) => {
				text.inputEl.type = 'password';
				text.setPlaceholder('sk-...')
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value.trim();
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('System prompt')
			.setDesc('Fixed instruction sent alongside the selected text.')
			.addTextArea((text) => {
				text.setPlaceholder('e.g. Correct grammar and spelling errors...')
					.setValue(this.plugin.settings.systemPrompt)
					.onChange(async (value) => {
						this.plugin.settings.systemPrompt = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 4;
			});

		new Setting(containerEl)
			.setName('API endpoint')
			.setDesc('OpenAI-compatible chat completions endpoint.')
			.addText((text) => {
				text.setPlaceholder('https://api.deepseek.com/v1/chat/completions')
					.setValue(this.plugin.settings.apiEndpoint)
					.onChange(async (value) => {
						this.plugin.settings.apiEndpoint = value.trim();
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Model')
			.setDesc('Model name to use (e.g. deepseek-chat, deepseek-reasoner).')
			.addText((text) => {
				text.setPlaceholder('deepseek-chat')
					.setValue(this.plugin.settings.model)
					.onChange(async (value) => {
						this.plugin.settings.model = value.trim();
						await this.plugin.saveSettings();
					});
			});
	}
}
```

### `src/api.ts`

```ts
import { Notice } from 'obsidian';

export interface ChatMessage {
	role: 'system' | 'user';
	content: string;
}

export async function callDeepSeek(
	endpoint: string,
	apiKey: string,
	model: string,
	messages: ChatMessage[],
): Promise<string | null> {
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model,
			messages,
			stream: false,
		}),
	});

	if (!response.ok) {
		const errorBody = await response.text();
		let detail = errorBody;
		try {
			const parsed = JSON.parse(errorBody);
			detail = parsed.error?.message ?? errorBody;
		} catch {
			// use raw text
		}
		new Notice(`API error (${response.status}): ${detail}`);
		return null;
	}

	const data = await response.json() as {
		choices: { message: { content: string } }[];
	};

	const content = data.choices?.[0]?.message?.content;
	if (!content) {
		new Notice('API returned an empty response.');
		return null;
	}

	return content;
}
```

### `src/main.ts`

```ts
import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';
import { callDeepSeek } from './api';
import { DEFAULT_SETTINGS, MeowPluginSettings, MeowSettingTab } from './settings';

export default class MeowPlugin extends Plugin {
	settings!: MeowPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('cat', 'Meow: polish text', (_evt: MouseEvent) => {
			this.polishSelection();
		});

		this.addCommand({
			id: 'meow-polish',
			name: 'Polish selected text',
			editorCallback: (_editor: Editor) => {
				this.polishSelection();
			},
		});

		this.addSettingTab(new MeowSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MeowPluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async polishSelection() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			new Notice('No active editor found.');
			return;
		}

		const editor = view.editor;
		const selectedText = editor.getSelection();
		if (!selectedText) {
			new Notice('Please select some text first.');
			return;
		}

		if (!this.settings.apiKey) {
			new Notice('Please configure your API key in settings.');
			return;
		}

		const notice = new Notice('Sending to DeepSeek...', 0);

		const result = await callDeepSeek(
			this.settings.apiEndpoint,
			this.settings.apiKey,
			this.settings.model,
			[
				{ role: 'system', content: this.settings.systemPrompt },
				{ role: 'user', content: selectedText },
			],
		);

		notice.hide();

		if (result) {
			editor.replaceSelection(result);
		}
	}
}
```

---

## 构建问题与解决

**问题**: `tsc` 报错 `Cannot find module 'obsidian'`

**原因**: TypeScript 5.x 中 `"module": "ESNext"` 没有显式 `moduleResolution` 时默认使用 `classic`，无法正确解析 `node_modules`。

**修复**: 在 `tsconfig.json` 中添加 `"moduleResolution": "bundler"`。

---

## 数据存储

设置通过 Obsidian 的 `this.saveData()` / `this.loadData()` 持久化到：

```
<Vault>/.obsidian/plugins/meow/data.json
```

结构：

```json
{
  "apiKey": "sk-...",
  "systemPrompt": "...",
  "apiEndpoint": "https://api.deepseek.com/v1/chat/completions",
  "model": "deepseek-chat"
}
```

> **安全提示**: API Key 以明文存储于本地文件，不会上传到任何远程服务。

---

## DeepSeek API 参考

| 项目 | 值 |
|---|---|
| Base URL | `https://api.deepseek.com` |
| Chat endpoint | `/v1/chat/completions` |
| 鉴权 | `Authorization: Bearer <api_key>` |
| 模型 | `deepseek-chat`、`deepseek-reasoner` |
| 兼容性 | 完全兼容 OpenAI SDK 格式 |

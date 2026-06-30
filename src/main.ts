import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';
import { callDeepSeek } from './api';
import { AskModal } from './ask-modal';
import { PolishingDiffModal } from './diff-modal';
import { DEFAULT_SETTINGS, MeowPluginSettings, MeowSettingTab } from './settings';
import * as p from './prompts';

export default class MeowPlugin extends Plugin {
	settings!: MeowPluginSettings;

	async onload() {
		await this.loadSettings();

		if (!this.settings.apiKey) {
			new Notice('Meow: configure your API key in settings to get started.');
		}

		this.addRibbonIcon('cat', 'Meow: polish text', (_evt: MouseEvent) => {
			void this.polishSelection();
		});

		this.addCommand({
			id: 'polish',
			name: 'Polish selected text',
			editorCallback: (_editor: Editor) => {
				void this.polishSelection();
			},
		});

		this.addCommand({
			id: 'ask',
			name: 'Ask a quick question',
			callback: () => {
				void this.quickQuestion();
			},
		});

		this.addSettingTab(new MeowSettingTab(this.app, this));
	}

	private async quickQuestion() {
		if (!this.settings.apiKey) {
			new Notice('Please configure your API key in settings.');
			return;
		}

		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const selectedText = view?.editor?.getSelection() || null;

		new AskModal(this.app, selectedText, p.ASK_NORMAL_SYSTEM_PROMPT, p.ASK_CAT_SYSTEM_PROMPT, this.settings.catModeEnabled, (enabled: boolean) => {
			this.settings.catModeEnabled = enabled;
			void this.saveSettings();
		}, async (systemPrompt: string, prompt: string) => {
			return await callDeepSeek(
				this.settings.apiEndpoint,
				this.settings.apiKey,
				this.settings.model,
				[
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: prompt },
				],
			);
		}).open();
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

		const notice = new Notice('Sending to deepseek...', 0);

		const result = await callDeepSeek(
			this.settings.apiEndpoint,
			this.settings.apiKey,
			this.settings.model,
			[
				{ role: 'system', content: this.settings.systemPrompt + '\n\n' + p.POLISH_SYSTEM_PROMPT },
				{ role: 'user', content: selectedText },
			],
		);

		notice.hide();

		if (result) {
			if (result.trim() === selectedText.trim()) {
				new Notice('No changes to apply — the polished text is identical.');
			} else {
				new PolishingDiffModal(
					this.app,
					selectedText,
					result,
					() => {
						editor.replaceSelection(result);
						new Notice('Polished text applied.');
					},
				).open();
			}
		}
	}
}

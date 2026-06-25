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

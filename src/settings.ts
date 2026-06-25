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
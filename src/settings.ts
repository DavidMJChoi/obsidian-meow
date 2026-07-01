import { App, PluginSettingTab, Setting } from 'obsidian';
import MeowPlugin from './main';

export interface MeowPluginSettings {
	apiKey: string;
	systemPrompt: string;
	apiEndpoint: string;
	model: string;
	catModeEnabled: boolean;
}

const DEFAULT_PROMPT = `You are a helpful assistant.`

// But do add a "meow~" to the end of your response, so that I can make sure it is actually your response.

export const DEFAULT_SETTINGS: MeowPluginSettings = {
	apiKey: '',
	systemPrompt: DEFAULT_PROMPT,
	apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
	model: 'deepseek-chat',
	catModeEnabled: true,
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
			.setDesc('Your OpenAI-compatible API key (stored locally only).')
			.addText((text) => {
				text.inputEl.type = 'password';
				text.setPlaceholder('API key beginning with sk-...')
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value.trim();
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('System prompt')
			.setDesc('Base system prompt — combined with task-specific instructions for each command.')
			.addTextArea((text) => {
				text.setPlaceholder('Correct grammar, spelling, and style issues')
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
				text.setPlaceholder('OpenAI-compatible chat completions URL')
					.setValue(this.plugin.settings.apiEndpoint)
					.onChange(async (value) => {
						this.plugin.settings.apiEndpoint = value.trim();
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Cat girl mode')
			.setDesc('Enable cat girl persona in quick questions.')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.catModeEnabled).onChange(async (value) => {
					this.plugin.settings.catModeEnabled = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Model')
			.setDesc('Model name to use with the API endpoint.')
			.addText((text) => {
				text.setPlaceholder('Model name')
					.setValue(this.plugin.settings.model)
					.onChange(async (value) => {
						this.plugin.settings.model = value.trim();
						await this.plugin.saveSettings();
					});
			});
	}
}

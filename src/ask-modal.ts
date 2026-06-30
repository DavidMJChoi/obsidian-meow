import { Modal, App, Notice, ButtonComponent, Setting } from 'obsidian';

const HIDDEN_CLS = 'meow-ask-hidden';

export class AskModal extends Modal {
	private promptTextArea!: HTMLTextAreaElement;
	private sendBtn!: ButtonComponent;
	private okBtn!: ButtonComponent;
	private copyBtn!: ButtonComponent;
	private responseDiv!: HTMLDivElement;
	private catModeEnabled: boolean;
	private sending = false;
	private hasResponse = false;

	constructor(
		app: App,
		private selectedText: string | null,
		private normalSystemPrompt: string,
		private catSystemPrompt: string,
		catModeEnabled: boolean,
		private onCatModeChange: (enabled: boolean) => void,
		private onSend: (systemPrompt: string, prompt: string) => Promise<string | null>,
	) {
		super(app);
		this.catModeEnabled = catModeEnabled;
	}

	onOpen() {
		const { titleEl, contentEl } = this;
		titleEl.setText('Quick question');

		// Selected text note
		if (this.selectedText) {
			const truncated =
				this.selectedText.length > 120
					? this.selectedText.slice(0, 120) + '...'
					: this.selectedText;
			contentEl.createEl('p', {
				cls: 'meow-ask-selection-note',
				text: `Selected text: "${truncated}"`,
			});
		}

		// Prompt input — full-width with label above
		contentEl.createEl('label', { text: 'Your question', cls: 'meow-ask-label' });
		this.promptTextArea = contentEl.createEl('textarea', {
			cls: 'meow-ask-textarea',
			attr: { placeholder: 'Ask something...', rows: '3' },
		});

		// Cat girl mode toggle
		new Setting(contentEl)
			.setName('Cat girl mode')
			.addToggle((toggle) =>
				toggle.setValue(this.catModeEnabled).onChange((value) => {
					this.catModeEnabled = value;
					this.onCatModeChange(value);
				}),
			);

		// Response area (hidden initially)
		this.responseDiv = contentEl.createDiv({ cls: 'meow-ask-response' });
		this.responseDiv.addClass(HIDDEN_CLS);

		// Button row
		const buttonBar = contentEl.createDiv({ cls: 'meow-ask-buttons' });

		this.okBtn = new ButtonComponent(buttonBar);
		this.okBtn.setButtonText('OK').onClick(() => this.close());
		this.okBtn.buttonEl.addClass(HIDDEN_CLS);

		this.copyBtn = new ButtonComponent(buttonBar);
		this.copyBtn
			.setButtonText('Copy')
			.onClick(() => { void this.copyToClipboard(); });
		this.copyBtn.buttonEl.addClass(HIDDEN_CLS);

		this.sendBtn = new ButtonComponent(buttonBar);
		this.sendBtn
			.setButtonText('Send')
			.setCta()
			.onClick(() => { void this.handleSend(); });

		// Enter: Send (before response), Copy (after response)
		this.scope.register([], 'Enter', (evt) => {
			if (this.sending) return false;
			if (evt.shiftKey) return false;
			if (this.hasResponse) {
				void this.copyToClipboard();
			} else {
				void this.handleSend();
			}
			return false;
		});

		// Block Escape during sending
		this.scope.register([], 'Escape', (evt) => {
			if (this.sending) return false;
			this.close();
			return false;
		});
	}

	private async handleSend() {
		const prompt = this.promptTextArea.value.trim();
		if (!prompt) {
			new Notice('Please enter a question.');
			return;
		}

		this.sending = true;
		this.promptTextArea.disabled = true;
		this.sendBtn.setButtonText('Sending...');
		this.sendBtn.buttonEl.disabled = true;

		// Build full prompt
		let fullPrompt: string;
		if (this.selectedText) {
			fullPrompt = `Context:\n"""\n${this.selectedText}\n"""\n\nQuestion: ${prompt}`;
		} else {
			fullPrompt = prompt;
		}

		const systemPrompt = this.catModeEnabled ? this.catSystemPrompt : this.normalSystemPrompt;
		const result = await this.onSend(systemPrompt, fullPrompt);

		this.sending = false;

		if (result !== null) {
			// Success
			this.hasResponse = true;
			this.responseDiv.removeClass(HIDDEN_CLS);
			this.responseDiv.setText(result);
			this.responseDiv.setAttribute('data-result', result);

			this.sendBtn.buttonEl.addClass(HIDDEN_CLS);
			this.okBtn.buttonEl.removeClass(HIDDEN_CLS);
			this.copyBtn.buttonEl.removeClass(HIDDEN_CLS);
		} else {
			// Error — already shown by callDeepSeek, reset to Ready
			this.promptTextArea.disabled = false;
			this.sendBtn.setButtonText('Send');
			this.sendBtn.buttonEl.disabled = false;
		}
	}

	private async copyToClipboard() {
		await navigator.clipboard.writeText(
			this.responseDiv.getAttribute('data-result') ?? '',
		);
		new Notice('Copied to clipboard.');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

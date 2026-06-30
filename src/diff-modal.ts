import { Modal, App, Setting } from 'obsidian';
import { diffWords } from 'diff';

export class PolishingDiffModal extends Modal {
	private accepted = false;

	constructor(
		app: App,
		private originalText: string,
		private polishedText: string,
		private onAccept: () => void,
	) {
		super(app);
	}

	onOpen() {
		const { titleEl, contentEl } = this;
		titleEl.setText('Polishing preview');

		const diffContainer = contentEl.createDiv({ cls: 'meow-diff-container' });

		const changes = diffWords(this.originalText, this.polishedText);

		for (const change of changes) {
			if (change.removed) {
				diffContainer.createSpan({
					cls: 'meow-diff-removed',
					text: change.value,
				});
			} else if (change.added) {
				diffContainer.createSpan({
					cls: 'meow-diff-added',
					text: change.value,
				});
			} else {
				diffContainer.appendText(change.value);
			}
		}

			let acceptBtn: HTMLElement | undefined;

		new Setting(contentEl)
			.setName('Apply these changes?')
			.addButton((btn) => {
				btn
					.setButtonText('Accept')
					.setCta()
					.onClick(() => {
						if (this.accepted) return;
						this.accepted = true;
						this.onAccept();
						this.close();
					});
				acceptBtn = btn.buttonEl;
			})
			.addButton((btn) =>
				btn
					.setButtonText('Reject')
					.onClick(() => {
						this.close();
					}),
			);

		if (acceptBtn) acceptBtn.focus();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

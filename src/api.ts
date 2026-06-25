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

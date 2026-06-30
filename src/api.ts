import { Notice, requestUrl } from 'obsidian';

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
	const response = await requestUrl({
		url: endpoint,
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
		throw: false,
	});

	if (response.status < 200 || response.status >= 300) {
		let detail = response.text;
		try {
			const parsed = JSON.parse(response.text) as { error?: { message?: string } };
			detail = parsed.error?.message ?? response.text;
		} catch {
			// use raw text
		}
		new Notice(`API error (${response.status}): ${detail}`);
		return null;
	}

	const data = response.json as {
		choices: { message: { content: string } }[];
	};

	const content = data.choices?.[0]?.message?.content;
	if (!content) {
		new Notice('API returned an empty response.');
		return null;
	}

	return content;
}

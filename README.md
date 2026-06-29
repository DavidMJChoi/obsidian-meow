# obsidian-meow

An Obsidian plugin that improves your writing — grammar fixes, wording improvements, and more, all without leaving your editor.

Select text, click the cat icon (or run the **Polish selected text** command), and a diff preview modal appears — review the changes (additions in green, removals in red), then Accept or Reject.

The polishment is accomplished by sending the selected text (with a system prompt) to an LLM, and replace the selected text with its response.

The API endpoint is configurable, so any OpenAI-compatible chat completions provider works too.

## Source code structure

```
src/
├── main.ts        — Plugin entry point: registers the ribbon icon, command, and settings tab
├── api.ts         — DeepSeek / OpenAI-compatible chat completions API client
├── diff-modal.ts  — Modal for reviewing AI-polished text with word-level diff highlighting
└── settings.ts    — Settings interface, defaults, and the settings tab UI
```

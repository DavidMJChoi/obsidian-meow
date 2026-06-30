# obsidian-meow
![alt text](obsidian-meow-v1.png)
An Obsidian plugin that polishes your writing and answers quick questions — powered by an LLM, all without leaving your editor.

## Features

**Polish selected text** — select text, run the command, and a diff preview modal shows changes with word-level highlighting (additions in green, removals in red strikethrough). Accept or reject with a click.

**Ask a quick question** — open a lightweight Q&A modal, type a prompt (optionally combined with selected text), and get an inline response. Toggle **Cat girl mode** for a playful feline persona, or keep it professional.

The API endpoint is configurable, so any OpenAI-compatible chat completions provider works (DeepSeek by default).

## Commands

| Command | ID | Description |
|---------|-----|-------------|
| Polish selected text | `meow-polish` | Polishes the selected text via LLM, shows diff preview before applying |
| Ask a quick question | `meow-ask` | Opens a Q&A modal — ask anything, see the response inline |

## Privacy

This plugin sends selected text or your questions to an external LLM service to generate responses. By default, the endpoint is **DeepSeek** (`api.deepseek.com`). You can configure any OpenAI-compatible provider in settings.

- **What is sent**: the text you select (polish) or type (quick question), plus a system prompt
- **Where it goes**: the API endpoint configured in settings (DeepSeek by default)
- **API key**: stored locally in your vault's `data.json` in plain text — never sent anywhere except to the configured endpoint
- **No telemetry**: the plugin does not collect analytics, usage data, or vault contents
- **Opt-in only**: no network requests occur until you explicitly run a command

## Source code structure

```
src/
├── main.ts        — Plugin entry point: lifecycle, command registration
├── api.ts         — OpenAI-compatible chat completions API client
├── prompts.ts     — System prompt constants for each feature
├── ask-modal.ts   — Q&A modal with cat mode toggle, Enter-to-send
├── diff-modal.ts  — Diff preview modal with Accept/Reject confirmation
└── settings.ts    — Settings interface, defaults, and settings tab UI
```

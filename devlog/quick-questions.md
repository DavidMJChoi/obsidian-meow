# Quick Questions Feature

* **Date**: 20260630
* **Author**: Claude Code

## Original Prompt


Now plan on adding new features. Please write a document similar to @devlog/diff-comparison.md in @devlog\                                   
                                                                         
grill me on any unclear specification below. grill me in the document written. before I respond to your grill, do not proceed to any coding.   
                                                                         
Feature: asking quick questions.                                         
                                                                         
1. New obsidian command: id: 'meow-ask', name: 'Ask a quick question'
2. New modal in new file ask-modal.ts: allow the user to write a short prompt, combine the prompt with selected text (if any), use it as user   
prompt. User click a send button to send the prompt to LLM, and the modal waits for the response and display it underneath the user input.   
After the response is displayed, change the send button to OK button, when clicked, close the modal. Also append a new button COPY to copy the 
response to the right of OK button.                                      
3. modify system prompt so that it is universal (I will do it manually before this task is sent to you). Each handler like polishSelection()    
should construct their own system prompt combined with the one in the setting.                                                                 
4. the new exclusive system prompt for polishSelection() will be
```                                                                      
Please help polish and improve the following text. Fix any grammar error. Never change the original meaning of the text given to you.       
                                                                         
In your response, please include only the polished text since your response will be used directly to replace text.                          
```                                                                      
5. the exclusive system prompt for our new feature quickQuestion() will be                                                                       
```                                                                      
You are a lovely little cat girl. Now answer my quetions within 100 words.                                                                   
```

## Purpose

Add a new "Ask a quick question" command that opens a lightweight Q&A modal — the user types a short prompt, optionally combined with selected text, sends it to the LLM, and sees the response inline without touching the editor.

## Technology

- **Obsidian `Modal`** — dialog class for the Q&A window
- **Obsidian `Setting`** — for input field and buttons
- **`callDeepSeek`** (existing `api.ts`) — API client, reused as-is

---

## Specification Review — Grilling Questions

> Answer these before any code is written.

### Q1 — System prompt combination

Each handler will construct its own system prompt "combined with" the settings system prompt. The settings prompt is now a short universal base (`"You are a helpful assistant."`). The handler-specific prompts are task instructions.

**How exactly should they be combined?** Two reasonable options:

| Option | Result (simplified) |
|--------|---------------------|
| **A**: Concatenate into a single system message | `{ role: 'system', content: basePrompt + '\n\n' + handlerPrompt }` |
| **B**: Send as two separate system messages | `[{ role: 'system', content: basePrompt }, { role: 'system', content: handlerPrompt }]` |

Most LLM APIs accept multiple system messages, but some older ones don't. Option A (single concatenated message) is safer and more portable. Which do you prefer?

**Follow-up**: Does the ask modal also prepend the base system prompt, or does the cat-girl prompt replace it entirely? The cat-girl prompt reads like a standalone persona. If combined, it'd be: `"You are a helpful assistant.\n\nYou are a lovely little cat girl..."` — a bit contradictory. Should the ask feature skip the base prompt?

**ANSWER TO Q1**: Option A. Skip the base prompt.

---

### Q2 — Ask modal: selected text + user prompt format

When there IS selected text, how should it be combined with the user's typed prompt?

| Option | Example |
|--------|---------|
| **A**: Context block prepended | `Context:\n"""\n{selectedText}\n"""\n\nQuestion: {userPrompt}` |
| **B**: Just concatenated | `{selectedText}\n\n{userPrompt}` |
| **C**: Selected text becomes the focus, question is the instruction | `Regarding the following text:\n"""\n{selectedText}\n"""\n\n{userPrompt}` |

**ANSWER TO Q2**: Option A

---

### Q3 — Ask modal: editor dependency

Currently `meow-polish` uses `editorCallback` which requires an active editor. For `meow-ask`:

- Should the command work **without an editor open**? (pure Q&A, no selected text)
- If yes, should it use a regular callback (no editor parameter) and optionally grab selection if available?
- If the user has no editor AND no selection, is the modal still useful? (just a chat box)

**ANSWER TO Q3**: Yes, the command should work without an editor open. It should use a regular callback and optionally grab selection. The modal is still useful without editor and no selection.

---

### Q4 — Ask modal: button behavior details

**Send → OK transition**: After clicking Send, it calls the API. Once the response arrives:
- Send button becomes **OK** (closes modal, no other action)
- A new **COPY** button appears next to OK (copies response to clipboard)

**Confirmations**:
- COPY should show a brief `Notice('Copied to clipboard.')` — yes?
- OK just closes — does it also insert the response into the editor? (I assume no, since this is "ask a question" not "edit text")
- If the API call fails, what happens? Show error in the modal (keep it open)? Or close it + notice?

**Loading state**: While waiting for the API response, should the Send button show a spinner/text change (e.g. "Sending...") and be disabled?

**ANSWER TO Q4**: Yes, show a brief notice. Do not insert the response when OK is clicked. If the call fails, show error in the modal and keep it open. Make sure that there is a way to close the modal (I suppose by default there is). Show a text change in sending button (Sending...). No need to add a spinner since it may be unnecessary complication.

---

### Q5 — Ask modal: Escape / dismiss behavior

- Before sending: Escape closes the modal, no side effects — fine?
- After sending but before response: should Escape cancel the request? (fetch can be aborted with AbortController)
- After response arrived: Escape same as OK (just close)?

**ANSWER TO Q5**: Disable Escape after sending but before response. Escape closes the modal normally before sending and after response arrived.

---

### Q6 — `ChatMessage` interface scope

Currently in `api.ts`:
```ts
export interface ChatMessage {
    role: 'system' | 'user';
    content: string;
}
```

The ask modal doesn't need an `assistant` role (responses are displayed, not sent back). But the `callDeepSeek` function signature won't change. Is the existing interface fine as-is for both features?

**ANSWER TO Q6**: I don't get your question, elaborate it.

**ELABORATION**: `ChatMessage` currently only allows `role: 'system' | 'user'`. I was asking whether we should expand it to include `'assistant'` for future multi-turn conversations. But neither the polish flow nor the ask flow retains conversation history — each sends one request and displays the response. So the interface is fine as-is. No change needed.

**RESOLUTION**: Keep `ChatMessage` as-is. No `assistant` role needed.

---

### Q7 — Command registration type

`meow-polish` uses `editorCallback` (requires active Markdown editor). For `meow-ask`:

- If it needs selected text optionally but works without an editor: use `callback` instead of `editorCallback`
- If it always needs an editor: use `editorCallback`

Which one?

**ANSWER TO Q7**: use `callback` as I've stated in ANSWER TO Q3.

---

### Q8 — Settings tab description update

The System prompt setting currently says: *"Fixed instruction sent alongside the selected text."* After restructuring, it becomes a base personality that each handler combines with its own task prompt. Should the description change to something like *"Base system prompt — combined with task-specific instructions for each command."*?

**ANSWER TO Q8**: yes. change the description.

---

## Implementation Summary

### Decisions applied

| Q | Decision | Implemented |
|---|----------|-------------|
| Q1 | Single concatenated system message for polish; ask skips base prompt | ✓ |
| Q2 | Selected text as context block: `Context:\n"""\n{text}\n"""\n\nQuestion: {prompt}` | ✓ |
| Q3 | `callback` (not `editorCallback`), works without editor, optionally grabs selection | ✓ |
| Q4 | COPY → notice; OK → close only; error → keep modal open; "Sending..." text | ✓ |
| Q5 | Escape disabled during API call, normal otherwise | ✓ |
| Q6 | `ChatMessage` unchanged | ✓ |
| Q7 | `callback` command type | ✓ |
| Q8 | Settings description updated | ✓ |

### Files changed

| File | Action | What |
|------|--------|------|
| `src/ask-modal.ts` | **created** | `AskModal` — full-width textarea, Enter-to-send, cat/normal mode toggle, OK+COPY after response |
| `src/prompts.ts` | **created** | Extracted prompt constants: `POLISH_SYSTEM_PROMPT`, `ASK_NORMAL_SYSTEM_PROMPT`, `ASK_CAT_SYSTEM_PROMPT` |
| `src/main.ts` | modified | `meow-ask` command, `quickQuestion()` method, combined polish prompt, passes cat mode setting to modal |
| `src/settings.ts` | modified | Updated system prompt description; added `catModeEnabled` setting + settings tab toggle |
| `styles.css` | modified | Added `.meow-ask-label`, `.meow-ask-textarea`, `.meow-ask-selection-note`, `.meow-ask-buttons` |

### Ask modal layout

```
┌──────────────────────────────────────┐
│ Quick Question                       │
├──────────────────────────────────────┤
│ Selected text: "..." (if any)        │
│                                      │
│ Your question                        │
│ ┌──────────────────────────────────┐ │
│ │ (full-width textarea)            │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ☑ Cat Girl Mode                     │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Response (hidden until reply)    │ │
│ └──────────────────────────────────┘ │
│                                      │
│                [COPY]  [OK]          │
│                [Send]                │
└──────────────────────────────────────┘
```

### Ask modal states & key behaviors

| State | Send btn | OK btn | COPY btn | TextArea | Escape | Enter key |
|-------|----------|--------|----------|----------|--------|-----------|
| **Ready** | visible, "Send" | hidden | hidden | enabled | closes | sends |
| **Sending** | "Sending...", disabled | hidden | hidden | disabled | blocked | blocked |
| **Response** | hidden | visible | visible | disabled | closes | copies |
| **Error** | visible, "Send" | hidden | hidden | enabled | closes | sends |

- **Enter** → Send (Ready/Error states), Copy (Response state); **Shift+Enter** → newline
- **Cat Girl Mode** checkbox reads from `catModeEnabled` plugin setting, persists to disk on toggle
- Both system prompts reside in `src/prompts.ts`, selected at send time based on checkbox

## Task List

- [x] Create `src/prompts.ts` — extracted prompt constants
- [x] Create `src/ask-modal.ts` — `AskModal` with full-width input, checkbox, button state machine
- [x] Add `meow-ask` command (callback type, no editor required)
- [x] Add `quickQuestion()` method — optionally grabs selection, passes cat mode setting
- [x] Update `polishSelection()` to combine base + polish system prompts
- [x] Update system prompt description in `src/settings.ts`
- [x] Add `catModeEnabled` to plugin settings + settings tab toggle
- [x] Enter to Send, Shift+Enter for newline
- [x] Enter copies to clipboard after response arrives
- [x] Improved cat girl prompt (explicit `meow~`, mannerisms)
- [x] Add ask modal CSS to `styles.css`
- [x] Build and verify (`npm run build`)

### Verification

1. `npm run build` — no errors
2. "Ask a quick question" works from command palette (no editor needed)
3. "Your question" label above full-width textarea
4. Enter sends; Shift+Enter inserts newline
5. "Sending..." disabled state while waiting
6. Response appears; Send → OK + COPY; Enter copies
7. OK closes modal without inserting text
8. With selected text → "Selected text: ..." note + context block in prompt
9. Cat Girl Mode checkbox toggles between normal and cat-girl system prompts
10. Cat mode preference persists across modal opens (stored in settings)
11. API error shown in modal, modal stays open for retry
12. Escape blocked during Sending, works normally before/after
13. "Polish selected text" still works with combined base+polish prompt
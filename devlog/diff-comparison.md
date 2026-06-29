# Diff Comparison Feature

* **Date**: 20260629
* **Author**: Claude Code + DeepSeek V4 Pro

## Purpose

Replace the direct `editor.replaceSelection()` flow with a diff preview modal so users can review AI-polished text before accepting or rejecting changes.

## Technology

- **Obsidian `Modal`** — native dialog class for the preview window
- **`diff` npm package** (`diffWords`) — word-level text diffing
- **CSS** — Obsidian theme-compatible highlight colors

## Task List

- [x] Install `diff` npm package
- [x] Create `src/diff-modal.ts` — `PolishingDiffModal` class
- [x] Modify `src/main.ts` — wire modal into `polishSelection()` flow
- [x] Update `styles.css` — diff container, removed-text, added-text styles
- [x] Focus Accept button by default (leftmost, focused on open)
- [x] Skip modal when polished text is identical to original (show notice instead)
- [x] Build and verify (`npm run build`)

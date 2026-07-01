# Release Readiness — Grilling Questions

* **Date**: 20260630

---

## 🔴 Critical — must fix before any release

### 1. API key exposed in Git history

`data.json` contains a live DeepSeek API key (`sk-708d9d0f...`). The `.gitignore` was updated to exclude `data.json`, but it was previously **commented out** (`# data.json`), meaning `data.json` was tracked in earlier commits.

**Actions:**
- [x] **Rotate the API key immediately** — generate a new one at console.deepseek.com, revoke the old one
- [x] Run `git rm --cached data.json` to untrack it from future commits
- ~~[ ] Run `git log --oneline -- data.json` to see which commits contain it. If pushing to a public remote, consider rewriting history with `git filter-branch` or BFG~~
- Key revoked. no need to do this.

### 2. `versions.json` mismatch

```json
{ "1.0.0": "1.0.0" }
```

`manifest.json` version is `"0.0.1"` — they must agree. The version-bump script (`npm run version`) updates both, but the current state is out of sync.

**Actions:**
- [x] Run `npm run version` with the target release version, or manually set both to match (e.g. `"1.0.0"`)

### 3. `package.json` still has template values

| Field | Current | Should be |
|-------|---------|-----------|
| `name` | `"obsidian-sample-plugin"` | `"obsidian-meow"` or `"meow"` |
| `description` | `"This is a sample plugin for Obsidian..."` | Something real |
| `license` | `"0-BSD"` | `"MIT"` (matches LICENSE file) |

---

## 🟡 Important — should fix before release

### 4. `manifest.json` description is too narrow

Current: `"LLM-based grammar checking assistant"`

Now the plugin has two features (polish + quick questions). Suggest: `"LLM-powered text polishing and quick Q&A — grammar fixes, wording improvements, and instant answers without leaving your editor."`

### 5. `manifest.json` `minAppVersion` is unrealistic

Current: `"0.0.1"`. This implies compatibility with every Obsidian version ever, which is almost certainly false. The plugin uses `Modal`, `Setting.addToggle`, `scope.register`, which require a reasonably modern Obsidian.

**Action:**
- [x] Test on the oldest Obsidian version you intend to support, or set to `"1.0.0"` as a safe baseline (the APIs used have been stable since well before 1.0)

### 6. Network call & privacy disclosure

AGENTS.md states:
> "Only make network requests when essential to the feature."
> "Clearly disclose any external services used, data sent, and risks."
> "Introduce network calls without an obvious user-facing reason and documentation" is a DON'T.

Current README mentions the API endpoint is configurable but doesn't explicitly disclose:
- Selected text / questions are sent to an external LLM service (DeepSeek by default)
- The API key is stored locally in plain text
- No data is collected by the plugin itself, but the LLM provider processes the text

**Actions:**
- [x] Add a **Privacy** section to README.md
- [x] Optionally add a consent/acknowledgment on first use (settings could have a note)

### 7. `manifest.json` `version` — what version to release?

Current: `"0.0.1"`. First public release should be at least `"1.0.0"` following SemVer. Or `"0.1.0"` if you want to signal pre-stability.

---

## 🟢 Nice to have

### 8. Empty `authorUrl` and `fundingUrl`

Fine to leave empty, but `authorUrl` could point to your GitHub profile.

### 9. Bundle size

The `diff` npm package adds ~15 KB to the bundle. `esbuild.config.mjs` has `minify: true` for production ✓. Should verify the final `main.js` isn't unexpectedly large.

### 10. `eslint` check

Run `npm run lint` — ensure zero warnings before release. The GitHub Action (if set up) will fail otherwise.

### 11. First-run experience

New users install the plugin, open it, and see... nothing until they configure an API key. Consider:
- A settings hint on first load: `new Notice('Meow: configure your API key in settings to get started.')` if `apiKey` is empty
- A link to DeepSeek's API key page in settings description

### 12. Mobile compatibility

`isDesktopOnly: false` — the plugin claims mobile support. `navigator.clipboard.writeText()` (used in ask-modal for Copy) works on modern mobile browsers, but worth a quick smoke test.

### 13. GitHub release setup

For community plugin submission:
- [x] Create a GitHub release with tag matching `manifest.json` version (no leading `v`)

---

## Summary

```
🔴 Rotate leaked API key + untrack data.json
🔴 Sync versions.json with manifest.json
🔴 Fix package.json template values (name, description, license)
🟡 Update manifest.json description + minAppVersion
🟡 Add privacy/external-service disclosure to README
🟡 Decide release version number
🟢 Lint, bundle check, mobile test, first-run UX
```

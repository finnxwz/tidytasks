# TidyTasks

**Automatically move completed tasks to the bottom of each Markdown task list, keeping subtasks attached and surrounding text in place.**

TidyTasks automatically moves completed tasks to the bottom of each Markdown task list in Obsidian. Subtasks stay attached to their parent, and surrounding text stays in place. Keep using your usual Markdown checkboxes—no separate task manager or new workflow required.

Open tasks come first, in-progress tasks follow, and completed tasks come last. Within the completed group, the most recently completed task appears first.

TidyTasks is free to use, with no paid features, accounts, telemetry or external services. The plugin runs locally and does not require network access.

## Behavior

After an existing parent task changes status, TidyTasks waits for 0.5 seconds without further edits and sorts each contiguous task block: open `[ ]` first, in progress `[/]` second, completed `[x]` / `[X]` last. Newly completed tasks go to the top of the completed group, newest first, including multiple observed changes within one debounce interval. Open and in-progress tasks keep their relative order.

For example, completing A and then B in a list A, B, C produces open C followed by completed B, A. Completion order is recorded only during the pending debounce, then carried by the Markdown order itself. Existing completed tasks are not reversed. No timestamps or task IDs are written to your notes. Simultaneous batch changes have no observable click chronology, so their document order is used.

```markdown
- [x] Finished parent
  - [ ] Its child
- [ ] Still open
```

becomes:

```markdown
- [ ] Still open
- [x] Finished parent
  - [ ] Its child
```

- Native Obsidian checkboxes and their theme-controlled appearance remain unchanged.
- Child tasks and indented continuation text move with their parent. Children are not sorted separately.
- Plain text, headings, ordinary list items and unindented blank lines split task blocks; tasks never cross those boundaries.
- Blank lines immediately followed by indented child content belong to the parent.
- `[ ]`, `[/]`, `[x]` and `[X]` are interpreted. Other custom task statuses split blocks. In-progress status can be written as `- [/] Task`; TidyTasks does not replace native checkbox controls or add a new click cycle.
- YAML frontmatter, fenced code, standalone four-space-indented code, Obsidian comments and blockquotes are left alone.
- Unordered markers `-`, `+`, `*` and numbered task markers are supported. Literal numbers are not renumbered.
- Opening notes, editing prose, adding tasks or moving task lines does not start automatic sorting. Changing an existing parent task's status does, whether via a checkbox or Markdown editing. Observed background status changes are supported too. Child status changes alone do not move/sort their parent.
- An existing mixed list can be sorted explicitly with the manual command. No vault-wide startup rewriting occurs.
- Editor changes preserve cursor positions on their original lines and use the Editor API. Background/reading-mode changes use atomic `Vault.process()`.

TidyTasks changes the actual Markdown file, not just its display. Keep backups and test in a separate vault first. It supports desktop, Android and iOS by design; actual mobile device testing is still required before public release.

## Settings and commands

- **Automatic sorting**: turn background sorting on/off.
- **Sort automatically in this note**: a switch in settings for the currently open Markdown note.
- Right-click a Markdown file (or use its file menu) and choose **TidyTasks: exclude note from automatic sorting**. Use the same menu to include it again.
- Excluded notes are listed in settings with an **Include again** button. Exclusions are saved in plugin settings; no manual note properties are required. They follow renames while the plugin is running.
- Optional advanced alternative: set the Boolean YAML property `tidytasks: false`. It takes precedence over the per-note switch. Remove the property or set it to `true` to release that override. The switch is disabled while this override is present.
- **Typing delay**: 500–1500 ms (default 500 ms).
- Command palette: **TidyTasks: Sort tasks in current note**. Works even if automatic sorting is disabled or the note is excluded, because it is an explicit action.
- Command palette: **TidyTasks: Include or exclude current note from automatic sorting**.

Undoing only a reordering does not restart automatic sorting: the statuses have not changed. Undoing a checkbox/status change is a real status change and can trigger sorting. Actual Obsidian undo grouping still needs manual verification. The tracker conservatively recognizes existing tasks by their parent text; changing the text and status simultaneously may be treated as a new task rather than an existing status change.

## About the author

Created by [Finn-Christopher-Krause / @finnxwz](https://github.com/finnxwz). TidyTasks is a small, focused project built around a simple idea: completed tasks should move out of the way without changing how you write your notes.

## Feedback and support

Found a bug or have a suggestion? Open an issue in this repository's **GitHub Issues** tab. Include your Obsidian version, device/platform, a small Markdown example and what you expected to happen. Please remove private note content before sharing examples.

The lint configuration uses the official recommended rules. Compatibility warnings are currently expected: legacy settings, refreshing their display and slider tooltips are retained for Obsidian before 1.13. npm may also report advisories for development-only dependencies inherited from the Obsidian API/lint packages; those dependencies are not bundled into `main.js`. Review these again before release rather than forcing an API downgrade with `npm audit fix --force`.

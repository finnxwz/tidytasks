# TidyTasks 

**Automatically move completed tasks to the bottom of each Markdown task list, keeping subtasks attached and surrounding text in place.**

Open tasks come first, in-progress tasks follow, and completed tasks come last. Within the completed group, the most recently completed task appears first.

## 💡 Behavoir

After an existing parent task changes status, TidyTasks waits for a short time without further edits and sorts each contiguous task block as explained above: open tasks come first, in-progress tasks follow, and completed tasks come last. Within the completed group, the most recently completed task appears first. Newly completed tasks go to the top of the completed group.

For example, completing A and then B in a list A, B, C produces open C followed by completed B, A. 

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
- YAML frontmatter, fenced code, standalone four-space-indented code, Obsidian comments and blockquotes are left alone.
- Opening notes, editing prose, adding tasks or moving task lines does not start automatic sorting. Changing an existing parent task's status does, whether via a checkbox or Markdown editing. Observed background status changes are supported too. Child status changes alone do not move/sort their parent.
- An existing mixed list can be sorted by simply updating one random checkbox within the list. No vault-wide startup rewriting occurs.

## ⚙️ Settings and commands
- **Automatic sorting**: turn background sorting on/off.
- **Sort automatically in this note**: a switch in settings for the currently open Markdown note.
- Right-click a Markdown file (or use its file menu) and choose **TidyTasks: exclude note from automatic sorting**. Use the same menu to include it again.
- Excluded notes are listed in settings with an **Include again** button. Exclusions are saved in plugin settings; no manual note properties are required. They follow renames while the plugin is running.
- **Typing delay**: 500–1500 ms (default 500 ms).
- **TidyTasks: Sort tasks in current note**. Works even if automatic sorting is disabled or the note is excluded, because it is an explicit action (available in command palette).
- **TidyTasks: Include or exclude current note from automatic sorting** (available in command palette).
 
## 💻 Installation

**directly in Obsidian:** 
- Settings → Community plugins → Browse* → search for **TidyTasks** → *Install* → **Enable**

**via GitHub:**
- Copy `manifest.json`, `main.js` and `styles.css` into `<your vault>/.obsidian/plugins/notemoji/`.
- Reload Obsidian and enable **TidyTasks** under *Settings → Community plugins*.

## 😎 You might also like some other plugins I've made:

- **[TidyTasks](obsidian://show-plugin?id=tidytasks)** - Automatically move completed tasks to the bottom of each Markdown task list, keeping subtasks attached and surrounding text in place.

My plugins are designed to work across Windows, macOS, Android, and iOS.

## ⚠️ Feedback and support

Found a bug or have a suggestion? Open an issue in this repository's **GitHub Issues** tab. Include your Obsidian version, device/platform, a small Markdown example and what you expected to happen. Please remove private note content before sharing examples.
![[tidytasks readme meme.png]]
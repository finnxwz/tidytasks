"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => TidyTasksPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// src/sorter.ts
function indentation(line) {
  let width = 0;
  for (const character of line) {
    if (character === " ") width++;
    else if (character === "	") width += 4 - width % 4;
    else break;
  }
  return width;
}
function protectedLines(lines) {
  const protectedFlags = lines.map(() => false);
  let frontmatter = lines[0]?.replace(/^\uFEFF/, "") === "---";
  let fence;
  let comment = false;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (frontmatter) {
      protectedFlags[index] = true;
      if (index > 0 && /^(---|\.\.\.)\s*$/.test(line)) frontmatter = false;
      continue;
    }
    const marker = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (fence) {
      protectedFlags[index] = true;
      if (marker && marker[1][0] === fence.character && marker[1].length >= fence.length && !marker[2].trim()) {
        fence = void 0;
      }
      continue;
    }
    if (comment || line.includes("%%")) {
      protectedFlags[index] = true;
      if ((line.match(/%%/g)?.length ?? 0) % 2 === 1) comment = !comment;
      continue;
    }
    if (marker) {
      protectedFlags[index] = true;
      fence = { character: marker[1][0], length: marker[1].length };
    }
  }
  return protectedFlags;
}
function taskBlocks(source) {
  const lines = source.split(/\r\n|\n|\r/);
  const blocks = [];
  const protectedFlags = protectedLines(lines);
  const taskAt = (index2) => protectedFlags[index2] ? null : lines[index2]?.match(/^([ \t]*)(?:[-+*]|\d+[.)])[ \t]+\[([ /xX])\](?:[ \t]+.*)?$/);
  let index = 0;
  while (index < lines.length) {
    const first = taskAt(index);
    if (!first || indentation(lines[index]) > 3) {
      index++;
      continue;
    }
    const baseIndent = indentation(lines[index]);
    const tasks = [];
    while (index < lines.length) {
      const match = taskAt(index);
      if (!match || indentation(lines[index]) !== baseIndent) break;
      const task = {
        start: index,
        end: index,
        status: match[2] === " " ? "open" : match[2] === "/" ? "progress" : "done",
        key: lines[index].replace(/\[[ /xX]\]/, "[ ]")
      };
      index++;
      while (index < lines.length) {
        if (!lines[index].trim()) {
          let next = index + 1;
          while (next < lines.length && !lines[next].trim()) next++;
          if (next < lines.length && indentation(lines[next]) > baseIndent) {
            index = next;
            continue;
          }
          break;
        }
        if (indentation(lines[index]) <= baseIndent) break;
        index++;
      }
      task.end = index - 1;
      tasks.push(task);
    }
    blocks.push(tasks);
  }
  return blocks;
}
function getTasks(source) {
  return taskBlocks(source).flat();
}
function sortTasks(source, completedOrder = /* @__PURE__ */ new Map()) {
  const endings = source.match(/\r\n|\n|\r/g) ?? [];
  const lines = source.split(/\r\n|\n|\r/);
  const output = [...lines];
  const lineMap = lines.map((_, index) => index);
  const changes = [];
  for (const tasks of taskBlocks(source)) {
    const start = tasks[0].start;
    const end = tasks[tasks.length - 1].end;
    const completed = tasks.filter((task) => task.status === "done").sort((left, right) => (completedOrder.get(right.start) ?? 0) - (completedOrder.get(left.start) ?? 0));
    const sorted = [
      ...tasks.filter((task) => task.status === "open"),
      ...tasks.filter((task) => task.status === "progress"),
      ...completed
    ];
    if (sorted.every((task, position) => task === tasks[position])) continue;
    let destination = start;
    for (const task of sorted) {
      for (let original = task.start; original <= task.end; original++) {
        output[destination] = lines[original];
        lineMap[original] = destination++;
      }
    }
    changes.push({
      startLine: start,
      endLine: end,
      text: output.slice(start, end + 1).map((line, offset) => line + (start + offset < end ? endings[start + offset] : "")).join("")
    });
  }
  return {
    text: output.map((line, position) => line + (endings[position] ?? "")).join(""),
    changes,
    lineMap
  };
}

// src/task-tracker.ts
var TaskTracker = class {
  constructor(source) {
    this.tasks = [];
    this.nextId = 0;
    this.sequence = 0;
    this.completed = /* @__PURE__ */ new Map();
    this.observe(source);
  }
  /** The Markdown order now carries recency; priorities are only needed during debounce. */
  acceptSorted(source) {
    this.observe(source);
    this.completed.clear();
  }
  observe(source) {
    const current = getTasks(source);
    const available = /* @__PURE__ */ new Map();
    for (const task of this.tasks) {
      const group = available.get(task.key) ?? [];
      group.push(task);
      available.set(task.key, group);
    }
    const matches = /* @__PURE__ */ new Map();
    for (const task of current) {
      const group = available.get(task.key) ?? [];
      const candidates = group.filter((previous) => previous.status === task.status);
      candidates.sort((left, right) => Math.abs(left.start - task.start) - Math.abs(right.start - task.start));
      if (candidates[0]) {
        matches.set(task, candidates[0]);
        group.splice(group.indexOf(candidates[0]), 1);
      }
    }
    let statusChanged = false;
    const next = [];
    for (const task of current) {
      let previous = matches.get(task);
      if (!previous) {
        previous = available.get(task.key)?.shift();
      }
      const id = previous?.id ?? this.nextId++;
      if (previous && previous.status !== task.status) {
        statusChanged = true;
        if (task.status === "done") this.completed.set(id, ++this.sequence);
        else this.completed.delete(id);
      }
      next.push({ ...task, id });
    }
    const retained = new Set(next.map((task) => task.id));
    for (const id of this.completed.keys()) {
      if (!retained.has(id)) this.completed.delete(id);
    }
    this.tasks = next;
    return {
      statusChanged,
      completedOrder: new Map(next.filter((task) => task.status === "done").map((task) => [task.start, this.completed.get(task.id) ?? 0]))
    };
  }
};

// src/main.ts
var TidyTasksPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.settings = { automatic: true, delay: 500, excludedNotes: [] };
    this.timers = /* @__PURE__ */ new Map();
    this.trackers = /* @__PURE__ */ new Map();
    this.revisions = /* @__PURE__ */ new Map();
    this.editing = /* @__PURE__ */ new Set();
    this.stopped = false;
    this.composing = false;
  }
  async onload() {
    const saved = await this.loadData();
    if (saved && typeof saved === "object") {
      const data = saved;
      if (typeof data.automatic === "boolean") this.settings.automatic = data.automatic;
      if (Array.isArray(data.excludedNotes)) {
        this.settings.excludedNotes = data.excludedNotes.filter((path) => typeof path === "string");
      }
      if (typeof data.delay === "number" && Number.isFinite(data.delay)) {
        this.settings.delay = Math.max(500, Math.min(1500, data.delay));
      }
    }
    this.addSettingTab(new TidyTasksSettingTab(this.app, this));
    this.addCommand({
      id: "sort-current-note",
      name: "Sort tasks in current note",
      editorCallback: (editor, context) => {
        if (context.file) this.sortEditor(editor, context.file);
      }
    });
    this.addCommand({
      id: "toggle-current-note-exclusion",
      name: "Include or exclude current note from automatic sorting",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== "md") return false;
        if (!checking) void this.toggleExcluded(file).catch((error) => this.reportError(error));
        return true;
      }
    });
    this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
      if (!(file instanceof import_obsidian.TFile) || file.extension !== "md") return;
      menu.addItem((item) => item.setTitle(this.settings.excludedNotes.includes(file.path) ? "TidyTasks: include note in automatic sorting" : "TidyTasks: exclude note from automatic sorting").onClick(() => {
        void this.toggleExcluded(file).catch((error) => this.reportError(error));
      }));
    }));
    this.registerEvent(this.app.workspace.on("editor-change", (editor, context) => {
      if (context.file) {
        this.revisions.set(context.file, (this.revisions.get(context.file) ?? 0) + 1);
        this.observe(context.file, editor.getValue());
      }
    }));
    this.registerEvent(this.app.vault.on("modify", (file) => {
      if (file instanceof import_obsidian.TFile) void this.observeFile(file).catch((error) => this.reportError(error));
    }));
    this.registerEvent(this.app.workspace.on("file-open", (file) => {
      if (file) void this.observeFile(file, true).catch((error) => this.reportError(error));
    }));
    this.registerEvent(this.app.vault.on("delete", (file) => {
      if (!(file instanceof import_obsidian.TFile)) return;
      this.cancelTimer(file);
      this.trackers.delete(file);
      this.revisions.delete(file);
    }));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      const matches = (path) => path === oldPath || path.startsWith(`${oldPath}/`);
      if (!this.settings.excludedNotes.some(matches)) return;
      this.settings.excludedNotes = this.settings.excludedNotes.map((path) => matches(path) ? file.path + path.slice(oldPath.length) : path);
      void this.saveData(this.settings).catch((error) => this.reportError(error));
    }));
    this.registerDomEvent(document, "compositionstart", () => {
      this.composing = true;
    });
    this.registerDomEvent(document, "compositionend", () => {
      this.composing = false;
    });
    this.app.workspace.onLayoutReady(() => {
      for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
        if (leaf.view instanceof import_obsidian.MarkdownView && leaf.view.file && !this.stopped) {
          void this.observeFile(leaf.view.file, true).catch((error) => this.reportError(error));
        }
      }
    });
  }
  onunload() {
    this.stopped = true;
    this.clearTimers();
    this.trackers.clear();
    this.revisions.clear();
  }
  clearTimers() {
    for (const timer of this.timers.values()) window.clearTimeout(timer);
    this.timers.clear();
  }
  cancelTimer(file) {
    const timer = this.timers.get(file);
    if (timer !== void 0) window.clearTimeout(timer);
    this.timers.delete(file);
  }
  isExcluded(file) {
    return this.settings.excludedNotes.includes(file.path) || this.app.metadataCache.getFileCache(file)?.frontmatter?.tidytasks === false;
  }
  async toggleExcluded(file) {
    const excluded = this.settings.excludedNotes.includes(file.path);
    this.settings.excludedNotes = excluded ? this.settings.excludedNotes.filter((path) => path !== file.path) : [...this.settings.excludedNotes, file.path];
    this.cancelTimer(file);
    await this.saveData(this.settings);
    new import_obsidian.Notice(excluded ? "Note included in automatic sorting. A tidytasks property set to false still takes precedence." : "Note excluded from automatic sorting.");
  }
  reportError(error) {
    console.error("TidyTasks: could not update tasks.", error);
    if (!this.stopped) new import_obsidian.Notice("Could not update tasks. See the developer console for details.");
  }
  observe(file, source) {
    if (this.stopped || file.extension !== "md") return;
    const tracker = this.trackers.get(file);
    if (!tracker) {
      this.trackers.set(file, new TaskTracker(source));
      return;
    }
    const { statusChanged } = tracker.observe(source);
    if (this.isExcluded(file)) {
      this.cancelTimer(file);
      return;
    }
    if (statusChanged || this.timers.has(file)) this.schedule(file);
  }
  async observeFile(file, baseline = false) {
    if (this.stopped || file.extension !== "md" || baseline && this.trackers.has(file)) return;
    const revision = (this.revisions.get(file) ?? 0) + 1;
    this.revisions.set(file, revision);
    const editor = this.findEditor(file);
    const source = editor ? editor.getValue() : await this.app.vault.cachedRead(file);
    if (this.stopped || this.revisions.get(file) !== revision || this.app.vault.getFileByPath(file.path) !== file) return;
    this.observe(file, source);
  }
  completedOrder(file, source) {
    let tracker = this.trackers.get(file);
    if (!tracker) {
      tracker = new TaskTracker(source);
      this.trackers.set(file, tracker);
    }
    return tracker.observe(source).completedOrder;
  }
  schedule(file) {
    if (this.stopped || !this.settings.automatic || this.isExcluded(file) || file.extension !== "md" || this.editing.has(file)) return;
    const previous = this.timers.get(file);
    if (previous !== void 0) window.clearTimeout(previous);
    this.timers.set(file, window.setTimeout(() => {
      this.timers.delete(file);
      void this.sortFile(file).catch((error) => this.reportError(error));
    }, this.settings.delay));
  }
  sortEditor(editor, file) {
    if (this.stopped || this.editing.has(file)) return;
    if (this.composing) {
      this.schedule(file);
      return;
    }
    const source = editor.getValue();
    const result = sortTasks(source, this.completedOrder(file, source));
    if (!result.changes.length) {
      this.trackers.get(file)?.acceptSorted(source);
      return;
    }
    const selections = editor.listSelections().map((selection) => ({
      from: { line: result.lineMap[selection.anchor.line], ch: selection.anchor.ch },
      to: { line: result.lineMap[selection.head.line], ch: selection.head.ch }
    }));
    const scroll = editor.getScrollInfo();
    this.editing.add(file);
    try {
      editor.transaction({
        changes: result.changes.map((change) => ({
          from: { line: change.startLine, ch: 0 },
          to: { line: change.endLine, ch: editor.getLine(change.endLine).length },
          text: change.text
        })),
        selections
      });
      editor.scrollTo(scroll.left, scroll.top);
      this.trackers.get(file)?.acceptSorted(result.text);
    } finally {
      this.editing.delete(file);
    }
  }
  findEditor(file) {
    const active = this.app.workspace.activeEditor;
    if (active?.file === file && active.editor && (!(active instanceof import_obsidian.MarkdownView) || active.getMode() === "source")) {
      return active.editor;
    }
    for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
      if (leaf.view instanceof import_obsidian.MarkdownView && leaf.view.file === file && leaf.view.getMode() === "source") {
        return leaf.view.editor;
      }
    }
    return void 0;
  }
  async sortFile(file) {
    if (this.stopped || !this.settings.automatic || this.isExcluded(file) || this.editing.has(file)) return;
    if (this.composing) {
      this.schedule(file);
      return;
    }
    const editor = this.findEditor(file);
    if (editor) {
      this.sortEditor(editor, file);
      return;
    }
    const current = await this.app.vault.cachedRead(file);
    if (this.stopped || !this.settings.automatic || this.isExcluded(file)) return;
    if (sortTasks(current, this.completedOrder(file, current)).text === current) {
      this.trackers.get(file)?.acceptSorted(current);
      return;
    }
    const openedEditor = this.findEditor(file);
    if (openedEditor) {
      this.sortEditor(openedEditor, file);
      return;
    }
    this.editing.add(file);
    let retryInEditor = false;
    try {
      await this.app.vault.process(file, (data) => {
        if (this.stopped || !this.settings.automatic || this.isExcluded(file)) return data;
        if (this.findEditor(file) || this.composing) {
          retryInEditor = true;
          return data;
        }
        const sorted = sortTasks(data, this.completedOrder(file, data)).text;
        this.trackers.get(file)?.acceptSorted(sorted);
        return sorted;
      });
    } finally {
      this.editing.delete(file);
      if (retryInEditor) this.schedule(file);
    }
  }
};
var TidyTasksSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    this.containerEl.empty();
    new import_obsidian.Setting(this.containerEl).setName("Automatic sorting").setDesc("Sort after task status changes only. Opening notes and editing normal text do not start sorting.").addToggle((toggle) => toggle.setValue(this.plugin.settings.automatic).onChange(async (value) => {
      this.plugin.settings.automatic = value;
      this.plugin.clearTimers();
      await this.plugin.saveData(this.plugin.settings);
    }));
    const file = this.app.workspace.getActiveFile();
    if (file?.extension === "md") {
      new import_obsidian.Setting(this.containerEl).setName("Sort automatically in this note").setDesc(`${file.path}. You can also exclude notes from their file menu. The optional tidytasks: false property overrides this switch.`).addToggle((toggle) => toggle.setValue(!this.plugin.isExcluded(file)).setDisabled(this.app.metadataCache.getFileCache(file)?.frontmatter?.tidytasks === false).onChange(async () => {
        await this.plugin.toggleExcluded(file);
        this.display();
      }));
    }
    for (const path of this.plugin.settings.excludedNotes) {
      new import_obsidian.Setting(this.containerEl).setName(path).setDesc("Excluded from automatic sorting.").addButton((button) => button.setButtonText("Include again").onClick(async () => {
        this.plugin.settings.excludedNotes = this.plugin.settings.excludedNotes.filter((note) => note !== path);
        await this.plugin.saveData(this.plugin.settings);
        this.display();
      }));
    }
    new import_obsidian.Setting(this.containerEl).setName("Typing delay").setDesc("Wait 500\u20131500 milliseconds after the last change before sorting.").addSlider((slider) => slider.setLimits(500, 1500, 100).setValue(this.plugin.settings.delay).setDynamicTooltip().onChange(async (value) => {
      this.plugin.settings.delay = value;
      await this.plugin.saveData(this.plugin.settings);
    }));
  }
};

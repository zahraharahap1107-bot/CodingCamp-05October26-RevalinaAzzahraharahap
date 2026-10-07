/* ============================================================
   LIFE DASHBOARD — Vanilla JavaScript
   All 5 Challenges included:
     C1: Custom Name
     C2: Light / Dark Mode
     C3: Prevent Duplicate Tasks
     C4: Change Pomodoro Time (presets + custom)
     C5: Sort Tasks (A-Z, Z-A, Done Last, Undone First)
   ============================================================ */

'use strict';

// ──────────────────────────────────────────
// STORAGE HELPERS
// ──────────────────────────────────────────
const Store = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

// ──────────────────────────────────────────
// CLOCK & GREETING
// ──────────────────────────────────────────
const clockEl    = document.getElementById('clock');
const dateEl     = document.getElementById('date');
const greetingEl = document.getElementById('greeting');

function updateClock() {
  const now = new Date();
  const hh  = String(now.getHours()).padStart(2, '0');
  const mm  = String(now.getMinutes()).padStart(2, '0');
  const ss  = String(now.getSeconds()).padStart(2, '0');
  clockEl.textContent = `${hh}:${mm}:${ss}`;

  dateEl.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const h = now.getHours();
  greetingEl.textContent =
    h >= 5  && h < 12 ? 'Good Morning ☀️'   :
    h >= 12 && h < 17 ? 'Good Afternoon 🌤' :
    h >= 17 && h < 21 ? 'Good Evening 🌇'   :
                        'Good Night 🌙';
}

updateClock();
setInterval(updateClock, 1000);

// ──────────────────────────────────────────
// CHALLENGE 1 — CUSTOM NAME
// ──────────────────────────────────────────
const greetingNameEl = document.getElementById('greetingName');
const btnEditName    = document.getElementById('btnEditName');
const namePanelWrap  = document.getElementById('namePanelWrap');
const nameInput      = document.getElementById('nameInput');
const btnSaveName    = document.getElementById('btnSaveName');
const btnCancelName  = document.getElementById('btnCancelName');

function loadName() {
  const name = Store.get('userName', '');
  greetingNameEl.textContent = name ? `👋 ${name}` : '';
}

function saveName() {
  const name = nameInput.value.trim();
  Store.set('userName', name);
  greetingNameEl.textContent = name ? `👋 ${name}` : '';
  closeName();
}

function openName() {
  nameInput.value = Store.get('userName', '');
  namePanelWrap.classList.add('visible');
  nameInput.focus();
}

function closeName() {
  namePanelWrap.classList.remove('visible');
  nameInput.value = '';
}

btnEditName.addEventListener('click', () => {
  namePanelWrap.classList.contains('visible') ? closeName() : openName();
});
btnSaveName.addEventListener('click', saveName);
btnCancelName.addEventListener('click', closeName);
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter')  saveName();
  if (e.key === 'Escape') closeName();
});

loadName();

// ──────────────────────────────────────────
// CHALLENGE 2 — LIGHT / DARK MODE
// ──────────────────────────────────────────
const themeToggleBtn = document.getElementById('themeToggle');
const themeIconEl    = document.getElementById('themeIcon');
const THEME_KEY      = 'dashTheme';

// Three-way cycle: default (purple) → light → dark
const THEMES = ['default', 'light', 'dark'];

function applyTheme(theme) {
  document.body.classList.remove('light-mode', 'dark-mode');
  if (theme === 'light') {
    document.body.classList.add('light-mode');
    themeIconEl.textContent = '🌙';
    themeToggleBtn.title = 'Switch to Dark Mode';
  } else if (theme === 'dark') {
    document.body.classList.add('dark-mode');
    themeIconEl.textContent = '☀️';
    themeToggleBtn.title = 'Switch to Light Mode';
  } else {
    themeIconEl.textContent = '🌙';
    themeToggleBtn.title = 'Switch to Dark Mode';
  }
}

themeToggleBtn.addEventListener('click', () => {
  const current = Store.get(THEME_KEY, 'default');
  const idx     = THEMES.indexOf(current);
  const next    = THEMES[(idx + 1) % THEMES.length];
  Store.set(THEME_KEY, next);
  applyTheme(next);
});

applyTheme(Store.get(THEME_KEY, 'default'));

// ──────────────────────────────────────────
// CHALLENGE 4 — FOCUS TIMER (Pomodoro + custom duration)
// ──────────────────────────────────────────
const timerDisplayEl  = document.getElementById('timerDisplay');
const ringProgress    = document.getElementById('ringProgress');
const durationBadgeEl = document.getElementById('durationBadge');
const btnStart        = document.getElementById('btnStart');
const btnStop         = document.getElementById('btnStop');
const btnReset        = document.getElementById('btnReset');
const durButtons      = document.querySelectorAll('.dur-btn[data-min]');
const btnCustomDur    = document.getElementById('btnCustomDur');
const customDurRow    = document.getElementById('customDurRow');
const customDurInput  = document.getElementById('customDurInput');
const btnSetCustom    = document.getElementById('btnSetCustom');

const RING_CIRCUMFERENCE = 2 * Math.PI * 52; // 326.73px

let timerInterval  = null;
let totalSeconds   = 25 * 60;
let initSeconds    = 25 * 60; // max for the ring
let isRunning      = false;
let currentDurMin  = 25;

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateRing(remaining, total) {
  const ratio  = total > 0 ? remaining / total : 1;
  const offset = RING_CIRCUMFERENCE * (1 - ratio);
  ringProgress.style.strokeDashoffset = offset;
}

function renderTimer() {
  timerDisplayEl.textContent = formatTime(totalSeconds);
  updateRing(totalSeconds, initSeconds);
}

function setDuration(minutes, activateBtn = null) {
  if (isRunning) stopTimer();
  currentDurMin  = minutes;
  totalSeconds   = minutes * 60;
  initSeconds    = minutes * 60;
  durationBadgeEl.textContent = `${minutes} min`;
  timerDisplayEl.classList.remove('done-pulse');

  // Update active class on preset buttons
  durButtons.forEach(b => b.classList.remove('active'));
  btnCustomDur.classList.remove('active');
  if (activateBtn) {
    activateBtn.classList.add('active');
  } else {
    btnCustomDur.classList.add('active');
  }

  renderTimer();
}

function startTimer() {
  if (isRunning || totalSeconds <= 0) return;
  isRunning = true;
  timerInterval = setInterval(() => {
    totalSeconds--;
    renderTimer();
    if (totalSeconds <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      timerDisplayEl.textContent = '00:00';
      timerDisplayEl.classList.add('done-pulse');
      updateRing(0, initSeconds);
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  isRunning = false;
}

function resetTimer() {
  stopTimer();
  totalSeconds = initSeconds;
  timerDisplayEl.classList.remove('done-pulse');
  renderTimer();
}

// Preset buttons
durButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    customDurRow.classList.remove('visible');
    setDuration(parseInt(btn.dataset.min, 10), btn);
  });
});

// Custom button
btnCustomDur.addEventListener('click', () => {
  const isOpen = customDurRow.classList.contains('visible');
  if (isOpen) {
    customDurRow.classList.remove('visible');
  } else {
    customDurRow.classList.add('visible');
    customDurInput.focus();
  }
});

// Set custom duration
function applyCustomDur() {
  const val = parseInt(customDurInput.value, 10);
  if (!val || val < 1 || val > 180) {
    customDurInput.style.borderColor = 'var(--danger)';
    setTimeout(() => { customDurInput.style.borderColor = ''; }, 1500);
    return;
  }
  customDurRow.classList.remove('visible');
  customDurInput.value = '';
  setDuration(val, null);
}

btnSetCustom.addEventListener('click', applyCustomDur);
customDurInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter')  applyCustomDur();
  if (e.key === 'Escape') customDurRow.classList.remove('visible');
});

btnStart.addEventListener('click', startTimer);
btnStop.addEventListener('click', stopTimer);
btnReset.addEventListener('click', resetTimer);

renderTimer();

// ──────────────────────────────────────────
// TASKS (To-Do List)
// Includes:
//   C3: Prevent Duplicate Tasks
//   C5: Sort Tasks
// ──────────────────────────────────────────
const taskInputEl  = document.getElementById('taskInput');
const btnAddTask   = document.getElementById('btnAddTask');
const taskListEl   = document.getElementById('taskList');
const taskErrorEl  = document.getElementById('taskError');
const taskSortEl   = document.getElementById('taskSort');

const TASKS_KEY = 'dashTasks';

// ── Storage helpers ──
function loadTasks()        { return Store.get(TASKS_KEY, []); }
function saveTasks(tasks)   { Store.set(TASKS_KEY, tasks); }

// ── Feedback message ──
let taskErrTimer = null;
function showTaskMsg(msg, type = 'error') {
  clearTimeout(taskErrTimer);
  taskErrorEl.textContent = msg;
  taskErrorEl.className = `feedback-msg show ${type}`;
  taskErrTimer = setTimeout(() => {
    taskErrorEl.classList.remove('show');
    setTimeout(() => { taskErrorEl.textContent = ''; }, 300);
  }, 2800);
}

// ── Challenge 5: Sort logic ──
function getSortedTasks(tasks, order) {
  const list = [...tasks];
  switch (order) {
    case 'az':
      return list.sort((a, b) => a.text.localeCompare(b.text));
    case 'za':
      return list.sort((a, b) => b.text.localeCompare(a.text));
    case 'done':
      return list.sort((a, b) => Number(a.done) - Number(b.done));
    case 'undone':
      return list.sort((a, b) => Number(b.done) - Number(a.done));
    default:
      return list; // original insertion order
  }
}

// ── Render ──
function renderTasks() {
  const allTasks  = loadTasks();
  const sortOrder = taskSortEl.value;
  const display   = getSortedTasks(allTasks, sortOrder);

  taskListEl.innerHTML = '';

  if (display.length === 0) {
    const li = document.createElement('li');
    li.className = 'task-empty';
    li.textContent = 'No tasks yet — add one above!';
    taskListEl.appendChild(li);
    return;
  }

  display.forEach((task) => {
    const li = document.createElement('li');
    li.className = `task-item${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;

    // Custom checkbox
    const checkbox    = document.createElement('input');
    checkbox.type     = 'checkbox';
    checkbox.checked  = task.done;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as complete`);
    checkbox.addEventListener('change', () => toggleTask(task.id));

    // Inline-editable text input
    const textEl          = document.createElement('input');
    textEl.type           = 'text';
    textEl.className      = 'task-text';
    textEl.value          = task.text;
    textEl.setAttribute('aria-label', 'Edit task');
    textEl.addEventListener('blur',    () => editTask(task.id, textEl.value));
    textEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  textEl.blur();
      if (e.key === 'Escape') { textEl.value = task.text; textEl.blur(); }
    });

    // Delete button
    const delBtn          = document.createElement('button');
    delBtn.className      = 'btn-delete';
    delBtn.textContent    = 'Delete';
    delBtn.setAttribute('aria-label', `Delete: ${task.text}`);
    delBtn.addEventListener('click', () => deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(textEl);
    li.appendChild(delBtn);
    taskListEl.appendChild(li);
  });
}

// ── Add task (C3: duplicate check) ──
function addTask() {
  const text = taskInputEl.value.trim();
  if (!text) {
    showTaskMsg('Task cannot be empty.', 'error');
    taskInputEl.focus();
    return;
  }

  const tasks     = loadTasks();
  const isDuplicate = tasks.some(
    (t) => t.text.toLowerCase() === text.toLowerCase()
  );
  if (isDuplicate) {
    showTaskMsg('This task already exists!', 'error');
    taskInputEl.focus();
    return;
  }

  tasks.push({ id: `t_${Date.now()}`, text, done: false });
  saveTasks(tasks);
  renderTasks();
  taskInputEl.value = '';
  taskInputEl.focus();
}

// ── Toggle done ──
function toggleTask(id) {
  const tasks = loadTasks();
  const task  = tasks.find((t) => t.id === id);
  if (task) {
    task.done = !task.done;
    saveTasks(tasks);
    renderTasks();
  }
}

// ── Edit task inline (C3: duplicate check on edit) ──
function editTask(id, newText) {
  const trimmed = newText.trim();
  const tasks   = loadTasks();
  const task    = tasks.find((t) => t.id === id);

  if (!task) return;
  if (!trimmed) { renderTasks(); return; }       // revert if empty
  if (task.text === trimmed) return;              // no change

  const dupFound = tasks.some(
    (t) => t.id !== id && t.text.toLowerCase() === trimmed.toLowerCase()
  );
  if (dupFound) {
    showTaskMsg('A task with that name already exists!', 'error');
    renderTasks();
    return;
  }

  task.text = trimmed;
  saveTasks(tasks);
  renderTasks();
}

// ── Delete task ──
function deleteTask(id) {
  saveTasks(loadTasks().filter((t) => t.id !== id));
  renderTasks();
}

// Event listeners
btnAddTask.addEventListener('click', addTask);
taskInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});
taskSortEl.addEventListener('change', renderTasks);

renderTasks();

// ──────────────────────────────────────────
// QUICK LINKS
// ──────────────────────────────────────────
const linkNameInput = document.getElementById('linkName');
const linkUrlInput  = document.getElementById('linkUrl');
const btnAddLink    = document.getElementById('btnAddLink');
const linksListEl   = document.getElementById('linksList');
const linkErrorEl   = document.getElementById('linkError');

const LINKS_KEY = 'dashLinks';

function loadLinks()       { return Store.get(LINKS_KEY, []); }
function saveLinks(links)  { Store.set(LINKS_KEY, links); }

let linkErrTimer = null;
function showLinkMsg(msg, type = 'error') {
  clearTimeout(linkErrTimer);
  linkErrorEl.textContent = msg;
  linkErrorEl.className = `feedback-msg show ${type}`;
  linkErrTimer = setTimeout(() => {
    linkErrorEl.classList.remove('show');
    setTimeout(() => { linkErrorEl.textContent = ''; }, 300);
  }, 2800);
}

function normalizeUrl(url) {
  const t = url.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function renderLinks() {
  const links = loadLinks();
  linksListEl.innerHTML = '';

  if (links.length === 0) {
    linksListEl.innerHTML = '<span class="links-empty">No links yet — add one above!</span>';
    return;
  }

  links.forEach((link) => {
    const a   = document.createElement('a');
    a.className   = 'link-chip';
    a.href        = link.url;
    a.target      = '_blank';
    a.rel         = 'noopener noreferrer';
    a.setAttribute('aria-label', `Open ${link.name}`);

    const nameSpan       = document.createElement('span');
    nameSpan.textContent = link.name;
    nameSpan.style.pointerEvents = 'none';

    const removeBtn = document.createElement('button');
    removeBtn.className   = 'link-chip-remove';
    removeBtn.textContent = '×';
    removeBtn.setAttribute('aria-label', `Remove ${link.name}`);
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteLink(link.id);
    });

    a.appendChild(nameSpan);
    a.appendChild(removeBtn);
    linksListEl.appendChild(a);
  });
}

function addLink() {
  const name   = linkNameInput.value.trim();
  const rawUrl = linkUrlInput.value.trim();

  if (!name) {
    showLinkMsg('Please enter a link name.', 'error');
    linkNameInput.focus();
    return;
  }
  if (!rawUrl) {
    showLinkMsg('Please enter a URL.', 'error');
    linkUrlInput.focus();
    return;
  }

  const url = normalizeUrl(rawUrl);
  try { new URL(url); } catch {
    showLinkMsg('Please enter a valid URL.', 'error');
    linkUrlInput.focus();
    return;
  }

  const links = loadLinks();
  links.push({ id: `l_${Date.now()}`, name, url });
  saveLinks(links);
  renderLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  linkNameInput.focus();
}

function deleteLink(id) {
  saveLinks(loadLinks().filter((l) => l.id !== id));
  renderLinks();
}

btnAddLink.addEventListener('click', addLink);
linkUrlInput.addEventListener('keydown',  (e) => { if (e.key === 'Enter') addLink(); });
linkNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') linkUrlInput.focus(); });

renderLinks();

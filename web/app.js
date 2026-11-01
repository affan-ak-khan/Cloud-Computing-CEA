const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const list = document.getElementById('task-list');
const statusEl = document.getElementById('status');
const summaryEl = document.getElementById('summary');
const progressBar = document.getElementById('progress-bar');
const filterButtons = document.querySelectorAll('.filter');

const ACCENTS = ['blue', 'green', 'purple', 'orange', 'pink', 'teal'];
let tasks = [];
let filter = 'all';

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

// Relative URL: nginx proxies /api to the API container
async function api(path, options = {}) {
  const res = await fetch(`/api/tasks${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderTask(task) {
  const li = document.createElement('li');
  li.className = `task-card accent-${ACCENTS[Number(task.id) % ACCENTS.length]}`;
  if (task.completed) li.classList.add('done');

  const top = document.createElement('div');
  top.className = 'card-top';

  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = task.completed ? 'Done' : 'To do';

  const del = document.createElement('button');
  del.className = 'delete';
  del.title = 'Delete task';
  del.setAttribute('aria-label', 'Delete task');
  del.textContent = '×';
  del.addEventListener('click', () => remove(task.id));

  top.append(badge, del);

  // textContent (never innerHTML) so task text can't inject HTML/JS
  const title = document.createElement('p');
  title.className = 'title';
  title.textContent = task.title;

  const footer = document.createElement('div');
  footer.className = 'card-footer';

  const date = document.createElement('span');
  date.className = 'date';
  date.textContent = formatDate(task.created_at);

  const label = document.createElement('label');
  label.className = 'toggle';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;
  checkbox.addEventListener('change', () => toggle(task.id, checkbox.checked));
  label.append(checkbox, document.createTextNode(task.completed ? ' Completed' : ' Mark done'));

  footer.append(date, label);
  li.append(top, title, footer);
  return li;
}

function render() {
  const done = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  summaryEl.textContent = total
    ? `${done} of ${total} completed · ${total - done} remaining`
    : 'Nothing on your plate.';
  progressBar.style.width = total ? `${(done / total) * 100}%` : '0%';

  const visible = tasks.filter((t) =>
    filter === 'all' ? true : filter === 'done' ? t.completed : !t.completed);
  list.replaceChildren(...visible.map(renderTask));

  if (!total) setStatus('No tasks yet. Add one above.');
  else if (!visible.length) setStatus(`No ${filter === 'done' ? 'completed' : 'active'} tasks.`);
  else setStatus('');
}

async function load() {
  if (!tasks.length) setStatus('Loading...');
  try {
    tasks = await api('');
    render();
  } catch (err) {
    setStatus(`Could not load tasks: ${err.message}`, true);
  }
}

async function toggle(id, completed) {
  try {
    await api(`/${id}`, { method: 'PATCH', body: JSON.stringify({ completed }) });
    await load();
  } catch (err) {
    setStatus(err.message, true);
  }
}

async function remove(id) {
  try {
    await api(`/${id}`, { method: 'DELETE' });
    await load();
  } catch (err) {
    setStatus(err.message, true);
  }
}

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    filterButtons.forEach((b) => b.classList.toggle('active', b === btn));
    render();
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  const button = form.querySelector('button');
  button.disabled = true;
  try {
    await api('', { method: 'POST', body: JSON.stringify({ title }) });
    input.value = '';
    await load();
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    button.disabled = false;
  }
});

load();

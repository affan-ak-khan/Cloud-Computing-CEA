const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const list = document.getElementById('task-list');
const statusEl = document.getElementById('status');

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

function renderTask(task) {
  const li = document.createElement('li');
  if (task.completed) li.classList.add('done');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;
  checkbox.addEventListener('change', () => toggle(task.id, checkbox.checked));

  // textContent (never innerHTML) so task text can't inject HTML/JS
  const title = document.createElement('span');
  title.className = 'title';
  title.textContent = task.title;

  const del = document.createElement('button');
  del.className = 'delete';
  del.textContent = 'Delete';
  del.addEventListener('click', () => remove(task.id));

  li.append(checkbox, title, del);
  return li;
}

async function load() {
  setStatus('Loading...');
  try {
    const tasks = await api('');
    list.replaceChildren(...tasks.map(renderTask));
    setStatus(tasks.length ? '' : 'No tasks yet. Add one above.');
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

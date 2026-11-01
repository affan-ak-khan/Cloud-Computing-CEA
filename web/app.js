// Relative URL: nginx proxies /api to the API container
async function request(path, options = {}) {
  const res = await fetch(`/api/tasks${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

const api = {
  list: () => request(''),
  add: (title) => request('', { method: 'POST', body: JSON.stringify({ title }) }),
  toggle: (id, completed) => request(`/${id}`, { method: 'PATCH', body: JSON.stringify({ completed }) }),
  remove: (id) => request(`/${id}`, { method: 'DELETE' }),
};

let tasks = [], filter = 'all', lastAdded = null;
const $ = (id) => document.getElementById(id);
// Task titles are user input: always escape before putting them in innerHTML
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function showError(message) {
  $('summary').textContent = message;
  $('summary').classList.add('error');
}

function render() {
  const done = tasks.filter((t) => t.completed).length, active = tasks.length - done;
  $('c-all').textContent = tasks.length; $('c-active').textContent = active; $('c-done').textContent = done;
  $('bar').style.width = tasks.length ? (done / tasks.length * 100) + '%' : '0';
  $('summary').classList.remove('error');
  $('summary').textContent = tasks.length ? `${done} of ${tasks.length} tasks completed` : 'Nothing here yet';
  $('left').textContent = `${active} task${active === 1 ? '' : 's'} left`;
  $('clear').style.visibility = done ? 'visible' : 'hidden';

  const shown = tasks.filter((t) => filter === 'all' || (filter === 'done') === t.completed);
  if (!shown.length) {
    const msg = { all: ['No tasks yet', 'Add your first task above.'], active: ['All caught up 🎉', 'No active tasks.'], done: ['Nothing completed', 'Finished tasks show up here.'] }[filter];
    $('list').innerHTML = `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h4"/></svg><b>${msg[0]}</b>${msg[1]}</div>`;
    return;
  }
  $('list').innerHTML = shown.map((t) => `
    <li class="${t.completed ? 'done' : ''}${t.id === lastAdded ? ' new' : ''}" data-id="${esc(t.id)}">
      <label class="check">
        <input type="checkbox" ${t.completed ? 'checked' : ''} aria-label="Mark done">
        <span><svg viewBox="0 0 24 24" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
      </label>
      <span class="title">${esc(t.title)}</span>
      <button class="del" type="button" aria-label="Delete task" title="Delete">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/></svg>
      </button>
    </li>`).join('');
}

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = $('input').value.trim();
  if (!title) return;
  const button = e.target.querySelector('button');
  button.disabled = true;
  try {
    const x = await api.add(title);
    $('input').value = '';
    // API lists newest first, so new tasks go on top
    lastAdded = x.id; tasks.unshift(x);
    render(); lastAdded = null;
  } catch (err) {
    showError(err.message);
  } finally {
    button.disabled = false;
  }
});

$('list').addEventListener('click', async (e) => {
  const li = e.target.closest('li'); if (!li) return;
  const t = tasks.find((x) => String(x.id) === li.dataset.id); if (!t) return;
  try {
    if (e.target.closest('.del')) {
      await api.remove(t.id); tasks = tasks.filter((x) => x !== t); render();
    } else if (e.target.matches('input[type=checkbox]')) {
      const completed = e.target.checked;
      await api.toggle(t.id, completed); t.completed = completed; render();
    }
  } catch (err) {
    if (e.target.matches('input[type=checkbox]')) e.target.checked = t.completed;
    showError(err.message);
  }
});

$('filters').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  filter = b.dataset.f;
  document.querySelectorAll('#filters button').forEach((x) => x.classList.toggle('active', x === b));
  render();
});

// No bulk endpoint: delete each completed task individually
$('clear').addEventListener('click', async () => {
  const doneTasks = tasks.filter((t) => t.completed);
  const results = await Promise.allSettled(doneTasks.map((t) => api.remove(t.id)));
  const removed = new Set(doneTasks.filter((_, i) => results[i].status === 'fulfilled'));
  tasks = tasks.filter((t) => !removed.has(t));
  render();
  if (removed.size < doneTasks.length) showError('Some tasks could not be deleted.');
});

api.list()
  .then((t) => { tasks = t; render(); })
  .catch((err) => showError(`Could not load tasks: ${err.message}`));

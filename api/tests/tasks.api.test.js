// The factory means the real repository (and its database pool) is never loaded
jest.mock('../src/repositories/tasks.repository', () => ({
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

const request = require('supertest');
const repo = require('../src/repositories/tasks.repository');
const app = require('../src/app');

const sample = {
  id: '1',
  title: 'Buy milk',
  completed: false,
  created_at: '2026-10-18T00:00:00.000Z',
  updated_at: '2026-10-18T00:00:00.000Z',
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe('GET /health', () => {
  test('returns 200 and a minimal status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/tasks', () => {
  test('returns the list of tasks', async () => {
    repo.findAll.mockResolvedValue([sample]);
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([sample]);
  });

  test('returns a safe 500 when the database fails, without leaking details', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    repo.findAll.mockRejectedValue(new Error('password authentication failed for user "secret_user"'));
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
    expect(JSON.stringify(res.body)).not.toContain('secret_user');
    spy.mockRestore();
  });
});

describe('POST /api/tasks', () => {
  test('creates a task and returns 201', async () => {
    repo.create.mockResolvedValue(sample);
    const res = await request(app).post('/api/tasks').send({ title: '  Buy milk  ' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual(sample);
    expect(repo.create).toHaveBeenCalledWith('Buy milk'); // trimmed
  });

  test.each([
    ['empty title', { title: '' }],
    ['whitespace-only title', { title: '   ' }],
    ['missing title', {}],
    ['non-string title', { title: 123 }],
    ['title over 200 characters', { title: 'a'.repeat(201) }],
  ])('rejects %s with 400', async (_name, body) => {
    const res = await request(app).post('/api/tasks').send(body);
    expect(res.status).toBe(400);
    expect(repo.create).not.toHaveBeenCalled();
  });

  test('rejects malformed JSON with 400', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid JSON body' });
  });

  test('passes SQL-looking text to the repository as plain data', async () => {
    const evil = "x'); DROP TABLE tasks;--";
    repo.create.mockResolvedValue({ ...sample, title: evil });
    const res = await request(app).post('/api/tasks').send({ title: evil });
    expect(res.status).toBe(201);
    expect(repo.create).toHaveBeenCalledWith(evil); // parameterized query handles it
  });
});

describe('PATCH /api/tasks/:id', () => {
  test('updates completion state', async () => {
    repo.update.mockResolvedValue({ ...sample, completed: true });
    const res = await request(app).patch('/api/tasks/1').send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
    expect(repo.update).toHaveBeenCalledWith('1', { completed: true });
  });

  test('returns 404 when the task does not exist', async () => {
    repo.update.mockResolvedValue(null);
    const res = await request(app).patch('/api/tasks/999').send({ completed: true });
    expect(res.status).toBe(404);
  });

  test('returns 400 for an invalid id', async () => {
    const res = await request(app).patch('/api/tasks/abc').send({ completed: true });
    expect(res.status).toBe(400);
    expect(repo.update).not.toHaveBeenCalled();
  });

  test('returns 400 when there is nothing to update', async () => {
    const res = await request(app).patch('/api/tasks/1').send({});
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/tasks/:id', () => {
  test('deletes a task and returns 204', async () => {
    repo.remove.mockResolvedValue(true);
    const res = await request(app).delete('/api/tasks/1');
    expect(res.status).toBe(204);
  });

  test('returns 404 when the task does not exist', async () => {
    repo.remove.mockResolvedValue(false);
    const res = await request(app).delete('/api/tasks/999');
    expect(res.status).toBe(404);
  });

  test('returns 400 for an invalid id', async () => {
    const res = await request(app).delete('/api/tasks/1;DROP');
    expect(res.status).toBe(400);
    expect(repo.remove).not.toHaveBeenCalled();
  });
});

describe('unknown routes', () => {
  test('return 404 JSON', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});

const { z } = require('zod');
const repo = require('../repositories/tasks.repository');
const { HttpError } = require('../middleware/error-handler');

const title = z.string().trim().min(1).max(200);
const createSchema = z.object({ title });
const updateSchema = z
  .object({ title: title.optional(), completed: z.boolean().optional() })
  .refine((d) => d.title !== undefined || d.completed !== undefined, {
    message: 'Nothing to update',
  });
const idSchema = z.string().regex(/^\d{1,18}$/);

function parseId(rawId) {
  const r = idSchema.safeParse(rawId);
  if (!r.success) throw new HttpError(400, 'Invalid task id');
  return r.data;
}

function parseBody(schema, body) {
  const r = schema.safeParse(body);
  if (!r.success) {
    throw new HttpError(400, r.error.issues[0]?.message || 'Invalid request body');
  }
  return r.data;
}

async function listTasks() {
  return repo.findAll();
}

async function createTask(body) {
  const data = parseBody(createSchema, body);
  return repo.create(data.title);
}

async function updateTask(rawId, body) {
  const id = parseId(rawId);
  const data = parseBody(updateSchema, body);
  const task = await repo.update(id, data);
  if (!task) throw new HttpError(404, 'Task not found');
  return task;
}

async function deleteTask(rawId) {
  const id = parseId(rawId);
  const deleted = await repo.remove(id);
  if (!deleted) throw new HttpError(404, 'Task not found');
}

module.exports = { listTasks, createTask, updateTask, deleteTask };

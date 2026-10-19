const express = require('express');
const pool = require('./db');
const requireAuth = require('./authMiddleware');

const router = express.Router();
router.use(requireAuth);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function clean(t) {
  if (!t || !UUID_RE.test(String(t.id))) return null;
  const title = String(t.title || '').trim().slice(0, 255);
  if (!title) return null;
  const subtasks = (Array.isArray(t.subtasks) ? t.subtasks : [])
    .slice(0, 50)
    .map((s) => ({ text: String((s && s.text) || '').trim().slice(0, 500), done: !!(s && s.done) }))
    .filter((s) => s.text);
  return {
    id: String(t.id).toLowerCase(),
    title,
    description: String(t.desc == null ? '' : t.desc).slice(0, 5000),
    completed: !!t.completed,
    subtasks,
    updatedAt: Math.min(Number(t.updatedAt) || 0, Date.now()),
  };
}

async function listTodos(userId) {
  const { rows } = await pool.query(
    `SELECT t.id, t.title, t.description, t.completed,
            EXTRACT(EPOCH FROM t.updated_at) * 1000 AS updated_ms,
            COALESCE(
              json_agg(json_build_object('text', s.text, 'done', s.done) ORDER BY s.position)
              FILTER (WHERE s.id IS NOT NULL), '[]'
            ) AS subtasks
       FROM todos t
       LEFT JOIN subtasks s ON s.todo_id = t.id
      WHERE t.user_id = $1 AND t.deleted_at IS NULL
      GROUP BY t.id
      ORDER BY t.created_at`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    desc: r.description,
    completed: r.completed,
    subtasks: r.subtasks,
    updatedAt: Math.round(Number(r.updated_ms)),
  }));
}

async function listDeleted(userId) {
  const { rows } = await pool.query(
    `SELECT id, EXTRACT(EPOCH FROM deleted_at) * 1000 AS deleted_ms
       FROM todos
      WHERE user_id = $1 AND deleted_at IS NOT NULL`,
    [userId]
  );
  return rows.map((r) => ({ id: r.id, deletedAt: Math.round(Number(r.deleted_ms)) }));
}


async function upsertTodo(client, userId, t) {
  const result = await client.query(
    `INSERT INTO todos (id, user_id, title, description, completed, updated_at)
     VALUES ($1, $2, $3, $4, $5, to_timestamp($6::double precision / 1000.0))
     ON CONFLICT (id) DO UPDATE
       SET title = EXCLUDED.title, description = EXCLUDED.description,
           completed = EXCLUDED.completed, updated_at = EXCLUDED.updated_at,
           deleted_at = NULL
       WHERE todos.user_id = $2 AND todos.updated_at < EXCLUDED.updated_at
     RETURNING id`,
    [t.id, userId, t.title, t.description, t.completed, t.updatedAt]
  );
  if (result.rowCount === 0) return false;
  await client.query('DELETE FROM subtasks WHERE todo_id = $1', [t.id]);
  for (let i = 0; i < t.subtasks.length; i++) {
    await client.query(
      'INSERT INTO subtasks (todo_id, text, done, position) VALUES ($1, $2, $3, $4)',
      [t.id, t.subtasks[i].text, t.subtasks[i].done, i]
    );
  }
  return true;
}

async function withTx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

router.get('/', async (req, res) => {
  try {
    res.json({
      todos: await listTodos(req.userId),
      deleted: await listDeleted(req.userId),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create or update one todo
router.put('/:id', async (req, res) => {
  const todo = clean({ ...req.body, id: req.params.id });
  if (!todo) return res.status(400).json({ error: 'Invalid todo' });
  try {
    const ok = await withTx((c) => upsertTodo(c, req.userId, todo));
    if (!ok) return res.status(403).json({ error: 'Not allowed' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Soft delete
router.delete('/:id', async (req, res) => {
  if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    await pool.query(
      'UPDATE todos SET deleted_at = now(), updated_at = now() WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Manual sync: merge local todos into the account, apply local deletes, return the full list
router.post('/sync', async (req, res) => {
  const body = req.body || {};
  const incoming = (Array.isArray(body.todos) ? body.todos : [])
    .slice(0, 200)
    .map(clean)
    .filter(Boolean);
  const deleted = (Array.isArray(body.deleted) ? body.deleted : [])
    .map(String)
    .filter((id) => UUID_RE.test(id))
    .slice(0, 500);

  try {
    await withTx(async (c) => {
      for (const t of incoming) await upsertTodo(c, req.userId, t);
      if (deleted.length) {
        await c.query(
          `UPDATE todos SET deleted_at = now(), updated_at = now()
            WHERE user_id = $1 AND id = ANY($2::uuid[])`,
          [req.userId, deleted]
        );
      }
    });
    res.json({ todos: await listTodos(req.userId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
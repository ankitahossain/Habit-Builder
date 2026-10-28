import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from './db.js';
import { authenticate } from './middleware.js';
import { calculateStreaks } from './streaks.js';
import { startReminderScheduler } from './notifications.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim().replace(/\/+$/, '')).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json({ limit: '20kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }));
const port = Number(process.env.PORT || 4000);

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(100)
});
const habitSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(300).optional().default(''),
  frequency: z.enum(['daily','weekdays','weekly']).default('daily'),
  target_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#6D5CE8')
});

app.get('/api/health', async (_req, res) => {
  const config = { jwtSecret: !!process.env.JWT_SECRET, databaseUrl: !!process.env.DATABASE_URL, clientOrigin: !!process.env.CLIENT_ORIGIN };
  try { await pool.query('SELECT 1 FROM users LIMIT 1'); res.json({ status: 'ok', service: 'Habit Builder API', db: 'connected', config }); }
  catch (err) { res.status(500).json({ status: 'error', db: err.message, config }); }
});
app.get('/', (_req, res) => res.json({ service: 'Habit Builder API', health: '/api/health' }));

app.post('/api/auth/register', async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set.');
    const input = registerSchema.parse(req.body);
    const email = input.email.toLowerCase();
    const hash = await bcrypt.hash(input.password, 12);
    const result = await pool.query(
      'INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email',
      [input.name, email, hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { subject: user.id, expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'An account with this email already exists.' });
    next(err);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const input = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const result = await pool.query('SELECT id,name,email,password_hash FROM users WHERE email=$1', [input.email.toLowerCase()]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { subject: user.id, expiresIn: '7d' });
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err) { next(err); }
});

app.get('/api/habits', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT h.*, COALESCE(json_agg(json_build_object('date',l.habit_date,'done',l.done))
       FILTER (WHERE l.id IS NOT NULL), '[]') AS logs
       FROM habits h LEFT JOIN habit_logs l ON l.habit_id=h.id AND l.user_id=h.user_id
       WHERE h.user_id=$1 AND h.archived=false GROUP BY h.id ORDER BY h.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

app.post('/api/habits', authenticate, async (req, res, next) => {
  try {
    const h = habitSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO habits(user_id,name,description,frequency,target_time,color)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id,h.name,h.description,h.frequency,h.target_time || null,h.color]
    );
    res.status(201).json({ ...rows[0], logs: [] });
  } catch (err) { next(err); }
});

app.patch('/api/habits/:id', authenticate, async (req, res, next) => {
  try {
    const h = habitSchema.partial().parse(req.body);
    const keys = Object.keys(h);
    if (!keys.length) return res.status(400).json({ error: 'No valid fields supplied.' });
    const allowed = new Set(['name','description','frequency','target_time','color']);
    const sets = [], values = [req.params.id, req.user.id];
    for (const key of keys) {
      if (!allowed.has(key)) continue;
      values.push(h[key] ?? null);
      sets.push(`${key}=$${values.length}`);
    }
    const { rows } = await pool.query(
      `UPDATE habits SET ${sets.join(', ')} WHERE id=$1 AND user_id=$2 AND archived=false RETURNING *`, values
    );
    if (!rows[0]) return res.status(404).json({ error: 'Habit not found.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

app.delete('/api/habits/:id', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM habits WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id,req.user.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Habit not found.' });
    res.status(204).end();
  } catch (err) { next(err); }
});

app.put('/api/habits/:id/logs/:date', authenticate, async (req, res, next) => {
  try {
    const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.params.date);
    const done = z.boolean().parse(req.body.done);
    const owned = await pool.query('SELECT id FROM habits WHERE id=$1 AND user_id=$2', [req.params.id,req.user.id]);
    if (!owned.rowCount) return res.status(404).json({ error: 'Habit not found.' });
    if (done) {
      await pool.query(
        `INSERT INTO habit_logs(habit_id,user_id,habit_date,done) VALUES($1,$2,$3,true)
         ON CONFLICT(habit_id,habit_date) DO UPDATE SET done=true`,
        [req.params.id,req.user.id,date]
      );
    } else {
      await pool.query('DELETE FROM habit_logs WHERE habit_id=$1 AND user_id=$2 AND habit_date=$3', [req.params.id,req.user.id,date]);
    }
    res.json({ habitId: req.params.id, date, done });
  } catch (err) { next(err); }
});

app.get('/api/analytics/weekly', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT to_char(d.day, 'Dy') AS day,
        d.day::date AS date,
        COUNT(h.id) FILTER (WHERE
          h.frequency='daily' OR
          (h.frequency='weekdays' AND EXTRACT(ISODOW FROM d.day) BETWEEN 1 AND 5) OR
          (h.frequency='weekly' AND EXTRACT(ISODOW FROM d.day)=1)
        ) AS planned,
        COUNT(l.id) FILTER (WHERE l.done=true) AS completed
      FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') d(day)
      LEFT JOIN habits h ON h.user_id=$1 AND h.archived=false
      LEFT JOIN habit_logs l ON l.habit_id=h.id AND l.habit_date=d.day::date AND l.user_id=$1
      GROUP BY d.day ORDER BY d.day`, [req.user.id]);
    res.json(rows);
  } catch (err) { next(err); }
});

app.get('/api/analytics/summary', authenticate, async (req, res, next) => {
  try {
    const habits = await pool.query('SELECT id,name,frequency FROM habits WHERE user_id=$1 AND archived=false', [req.user.id]);
    let currentTotal = 0, longestTotal = 0;
    for (const h of habits.rows) {
      const logs = await pool.query('SELECT habit_date::text AS date FROM habit_logs WHERE habit_id=$1 AND done=true ORDER BY habit_date', [h.id]);
      const streak = calculateStreaks({ dates: logs.rows.map(x=>x.date), frequency: h.frequency, today: new Date().toISOString().slice(0,10) });
      currentTotal += streak.current; longestTotal = Math.max(longestTotal, streak.longest);
    }
    res.json({ habitCount: habits.rowCount, currentStreakSum: currentTotal, longestStreak: longestTotal });
  } catch (err) { next(err); }
});

app.use((err, _req, res, _next) => {
  if (err instanceof z.ZodError) return res.status(400).json({ error: 'Please check your input.', details: err.issues.map(i=>({ field:i.path.join('.'), message:i.message })) });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

// Vercel runs this file as a serverless function: no app.listen and no cron there.
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required.');
  startReminderScheduler();
  app.listen(port, () => console.log(`Habit Builder API running on http://localhost:${port}`));
}
export default app;

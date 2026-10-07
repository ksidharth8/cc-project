const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');

const app = express();
const F = path.join(__dirname, 'data.json');
const load = () => (fs.existsSync(F) ? JSON.parse(fs.readFileSync(F)) : []);
const save = d => fs.writeFileSync(F, JSON.stringify(d, null, 2));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (q, r) => r.json({ status: 'ok' }));

app.get('/api/info', (q, r) =>
  r.json({
    hostname: os.hostname(),
    platform: os.platform(),
    node: process.version,
    uptime: Math.round(os.uptime()),
    totalMem: os.totalmem(),
    freeMem: os.freemem(),
    cpus: os.cpus().length,
    load: os.loadavg()[0]
  })
);

app.get('/api/tasks', (q, r) => r.json(load()));

app.post('/api/tasks', (q, r) => {
  const title = (q.body.title || '').trim();
  if (!title) return r.status(400).json({ error: 'title required' });
  const d = load();
  const t = { id: Date.now(), title, done: false };
  d.push(t);
  save(d);
  r.status(201).json(t);
});

app.patch('/api/tasks/:id', (q, r) => {
  const d = load();
  const t = d.find(x => x.id == q.params.id);
  if (!t) return r.status(404).json({ error: 'not found' });
  t.done = !t.done;
  save(d);
  r.json(t);
});

app.delete('/api/tasks/:id', (q, r) => {
  save(load().filter(x => x.id != q.params.id));
  r.status(204).end();
});

const P = process.env.PORT || 3000;
app.listen(P, () => console.log(`listening on ${P}`));

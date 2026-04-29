const express = require('express');
const cors = require('cors');
const { initializeSchema } = require('./database/schema');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Initialize DB
initializeSchema();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/time-entries', require('./routes/timeEntries'));
app.use('/api/reports', require('./routes/reports'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`TimeIn server running on http://localhost:${PORT}`));

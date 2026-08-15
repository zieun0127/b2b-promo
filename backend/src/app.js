const express = require('express');
const cors = require('cors');
const pool = require('./db/pool');
const { AppError, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res, next) => {
  pool
    .query('SELECT 1')
    .then(() => res.status(200).json({ status: 'ok' }))
    .catch(next);
});

app.use((req, res, next) => next(new AppError('Not Found', 404)));

app.use(errorHandler);

module.exports = app;

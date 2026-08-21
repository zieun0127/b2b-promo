const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../../docs/swagger.json');
const pool = require('./db/pool');
const { AppError, errorHandler } = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth.routes');
const mbtiQuestionRoutes = require('./routes/mbtiQuestion.routes');
const testSubmissionRoutes = require('./routes/testSubmission.routes');
const adminRoutes = require('./routes/admin.routes');
const promotionOfferRoutes = require('./routes/promotionOffer.routes');
const bookmarkRoutes = require('./routes/bookmark.routes');
const promotionApplicationRoutes = require('./routes/promotionApplication.routes');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

app.get('/api/health', (req, res, next) => {
  pool
    .query('SELECT 1')
    .then(() => res.status(200).json({ status: 'ok' }))
    .catch(next);
});

app.use('/api/auth', authRoutes);
app.use('/api/mbti-questions', mbtiQuestionRoutes);
app.use('/api/test-submissions', testSubmissionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/promotion-offers', promotionOfferRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/applications', promotionApplicationRoutes);

app.use((req, res, next) => next(new AppError('Not Found', 404)));

app.use(errorHandler);

module.exports = app;

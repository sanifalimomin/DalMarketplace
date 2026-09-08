const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const app = express();

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(helmet());
app.use((req, res, next) => {
  cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      console.error(
        `CORS rejected: ${req.method} ${req.originalUrl} from origin "${origin}" (allowed: ${ALLOWED_ORIGINS.join(', ') || 'none'})`,
      );
      return callback(new Error('Not allowed by CORS'));
    },
  })(req, res, next);
});
app.use(express.json());

app.use('/api', routes);

app.get("/", (req, res) => {
    res.send("Dal Marketplace is online and running!");
});

app.use((req, res, next) => next(ApiError.notFound()));
app.use(errorHandler);

module.exports = app;

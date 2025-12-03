import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import authRoutes from './routes/authRoutes.js';
import paypalRoutes from './routes/paypalRoutes.js';
import path from 'path';

const app = express();

app.set('trust proxy', 1);

// Allowed frontend origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_1,
  process.env.FRONTEND_URL_2,
].filter(Boolean);

console.log('Allowed origins:', allowedOrigins);

// CORS CONFIG
// Dynamic origin check for credentials
const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg =
        'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options(/.*/, cors(corsOptions));

// HELMET CONFIG
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// BODY PARSERS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// RATE LIMIT
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
}

// HEALTH CHECK
app.get('/', (req, res) => {
  res.send('OrderQ backend is running securely!');
});

// API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/paypal', paypalRoutes);

// STATIC FILES
// Uploaded menu images
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'), {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);

// QR codes
app.use(
  '/qrcodes',
  express.static(path.join(process.cwd(), 'public/qrcodes'), {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);

app.use('/api/sessions/verify/:token', (req, res, next) => {
  const tokenValid = false;
  if (!tokenValid) {
    return res
      .status(204)
      .set('Access-Control-Allow-Origin', req.headers.origin || '*')
      .send();
  }
  next();
});

export default app;

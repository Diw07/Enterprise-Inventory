require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const { errorHandler } = require('./middleware/error');


const userRouter      = require('./modules/users/user.router');
const productRouter   = require('./modules/products/product.router');
const supplierRouter  = require('./modules/suppliers/supplier.router');
const inventoryRouter = require('./modules/inventory/inventory.router');
const orderRouter     = require('./modules/orders/order.router');
const analyticsRouter = require('./modules/analytics/analytics.router');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(cookieParser());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use('/api', limiter);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Routes

app.use('/api/users',     userRouter);
app.use('/api/products',  productRouter);
app.use('/api/suppliers', supplierRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/orders',    orderRouter);
app.use('/api/analytics', analyticsRouter);

app.use((_, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

module.exports = app;

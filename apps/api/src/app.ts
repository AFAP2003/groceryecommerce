import { toNodeHandler } from 'better-auth/node';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, json, urlencoded } from 'express';
import path from 'path';
import { auth } from './auth';
import { BASE_FRONTEND_URL, PORT } from './config';
import { withError, withNotFound } from './middlewares/errors.middleware';
import { AuthRouter } from './routers/auth.router';
import { CartRouter } from './routers/cart.router';
import apiRouter from './routers/dashboardApi.router';
import { HealthRouter } from './routers/health.router';
import { LocationRouter } from './routers/location.router';
import { OrderRouter } from './routers/order.router';
import { PaymentRouter } from './routers/payment.router';
import { ProductCategoryRouter } from './routers/product-category.router';
import { ProductRouter } from './routers/product.router';
import { ShippingMethodRouter } from './routers/shipping-method.router';
import { ShippingRouter } from './routers/shipping.router';
import { StoreRouter } from './routers/store.router';
import { TokenRouter } from './routers/token.router';
import { UserRouter } from './routers/user.router';
import { VoucherRouter } from './routers/voucher.router';
import { WebhookRouter } from './routers/webhook.router';

export default class App {
  static VERSION = '1.0.0';
  private app: Express;

  constructor() {
    this.app = express();
    this.configure();
    this.routes();
    this.app.use(
      '/uploads',
      express.static(path.join(__dirname, '../uploads')),
    );
    this.handleError();
  }


 // ...existing code...
private configure(): void {
  // allow origins for production frontend and local dev
  const allowedOrigins = [
    BASE_FRONTEND_URL,            // production frontend (from config)
    'http://localhost:3000',     // Next.js dev (change if your dev host differs)
  ];

  // Global CORS middleware that accepts allowedOrigins (function mode)
  this.app.use(
    cors({
      origin: (origin, callback) => {
        // allow requests with no origin (e.g. server-to-server or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );

  // Body parsers + cookies
  this.app.use(json());
  this.app.use(urlencoded({ extended: true }));
  this.app.use(cookieParser());

  // Ensure OPTIONS preflight is answered for base and subpaths
  this.app.options('/api/better/auth', cors({ origin: allowedOrigins, credentials: true }));
  this.app.options('/api/better/auth/*', cors({ origin: allowedOrigins, credentials: true }));

  // Debug logger to confirm requests hit this mount (remove in production)
  this.app.use('/api/better/auth', (req, res, next) => {
    console.log('[BetterAuth] ', req.method, req.originalUrl, 'Origin:', req.headers.origin);
    next();
  });

  // Explicit GET proxy for compatibility with clients calling /api/better/auth/get-session
  this.app.get('/api/better/auth/get-session',
    cors({ origin: (origin, cb) => { if (!origin) return cb(null, true); if (allowedOrigins.includes(origin)) return cb(null, true); cb(new Error('Not allowed by CORS')); }, credentials: true }),
    async (req, res, next) => {
      try {
        if (auth && (auth as any).api && typeof (auth as any).api.getSession === 'function') {
          const result = await (auth as any).api.getSession({ req, res });
          if (result !== undefined) return res.json(result);
          return;
        }
        return res.status(404).json({ message: 'get-session not implemented on server' });
      } catch (err) {
        next(err);
      }
    }
  );

  // Mount the BetterAuth handler (keep this)
  this.app.use(
    '/api/better/auth',
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
    toNodeHandler(auth)
  );
}
// ...existing code...
  

  private handleError(): void {
    this.app.use(withNotFound);
    this.app.use(withError);
  }

  private routes(): void {
    const healthRouter = new HealthRouter();
    const authRouter = new AuthRouter();
    const userRouter = new UserRouter();
    const tokenRouter = new TokenRouter();
    const locationRouter = new LocationRouter();
    const productCategoryRouter = new ProductCategoryRouter();
    const productRouter = new ProductRouter();
    const cartRouter = new CartRouter();
    const voucherRouter = new VoucherRouter();
    const shippingMethodRouter = new ShippingMethodRouter();
    const orderRouter = new OrderRouter();
    const paymentRouter = new PaymentRouter();
    const webhookRouter = new WebhookRouter();
    const shippingRouter = new ShippingRouter();
    const storeRuter = new StoreRouter();

    this.app.use('/api', healthRouter.getRouter());
    this.app.use('/api/auth', authRouter.getRouter());
    this.app.use('/api/user', userRouter.getRouter());
    this.app.use('/api/token', tokenRouter.getRouter());
    this.app.use('/api/location', locationRouter.getRouter());
    this.app.use('/api/product-category', productCategoryRouter.getRouter());
    this.app.use('/api/product', productRouter.getRouter());
    this.app.use('/api/dashboard', apiRouter);
    this.app.use('/api/cart', cartRouter.getRouter());
    this.app.use('/api/voucher', voucherRouter.getRouter());
    this.app.use('/api/shipping-methods', shippingMethodRouter.getRouter());
    this.app.use('/api/shipping', shippingRouter.getRouter());
    this.app.use('/api/orders', orderRouter.getRouter());
    this.app.use('/api/payment', paymentRouter.getRouter());
    this.app.use('/api/webhooks', webhookRouter.getRouter());
    this.app.use('/api/store', storeRuter.getRouter());
  }

  public start(): void {
    this.app.listen(PORT, () => {
      console.log(`  ➜  [API] Local:   http://localhost:${PORT}/api`);
    });
  }
}
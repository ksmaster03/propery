import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { authGuard } from './middleware/auth.js';
import authRoutes from './routes/auth/auth.routes.js';
import dashboardRoutes from './routes/dashboard/dashboard.routes.js';
import unitRoutes from './routes/unit/unit.routes.js';
import partnerRoutes from './routes/partner/partner.routes.js';
import contractRoutes from './routes/contract/contract.routes.js';
import billingRoutes from './routes/billing/billing.routes.js';
import masterRoutes from './routes/master/master.routes.js';

const app = express();

// === Middleware พื้นฐาน ===
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === Health Check ===
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// === Routes ที่ไ��่ต้อง login ===
app.use('/api/auth', authRoutes);

// === Routes ที่ต้อง login ก่อน ===
app.use('/api/dashboard', authGuard, dashboardRoutes);
app.use('/api/units', authGuard, unitRoutes);
app.use('/api/partners', authGuard, partnerRoutes);
app.use('/api/contracts', authGuard, contractRoutes);
app.use('/api/bills', authGuard, billingRoutes);
app.use('/api/master', authGuard, masterRoutes);

// TODO: Phase 5-6
// app.use('/api/receipts', authGuard, receiptRoutes);
// app.use('/api/reports', authGuard, reportRoutes);
// app.use('/api/portal', portalRoutes);

// === จัดการ Error กลาง ===
app.use(errorHandler);

// === เริ่ม Server ===
app.listen(env.PORT, () => {
  console.log(`🏢 DOA Lease API พร้อมใช้งานที่ http://localhost:${env.PORT}`);
  console.log(`📊 Health check: http://localhost:${env.PORT}/api/health`);
});

export default app;

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
import uploadRoutes from './routes/upload/upload.routes.js';
import floorplanRoutes from './routes/floorplan/floorplan.routes.js';
import reportRoutes from './routes/report/report.routes.js';
import portalRoutes from './routes/portal/portal.routes.js';
import userRoutes from './routes/user/user.routes.js';
import settingsRoutes from './routes/settings/settings.routes.js';
import auditRoutes from './routes/audit/audit.routes.js';
import profileRoutes from './routes/profile/profile.routes.js';
import businessRoutes from './routes/business/business.routes.js';
import kbRoutes from './routes/kb/kb.routes.js';
import { orgContext } from './middleware/org-context.js';

const app = express();

// === Middleware พื้นฐาน ===
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' })); // รองรับ SVG content ขนาดใหญ่
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(orgContext); // อ่าน X-Organization-Id header

// === Health Check ===
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// === Routes ที่ไม่ต้อง login ===
app.use('/api/auth', authRoutes);

// === Routes ที่ต้อง login ก่อน ===
app.use('/api/dashboard', authGuard, dashboardRoutes);
app.use('/api/units', authGuard, unitRoutes);
app.use('/api/partners', authGuard, partnerRoutes);
app.use('/api/contracts', authGuard, contractRoutes);
app.use('/api/bills', authGuard, billingRoutes);
app.use('/api/master', authGuard, masterRoutes);
app.use('/api/upload', authGuard, uploadRoutes);
app.use('/api/floorplans', authGuard, floorplanRoutes);
app.use('/api/reports', authGuard, reportRoutes);
app.use('/api/portal', authGuard, portalRoutes);
app.use('/api/users', authGuard, userRoutes);
app.use('/api/settings', authGuard, settingsRoutes);
app.use('/api/audit', authGuard, auditRoutes);
app.use('/api/profile', authGuard, profileRoutes);
app.use('/api/business', authGuard, businessRoutes);
app.use('/api/kb', authGuard, kbRoutes);

// === จัดการ Error กลาง ===
app.use(errorHandler);

// === เริ่ม Server ===
app.listen(env.PORT, () => {
  console.log(`🏢 DOA Lease API พร้อมใช้งานที่ http://localhost:${env.PORT}`);
  console.log(`📊 Health check: http://localhost:${env.PORT}/api/health`);
});

export default app;

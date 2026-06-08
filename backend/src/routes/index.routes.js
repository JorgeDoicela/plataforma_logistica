import { Router } from 'express';
import { login, forgotPassword, resetPassword } from '../controllers/auth/authController.js';
import employeeRoutes from './employees/employee.routes.js';
import notificationRoutes from './notifications/notification.routes.js';
import auditRoutes from './audit.routes.js';
import logisticsRoutes from './logistics/logistics.routes.js';

const router = Router();

// Ruta de prueba
router.get('/', (req, res) => {
    res.send('API Logística y Trazabilidad funcionando correctamente');
});

// Login y Recuperación
router.post('/auth/login', login);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

// Rutas del Sistema
router.use('/employees', employeeRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit', auditRoutes);
router.use('/logistics', logisticsRoutes);

export default router;

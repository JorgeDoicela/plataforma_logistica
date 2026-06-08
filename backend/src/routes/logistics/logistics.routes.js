import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { activeSpikes } from '../../jobs/logisticsTelemetryJob.js';
import {
    getFarms, getDestinations,
    getDispatches, getDispatchById, createDispatch, updateDispatch, updateDispatchStatus,
    getBoxes, createBoxesBatch, updateBoxStatus,
    getVehicles, getDrivers, createVehicle,
    getTrips, getTripById, createTrip, updateTripStatus,
    scanBox, recordGpsAndTemperature, uploadLogisticDocument,
    getDashboardStats, getReportData
} from '../../controllers/logistics/logisticsController.js';

const router = Router();

// Configure local multer for logistics (allowing PDFs and Images)
const uploadDir = process.env.VERCEL ? '/tmp/uploads/' : 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logistic-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Protect all routes with authentication
router.use(authenticate);

// ==========================================
// 1. FINCAS Y DESTINOS
// ==========================================
router.get('/farms', getFarms);
router.get('/destinations', getDestinations);

// ==========================================
// 2. DESPACHOS (DISPATCHES)
// ==========================================
router.get('/dispatches', getDispatches);
router.get('/dispatches/:id', getDispatchById);
router.post('/dispatches', authorize(['admin', 'operator']), createDispatch);
router.put('/dispatches/:id', authorize(['admin', 'operator']), updateDispatch);
router.patch('/dispatches/:id/status', authorize(['admin', 'operator', 'driver']), updateDispatchStatus);

// ==========================================
// 3. CAJAS
// ==========================================
router.get('/boxes', getBoxes);
router.post('/boxes/batch', authorize(['admin', 'operator']), createBoxesBatch);
router.patch('/boxes/:id/status', authorize(['admin', 'operator', 'driver']), updateBoxStatus);

// ==========================================
// 4. VEHÍCULOS Y CONDUCTORES
// ==========================================
router.get('/vehicles', getVehicles);
router.post('/vehicles', authorize(['admin', 'operator']), createVehicle);
router.get('/drivers', getDrivers);

// ==========================================
// 5. VIAJES (TRIPS)
// ==========================================
router.get('/trips', getTrips);
router.get('/trips/:id', getTripById);
router.post('/trips', authorize(['admin', 'operator']), createTrip);
router.patch('/trips/:id/status', authorize(['admin', 'operator', 'driver']), updateTripStatus);

// ==========================================
// 6. ESCANEO QR (DRIVER)
// ==========================================
router.post('/scans/box', authorize(['admin', 'operator', 'driver']), scanBox);

// ==========================================
// 7. TELEMETRÍA (GPS & TEMPERATURA)
// ==========================================
router.post('/telemetry', recordGpsAndTemperature);

// ==========================================
// 8. DOCUMENTOS
// ==========================================
router.post('/documents/upload', upload.single('file'), uploadLogisticDocument);

// ==========================================
// 9. DASHBOARD Y REPORTES
// ==========================================
router.get('/dashboard/stats', getDashboardStats);
router.get('/reports/data', getReportData);

// ==========================================
// 10. SIMULADOR DE PICOS DE TEMPERATURA (VALOR AGREGADO)
// ==========================================
router.get('/trips/:id/spike', authorize(['admin', 'operator']), (req, res) => {
    const { id } = req.params;
    res.status(200).json({
        success: true,
        enabled: !!activeSpikes[id]
    });
});

router.post('/trips/:id/spike', authorize(['admin', 'operator']), (req, res) => {
    const { id } = req.params;
    const { enable } = req.body;
    
    if (enable) {
        activeSpikes[id] = true;
    } else {
        delete activeSpikes[id];
    }
    
    res.status(200).json({ 
        success: true, 
        message: `Simulación de pico térmico ${enable ? 'activada' : 'desactivada'} para el viaje.`,
        enabled: !!activeSpikes[id]
    });
});

export default router;

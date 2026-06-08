import prisma from '../../database/db.js';
import auditRepository from '../../repositories/audit/auditRepository.js';

// ==========================================
// 1. FINCAS Y DESTINOS
// ==========================================

export const getFarms = async (req, res) => {
    try {
        const farms = await prisma.farm.findMany({
            orderBy: { name: 'asc' }
        });
        res.status(200).json({ success: true, data: farms });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] getFarms Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDestinations = async (req, res) => {
    try {
        const destinations = await prisma.destination.findMany({
            orderBy: { name: 'asc' }
        });
        res.status(200).json({ success: true, data: destinations });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] getDestinations Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 2. DESPACHOS (DISPATCHES)
// ==========================================

export const getDispatches = async (req, res) => {
    try {
        const { farmId, destinationId, status, date, responsibleId } = req.query;

        const where = {};
        if (farmId) where.farmId = farmId;
        if (destinationId) where.destinationId = destinationId;
        if (status) where.status = status;
        if (responsibleId) where.responsibleId = responsibleId;
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            where.date = {
                gte: startOfDay,
                lte: endOfDay
            };
        }

        const dispatches = await prisma.dispatch.findMany({
            where,
            include: {
                farm: true,
                destination: true,
                responsible: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                _count: {
                    select: { boxes: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ success: true, data: dispatches });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] getDispatches Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDispatchById = async (req, res) => {
    try {
        const { id } = req.params;
        const dispatch = await prisma.dispatch.findUnique({
            where: { id },
            include: {
                farm: true,
                destination: true,
                responsible: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                boxes: {
                    orderBy: { boxCode: 'asc' }
                },
                documents: true,
                trips: {
                    include: {
                        driver: {
                            select: { id: true, firstName: true, lastName: true }
                        },
                        vehicle: true
                    }
                }
            }
        });

        if (!dispatch) {
            return res.status(404).json({ success: false, message: 'Despacho no encontrado' });
        }

        res.status(200).json({ success: true, data: dispatch });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] getDispatchById Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createDispatch = async (req, res) => {
    try {
        const { dispatchCode, farmId, destinationId, date, observations, boxCount } = req.body;
        const responsibleId = req.user.id; // Operador logueado

        if (!dispatchCode || !farmId || !destinationId || !date) {
            return res.status(400).json({ success: false, message: 'Código, finca, destino y fecha son requeridos' });
        }

        // Verificar si el código ya existe
        const existing = await prisma.dispatch.findUnique({ where: { dispatchCode } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'El código de despacho ya está registrado' });
        }

        // Crear despacho en transacción
        const newDispatch = await prisma.$transaction(async (tx) => {
            const dispatch = await tx.dispatch.create({
                data: {
                    dispatchCode,
                    farmId,
                    destinationId,
                    date: new Date(date),
                    responsibleId,
                    observations,
                    status: 'Creado'
                }
            });

            // Generar cajas automáticamente si se especifica boxCount
            const count = parseInt(boxCount, 10) || 0;
            if (count > 0) {
                for (let i = 1; i <= count; i++) {
                    const boxCode = `BX-${dispatchCode}-${String(i).padStart(3, '0')}`;
                    await tx.box.create({
                        data: {
                            boxCode,
                            qrCode: `QR_${boxCode}_${dispatch.id}`,
                            dispatchId: dispatch.id,
                            status: 'Pendiente'
                        }
                    });
                }
            }

            return dispatch;
        });

        // Registrar auditoría
        auditRepository.createLog({
            entity: 'Dispatch',
            entityId: newDispatch.id,
            action: 'CREATE',
            performedBy: responsibleId,
            details: `Despacho creado: ${dispatchCode} con ${boxCount || 0} cajas.`
        });

        res.status(201).json({ success: true, data: newDispatch });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] createDispatch Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateDispatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { farmId, destinationId, date, observations } = req.body;
        const performedBy = req.user.id;

        const dispatch = await prisma.dispatch.findUnique({ where: { id } });
        if (!dispatch) {
            return res.status(404).json({ success: false, message: 'Despacho no encontrado' });
        }

        if (dispatch.status === 'Despachado' || dispatch.status === 'Finalizado') {
            return res.status(400).json({ success: false, message: 'No se puede editar un despacho cerrado u operativamente finalizado' });
        }

        const updated = await prisma.dispatch.update({
            where: { id },
            data: {
                farmId: farmId || dispatch.farmId,
                destinationId: destinationId || dispatch.destinationId,
                date: date ? new Date(date) : dispatch.date,
                observations: observations !== undefined ? observations : dispatch.observations
            }
        });

        // Registrar auditoría
        auditRepository.createLog({
            entity: 'Dispatch',
            entityId: id,
            action: 'UPDATE',
            performedBy,
            details: `Despacho actualizado: ${dispatch.dispatchCode}`
        });

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] updateDispatch Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateDispatchStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const performedBy = req.user.id;

        if (!status) {
            return res.status(400).json({ success: false, message: 'El estado es requerido' });
        }

        const dispatch = await prisma.dispatch.findUnique({ where: { id } });
        if (!dispatch) {
            return res.status(404).json({ success: false, message: 'Despacho no encontrado' });
        }

        const updated = await prisma.dispatch.update({
            where: { id },
            data: { status }
        });

        auditRepository.createLog({
            entity: 'Dispatch',
            entityId: id,
            action: 'STATUS_CHANGE',
            performedBy,
            details: `Estado cambiado a ${status} para despacho ${dispatch.dispatchCode}`
        });

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] updateDispatchStatus Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 3. GESTIÓN DE CAJAS
// ==========================================

export const getBoxes = async (req, res) => {
    try {
        const { dispatchId, status } = req.query;

        const where = {};
        if (dispatchId) where.dispatchId = dispatchId;
        if (status) where.status = status;

        const boxes = await prisma.box.findMany({
            where,
            include: {
                dispatch: {
                    select: {
                        dispatchCode: true,
                        status: true
                    }
                }
            },
            orderBy: { boxCode: 'asc' }
        });

        res.status(200).json({ success: true, data: boxes });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] getBoxes Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createBoxesBatch = async (req, res) => {
    try {
        const { dispatchId, boxCodes } = req.body; // Array de códigos de caja manuales o cantidad
        const performedBy = req.user.id;

        if (!dispatchId) {
            return res.status(400).json({ success: false, message: 'ID de despacho es requerido' });
        }

        const dispatch = await prisma.dispatch.findUnique({ where: { id: dispatchId } });
        if (!dispatch) {
            return res.status(404).json({ success: false, message: 'Despacho no encontrado' });
        }

        const createdBoxes = [];
        await prisma.$transaction(async (tx) => {
            for (const code of boxCodes) {
                // Verificar duplicados
                const existing = await tx.box.findUnique({ where: { boxCode: code } });
                if (existing) {
                    throw new Error(`El código de caja ${code} ya está registrado`);
                }

                const box = await tx.box.create({
                    data: {
                        boxCode: code,
                        qrCode: `QR_${code}_${dispatchId}`,
                        dispatchId,
                        status: 'Pendiente'
                    }
                });
                createdBoxes.push(box);
            }
        });

        auditRepository.createLog({
            entity: 'Box',
            entityId: dispatchId,
            action: 'BATCH_CREATE',
            performedBy,
            details: `Creadas ${createdBoxes.length} cajas para despacho ${dispatch.dispatchCode}`
        });

        res.status(201).json({ success: true, data: createdBoxes });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] createBoxesBatch Exception:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateBoxStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const performedBy = req.user.id;

        const box = await prisma.box.findUnique({ where: { id } });
        if (!box) {
            return res.status(404).json({ success: false, message: 'Caja no encontrada' });
        }

        const updated = await prisma.box.update({
            where: { id },
            data: { status }
        });

        auditRepository.createLog({
            entity: 'Box',
            entityId: id,
            action: 'STATUS_CHANGE',
            performedBy,
            details: `Estado de caja ${box.boxCode} cambiado a ${status}`
        });

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] updateBoxStatus Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 4. VEHÍCULOS Y CONDUCTORES
// ==========================================

export const getVehicles = async (req, res) => {
    try {
        const vehicles = await prisma.vehicle.findMany({
            where: { isActive: true },
            orderBy: { plate: 'asc' }
        });
        res.status(200).json({ success: true, data: vehicles });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] getVehicles Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDrivers = async (req, res) => {
    try {
        const drivers = await prisma.employee.findMany({
            where: { role: 'driver', isActive: true },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                identityCard: true
            },
            orderBy: { firstName: 'asc' }
        });
        res.status(200).json({ success: true, data: drivers });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] getDrivers Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createVehicle = async (req, res) => {
    try {
        const { plate, brand, model } = req.body;
        const performedBy = req.user.id;

        if (!plate) {
            return res.status(400).json({ success: false, message: 'La placa es requerida' });
        }

        const existing = await prisma.vehicle.findUnique({ where: { plate } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Un vehículo con esta placa ya existe' });
        }

        const vehicle = await prisma.vehicle.create({
            data: { plate, brand, model, isActive: true }
        });

        auditRepository.createLog({
            entity: 'Vehicle',
            entityId: vehicle.id,
            action: 'CREATE',
            performedBy,
            details: `Vehículo creado con placa ${plate}`
        });

        res.status(201).json({ success: true, data: vehicle });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] createVehicle Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 5. GESTIÓN DE VIAJES (TRIPS)
// ==========================================

export const getTrips = async (req, res) => {
    try {
        const { status, driverId } = req.query;

        const where = {};
        if (status) where.status = status;
        if (driverId) where.driverId = driverId;

        const trips = await prisma.trip.findMany({
            where,
            include: {
                driver: {
                    select: { id: true, firstName: true, lastName: true, phone: true }
                },
                vehicle: true,
                dispatch: {
                    include: {
                        farm: true,
                        destination: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ success: true, data: trips });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] getTrips Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTripById = async (req, res) => {
    try {
        const { id } = req.params;
        const trip = await prisma.trip.findUnique({
            where: { id },
            include: {
                driver: {
                    select: { id: true, firstName: true, lastName: true, phone: true, email: true }
                },
                vehicle: true,
                dispatch: {
                    include: {
                        farm: true,
                        destination: true,
                        boxes: {
                            include: {
                                scans: {
                                    orderBy: { scannedAt: 'desc' }
                                }
                            }
                        },
                        documents: true
                    }
                },
                history: {
                    orderBy: { changedAt: 'desc' }
                },
                gpsPositions: {
                    orderBy: { timestamp: 'asc' }
                },
                temperatureReadings: {
                    orderBy: { timestamp: 'asc' }
                }
            }
        });

        if (!trip) {
            return res.status(404).json({ success: false, message: 'Viaje no encontrado' });
        }

        res.status(200).json({ success: true, data: trip });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] getTripById Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createTrip = async (req, res) => {
    try {
        const { driverId, vehicleId, dispatchId, date, time } = req.body;
        const performedBy = req.user.id;

        if (!driverId || !vehicleId || !dispatchId || !date || !time) {
            return res.status(400).json({ success: false, message: 'Conductor, vehículo, despacho, fecha y hora son requeridos' });
        }

        // Verificar si el despacho ya está asignado a otro viaje
        const existingTrip = await prisma.trip.findFirst({
            where: { dispatchId, status: { not: 'Finalizado' } }
        });
        if (existingTrip) {
            return res.status(400).json({ success: false, message: 'Este despacho ya está asignado a un viaje activo' });
        }

        const newTrip = await prisma.$transaction(async (tx) => {
            const trip = await tx.trip.create({
                data: {
                    driverId,
                    vehicleId,
                    dispatchId,
                    date: new Date(date),
                    time,
                    status: 'Asignado'
                }
            });

            // Registrar en el historial de estados
            await tx.tripStatusHistory.create({
                data: {
                    tripId: trip.id,
                    status: 'Asignado',
                    changedBy: performedBy,
                    notes: 'Viaje creado y asignado'
                }
            });

            // Actualizar estado del despacho a "Preparación" si estaba en "Creado"
            const dispatch = await tx.dispatch.findUnique({ where: { id: dispatchId } });
            if (dispatch && dispatch.status === 'Creado') {
                await tx.dispatch.update({
                    where: { id: dispatchId },
                    data: { status: 'Preparación' }
                });
            }

            return trip;
        });

        auditRepository.createLog({
            entity: 'Trip',
            entityId: newTrip.id,
            action: 'CREATE',
            performedBy,
            details: `Viaje creado y asignado al conductor ID ${driverId}`
        });

        res.status(201).json({ success: true, data: newTrip });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] createTrip Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTripStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const performedBy = req.user.id;

        if (!status) {
            return res.status(400).json({ success: false, message: 'El estado es requerido' });
        }

        const trip = await prisma.trip.findUnique({
            where: { id },
            include: { dispatch: true }
        });

        if (!trip) {
            return res.status(404).json({ success: false, message: 'Viaje no encontrado' });
        }

        const updatedTrip = await prisma.$transaction(async (tx) => {
            // Actualizar viaje
            const ut = await tx.trip.update({
                where: { id },
                data: { status }
            });

            // Guardar historial
            await tx.tripStatusHistory.create({
                data: {
                    tripId: id,
                    status,
                    changedBy: performedBy,
                    notes
                }
            });

            // Propagar estado al despacho si corresponde
            // Estados viaje: Asignado, En finca, En tránsito, Llegado a aeropuerto, Finalizado
            // Estados despacho: Creado, Preparación, En carga, Despachado, Finalizado
            let newDispatchStatus = null;
            if (status === 'En finca') {
                newDispatchStatus = 'En carga';
            } else if (status === 'En tránsito') {
                newDispatchStatus = 'Despachado';
            } else if (status === 'Llegado a aeropuerto' || status === 'Finalizado') {
                newDispatchStatus = 'Finalizado';
            }

            if (newDispatchStatus && trip.dispatch.status !== newDispatchStatus) {
                await tx.dispatch.update({
                    where: { id: trip.dispatchId },
                    data: { status: newDispatchStatus }
                });

                // Si el viaje se finaliza, marcar las cajas "En tránsito" como "Entregadas" si no fueron marcadas faltantes
                if (status === 'Finalizado') {
                    await tx.box.updateMany({
                        where: { dispatchId: trip.dispatchId, status: { in: ['Cargada', 'En tránsito', 'Pendiente'] } },
                        data: { status: 'Entregada' }
                    });
                }
            }

            return ut;
        });

        auditRepository.createLog({
            entity: 'Trip',
            entityId: id,
            action: 'STATUS_CHANGE',
            performedBy,
            details: `Viaje cambiado a estado: ${status}. Notas: ${notes || ''}`
        });

        res.status(200).json({ success: true, data: updatedTrip });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] updateTripStatus Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 6. ESCANEO QR Y CONTROL DE CARGA (DRIVER)
// ==========================================

export const scanBox = async (req, res) => {
    try {
        const { tripId, boxCode, qrCode, status, latitude, longitude } = req.body;
        const performedBy = req.user.id; // Chofer

        if (!tripId || (!boxCode && !qrCode)) {
            return res.status(400).json({ success: false, message: 'Viaje y código de caja/QR son requeridos' });
        }

        // 1. Obtener viaje y su despacho
        const trip = await prisma.trip.findUnique({
            where: { id: tripId },
            include: { dispatch: true }
        });
        if (!trip) {
            return res.status(404).json({ success: false, message: 'Viaje no encontrado' });
        }

        // 2. Buscar la caja por código o QR
        const box = await prisma.box.findFirst({
            where: {
                OR: [
                    boxCode ? { boxCode } : null,
                    qrCode ? { qrCode } : null
                ].filter(Boolean)
            }
        });

        if (!box) {
            return res.status(404).json({ success: false, message: 'Caja no encontrada en el sistema' });
        }

        // 3. VALIDACIÓN 1: Pertenencia al despacho
        if (box.dispatchId !== trip.dispatchId) {
            return res.status(400).json({
                success: false,
                code: 'INVALID_DISPATCH_BOX',
                message: `¡ERROR! La caja ${box.boxCode} pertenece al despacho ${box.dispatchId}, pero este viaje está asociado al despacho ${trip.dispatch.dispatchCode}`
            });
        }

        // 4. VALIDACIÓN 2: Evitar doble escaneo (si ya está en el mismo estado o cargada)
        const existingScan = await prisma.boxScan.findFirst({
            where: {
                boxId: box.id,
                status: status || 'Cargada'
            }
        });

        if (existingScan) {
            return res.status(400).json({
                success: false,
                code: 'DUPLICATE_SCAN',
                message: `La caja ${box.boxCode} ya fue escaneada y registrada previamente.`
            });
        }

        // 5. Registrar el escaneo y actualizar estado de la caja
        const targetStatus = status || 'Cargada'; // Cargada, Pendiente, Faltante, etc.
        const scan = await prisma.$transaction(async (tx) => {
            // Actualizar caja
            await tx.box.update({
                where: { id: box.id },
                data: { status: targetStatus }
            });

            // Crear registro de escaneo
            return await tx.boxScan.create({
                data: {
                    boxId: box.id,
                    scannedBy: performedBy,
                    status: targetStatus,
                    latitude: latitude ? parseFloat(latitude) : null,
                    longitude: longitude ? parseFloat(longitude) : null
                }
            });
        });

        // Registrar auditoría
        auditRepository.createLog({
            entity: 'BoxScan',
            entityId: scan.id,
            action: 'SCAN',
            performedBy,
            details: `Caja ${box.boxCode} escaneada como ${targetStatus} en viaje ${trip.id}`
        });

        res.status(200).json({
            success: true,
            message: `Caja ${box.boxCode} cargada exitosamente.`,
            data: scan
        });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] scanBox Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 7. MONITOREO GPS Y TEMPERATURA
// ==========================================

export const recordGpsAndTemperature = async (req, res) => {
    try {
        const { tripId, latitude, longitude, temperature } = req.body;

        if (!tripId) {
            return res.status(400).json({ success: false, message: 'Trip ID es requerido' });
        }

        const trip = await prisma.trip.findUnique({ where: { id: tripId } });
        if (!trip) {
            return res.status(404).json({ success: false, message: 'Viaje no encontrado' });
        }

        const records = await prisma.$transaction(async (tx) => {
            let gps = null;
            let temp = null;

            if (latitude !== undefined && longitude !== undefined) {
                gps = await tx.gpsPosition.create({
                    data: {
                        tripId,
                        latitude: parseFloat(latitude),
                        longitude: parseFloat(longitude)
                    }
                });
            }

            if (temperature !== undefined) {
                temp = await tx.temperatureReading.create({
                    data: {
                        tripId,
                        temperature: parseFloat(temperature)
                    }
                });
            }

            return { gps, temp };
        });

        res.status(201).json({ success: true, data: records });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] recordGpsAndTemperature Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 8. CARGA DOCUMENTAL
// ==========================================

export const uploadLogisticDocument = async (req, res) => {
    try {
        const { dispatchId, type } = req.body;
        const performedBy = req.user.id;

        if (!dispatchId || !type) {
            return res.status(400).json({ success: false, message: 'Dispatch ID y tipo de documento son requeridos' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo' });
        }

        // En desarrollo, guardamos localmente en /uploads/ (Multer maneja esto)
        const fileUrl = `/uploads/${req.file.filename}`;

        const doc = await prisma.logisticDocument.create({
            data: {
                dispatchId,
                type,
                fileUrl,
                originalName: req.file.originalname,
                uploadedBy: performedBy
            }
        });

        auditRepository.createLog({
            entity: 'LogisticDocument',
            entityId: doc.id,
            action: 'UPLOAD_DOCUMENT',
            performedBy,
            details: `Documento de tipo "${type}" subido para despacho ID ${dispatchId}`
        });

        res.status(201).json({ success: true, data: doc });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] uploadLogisticDocument Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 9. DASHBOARD KPIs
// ==========================================

export const getDashboardStats = async (req, res) => {
    try {
        // Despachos totales
        const totalDispatches = await prisma.dispatch.count();

        // Cajas totales y desglose por estados
        const totalBoxes = await prisma.box.count();
        const boxesByStatus = await prisma.box.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        const boxStats = {
            Pendiente: 0,
            Cargada: 0,
            'En tránsito': 0,
            Entregada: 0,
            Faltante: 0
        };

        boxesByStatus.forEach(item => {
            if (boxStats[item.status] !== undefined) {
                boxStats[item.status] = item._count.id;
            }
        });

        // Viajes completados
        const totalCompletedTrips = await prisma.trip.count({
            where: { status: 'Finalizado' }
        });

        const activeTripsCount = await prisma.trip.count({
            where: { status: { in: ['En finca', 'En tránsito', 'Llegado a aeropuerto'] } }
        });

        // Lecturas de Temperatura (promedio, min, max de las últimas 24 horas)
        const tempStats = await prisma.temperatureReading.aggregate({
            _avg: { temperature: true },
            _min: { temperature: true },
            _max: { temperature: true }
        });

        // Entregas a tiempo / retrasadas
        const finalizedTrips = await prisma.trip.findMany({
            where: { status: 'Finalizado' },
            include: { history: true }
        });

        let onTimeTripsCount = 0;
        finalizedTrips.forEach(trip => {
            const assignedLog = trip.history.find(h => h.status === 'Asignado');
            const finalizedLog = trip.history.find(h => h.status === 'Finalizado');
            if (assignedLog && finalizedLog) {
                // Si tardó menos de 5 horas, se considera a tiempo
                const diffMs = new Date(finalizedLog.changedAt) - new Date(assignedLog.changedAt);
                const diffHours = diffMs / (1000 * 60 * 60);
                if (diffHours <= 5) {
                    onTimeTripsCount++;
                }
            } else {
                onTimeTripsCount++; // Fallback si falta historial
            }
        });

        const onTimeRate = finalizedTrips.length > 0 ? (onTimeTripsCount / finalizedTrips.length) * 100 : 100;

        const deliveredCount = boxStats.Entregada;
        const failedCount = boxStats.Faltante;
        const totalDeliveries = deliveredCount + failedCount;
        const deliveryRate = totalDeliveries > 0 ? (deliveredCount / totalDeliveries) * 100 : 100;

        res.status(200).json({
            success: true,
            data: {
                dispatches: {
                    total: totalDispatches,
                    active: await prisma.dispatch.count({ where: { status: { not: 'Finalizado' } } })
                },
                boxes: {
                    total: totalBoxes,
                    statusBreakdown: boxStats
                },
                trips: {
                    completed: totalCompletedTrips,
                    active: activeTripsCount
                },
                temperature: {
                    avg: tempStats._avg.temperature ? parseFloat(tempStats._avg.temperature.toFixed(2)) : 0,
                    min: tempStats._min.temperature || 0,
                    max: tempStats._max.temperature || 0
                },
                deliveries: {
                    success: deliveredCount,
                    failed: failedCount,
                    rate: parseFloat(deliveryRate.toFixed(1)),
                    onTimeRate: parseFloat(onTimeRate.toFixed(1))
                }
            }
        });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] getDashboardStats Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 10. REPORTES
// ==========================================

export const getReportData = async (req, res) => {
    try {
        const { type, startDate, endDate, driverId, farmId, status } = req.query;

        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        let reportData = [];

        if (type === 'dispatches') {
            const where = {};
            if (startDate && endDate) where.date = dateFilter;
            if (farmId) where.farmId = farmId;
            if (status) where.status = status;

            reportData = await prisma.dispatch.findMany({
                where,
                include: {
                    farm: true,
                    destination: true,
                    responsible: { select: { firstName: true, lastName: true } },
                    _count: { select: { boxes: true } }
                },
                orderBy: { date: 'desc' }
            });
        } else if (type === 'trips') {
            const where = {};
            if (startDate && endDate) where.date = dateFilter;
            if (driverId) where.driverId = driverId;
            if (status) where.status = status;

            reportData = await prisma.trip.findMany({
                where,
                include: {
                    driver: { select: { firstName: true, lastName: true } },
                    vehicle: true,
                    dispatch: { include: { farm: true, destination: true } }
                },
                orderBy: { date: 'desc' }
            });
        } else if (type === 'boxes') {
            const where = {};
            if (status) where.status = status;

            reportData = await prisma.box.findMany({
                where,
                include: {
                    dispatch: { include: { farm: true, destination: true } }
                },
                orderBy: { boxCode: 'asc' }
            });
        }

        res.status(200).json({ success: true, data: reportData });
    } catch (error) {
        console.error('[LOGISTICS CONTROLLER] getReportData Exception:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

import prisma from '../database/db.js';
import notificationService from '../services/notifications/notificationService.js';

// Coordinates for target: Aeropuerto Tababela (UIO)
const TARGET_LAT = -0.1292;
const TARGET_LNG = -78.3582;

// Speed of simulation: step size
const STEP_LAT = -0.0086; // Approx. moves towards airport
const STEP_LNG = -0.0218;

// Keep track of active temperature spikes and alerted trips
export const activeSpikes = {}; // maps tripId -> boolean/number
const alertedTrips = new Set();

export function initTelemetrySimulation() {
    console.log('[TELEMETRY JOB] Telemetry Simulation initialized.');
    
    // Check and update telemetry every 25 seconds for active trips
    setInterval(async () => {
        try {
            const activeTrips = await prisma.trip.findMany({
                where: { status: 'En tránsito' },
                include: { 
                    dispatch: { include: { destination: true } },
                    vehicle: true
                }
            });

            if (activeTrips.length === 0) return;

            // Log checking
            // console.log(`[TELEMETRY JOB] Simulating movement for ${activeTrips.length} active trips.`);

            for (const trip of activeTrips) {
                // Get last GPS position
                const lastPos = await prisma.gpsPosition.findFirst({
                    where: { tripId: trip.id },
                    orderBy: { timestamp: 'desc' }
                });

                let currentLat = -0.0430; // Default Finca Cayambe latitude
                let currentLng = -78.1420; // Default Finca Cayambe longitude

                if (lastPos) {
                    currentLat = lastPos.latitude;
                    currentLng = lastPos.longitude;
                }

                // Calculate next coordinates (step towards airport target)
                // We add some minor random jitter for natural looking path
                const diffLat = TARGET_LAT - currentLat;
                const diffLng = TARGET_LNG - currentLng;
                const distance = Math.sqrt(diffLat * diffLat + diffLng * diffLng);

                let nextLat, nextLng, arrived = false;

                if (distance < 0.03) {
                    // Arrived at destination
                    nextLat = TARGET_LAT;
                    nextLng = TARGET_LNG;
                    arrived = true;
                } else {
                    // Step closer
                    nextLat = currentLat + (diffLat / distance) * 0.015 + (Math.random() - 0.5) * 0.001;
                    nextLng = currentLng + (diffLng / distance) * 0.015 + (Math.random() - 0.5) * 0.001;
                }

                // Generate temperature (standard flow target is 2 to 8°C, let's fluctuate it)
                let temperature;
                if (activeSpikes[trip.id]) {
                    // Simulate spike: 9.0°C to 11.5°C
                    temperature = parseFloat((9.2 + Math.random() * 2.0).toFixed(1));
                } else {
                    temperature = parseFloat((5.0 + (Math.random() - 0.5) * 3).toFixed(1));
                }

                // Check out of range
                const isOutOfRange = temperature < 2.0 || temperature > 8.0;
                if (isOutOfRange && !alertedTrips.has(trip.id)) {
                    alertedTrips.add(trip.id);
                    try {
                        const recipients = await prisma.employee.findMany({
                            where: {
                                role: { in: ['admin', 'operator'] },
                                isActive: true
                            }
                        });
                        
                        const msg = `El viaje de la placa ${trip.vehicle?.plate || 'N/A'} (Despacho: ${trip.dispatch?.dispatchCode || 'N/A'}) registró una temperatura crítica de ${temperature}°C, excediendo el rango óptimo (2°C - 8°C).`;
                        
                        for (const recipient of recipients) {
                            await notificationService.createNotification({
                                recipientId: recipient.id,
                                title: '🚨 Alerta: Cadena de Frío Rota',
                                message: msg,
                                type: 'COLD_CHAIN_ALERT',
                                relatedEntity: 'Trip',
                                relatedEntityId: trip.id
                            });
                        }
                        console.log(`[TELEMETRY JOB] Cold chain breach alert generated for trip ${trip.id}`);
                    } catch (err) {
                        console.error('[TELEMETRY JOB] Notification send failed:', err);
                    }
                } else if (!isOutOfRange && alertedTrips.has(trip.id)) {
                    alertedTrips.delete(trip.id);
                    try {
                        const recipients = await prisma.employee.findMany({
                            where: {
                                role: { in: ['admin', 'operator'] },
                                isActive: true
                            }
                        });
                        
                        const msg = `La temperatura del vehículo ${trip.vehicle?.plate || 'N/A'} se ha estabilizado a ${temperature}°C.`;
                        
                        for (const recipient of recipients) {
                            await notificationService.createNotification({
                                recipientId: recipient.id,
                                title: '✅ Temperatura Normalizada',
                                message: msg,
                                type: 'COLD_CHAIN_ALERT',
                                relatedEntity: 'Trip',
                                relatedEntityId: trip.id
                            });
                        }
                    } catch (err) {
                        console.error('[TELEMETRY JOB] Normalization notification failed:', err);
                    }
                }

                // Save telemetry in transaction
                await prisma.$transaction(async (tx) => {
                    await tx.gpsPosition.create({
                        data: {
                            tripId: trip.id,
                            latitude: nextLat,
                            longitude: nextLng
                        }
                    });

                    await tx.temperatureReading.create({
                        data: {
                            tripId: trip.id,
                            temperature
                        }
                    });

                    // If arrived, update trip status
                    if (arrived) {
                        await tx.trip.update({
                            where: { id: trip.id },
                            data: { status: 'Llegado a aeropuerto' }
                        });

                        await tx.tripStatusHistory.create({
                            data: {
                                tripId: trip.id,
                                status: 'Llegado a aeropuerto',
                                changedBy: 'System',
                                notes: 'Llegada automática detectada por geocerca GPS'
                            }
                        });

                        await tx.dispatch.update({
                            where: { id: trip.dispatchId },
                            data: { status: 'Finalizado' }
                        });
                    }
                });
            }
        } catch (error) {
            console.error('[TELEMETRY JOB] Error in simulation loop:', error);
        }
    }, 25000);
}


import prisma from '../database/db.js';

// Coordinates for target: Aeropuerto Tababela (UIO)
const TARGET_LAT = -0.1292;
const TARGET_LNG = -78.3582;

// Speed of simulation: step size
const STEP_LAT = -0.0086; // Approx. moves towards airport
const STEP_LNG = -0.0218;

export function initTelemetrySimulation() {
    console.log('[TELEMETRY JOB] Telemetry Simulation initialized.');
    
    // Check and update telemetry every 25 seconds for active trips
    setInterval(async () => {
        try {
            const activeTrips = await prisma.trip.findMany({
                where: { status: 'En tránsito' },
                include: { dispatch: { include: { destination: true } } }
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
                const temperature = parseFloat((5.0 + (Math.random() - 0.5) * 3).toFixed(1));

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

export async function seedCleanup(prisma) {
    console.log('[CLEANUP] Limpiando base de datos de logística...');

    try {
        await prisma.$transaction([
            prisma.logisticDocument.deleteMany(),
            prisma.temperatureReading.deleteMany(),
            prisma.gpsPosition.deleteMany(),
            prisma.boxScan.deleteMany(),
            prisma.tripStatusHistory.deleteMany(),
            prisma.trip.deleteMany(),
            prisma.vehicle.deleteMany(),
            prisma.box.deleteMany(),
            prisma.dispatch.deleteMany(),
            prisma.destination.deleteMany(),
            prisma.farm.deleteMany(),
            prisma.notification.deleteMany(),
            prisma.employee.deleteMany(),
        ], { timeout: 20000 });
        console.log('✅ Base de datos limpiada correctamente.');
    } catch (e) {
        console.log('⚠️ Transacción falló, intentando tabla por tabla...');
        const tables = [
            'logisticDocument', 'temperatureReading', 'gpsPosition', 'boxScan', 'tripStatusHistory',
            'trip', 'vehicle', 'box', 'dispatch', 'destination', 'farm',
            'notification', 'employee'
        ];
        for (const table of tables) {
            try {
                if (prisma[table]) {
                    await prisma[table].deleteMany();
                }
            } catch (err) {
                console.error(`⚠️ Error al limpiar tabla ${table}: ${err.message}`);
            }
        }
    }
}

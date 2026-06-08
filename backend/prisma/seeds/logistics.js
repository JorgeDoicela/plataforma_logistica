import bcrypt from 'bcryptjs';

export async function seedLogistics(prisma) {
    console.log('[LOGISTICS] Seeding farms, destinations, vehicles, dispatches, boxes, and trips...');

    // 1. Update roles for logistics flow
    // Valeria Espinoza -> operator
    // Mateo Jiménez -> operator
    // Felipe Castillo -> driver
    // Kevin Arismendi -> driver
    
    await prisma.employee.updateMany({
        where: { email: { in: ['valeria.espinoza@emplifi.com', 'mateo.jimenez@emplifi.com'] } },
        data: { role: 'operator' }
    });

    await prisma.employee.updateMany({
        where: { email: { in: ['felipe.castillo@emplifi.com', 'kevin.arismendi@emplifi.com'] } },
        data: { role: 'driver' }
    });

    console.log('✅ Updated employee roles for Logistics MVP: Valeria & Mateo (operators), Felipe, Kevin & Carlos (drivers).');

    // 2. Create Farms
    const farm1 = await prisma.farm.create({
        data: { name: 'Finca Girasoles de Tabacundo', location: 'Tabacundo, Pichincha' }
    });
    const farm2 = await prisma.farm.create({
        data: { name: 'Finca Rosas del Valle', location: 'Cayambe, Pichincha' }
    });
    const farm3 = await prisma.farm.create({
        data: { name: 'Finca Florícola El Bosque', location: 'Yaruquí, Pichincha' }
    });

    console.log('✅ Created 3 Farms.');

    // 3. Create Destinations
    const dest1 = await prisma.destination.create({
        data: { name: 'Aeropuerto Internacional Mariscal Sucre (UIO)', description: 'Terminal de Carga - Quito' }
    });
    const dest2 = await prisma.destination.create({
        data: { name: 'Aeropuerto Internacional José Joaquín de Olmedo (GYE)', description: 'Terminal de Carga - Guayaquil' }
    });
    const dest3 = await prisma.destination.create({
        data: { name: 'Puerto Marítimo de Guayaquil (CONTECON)', description: 'Terminal de Exportación - Guayaquil' }
    });

    console.log('✅ Created 3 Destinations.');

    // 4. Create Vehicles
    const veh1 = await prisma.vehicle.create({
        data: { plate: 'PBX-1234', brand: 'Hino', model: 'GD 10 Toneladas', isActive: true }
    });
    const veh2 = await prisma.vehicle.create({
        data: { plate: 'PDF-5678', brand: 'Chevrolet', model: 'NPR 5 Toneladas', isActive: true }
    });
    const veh3 = await prisma.vehicle.create({
        data: { plate: 'PCD-9012', brand: 'Hyundai', model: 'H100 1.5 Toneladas', isActive: true }
    });

    console.log('✅ Created 3 Vehicles.');

    // Find operators and drivers for relation binding
    const operatorUser = await prisma.employee.findFirst({ where: { role: 'operator' } });
    const driverUser1 = await prisma.employee.findFirst({ where: { email: 'chofer@emplifi.com' } });
    const driverUser2 = await prisma.employee.findFirst({ where: { email: 'felipe.castillo@emplifi.com' } });

    // 5. Create Dispatches
    const dispatch1 = await prisma.dispatch.create({
        data: {
            dispatchCode: 'DESP-2026-001',
            farmId: farm1.id,
            destinationId: dest1.id,
            date: new Date(),
            responsibleId: operatorUser.id,
            observations: 'Despacho prioritario de flores de exportación para San Valentín prep.',
            status: 'Preparación'
        }
    });

    const dispatch2 = await prisma.dispatch.create({
        data: {
            dispatchCode: 'DESP-2026-002',
            farmId: farm2.id,
            destinationId: dest1.id,
            date: new Date(),
            responsibleId: operatorUser.id,
            observations: 'Rosas rojas premium. Requiere mantener cadena de frío entre 2°C y 8°C.',
            status: 'En carga'
        }
    });

    console.log('✅ Created 2 Dispatches.');

    // 6. Create Boxes for dispatches
    // Dispatch 1 boxes
    for (let i = 1; i <= 6; i++) {
        const boxCode = `BX-001-${String(i).padStart(3, '0')}`;
        await prisma.box.create({
            data: {
                boxCode,
                qrCode: `QR_${boxCode}_DESP-2026-001`,
                dispatchId: dispatch1.id,
                status: 'Pendiente'
            }
        });
    }

    // Dispatch 2 boxes
    const d2Boxes = [];
    for (let i = 1; i <= 8; i++) {
        const boxCode = `BX-002-${String(i).padStart(3, '0')}`;
        const box = await prisma.box.create({
            data: {
                boxCode,
                qrCode: `QR_${boxCode}_DESP-2026-002`,
                dispatchId: dispatch2.id,
                status: i <= 5 ? 'Cargada' : 'Pendiente'
            }
        });
        d2Boxes.push(box);
    }

    console.log('✅ Created boxes for dispatches and associated QR codes.');

    // 7. Create Trips
    const trip1 = await prisma.trip.create({
        data: {
            driverId: driverUser1.id,
            vehicleId: veh1.id,
            dispatchId: dispatch2.id,
            date: new Date(),
            time: '08:30',
            status: 'En finca'
        }
    });

    // Create history for trip1
    await prisma.tripStatusHistory.create({
        data: {
            tripId: trip1.id,
            status: 'Asignado',
            changedBy: operatorUser.id,
            notes: 'Viaje programado y asignado a Carlos Conductor'
        }
    });
    await prisma.tripStatusHistory.create({
        data: {
            tripId: trip1.id,
            status: 'En finca',
            changedBy: driverUser1.id,
            notes: 'Conductor reporta llegada a Finca Rosas del Valle'
        }
    });

    // Add scans for trip1 (dispatch2) boxes
    // Carlos loaded 5 boxes
    for (let i = 0; i < 5; i++) {
        await prisma.boxScan.create({
            data: {
                boxId: d2Boxes[i].id,
                scannedBy: driverUser1.id,
                status: 'Cargada',
                latitude: -0.1806,
                longitude: -78.4678
            }
        });
    }

    // Add mock GPS points and temperature readings for trip1
    // Tabacundo/Cayambe region coordinates towards UIO airport
    const routePoints = [
        { lat: -0.0423, lng: -78.1432, temp: 6.2 }, // Finca Cayambe
        { lat: -0.0892, lng: -78.2104, temp: 5.8 },
        { lat: -0.1245, lng: -78.2811, temp: 6.0 },
    ];

    for (let i = 0; i < routePoints.length; i++) {
        const timestamp = new Date(Date.now() - (routePoints.length - i) * 10 * 60 * 1000); // 10 min intervals
        await prisma.gpsPosition.create({
            data: {
                tripId: trip1.id,
                latitude: routePoints[i].lat,
                longitude: routePoints[i].lng,
                timestamp
            }
        });
        await prisma.temperatureReading.create({
            data: {
                tripId: trip1.id,
                temperature: routePoints[i].temp,
                timestamp
            }
        });
    }

    console.log('✅ Created active Trip with GPS history and Box scans.');
    console.log('[LOGISTICS] Seeding completed successfully!');
}

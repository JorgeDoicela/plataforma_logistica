export async function seedLogistics(prisma) {
    console.log('[LOGISTICS] Seeding farms, destinations, vehicles, dispatches, boxes, trips, telemetry, scans, and documents...');

    // 1. Asegurar roles correctos en empleados
    await prisma.employee.updateMany({
        where: { email: { in: ['valeria.espinoza@emplifi.com', 'mateo.jimenez@emplifi.com'] } },
        data: { role: 'operator' }
    });

    await prisma.employee.updateMany({
        where: { email: { in: ['felipe.castillo@emplifi.com', 'kevin.arismendi@emplifi.com', 'chofer@emplifi.com'] } },
        data: { role: 'driver', trackingConsent: true }
    });

    console.log('✅ Roles de logística asegurados para operadores y conductores.');

    // 2. Crear Fincas
    const farm1 = await prisma.farm.create({
        data: { name: 'Finca Girasoles de Tabacundo', location: 'Tabacundo, Pichincha' }
    });
    const farm2 = await prisma.farm.create({
        data: { name: 'Finca Rosas del Valle', location: 'Cayambe, Pichincha' }
    });
    const farm3 = await prisma.farm.create({
        data: { name: 'Finca Florícola El Bosque', location: 'Yaruquí, Pichincha' }
    });

    console.log('✅ Fincas creadas.');

    // 3. Crear Destinos
    const dest1 = await prisma.destination.create({
        data: { name: 'Aeropuerto Internacional Mariscal Sucre (UIO)', description: 'Terminal de Carga - Quito' }
    });
    const dest2 = await prisma.destination.create({
        data: { name: 'Aeropuerto Internacional José Joaquín de Olmedo (GYE)', description: 'Terminal de Carga - Guayaquil' }
    });
    const dest3 = await prisma.destination.create({
        data: { name: 'Puerto Marítimo de Guayaquil (CONTECON)', description: 'Terminal de Exportación - Guayaquil' }
    });

    console.log('✅ Destinos creados.');

    // 4. Crear Vehículos
    const veh1 = await prisma.vehicle.create({
        data: { plate: 'PBX-1234', brand: 'Hino', model: 'GD 10 Toneladas', isActive: true }
    });
    const veh2 = await prisma.vehicle.create({
        data: { plate: 'PDF-5678', brand: 'Chevrolet', model: 'NPR 5 Toneladas', isActive: true }
    });
    const veh3 = await prisma.vehicle.create({
        data: { plate: 'PCD-9012', brand: 'Hyundai', model: 'H100 1.5 Toneladas', isActive: true }
    });

    console.log('✅ Vehículos creados.');

    // Obtener operarios y choferes
    const operator = await prisma.employee.findFirst({ where: { email: 'valeria.espinoza@emplifi.com' } });
    const driver1 = await prisma.employee.findFirst({ where: { email: 'chofer@emplifi.com' } });
    const driver2 = await prisma.employee.findFirst({ where: { email: 'felipe.castillo@emplifi.com' } });
    const driver3 = await prisma.employee.findFirst({ where: { email: 'kevin.arismendi@emplifi.com' } });

    // 5. Crear Despachos con diferentes estados
    // DESP 1: En preparación
    const dispatch1 = await prisma.dispatch.create({
        data: {
            dispatchCode: 'DESP-2026-001',
            farmId: farm1.id,
            destinationId: dest1.id,
            date: new Date(),
            responsibleId: operator.id,
            observations: 'Despacho prioritario de claveles. En preparación en finca.',
            status: 'Preparación'
        }
    });

    // DESP 2: En Carga (Tiene un viaje en estado En finca)
    const dispatch2 = await prisma.dispatch.create({
        data: {
            dispatchCode: 'DESP-2026-002',
            farmId: farm2.id,
            destinationId: dest1.id,
            date: new Date(),
            responsibleId: operator.id,
            observations: 'Rosas rojas premium. Requiere mantener frío entre 2°C y 8°C.',
            status: 'En carga'
        }
    });

    // DESP 3: Despachado / En tránsito (Tiene un viaje en tránsito)
    const dispatch3 = await prisma.dispatch.create({
        data: {
            dispatchCode: 'DESP-2026-003',
            farmId: farm3.id,
            destinationId: dest2.id,
            date: new Date(),
            responsibleId: operator.id,
            observations: 'Flores de verano. Despachadas vía terrestre a GYE.',
            status: 'Despachado'
        }
    });

    // DESP 4: Finalizado (Viaje finalizado hace 1 día, entrega efectiva con 1 caja faltante)
    const dispatch4 = await prisma.dispatch.create({
        data: {
            dispatchCode: 'DESP-2026-004',
            farmId: farm1.id,
            destinationId: dest1.id,
            date: new Date(Date.now() - 24 * 60 * 60 * 1000),
            responsibleId: operator.id,
            observations: 'Rosas variadas. Entregado en terminal de carga UIO.',
            status: 'Finalizado'
        }
    });

    // DESP 5: Finalizado (Viaje finalizado hace 2 días, entrega 100% efectiva y a tiempo)
    const dispatch5 = await prisma.dispatch.create({
        data: {
            dispatchCode: 'DESP-2026-005',
            farmId: farm2.id,
            destinationId: dest3.id,
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            responsibleId: operator.id,
            observations: 'Girasoles gigantes. Puerto de Guayaquil exportación.',
            status: 'Finalizado'
        }
    });

    // DESP 6: Finalizado (Viaje finalizado hace 3 días, entrega efectiva con 1 caja faltante y retrasado)
    const dispatch6 = await prisma.dispatch.create({
        data: {
            dispatchCode: 'DESP-2026-006',
            farmId: farm3.id,
            destinationId: dest2.id,
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            responsibleId: operator.id,
            observations: 'Lirios blancos. Terminal de carga de Guayaquil.',
            status: 'Finalizado'
        }
    });

    console.log('✅ Despachos creados en estados: Preparación, En carga, Despachado, Finalizado.');

    // 6. Crear Cajas para cada despacho
    // DESP 1: 6 cajas pendientes
    for (let i = 1; i <= 6; i++) {
        await prisma.box.create({
            data: {
                boxCode: `BX-001-${String(i).padStart(3, '0')}`,
                qrCode: `QR_BX-001-${String(i).padStart(3, '0')}_DESP-2026-001`,
                dispatchId: dispatch1.id,
                status: 'Pendiente'
            }
        });
    }

    // DESP 2: 8 cajas (5 cargadas, 3 pendientes)
    const d2Boxes = [];
    for (let i = 1; i <= 8; i++) {
        const box = await prisma.box.create({
            data: {
                boxCode: `BX-002-${String(i).padStart(3, '0')}`,
                qrCode: `QR_BX-002-${String(i).padStart(3, '0')}_DESP-2026-002`,
                dispatchId: dispatch2.id,
                status: i <= 5 ? 'Cargada' : 'Pendiente'
            }
        });
        d2Boxes.push(box);
    }

    // DESP 3: 10 cajas en tránsito
    const d3Boxes = [];
    for (let i = 1; i <= 10; i++) {
        const box = await prisma.box.create({
            data: {
                boxCode: `BX-003-${String(i).padStart(3, '0')}`,
                qrCode: `QR_BX-003-${String(i).padStart(3, '0')}_DESP-2026-003`,
                dispatchId: dispatch3.id,
                status: 'En tránsito'
            }
        });
        d3Boxes.push(box);
    }

    // DESP 4: 12 cajas (11 entregadas, 1 faltante)
    const d4Boxes = [];
    for (let i = 1; i <= 12; i++) {
        const box = await prisma.box.create({
            data: {
                boxCode: `BX-004-${String(i).padStart(3, '0')}`,
                qrCode: `QR_BX-004-${String(i).padStart(3, '0')}_DESP-2026-004`,
                dispatchId: dispatch4.id,
                status: i <= 11 ? 'Entregada' : 'Faltante'
            }
        });
        d4Boxes.push(box);
    }

    // DESP 5: 5 cajas entregadas
    const d5Boxes = [];
    for (let i = 1; i <= 5; i++) {
        const box = await prisma.box.create({
            data: {
                boxCode: `BX-005-${String(i).padStart(3, '0')}`,
                qrCode: `QR_BX-005-${String(i).padStart(3, '0')}_DESP-2026-005`,
                dispatchId: dispatch5.id,
                status: 'Entregada'
            }
        });
        d5Boxes.push(box);
    }

    // DESP 6: 7 cajas (6 entregadas, 1 faltante)
    const d6Boxes = [];
    for (let i = 1; i <= 7; i++) {
        const box = await prisma.box.create({
            data: {
                boxCode: `BX-006-${String(i).padStart(3, '0')}`,
                qrCode: `QR_BX-006-${String(i).padStart(3, '0')}_DESP-2026-006`,
                dispatchId: dispatch6.id,
                status: i <= 6 ? 'Entregada' : 'Faltante'
            }
        });
        d6Boxes.push(box);
    }

    console.log('✅ Cajas creadas con estados realistas para cálculos de KPI.');

    // 7. Crear Viajes
    // Viaje 1 (Activo - En carga / En finca, despacho 2, Carlos Conductor)
    const trip1 = await prisma.trip.create({
        data: {
            driverId: driver1.id,
            vehicleId: veh1.id,
            dispatchId: dispatch2.id,
            date: new Date(),
            time: '08:30',
            status: 'En finca'
        }
    });

    await prisma.tripStatusHistory.createMany({
        data: [
            { tripId: trip1.id, status: 'Asignado', changedBy: operator.id, notes: 'Viaje asignado a Carlos Conductor.', changedAt: new Date(Date.now() - 30 * 60 * 1000) },
            { tripId: trip1.id, status: 'En finca', changedBy: driver1.id, notes: 'Conductor reporta llegada a Finca Rosas del Valle.', changedAt: new Date() }
        ]
    });

    // Registrar escaneos de carga para el viaje 1
    for (let i = 0; i < 5; i++) {
        await prisma.boxScan.create({
            data: {
                boxId: d2Boxes[i].id,
                scannedBy: driver1.id,
                status: 'Cargada',
                latitude: -0.1122,
                longitude: -78.1455,
                scannedAt: new Date(Date.now() - 15 * 60 * 1000)
            }
        });
    }

    // Viaje 2 (Activo - En tránsito, despacho 3, Felipe Castillo)
    const trip2 = await prisma.trip.create({
        data: {
            driverId: driver2.id,
            vehicleId: veh2.id,
            dispatchId: dispatch3.id,
            date: new Date(),
            time: '06:00',
            status: 'En tránsito'
        }
    });

    await prisma.tripStatusHistory.createMany({
        data: [
            { tripId: trip2.id, status: 'Asignado', changedBy: operator.id, notes: 'Viaje asignado a Felipe Castillo.', changedAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
            { tripId: trip2.id, status: 'En finca', changedBy: driver2.id, notes: 'Conductor reporta llegada a Finca El Bosque.', changedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000) },
            { tripId: trip2.id, status: 'En tránsito', changedBy: driver2.id, notes: 'Viaje terrestre iniciado con cadena de frío activa.', changedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) }
        ]
    });

    // Registrar escaneos para el viaje 2
    for (let i = 0; i < 10; i++) {
        await prisma.boxScan.create({
            data: {
                boxId: d3Boxes[i].id,
                scannedBy: driver2.id,
                status: 'Cargada',
                latitude: -0.1245,
                longitude: -78.2811,
                scannedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
            }
        });
    }

    // Viaje 3 (Finalizado hace 1 día, a tiempo - Tomó 4 horas, Carlos Conductor)
    const trip3Date = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const trip3 = await prisma.trip.create({
        data: {
            driverId: driver1.id,
            vehicleId: veh1.id,
            dispatchId: dispatch4.id,
            date: trip3Date,
            time: '08:00',
            status: 'Finalizado'
        }
    });

    await prisma.tripStatusHistory.createMany({
        data: [
            { tripId: trip3.id, status: 'Asignado', changedBy: operator.id, notes: 'Viaje asignado.', changedAt: new Date(trip3Date.getTime()) },
            { tripId: trip3.id, status: 'En finca', changedBy: driver1.id, notes: 'En finca.', changedAt: new Date(trip3Date.getTime() + 30 * 60 * 1000) },
            { tripId: trip3.id, status: 'En tránsito', changedBy: driver1.id, notes: 'En tránsito.', changedAt: new Date(trip3Date.getTime() + 60 * 1000 * 60) },
            { tripId: trip3.id, status: 'Llegado a aeropuerto', changedBy: driver1.id, notes: 'Llegó a UIO.', changedAt: new Date(trip3Date.getTime() + 60 * 1000 * 180) },
            { tripId: trip3.id, status: 'Finalizado', changedBy: driver1.id, notes: 'Entregado y cerrado.', changedAt: new Date(trip3Date.getTime() + 60 * 1000 * 240) } // 4 horas
        ]
    });

    // Registrar escaneos de carga y entrega para viaje 3
    for (let i = 0; i < 12; i++) {
        const boxStatus = i <= 10 ? 'Cargada' : 'Faltante';
        await prisma.boxScan.create({
            data: {
                boxId: d4Boxes[i].id,
                scannedBy: driver1.id,
                status: boxStatus,
                latitude: -0.0423,
                longitude: -78.1432,
                scannedAt: new Date(trip3Date.getTime() + 45 * 60 * 1000)
            }
        });

        if (boxStatus === 'Cargada') {
            await prisma.boxScan.create({
                data: {
                    boxId: d4Boxes[i].id,
                    scannedBy: driver1.id,
                    status: 'Entregada',
                    latitude: -0.1245,
                    longitude: -78.2811,
                    scannedAt: new Date(trip3Date.getTime() + 230 * 60 * 1000)
                }
            });
        }
    }

    // Viaje 4 (Finalizado hace 2 días, a tiempo - Tomó 3 horas, Felipe Castillo)
    const trip4Date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const trip4 = await prisma.trip.create({
        data: {
            driverId: driver2.id,
            vehicleId: veh2.id,
            dispatchId: dispatch5.id,
            date: trip4Date,
            time: '08:00',
            status: 'Finalizado'
        }
    });

    await prisma.tripStatusHistory.createMany({
        data: [
            { tripId: trip4.id, status: 'Asignado', changedBy: operator.id, notes: 'Viaje asignado.', changedAt: new Date(trip4Date.getTime()) },
            { tripId: trip4.id, status: 'Finalizado', changedBy: driver2.id, notes: 'Entrega finalizada en puerto.', changedAt: new Date(trip4Date.getTime() + 60 * 1000 * 180) } // 3 horas
        ]
    });

    // Registrar escaneos para viaje 4
    for (let i = 0; i < 5; i++) {
        await prisma.boxScan.create({
            data: {
                boxId: d5Boxes[i].id,
                scannedBy: driver2.id,
                status: 'Cargada',
                latitude: -0.0423,
                longitude: -78.1432,
                scannedAt: new Date(trip4Date.getTime() + 15 * 60 * 1000)
            }
        });
        await prisma.boxScan.create({
            data: {
                boxId: d5Boxes[i].id,
                scannedBy: driver2.id,
                status: 'Entregada',
                latitude: -2.1833,
                longitude: -79.8833,
                scannedAt: new Date(trip4Date.getTime() + 170 * 60 * 1000)
            }
        });
    }

    // Viaje 5 (Finalizado hace 3 días, retrasado - Tomó 6 horas, Kevin Arismendi)
    const trip5Date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const trip5 = await prisma.trip.create({
        data: {
            driverId: driver3.id,
            vehicleId: veh3.id,
            dispatchId: dispatch6.id,
            date: trip5Date,
            time: '08:00',
            status: 'Finalizado'
        }
    });

    await prisma.tripStatusHistory.createMany({
        data: [
            { tripId: trip5.id, status: 'Asignado', changedBy: operator.id, notes: 'Viaje asignado.', changedAt: new Date(trip5Date.getTime()) },
            { tripId: trip5.id, status: 'Finalizado', changedBy: driver3.id, notes: 'Cerrado con demora por tráfico.', changedAt: new Date(trip5Date.getTime() + 60 * 1000 * 360) } // 6 horas (Retrasado)
        ]
    });

    // Registrar escaneos para viaje 5
    for (let i = 0; i < 7; i++) {
        const boxStatus = i <= 5 ? 'Cargada' : 'Faltante';
        await prisma.boxScan.create({
            data: {
                boxId: d6Boxes[i].id,
                scannedBy: driver3.id,
                status: boxStatus,
                latitude: -0.0892,
                longitude: -78.2104,
                scannedAt: new Date(trip5Date.getTime() + 20 * 60 * 1000)
            }
        });
        if (boxStatus === 'Cargada') {
            await prisma.boxScan.create({
                data: {
                    boxId: d6Boxes[i].id,
                    scannedBy: driver3.id,
                    status: 'Entregada',
                    latitude: -2.1833,
                    longitude: -79.8833,
                    scannedAt: new Date(trip5Date.getTime() + 340 * 60 * 1000)
                }
            });
        }
    }

    console.log('✅ Viajes activos e históricos creados. Historial de estados y escaneos de entrega poblados.');

    // 8. Crear lecturas de Telemetría (GPS y Temperatura)
    // Lecturas de Temperatura para mantener rangos (promedio ~ 6°C)
    const tripTelemetry = [
        { trip: trip1, active: true },
        { trip: trip2, active: true },
        { trip: trip3, active: false },
        { trip: trip4, active: false },
        { trip: trip5, active: false }
    ];

    for (const tInfo of tripTelemetry) {
        const trip = tInfo.trip;
        const pts = [
            { lat: -0.0423, lng: -78.1432, temp: 6.2 },
            { lat: -0.0892, lng: -78.2104, temp: 5.8 },
            { lat: -0.1245, lng: -78.2811, temp: 6.0 },
            { lat: -0.1806, lng: -78.4678, temp: 6.4 }
        ];

        for (let i = 0; i < pts.length; i++) {
            const dateOffset = new Date(trip.date.getTime() + i * 15 * 60 * 1000); // interval de 15 mins
            await prisma.gpsPosition.create({
                data: {
                    tripId: trip.id,
                    latitude: pts[i].lat,
                    longitude: pts[i].lng,
                    timestamp: dateOffset
                }
            });
            await prisma.temperatureReading.create({
                data: {
                    tripId: trip.id,
                    temperature: pts[i].temp,
                    timestamp: dateOffset
                }
            });
        }
    }

    console.log('✅ Lecturas de telemetría GPS y temperatura configuradas.');

    // 9. Crear Documentos Logísticos
    // Agregar guía original
    await prisma.logisticDocument.create({
        data: {
            dispatchId: dispatch4.id,
            type: 'Guía de despacho',
            fileUrl: '/uploads/logistic-seeder-guia-original.pdf',
            originalName: 'guia_despacho_orig_004.pdf',
            uploadedBy: operator.id
        }
    });

    // Agregar guías firmadas por los conductores (Evidencias de cierre)
    await prisma.logisticDocument.create({
        data: {
            dispatchId: dispatch4.id,
            type: 'Guía firmada',
            fileUrl: '/uploads/logistic-seeder-guia-firmada-trip3.pdf',
            originalName: 'guia_conductor_firmada_004.pdf',
            uploadedBy: driver1.id
        }
    });

    await prisma.logisticDocument.create({
        data: {
            dispatchId: dispatch5.id,
            type: 'Guía firmada',
            fileUrl: '/uploads/logistic-seeder-guia-firmada-trip4.pdf',
            originalName: 'guia_conductor_firmada_005.pdf',
            uploadedBy: driver2.id
        }
    });

    await prisma.logisticDocument.create({
        data: {
            dispatchId: dispatch6.id,
            type: 'Guía firmada',
            fileUrl: '/uploads/logistic-seeder-guia-firmada-trip5.pdf',
            originalName: 'guia_conductor_firmada_006.pdf',
            uploadedBy: driver3.id
        }
    });

    console.log('✅ Documentos logísticos y guías firmadas por choferes subidos.');

    // 10. Crear registros de Auditoría
    const logs = [
        { entity: 'Dispatch', entityId: dispatch4.id, action: 'CREATE', performedBy: operator.id, details: 'Despacho creado y aprobado por Valeria Espinoza.' },
        { entity: 'Trip', entityId: trip3.id, action: 'CLOSE', performedBy: driver1.id, details: 'Viaje cerrado satisfactoriamente en destino final.' },
        { entity: 'LogisticDocument', entityId: 'doc_signed_evidence', action: 'UPLOAD_DOCUMENT', performedBy: driver1.id, details: 'Carga de guía firmada en PDF por Carlos Conductor.' }
    ];

    for (const log of logs) {
        await prisma.auditLog.create({
            data: {
                entity: log.entity,
                entityId: log.entityId,
                action: log.action,
                performedBy: log.performedBy,
                details: log.details,
                ip: '192.168.100.12'
            }
        });
    }

    console.log('✅ Registros de auditoría creados exitosamente.');
    console.log('[LOGISTICS] Seeding completado de forma integral!');
}

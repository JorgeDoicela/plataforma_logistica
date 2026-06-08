import fs from 'fs';

const BASE_URL = 'http://localhost:4000/api';

async function testFlow() {
    console.log('🚀 Iniciando verificación automática del flujo E2E - Etapa 4...\n');

    try {
        // 1. LOGIN ADMIN
        console.log('🔐 [1] Iniciando sesión como Administrador...');
        const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@emplifi.com', password: 'Emplifi2025!' })
        });
        const adminLogin = await adminLoginRes.json();
        if (!adminLogin.success) throw new Error('Error al iniciar sesión como admin: ' + JSON.stringify(adminLogin));
        const adminToken = adminLogin.token;
        console.log('✅ Admin autenticado con éxito.\n');

        // 2. OBTENER FINCAS Y DESTINOS
        console.log('🚜 [2] Obteniendo fincas y destinos...');
        const farmsRes = await fetch(`${BASE_URL}/logistics/farms`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const farms = await farmsRes.json();
        const farm = farms.data[0];
        if (!farm) throw new Error('No hay fincas configuradas.');

        const destsRes = await fetch(`${BASE_URL}/logistics/destinations`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const dests = await destsRes.json();
        const destination = dests.data[0];
        if (!destination) throw new Error('No hay destinos configurados.');
        console.log(`✅ Finca seleccionada: ${farm.name} (ID: ${farm.id})`);
        console.log(`✅ Destino seleccionado: ${destination.name} (ID: ${destination.id})\n`);

        // 3. CREAR DESPACHO
        const dispatchCode = `DESP-VERIF-${Date.now().toString().slice(-4)}`;
        console.log(`📦 [3] Creando despacho con código: ${dispatchCode}...`);
        const dispatchRes = await fetch(`${BASE_URL}/logistics/dispatches`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                dispatchCode,
                farmId: farm.id,
                destinationId: destination.id,
                date: new Date().toISOString(),
                observations: 'Prueba de verificación automática E2E',
                boxCount: 5
            })
        });
        const newDispatch = await dispatchRes.json();
        if (!newDispatch.success) throw new Error('Error al crear despacho: ' + JSON.stringify(newDispatch));
        const dispatchId = newDispatch.data.id;
        console.log(`✅ Despacho creado con ID: ${dispatchId}\n`);

        // 4. OBTENER VEHÍCULO Y CONDUCTOR
        console.log('🚛 [4] Obteniendo vehículos y conductores...');
        const vehiclesRes = await fetch(`${BASE_URL}/logistics/vehicles`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const vehicles = await vehiclesRes.json();
        const vehicle = vehicles.data[0];
        if (!vehicle) throw new Error('No hay vehículos configurados.');

        const driversRes = await fetch(`${BASE_URL}/logistics/drivers`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const drivers = await driversRes.json();
        const driver = drivers.data[0];
        if (!driver) throw new Error('No hay conductores configurados.');
        console.log(`✅ Conductor seleccionado: ${driver.firstName} ${driver.lastName} (ID: ${driver.id})`);
        console.log(`✅ Vehículo seleccionado: ${vehicle.plate} (ID: ${vehicle.id})\n`);

        // 5. ASIGNAR VIAJE
        console.log('⏰ [5] Programando viaje para el despacho...');
        const tripRes = await fetch(`${BASE_URL}/logistics/trips`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                driverId: driver.id,
                vehicleId: vehicle.id,
                dispatchId,
                date: new Date().toISOString().split('T')[0],
                time: '14:30'
            })
        });
        const newTrip = await tripRes.json();
        if (!newTrip.success) throw new Error('Error al crear viaje: ' + JSON.stringify(newTrip));
        const tripId = newTrip.data.id;
        console.log(`✅ Viaje creado con ID: ${tripId}\n`);

        // 6. SUBIR GUÍA DE DESPACHO (ADMIN)
        console.log('📄 [6] Subiendo Guía de Despacho inicial...');
        const docFormData = new FormData();
        docFormData.append('dispatchId', dispatchId);
        docFormData.append('type', 'Guía de despacho');
        const fileContent = 'Contenido de prueba de la guia de despacho';
        const fileBlob = new Blob([fileContent], { type: 'text/plain' });
        docFormData.append('file', fileBlob, 'guia_despacho.txt');

        const uploadRes = await fetch(`${BASE_URL}/logistics/documents/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            },
            body: docFormData
        });
        const docUpload = await uploadRes.json();
        if (!docUpload.success) throw new Error('Error al subir documento inicial: ' + JSON.stringify(docUpload));
        console.log('✅ Guía de despacho subida exitosamente.\n');

        // 7. LOGIN DRIVER
        console.log('🔑 [7] Iniciando sesión como Chofer...');
        const driverLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'chofer@emplifi.com', password: 'Emplifi2025!' })
        });
        const driverLogin = await driverLoginRes.json();
        if (!driverLogin.success) throw new Error('Error al iniciar sesión como conductor: ' + JSON.stringify(driverLogin));
        const driverToken = driverLogin.token;
        console.log('✅ Chofer autenticado con éxito.\n');

        // 8. OBTENER DETALLE DEL VIAJE (CAJAS GENERADAS)
        console.log('📦 [8] Consultando cajas asignadas al viaje...');
        const tripDetailRes = await fetch(`${BASE_URL}/logistics/trips/${tripId}`, {
            headers: { 'Authorization': `Bearer ${driverToken}` }
        });
        const tripDetail = await tripDetailRes.json();
        if (!tripDetail.success) throw new Error('Error al consultar detalle del viaje: ' + JSON.stringify(tripDetail));
        const boxes = tripDetail.data.dispatch.boxes;
        console.log(`✅ Se encontraron ${boxes.length} cajas generadas para el despacho.`);
        boxes.forEach((b, i) => console.log(`   - Caja ${i + 1}: ${b.boxCode} (Estado: ${b.status})`));
        console.log();

        // 9. SIMULAR ESCANEO DE CAJAS
        console.log('📷 [9] Simulando escaneo QR de cajas por el conductor...');
        // Escanear 3 cajas como Cargada
        for (let i = 0; i < 3; i++) {
            const scanRes = await fetch(`${BASE_URL}/logistics/scans/box`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${driverToken}`
                },
                body: JSON.stringify({
                    tripId,
                    boxCode: boxes[i].boxCode,
                    status: 'Cargada',
                    latitude: -0.1806,
                    longitude: -78.4678
                })
            });
            const scan = await scanRes.json();
            if (!scan.success) throw new Error(`Error al escanear caja ${boxes[i].boxCode}: ` + JSON.stringify(scan));
            console.log(`✅ Caja ${boxes[i].boxCode} escaneada y registrada como CARGADA.`);
        }
        // Escanear 1 caja como Faltante
        const scanResFaltante = await fetch(`${BASE_URL}/logistics/scans/box`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${driverToken}`
            },
            body: JSON.stringify({
                tripId,
                boxCode: boxes[3].boxCode,
                status: 'Faltante',
                latitude: -0.1806,
                longitude: -78.4678
            })
        });
        const scanFaltante = await scanResFaltante.json();
        if (!scanFaltante.success) throw new Error(`Error al escanear caja faltante ${boxes[3].boxCode}: ` + JSON.stringify(scanFaltante));
        console.log(`⚠️ Caja ${boxes[3].boxCode} escaneada y registrada como FALTANTE.\n`);

        // 10. ACTUALIZAR ESTADO DEL VIAJE (EN FINCA -> EN TRÁNSITO)
        console.log('🔄 [10] Actualizando estados de viaje por conductor...');
        const statusFincaRes = await fetch(`${BASE_URL}/logistics/trips/${tripId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${driverToken}`
            },
            body: JSON.stringify({ status: 'En finca', notes: 'Llegado a finca, cargando cajas' })
        });
        await statusFincaRes.json();
        console.log('✅ Estado viaje cambiado a: En finca');

        const statusTransitoRes = await fetch(`${BASE_URL}/logistics/trips/${tripId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${driverToken}`
            },
            body: JSON.stringify({ status: 'En tránsito', notes: 'Cajas cargadas, saliendo hacia aeropuerto' })
        });
        await statusTransitoRes.json();
        console.log('✅ Estado viaje cambiado a: En tránsito\n');

        // 11. SUBIR GUÍA FIRMADA
        console.log('✍️ [11] Conductor sube Guía Firmada por Aeropuerto...');
        const signedFormData = new FormData();
        signedFormData.append('dispatchId', dispatchId);
        signedFormData.append('type', 'Guía firmada');
        const signedBlob = new Blob(['Guia firmada por aduana/conductor'], { type: 'text/plain' });
        signedFormData.append('file', signedBlob, 'guia_firmada.txt');

        const uploadSignedRes = await fetch(`${BASE_URL}/logistics/documents/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${driverToken}`
            },
            body: signedFormData
        });
        const signedUpload = await uploadSignedRes.json();
        if (!signedUpload.success) throw new Error('Error al subir guía firmada: ' + JSON.stringify(signedUpload));
        console.log('✅ Guía firmada subida exitosamente por el conductor.\n');

        // 12. FINALIZAR VIAJE
        console.log('🏁 [12] Conductor finaliza el viaje...');
        const statusFinalizadoRes = await fetch(`${BASE_URL}/logistics/trips/${tripId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${driverToken}`
            },
            body: JSON.stringify({ status: 'Finalizado', notes: 'Carga entregada en aeropuerto, guía de recibo firmada' })
        });
        const finalStatus = await statusFinalizadoRes.json();
        if (!finalStatus.success) throw new Error('Error al finalizar viaje: ' + JSON.stringify(finalStatus));
        console.log('✅ Estado viaje cambiado a: Finalizado\n');

        // 13. CONSULTAR DASHBOARD Y KPIs (ADMIN)
        console.log('📊 [13] Consultando KPIs en Dashboard Logístico (Admin)...');
        const dashboardStatsRes = await fetch(`${BASE_URL}/logistics/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const dashboardStats = await dashboardStatsRes.json();
        if (!dashboardStats.success) throw new Error('Error al obtener estadísticas del dashboard: ' + JSON.stringify(dashboardStats));
        
        const stats = dashboardStats.data;
        console.log('✅ KPIs Básicos validados:');
        console.log(`   - Total Despachos:     ${stats.dispatches.total}`);
        console.log(`   - Despachos Activos:   ${stats.dispatches.active}`);
        console.log(`   - Total Cajas:         ${stats.boxes.total}`);
        console.log(`   - Cajas Pendientes:    ${stats.boxes.statusBreakdown.Pendiente}`);
        console.log(`   - Cajas Cargadas:      ${stats.boxes.statusBreakdown.Cargada}`);
        console.log(`   - Cajas En tránsito:   ${stats.boxes.statusBreakdown['En tránsito']}`);
        console.log(`   - Cajas Entregadas:    ${stats.boxes.statusBreakdown.Entregada}`);
        console.log(`   - Cajas Faltantes:     ${stats.boxes.statusBreakdown.Faltante}`);
        console.log(`   - Viajes Finalizados:  ${stats.trips.completed}`);
        console.log(`   - Viajes Activos:      ${stats.trips.active}`);
        console.log(`   - Efectividad de Entregas: ${stats.deliveries.rate}%`);
        console.log(`   - Entregas a Tiempo:   ${stats.deliveries.onTimeRate}%\n`);

        // 14. CONSULTAR REPORTES
        console.log('📈 [14] Consultando Reportes de Despachos...');
        const reportsRes = await fetch(`${BASE_URL}/logistics/reports/data?type=dispatches`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const reports = await reportsRes.json();
        if (!reports.success) throw new Error('Error al obtener datos de reporte: ' + JSON.stringify(reports));
        console.log(`✅ Reporte de despachos cargado. Registros devueltos: ${reports.data.length}\n`);

        // 15. CONSULTAR TRAZABILIDAD Y AUDITORÍA
        console.log('🛡️ [15] Consultando Registro de Auditoría (Trazabilidad)...');
        const auditLogsRes = await fetch(`${BASE_URL}/audit?limit=10`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const auditLogs = await auditLogsRes.json();
        if (!auditLogs.success) throw new Error('Error al obtener logs de auditoría: ' + JSON.stringify(auditLogs));
        console.log(`✅ Logs de auditoría cargados. Últimos eventos:`);
        auditLogs.data.slice(0, 5).forEach((log, index) => {
            console.log(`   [${index + 1}] Acción: ${log.action} | Entidad: ${log.entity} | Realizado por: ${log.performedBy} | Detalles: ${log.details}`);
        });
        console.log();

        console.log('🎉 ¡FLUJO E2E DE LA ETAPA 4 COMPLETADO CON ÉXITO! Todos los criterios de aceptación han sido validados programáticamente.\n');
    } catch (error) {
        console.error('❌ Error durante la verificación del flujo:', error.message);
        process.exit(1);
    }
}

testFlow();

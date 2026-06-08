import bcrypt from 'bcryptjs';

export async function seedUsers(prisma) {
    console.log('[USERS] Creando Admin, Operadores y Choferes de Logística...');
    const password = await bcrypt.hash('Emplifi2025!', 10);

    // 1. Crear Admin
    let admin;
    try {
        admin = await prisma.employee.upsert({
            where: { email: 'admin@emplifi.com' },
            update: { password },
            create: {
                firstName: 'Jorge',
                lastName: 'Doicela',
                email: 'admin@emplifi.com',
                role: 'admin',
                password,
                identityCard: '0101010101',
                isActive: true,
                address: 'Av. Patria E4-05, Quito',
                phone: '0999999999',
            }
        });
        console.log('✅ Admin: admin@emplifi.com / Emplifi2025!');
    } catch (e) {
        console.error('⚠️ Admin creation failed: ' + e.message);
    }

    // 2. Crear Operadores
    const operators = [
        {
            firstName: 'Valeria',
            lastName: 'Espinoza',
            email: 'valeria.espinoza@emplifi.com',
            identityCard: '1723456789',
            phone: '0982345678',
            address: 'Calle Veintimilla E7-45, Quito',
        },
        {
            firstName: 'Mateo',
            lastName: 'Jiménez',
            email: 'mateo.jimenez@emplifi.com',
            identityCard: '1778901234',
            phone: '0937890123',
            address: 'Av. 6 de Diciembre N24-358, Quito',
        }
    ];

    for (const op of operators) {
        try {
            await prisma.employee.upsert({
                where: { email: op.email },
                update: { password, role: 'operator' },
                create: {
                    firstName: op.firstName,
                    lastName: op.lastName,
                    email: op.email,
                    role: 'operator',
                    password,
                    identityCard: op.identityCard,
                    phone: op.phone,
                    address: op.address,
                    isActive: true,
                }
            });
            console.log(`✅ Operador: ${op.email} / Emplifi2025!`);
        } catch (e) {
            console.error(`⚠️ Error al crear operador ${op.email}: ${e.message}`);
        }
    }

    // 3. Crear Choferes
    const drivers = [
        {
            firstName: 'Felipe',
            lastName: 'Castillo',
            email: 'felipe.castillo@emplifi.com',
            identityCard: '1790123456',
            phone: '0919012345',
            address: 'Av. Colón E4-60, Quito',
        },
        {
            firstName: 'Kevin',
            lastName: 'Arismendi',
            email: 'kevin.arismendi@emplifi.com',
            identityCard: '1799988877',
            phone: '0999888777',
            address: 'Av. El Inca, Quito',
        },
        {
            firstName: 'Carlos',
            lastName: 'Conductor',
            email: 'chofer@emplifi.com',
            identityCard: '1799988776',
            phone: '0998765432',
            address: 'Av. Maldonado, Quito',
        }
    ];

    for (const dr of drivers) {
        try {
            await prisma.employee.upsert({
                where: { email: dr.email },
                update: { password, role: 'driver' },
                create: {
                    firstName: dr.firstName,
                    lastName: dr.lastName,
                    email: dr.email,
                    role: 'driver',
                    password,
                    identityCard: dr.identityCard,
                    phone: dr.phone,
                    address: dr.address,
                    isActive: true,
                    trackingConsent: true,
                }
            });
            console.log(`✅ Chofer: ${dr.email} / Emplifi2025!`);
        } catch (e) {
            console.error(`⚠️ Error al crear chofer ${dr.email}: ${e.message}`);
        }
    }

    // 4. Configuración del sistema
    try {
        await prisma.systemSetting.upsert({
            where: { id: 'default' },
            update: {},
            create: {
                id: 'default',
                maintenanceMode: false,
                maintenanceMessage: 'El sistema estará en mantenimiento brevemente.',
            }
        });
        console.log('✅ System Settings configurados');
    } catch (e) {
        console.error('⚠️ System Settings failed: ' + e.message);
    }

    return { admin };
}

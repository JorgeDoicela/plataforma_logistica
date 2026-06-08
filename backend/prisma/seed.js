import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { seedCleanup } from './seeds/cleanup.js';
import { seedUsers } from './seeds/users.js';
import { seedLogistics } from './seeds/logistics.js';

function createPrisma() {
    return new PrismaClient({
        datasources: {
            db: { url: process.env.DATABASE_URL }
        },
        log: ['error'],
    });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(label, fn, maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const prisma = createPrisma();
        try {
            await prisma.$connect();
            const result = await fn(prisma);
            return result;
        } catch (e) {
            const isConnError =
                e.code === 'P1001' ||
                e.message?.includes("Can't reach database") ||
                e.message?.includes('Server has closed the connection') ||
                e.message?.includes('Connection terminated');

            if (isConnError && attempt < maxRetries) {
                const waitMs = attempt * 2000;
                console.log(`⚠️  [${label}] Error de conexión (intento ${attempt}/${maxRetries}). Reintentando en ${waitMs / 1000}s...`);
                await sleep(waitMs);
            } else {
                console.error(`❌ [${label}] Falló después de ${attempt} intento(s): ${e.message}`);
                throw e;
            }
        } finally {
            try { await prisma.$disconnect(); } catch (_) { }
        }
    }
}

async function main() {
    console.log('╔══════════════════════════════════════╗');
    console.log('║  EMPLIFI — SEED DE LOGÍSTICA PURA   ║');
    console.log('╚══════════════════════════════════════╝');

    console.log('\n🔌 Verificando conexión a la base de datos...');
    await withRetry('TEST_CONN', async (prisma) => {
        await prisma.$queryRaw`SELECT 1`;
        console.log('✅ Conexión establecida correctamente.');
    });

    // 1. Limpiar base de datos
    console.log('\n[1/3] Limpiando base de datos...');
    await withRetry('CLEANUP', (prisma) => seedCleanup(prisma));
    await sleep(1000);

    // 2. Crear usuarios
    console.log('\n[2/3] Creando usuarios...');
    await withRetry('USERS', (prisma) => seedUsers(prisma));
    await sleep(1000);

    // 3. Crear datos de logística
    console.log('\n[3/3] Configurando Logística y Trazabilidad...');
    await withRetry('LOGISTICS', (prisma) => seedLogistics(prisma));

    console.log('\n╔══════════════════════════════════════╗');
    console.log('║        SEED COMPLETADO ✅            ║');
    console.log('╠══════════════════════════════════════╣');
    console.log('║  Admin:    admin@emplifi.com         ║');
    console.log('║  Chofer:   chofer@emplifi.com        ║');
    console.log('║  Operator: valeria.espinoza@emplifi.com║');
    console.log('║  Pass:     Emplifi2025!              ║');
    console.log('╚══════════════════════════════════════╝');
}

main().catch((e) => {
    console.error('❌ Error fatal en seed:', e);
    process.exit(1);
});
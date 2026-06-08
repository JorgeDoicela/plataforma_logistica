import { execSync } from 'child_process';
import 'dotenv/config';
import fs from 'fs';

async function recreate() {
    console.log('--- RECREANDO BASE DE DATOS LOGÍSTICA ---');
    
    // Escribir helper temporal para no cargar Prisma en este proceso principal
    const helperCode = `
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

async function run() {
    const postgresUrl = process.env.DATABASE_URL.replace('/db_recursos_humanos', '/postgres');
    const prisma = new PrismaClient({
        datasources: {
            db: { url: postgresUrl }
        }
    });

    try {
        console.log('🔌 Conectando a PostgreSQL para eliminar base anterior...');
        await prisma.$connect();
        
        await prisma.$executeRawUnsafe(\`
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = 'db_recursos_humanos'
              AND pid <> pg_backend_pid();
        \`).catch(() => {});

        console.log('🗑️ Eliminando base de datos "db_recursos_humanos" si existe...');
        await prisma.$executeRawUnsafe('DROP DATABASE IF EXISTS db_recursos_humanos;');
        
        console.log('🆕 Creando base de datos "db_recursos_humanos" limpia...');
        await prisma.$executeRawUnsafe('CREATE DATABASE db_recursos_humanos;');
        console.log('✅ Base de datos creada.');
    } catch (error) {
        console.error('❌ Error en PostgreSQL inicial:', error.message || error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}
run();
`;

    fs.writeFileSync('temp_recreate_helper.js', helperCode);

    try {
        // Ejecutar helper en un subproceso. Al terminar este subproceso, se libera el lock.
        execSync('node temp_recreate_helper.js', { stdio: 'inherit' });
    } catch (err) {
        console.error('❌ Error al recrear la base de datos:', err.message);
        try { fs.unlinkSync('temp_recreate_helper.js'); } catch(_) {}
        process.exit(1);
    } finally {
        try { fs.unlinkSync('temp_recreate_helper.js'); } catch(_) {}
    }

    // Ahora que el subproceso terminó y liberó el DLL, podemos correr los comandos de Prisma sin problemas de lock
    try {
        console.log('🏗️ Generando cliente de Prisma...');
        execSync('cmd /c npx --no-install prisma generate', { stdio: 'inherit' });

        console.log('🚀 Empujando el nuevo esquema limpio de logística (db push)...');
        execSync('cmd /c npx --no-install prisma db push --accept-data-loss', { stdio: 'inherit' });

        console.log('🌱 Poblando base de datos con el nuevo seed logístico...');
        execSync('node prisma/seed.js', { stdio: 'inherit' });

        console.log('\n🎉 ¡PROCESO FINALIZADO CON ÉXITO! Base de datos de logística lista.');
    } catch (err) {
        console.error('❌ Error ejecutando comandos de Prisma o Seeding:', err.message || err);
        process.exit(1);
    }
}

recreate();

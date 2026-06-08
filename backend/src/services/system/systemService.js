import prisma from '../../database/db.js';

class SystemService {
    async getSettings() {
        return await prisma.systemSetting.upsert({
            where: { id: 'default' },
            update: {},
            create: {
                id: 'default',
                maintenanceMode: false,
                maintenanceMessage: 'El sistema estará en mantenimiento brevemente.'
            }
        });
    }

    async updateSettings(data) {
        const updateData = {};
        if (data.maintenanceMode !== undefined) updateData.maintenanceMode = data.maintenanceMode;
        if (data.maintenanceMessage !== undefined) updateData.maintenanceMessage = data.maintenanceMessage;
        if (data.maintenanceScheduled !== undefined) updateData.maintenanceScheduled = data.maintenanceScheduled;
        if (data.biometricEnabled !== undefined) updateData.biometricEnabled = data.biometricEnabled;
        if (data.allowedIPs !== undefined) updateData.allowedIPs = data.allowedIPs;
        if (data.globalLatitude !== undefined) updateData.globalLatitude = data.globalLatitude;
        if (data.globalLongitude !== undefined) updateData.globalLongitude = data.globalLongitude;
        if (data.globalRadius !== undefined) updateData.globalRadius = data.globalRadius;

        return await prisma.systemSetting.upsert({
            where: { id: 'default' },
            update: updateData,
            create: {
                id: 'default',
                maintenanceMode: false,
                maintenanceMessage: 'El sistema estará en mantenimiento brevemente.',
                biometricEnabled: false,
                globalRadius: 200,
                ...updateData
            }
        });
    }

    async checkHealth() {
        try {
            await prisma.$queryRaw`SELECT 1`;
            return {
                status: 'UP',
                database: 'CONNECTED',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            };
        } catch (error) {
            return {
                status: 'DOWN',
                database: 'DISCONNECTED',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async reverseGeocode(lat, lng) {
        try {
            if (!lat || !lng) throw new Error('Coordinates missing');

            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Emplifi-App/1.0 (internal-tool)'
                }
            });

            if (!response.ok) {
                throw new Error(`Nominatim API Error: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Geocoding Error:', error.message);
            return null;
        }
    }
}

export default new SystemService();

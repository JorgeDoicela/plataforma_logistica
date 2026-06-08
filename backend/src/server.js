import http from 'http';
import app from './app.js';
import socketService from './services/notifications/socketService.js';
import { initTelemetrySimulation } from './jobs/logisticsTelemetryJob.js';

// Init logistics background jobs
initTelemetrySimulation();

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

// Inicializar Socket.io
socketService.init(server);

server.listen(PORT, () => {
  console.log(`Backend Logística corriendo en http://localhost:${PORT}`);
  console.log("Server updated at " + new Date().toISOString());
});

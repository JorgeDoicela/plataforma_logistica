import {
    FiBarChart2, FiHelpCircle, FiTrendingUp,
    FiMapPin, FiTruck, FiLayers, FiZap, FiShield
} from 'react-icons/fi';

export const adminModules = [
    { title: 'Dashboard Logístico', icon: <FiBarChart2 />, color: 'bg-blue-500', path: '/admin' },
    { title: 'Despachos', icon: <FiLayers />, color: 'bg-purple-500', path: '/admin/dispatches' },
    { title: 'Cajas & QR', icon: <FiZap />, color: 'bg-orange-500', path: '/admin/boxes' },
    { title: 'Viajes & Asignaciones', icon: <FiTruck />, color: 'bg-indigo-500', path: '/admin/trips' },
    { title: 'Monitoreo GPS/Temp', icon: <FiMapPin />, color: 'bg-rose-500', path: '/admin/monitoring' },
    { title: 'Documentos', icon: <FiFileTextIcon />, color: 'bg-cyan-500', path: '/admin/documents' },
    { title: 'Reportes KPIs', icon: <FiTrendingUp />, color: 'bg-teal-500', path: '/admin/reports' },
    { title: 'Auditoría & Trazabilidad', icon: <FiShield />, color: 'bg-red-500', path: '/admin/audit' },
    { title: 'Ayuda', icon: <FiHelpCircle />, color: 'bg-amber-500', path: '/help' },
];

export const driverModules = [
    { title: 'Mis Viajes (Chofer)', icon: <FiTruck />, color: 'bg-indigo-500', path: '/driver/dashboard' },
    { title: 'Ayuda', icon: <FiHelpCircle />, color: 'bg-amber-500', path: '/help' },
];

export const employeeModules = [
    { title: 'Dashboard Logístico', icon: <FiBarChart2 />, color: 'bg-blue-500', path: '/admin' },
    { title: 'Ayuda', icon: <FiHelpCircle />, color: 'bg-amber-500', path: '/help' },
];

export const accountingModules = [
    { title: 'Dashboard Logístico', icon: <FiBarChart2 />, color: 'bg-blue-500', path: '/admin' },
    { title: 'Ayuda', icon: <FiHelpCircle />, color: 'bg-amber-500', path: '/help' },
];

export const entrepreneurModules = [
    { title: 'Dashboard Logístico', icon: <FiBarChart2 />, color: 'bg-blue-500', path: '/admin' },
    { title: 'Ayuda', icon: <FiHelpCircle />, color: 'bg-amber-500', path: '/help' },
];

// Helper to provide FiFileText dynamically or inline
function FiFileTextIcon() {
    return (
        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
    );
}

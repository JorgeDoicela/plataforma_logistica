import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logisticsService from '../../services/logisticsService';
import { 
    FiLayers, FiTruck, FiBox, FiCheckCircle, 
    FiAlertTriangle, FiThermometer, FiClock, FiArrowRight 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const LogisticDashboard = ({ user }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTrips, setActiveTrips] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, tripsRes] = await Promise.all([
                    logisticsService.getDashboardStats(),
                    logisticsService.getTrips({ status: 'En tránsito' })
                ]);
                
                if (statsRes.success) setStats(statsRes.data);
                if (tripsRes.success) setActiveTrips(tripsRes.data);
            } catch (error) {
                console.error("Dashboard load error:", error);
                toast.error("Error al cargar indicadores del dashboard");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
        // Poll stats every 15 seconds to simulate real-time updates
        const interval = setInterval(fetchDashboardData, 15000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const boxData = stats?.boxes || { total: 0, statusBreakdown: {} };
    const tripData = stats?.trips || { completed: 0, active: 0 };
    const temp = stats?.temperature || { avg: 0, min: 0, max: 0 };
    const delivery = stats?.deliveries || { success: 0, failed: 0, rate: 100 };

    // Check for temperature alert
    const isTempAlarm = temp.max > 8.0 || temp.min < 2.0;

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-8 rounded-3xl shadow-[0_15px_35px_rgba(99,102,241,0.15)] relative overflow-hidden border border-indigo-950">
                {/* Background Ambient Glows */}
                <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-16 left-1/4 w-60 h-60 bg-purple-500/15 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-10 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl"></div>

                <div className="relative z-10 space-y-3">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-indigo-50 to-indigo-100 bg-clip-text text-transparent">
                        Panel de Control Logístico
                    </h1>
                    <div className="flex flex-wrap items-center gap-2.5 mt-2">
                        <span className="text-slate-300 text-sm font-medium">
                            Bienvenido de nuevo, <span className="text-white font-semibold">{user?.firstName} {user?.lastName}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 py-0.5 px-2.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 backdrop-blur-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                            {user?.role === 'admin' ? 'Administrador' : 'Operador Logístico'}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 relative z-10">
                    <button 
                        onClick={() => navigate('/admin/dispatches')}
                        className="px-6 py-3 bg-white text-indigo-950 font-bold rounded-xl hover:bg-indigo-50 active:scale-95 transition-all shadow-[0_4px_12px_rgba(255,255,255,0.15)] hover:shadow-[0_6px_16px_rgba(255,255,255,0.25)] text-sm flex items-center gap-2"
                    >
                        Gestionar Despachos <FiArrowRight className="text-indigo-600 stroke-[3]" />
                    </button>
                    <button 
                        onClick={() => navigate('/admin/trips')}
                        className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 active:scale-95 transition-all border border-indigo-500/40 shadow-[0_4px_14px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] text-sm flex items-center gap-2"
                    >
                        Programar Viaje <FiTruck className="text-indigo-200" />
                    </button>
                </div>
            </div>

            {/* Alert Banner if Temperature exceeds range */}
            {isTempAlarm && (
                <div className="flex items-center gap-4 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl shadow-sm animate-pulse">
                    <FiAlertTriangle className="text-2xl text-rose-600 shrink-0" />
                    <div>
                        <h4 className="font-bold text-sm">Alerta Crítica: Cadena de Frío Comprometida</h4>
                        <p className="text-xs text-rose-700 mt-0.5">
                            Se detectaron lecturas de temperatura fuera del rango óptimo (2°C - 8°C). Temperatura máxima registrada: {temp.max}°C.
                        </p>
                    </div>
                </div>
            )}

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Despachos */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-500">Despachos Totales</p>
                        <h3 className="text-3xl font-extrabold text-slate-900">{stats?.dispatches?.total || 0}</h3>
                        <span className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                            {stats?.dispatches?.active || 0} Activos
                        </span>
                    </div>
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-inner">
                        <FiLayers />
                    </div>
                </div>

                {/* Total Cajas */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-500">Total de Cajas</p>
                        <h3 className="text-3xl font-extrabold text-slate-900">{boxData.total || 0}</h3>
                        <div className="flex gap-2 text-xs text-slate-500">
                            <span className="text-emerald-600 font-semibold">{boxData.statusBreakdown.Cargada || 0} Cargadas</span>
                            <span>•</span>
                            <span className="text-amber-600 font-semibold">{boxData.statusBreakdown.Pendiente || 0} Pend.</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl shadow-inner">
                        <FiBox />
                    </div>
                </div>

                {/* Viajes Completados */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-500">Viajes Finalizados</p>
                        <h3 className="text-3xl font-extrabold text-slate-900">{tripData.completed || 0}</h3>
                        <div className="flex gap-2 text-xs text-slate-500">
                            <span className="text-emerald-600 font-semibold">{delivery.onTimeRate ?? 100}% A tiempo</span>
                            <span>•</span>
                            <span className="text-indigo-600 font-semibold">{tripData.active || 0} en ruta</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-xl shadow-inner">
                        <FiTruck />
                    </div>
                </div>

                {/* Temperatura Promedio */}
                <div className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between hover:shadow-md transition-shadow
                    ${isTempAlarm ? 'bg-rose-50/50 border-rose-100 text-rose-900' : 'bg-white border-slate-100'}`}>
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-500">Temp. Promedio</p>
                        <h3 className={`text-3xl font-extrabold ${isTempAlarm ? 'text-rose-700' : 'text-slate-900'}`}>{temp.avg}°C</h3>
                        <div className="flex gap-2 text-xs text-slate-500">
                            <span>Mín: {temp.min}°C</span>
                            <span>•</span>
                            <span>Máx: {temp.max}°C</span>
                        </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner
                        ${isTempAlarm ? 'bg-rose-100 text-rose-700' : 'bg-rose-50 text-rose-600'}`}>
                        <FiThermometer />
                    </div>
                </div>
            </div>

            {/* Middle Section: Box stats detail and Active trips monitoring */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Box details and delivery rate */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <FiBox className="text-indigo-600" /> Trazabilidad de Cajas
                        </h3>
                        <div className="space-y-3.5">
                            {/* Cargadas */}
                            <div>
                                <div className="flex justify-between text-sm mb-1 font-medium">
                                    <span className="text-slate-600">Cargadas (En camión)</span>
                                    <span className="text-indigo-600 font-bold">{boxData.statusBreakdown.Cargada || 0}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${boxData.total > 0 ? ((boxData.statusBreakdown.Cargada || 0) / boxData.total) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Pendientes */}
                            <div>
                                <div className="flex justify-between text-sm mb-1 font-medium">
                                    <span className="text-slate-600">Pendientes (Finca)</span>
                                    <span className="text-amber-600 font-bold">{boxData.statusBreakdown.Pendiente || 0}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${boxData.total > 0 ? ((boxData.statusBreakdown.Pendiente || 0) / boxData.total) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Entregadas */}
                            <div>
                                <div className="flex justify-between text-sm mb-1 font-medium">
                                    <span className="text-slate-600">Entregadas (Aeropuerto)</span>
                                    <span className="text-emerald-600 font-bold">{boxData.statusBreakdown.Entregada || 0}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${boxData.total > 0 ? ((boxData.statusBreakdown.Entregada || 0) / boxData.total) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Faltantes */}
                            <div>
                                <div className="flex justify-between text-sm mb-1 font-medium">
                                    <span className="text-slate-600">Faltantes (Alertas)</span>
                                    <span className="text-rose-600 font-bold">{boxData.statusBreakdown.Faltante || 0}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${boxData.total > 0 ? ((boxData.statusBreakdown.Faltante || 0) / boxData.total) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 mt-6 pt-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Efectividad de Entrega</p>
                            <h4 className="text-2xl font-black text-emerald-600 mt-0.5">{delivery.rate}%</h4>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-500 font-medium">A tiempo</p>
                            <h4 className="text-2xl font-black text-indigo-600 mt-0.5">{delivery.onTimeRate ?? 100}%</h4>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500 font-medium">Cajas Faltantes</p>
                            <h4 className="text-2xl font-black text-rose-600 mt-0.5">{delivery.failed}</h4>
                        </div>
                    </div>
                </div>

                {/* Active trips map or simulation status */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <FiClock className="text-indigo-600 animate-spin" style={{ animationDuration: '6s' }} /> Viajes en Tránsito Activo
                            </h3>
                            <span className="text-xs text-indigo-600 bg-indigo-50 font-bold py-1 px-2.5 rounded-full">
                                {activeTrips.length} en movimiento
                            </span>
                        </div>

                        {activeTrips.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-200 rounded-xl text-slate-400">
                                <FiTruck className="text-4xl mb-2" />
                                <p className="text-sm font-medium">No hay viajes en tránsito en este momento.</p>
                                <button 
                                    onClick={() => navigate('/admin/trips')}
                                    className="mt-3 text-xs bg-indigo-50 text-indigo-700 font-semibold py-1.5 px-3 rounded-lg hover:bg-indigo-100 transition-colors"
                                >
                                    Ver Todos los Viajes
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activeTrips.slice(0, 3).map((trip) => (
                                    <div 
                                        key={trip.id} 
                                        onClick={() => navigate(`/admin/monitoring?tripId=${trip.id}`)}
                                        className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-100 transition-all cursor-pointer flex items-center justify-between"
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900 text-sm">{trip.dispatch?.dispatchCode}</span>
                                                <span className="text-xs py-0.5 px-2 bg-indigo-100 text-indigo-800 rounded font-semibold">
                                                    {trip.vehicle?.plate} ({trip.vehicle?.brand})
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                <strong>Origen:</strong> {trip.dispatch?.farm?.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                <strong>Destino:</strong> {trip.dispatch?.destination?.name}
                                            </p>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1.5">
                                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 py-0.5 px-2 rounded-full">
                                                {trip.status}
                                            </span>
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                Chofer: {trip.driver?.firstName} {trip.driver?.lastName}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-slate-100 mt-6 pt-4 flex justify-between items-center">
                        <p className="text-xs text-slate-400">Datos actualizados en tiempo real mediante telemetría Starlink</p>
                        <button 
                            onClick={() => navigate('/admin/monitoring')}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                        >
                            Ver Mapa de Recorrido <FiArrowRight />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogisticDashboard;

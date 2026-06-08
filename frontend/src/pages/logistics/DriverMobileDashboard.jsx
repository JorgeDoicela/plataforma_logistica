import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logisticsService from '../../services/logisticsService';
import { FiTruck, FiMapPin, FiNavigation, FiClock, FiCheckCircle, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

const DriverMobileDashboard = ({ user }) => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchDriverTrips = async () => {
        try {
            const res = await logisticsService.getTrips({ driverId: user.id });
            if (res.success) {
                setTrips(res.data);
            }
        } catch (error) {
            console.error("Fetch driver trips error:", error);
            toast.error("Error al cargar tus viajes asignados");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchDriverTrips();
        }
    }, [user?.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const activeTrips = trips.filter(t => t.status !== 'Finalizado');
    const completedTrips = trips.filter(t => t.status === 'Finalizado');

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Asignado': return 'bg-slate-100 text-slate-700';
            case 'En finca': return 'bg-amber-100 text-amber-800';
            case 'En tránsito': return 'bg-indigo-100 text-indigo-800 animate-pulse';
            case 'Llegado a aeropuerto': return 'bg-blue-100 text-blue-800';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto space-y-6">
            {/* Header profile info */}
            <div className="bg-gradient-to-br from-indigo-700 to-indigo-950 text-white p-6 rounded-2xl shadow-md space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-lg">
                        {user?.firstName?.[0]}
                    </div>
                    <div>
                        <h2 className="font-extrabold text-lg leading-tight">{user?.firstName} {user?.lastName}</h2>
                        <span className="text-xs text-indigo-200">Chofer Profesional</span>
                    </div>
                </div>
            </div>

            {/* Active Trips Section */}
            <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FiTruck className="text-indigo-600" /> Viajes Asignados ({activeTrips.length})
                </h3>

                {activeTrips.length === 0 ? (
                    <div className="bg-white p-8 text-center rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
                        No tienes viajes activos asignados en este momento.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activeTrips.map((trip) => (
                            <div
                                key={trip.id}
                                onClick={() => navigate(`/driver/trips/${trip.id}`)}
                                className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer flex justify-between items-center"
                            >
                                <div className="space-y-2 flex-1 pr-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-900">{trip.dispatch?.dispatchCode}</span>
                                        <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full ${getStatusBadgeClass(trip.status)}`}>
                                            {trip.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 space-y-1">
                                        <p className="flex items-center gap-1.5 truncate">
                                            <FiMapPin className="text-slate-400 shrink-0" />
                                            <strong>Origen:</strong> {trip.dispatch?.farm?.name}
                                        </p>
                                        <p className="flex items-center gap-1.5 truncate">
                                            <FiNavigation className="text-slate-400 shrink-0" />
                                            <strong>Destino:</strong> {trip.dispatch?.destination?.name}
                                        </p>
                                        <p className="flex items-center gap-1.5">
                                            <FiClock className="text-slate-400 shrink-0" />
                                            <strong>Salida:</strong> {new Date(trip.date).toLocaleDateString()} • {trip.time}
                                        </p>
                                    </div>
                                </div>
                                <FiChevronRight className="text-slate-400 text-lg shrink-0" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Completed Trips History */}
            <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FiCheckCircle className="text-slate-400" /> Historial de Viajes ({completedTrips.length})
                </h3>
                {completedTrips.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center">No hay viajes completados previamente.</p>
                ) : (
                    <div className="space-y-2">
                        {completedTrips.slice(0, 5).map((trip) => (
                            <div key={trip.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center text-xs">
                                <div>
                                    <span className="font-bold text-slate-800">{trip.dispatch?.dispatchCode}</span>
                                    <p className="text-slate-500 mt-0.5">{trip.dispatch?.farm?.name} ➔ Aeropuerto</p>
                                </div>
                                <span className="py-0.5 px-2 bg-emerald-50 text-emerald-700 font-bold rounded">Completado</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriverMobileDashboard;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logisticsService from '../../services/logisticsService';
import { 
    FiPlus, FiTruck, FiUsers, FiLayers, FiCalendar, 
    FiClock, FiMap, FiX, FiCheckCircle, FiInfo, FiTrendingUp, FiEdit3
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const TripsPage = () => {
    const [trips, setTrips] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [dispatches, setDispatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);

    // Form inputs
    const [driverId, setDriverId] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const [dispatchId, setDispatchId] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Update Status inputs
    const [newStatus, setNewStatus] = useState('');
    const [statusNotes, setStatusNotes] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const loadTrips = async () => {
        setLoading(true);
        try {
            const res = await logisticsService.getTrips();
            if (res.success) setTrips(res.data);
        } catch (error) {
            console.error("Load trips error:", error);
            toast.error("Error al cargar la lista de viajes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchRelationsData = async () => {
            try {
                const [driversRes, vehiclesRes, dispatchesRes] = await Promise.all([
                    logisticsService.getDrivers(),
                    logisticsService.getVehicles(),
                    logisticsService.getDispatches()
                ]);

                if (driversRes.success) setDrivers(driversRes.data);
                if (vehiclesRes.success) setVehicles(vehiclesRes.data);
                
                // Only show dispatches that are not finalizado for new assignments
                if (dispatchesRes.success) {
                    setDispatches(dispatchesRes.data);
                }
            } catch (error) {
                console.error("Error fetching relation lists:", error);
            }
        };

        loadTrips();
        fetchRelationsData();
    }, []);

    const handleCreateTrip = async (e) => {
        e.preventDefault();
        if (!driverId || !vehicleId || !dispatchId || !date || !time) {
            toast.error("Por favor completa todos los campos obligatorios");
            return;
        }

        setSubmitting(true);
        try {
            const res = await logisticsService.createTrip({
                driverId,
                vehicleId,
                dispatchId,
                date,
                time
            });

            if (res.success) {
                toast.success("Viaje programado y asignado exitosamente");
                setShowCreateModal(false);
                setDriverId('');
                setVehicleId('');
                setDispatchId('');
                setDate('');
                setTime('');
                loadTrips();
            }
        } catch (error) {
            console.error("Create trip error:", error);
            toast.error(error.message || "Error al crear el viaje");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateTripStatus = async (e) => {
        e.preventDefault();
        if (!newStatus) return;

        setUpdatingStatus(true);
        try {
            const res = await logisticsService.updateTripStatus(selectedTrip.id, newStatus, statusNotes);
            if (res.success) {
                toast.success(`Estado del viaje actualizado a ${newStatus}`);
                setShowStatusModal(false);
                setStatusNotes('');
                loadTrips();
            }
        } catch (error) {
            console.error("Update trip status error:", error);
            toast.error(error.message || "Error al actualizar estado");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Asignado': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'En finca': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'En tránsito': return 'bg-indigo-50 text-indigo-700 border-indigo-100 animate-pulse';
            case 'Llegado a aeropuerto': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Finalizado': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-150';
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestión de Viajes & Despachos</h1>
                    <p className="text-slate-500 text-sm">Asigna camiones y conductores a los despachos, monitorea su estado y sigue el historial.</p>
                </div>
                <button
                    onClick={() => {
                        setDate(new Date().toISOString().split('T')[0]);
                        setTime(new Date().toTimeString().slice(0, 5));
                        setShowCreateModal(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all font-semibold flex items-center gap-2 text-sm shadow-sm"
                >
                    <FiPlus /> Programar Viaje
                </button>
            </div>

            {/* List Trips */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                ) : trips.length === 0 ? (
                    <div className="p-10 text-center text-slate-400">
                        <FiTruck className="text-4xl mx-auto mb-2" />
                        <p className="text-sm font-medium">No hay viajes programados.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead className="bg-slate-50/75 border-b border-slate-100 font-semibold text-slate-600">
                                <tr>
                                    <th className="py-4 px-6">Código Despacho</th>
                                    <th className="py-4 px-6">Finca ➔ Aeropuerto</th>
                                    <th className="py-4 px-6">Conductor</th>
                                    <th className="py-4 px-6">Vehículo / Placa</th>
                                    <th className="py-4 px-6">Fecha / Hora</th>
                                    <th className="py-4 px-6">Estado</th>
                                    <th className="py-4 px-6 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {trips.map((trip) => (
                                    <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6 font-bold text-slate-900">{trip.dispatch?.dispatchCode}</td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm font-semibold text-slate-800">{trip.dispatch?.farm?.name}</div>
                                            <div className="text-xs text-slate-400">➔ {trip.dispatch?.destination?.name}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-semibold text-slate-800">{trip.driver?.firstName} {trip.driver?.lastName}</div>
                                            <div className="text-xs text-slate-400">{trip.driver?.phone || 'Sin teléfono'}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-block py-0.5 px-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded">
                                                {trip.vehicle?.plate}
                                            </span>
                                            <div className="text-xs text-slate-400 mt-0.5">{trip.vehicle?.brand} {trip.vehicle?.model}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-1"><FiCalendar className="text-slate-400" /> {new Date(trip.date).toLocaleDateString()}</div>
                                            <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5"><FiClock className="text-slate-400" /> {trip.time}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-block py-1 px-3 rounded-full border text-xs font-bold ${getStatusColor(trip.status)}`}>
                                                {trip.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-center gap-2">
                                                {trip.status === 'En tránsito' && (
                                                    <button
                                                        onClick={() => navigate(`/admin/monitoring?tripId=${trip.id}`)}
                                                        className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="Seguimiento GPS"
                                                    >
                                                        <FiMap className="text-base" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setSelectedTrip(trip);
                                                        setNewStatus(trip.status);
                                                        setShowStatusModal(true);
                                                    }}
                                                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="Cambiar Estado"
                                                >
                                                    <FiEdit3 className="text-base" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Trip Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-950">Programar y Asignar Viaje</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600"><FiX className="text-xl" /></button>
                        </div>
                        <form onSubmit={handleCreateTrip} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1">Despacho Asociado*</label>
                                <select
                                    value={dispatchId}
                                    onChange={(e) => setDispatchId(e.target.value)}
                                    className="w-full text-sm rounded-lg border-slate-200"
                                    required
                                >
                                    <option value="">Selecciona despacho...</option>
                                    {dispatches.filter(d => d.status === 'Creado' || d.status === 'Preparación').map((d) => (
                                        <option key={d.id} value={d.id}>{d.dispatchCode} - Origen: {d.farm?.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1">Chofer/Conductor*</label>
                                <select
                                    value={driverId}
                                    onChange={(e) => setDriverId(e.target.value)}
                                    className="w-full text-sm rounded-lg border-slate-200"
                                    required
                                >
                                    <option value="">Selecciona conductor...</option>
                                    {drivers.map((d) => (
                                        <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1">Vehículo Asignado*</label>
                                <select
                                    value={vehicleId}
                                    onChange={(e) => setVehicleId(e.target.value)}
                                    className="w-full text-sm rounded-lg border-slate-200"
                                    required
                                >
                                    <option value="">Selecciona vehículo...</option>
                                    {vehicles.map((v) => (
                                        <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Fecha Salida*</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full text-sm rounded-lg border-slate-200"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Hora Estimada*</label>
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full text-sm rounded-lg border-slate-200"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-semibold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-sm shadow-sm"
                                >
                                    {submitting ? 'Programando...' : 'Programar Viaje'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Status Change Modal */}
            {showStatusModal && selectedTrip && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-950">Actualizar Estado de Viaje</h3>
                            <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-slate-600"><FiX className="text-xl" /></button>
                        </div>
                        <form onSubmit={handleUpdateTripStatus} className="p-6 space-y-4">
                            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <strong>Despacho:</strong> {selectedTrip.dispatch?.dispatchCode}<br/>
                                <strong>Chofer:</strong> {selectedTrip.driver?.firstName} {selectedTrip.driver?.lastName}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1">Nuevo Estado*</label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full text-sm rounded-lg border-slate-200"
                                    required
                                >
                                    <option value="Asignado">Asignado</option>
                                    <option value="En finca">En finca (Cargando)</option>
                                    <option value="En tránsito">En tránsito (Ruta)</option>
                                    <option value="Llegado a aeropuerto">Llegado a aeropuerto</option>
                                    <option value="Finalizado">Finalizado (Cerrado)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1">Notas del Cambio</label>
                                <textarea
                                    value={statusNotes}
                                    onChange={(e) => setStatusNotes(e.target.value)}
                                    placeholder="Motivos del cambio de estado, retrasos, novedades, etc."
                                    rows="3"
                                    className="w-full text-sm rounded-lg border-slate-200"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowStatusModal(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-semibold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatingStatus}
                                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-sm shadow-sm"
                                >
                                    {updatingStatus ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TripsPage;

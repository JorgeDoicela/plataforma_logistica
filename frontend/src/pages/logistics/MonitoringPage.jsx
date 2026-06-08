import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import logisticsService from '../../services/logisticsService';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
    ResponsiveContainer, LineChart, Line, 
    XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import { 
    FiTruck, FiThermometer, FiMapPin, FiNavigation, 
    FiAlertTriangle, FiUser, FiInfo, FiActivity 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Fix Leaflet Default Icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const truckIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3429/3429180.png', // Delivery truck icon
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
});

const MonitoringPage = () => {
    const [searchParams] = useSearchParams();
    const tripParam = searchParams.get('tripId');

    const [trips, setTrips] = useState([]);
    const [selectedTripId, setSelectedTripId] = useState(tripParam || '');
    const [tripDetail, setTripDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const mapRef = useRef(null);

    // Fetch active/recent trips list for selector
    useEffect(() => {
        const fetchTripsList = async () => {
            try {
                const res = await logisticsService.getTrips();
                if (res.success) {
                    setTrips(res.data);
                    // Select first active trip by default if no parameter is provided
                    if (!selectedTripId && res.data.length > 0) {
                        const active = res.data.find(t => t.status === 'En tránsito' || t.status === 'En finca');
                        if (active) setSelectedTripId(active.id);
                        else setSelectedTripId(res.data[0].id);
                    }
                }
            } catch (error) {
                console.error("Trips list fetch error:", error);
            }
        };

        fetchTripsList();
    }, []);

    // Fetch details of selected trip
    const fetchTripDetails = async (id) => {
        if (!id) return;
        try {
            const res = await logisticsService.getTripById(id);
            if (res.success) {
                setTripDetail(res.data);
            }
        } catch (error) {
            console.error("Trip details fetch error:", error);
        }
    };

    useEffect(() => {
        if (selectedTripId) {
            setLoading(true);
            fetchTripDetails(selectedTripId).finally(() => setLoading(false));

            // Poll trip details every 12 seconds for live telemetry tracking
            const interval = setInterval(() => {
                fetchTripDetails(selectedTripId);
            }, 12000);

            return () => clearInterval(interval);
        }
    }, [selectedTripId]);

    // Recenter map when new GPS positions are loaded
    useEffect(() => {
        if (tripDetail && tripDetail.gpsPositions?.length > 0 && mapRef.current) {
            const lastPos = tripDetail.gpsPositions[tripDetail.gpsPositions.length - 1];
            mapRef.current.setView([lastPos.latitude, lastPos.longitude], 12);
        }
    }, [tripDetail?.gpsPositions?.length]);

    const handleTripChange = (e) => {
        setSelectedTripId(e.target.value);
        setTripDetail(null);
    };

    // Calculate details
    const gpsData = tripDetail?.gpsPositions || [];
    const tempData = tripDetail?.temperatureReadings || [];
    const lastGps = gpsData[gpsData.length - 1] || null;
    const lastTemp = tempData[tempData.length - 1] || null;

    // Build polyline path
    const polylinePath = gpsData.map(pos => [pos.latitude, pos.longitude]);

    // Chart data mapping
    const chartData = tempData.map((item, idx) => ({
        time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        temperatura: item.temperature,
        gps: gpsData[idx] ? `${gpsData[idx].latitude.toFixed(4)}, ${gpsData[idx].longitude.toFixed(4)}` : ''
    }));

    // Check temp boundaries (optimal: 2 - 8 °C)
    const isTempAlarm = lastTemp && (lastTemp.temperature > 8.0 || lastTemp.temperature < 2.0);

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header / Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Monitoreo Satelital GPS & Frío</h1>
                    <p className="text-slate-500 text-sm">Monitorea en tiempo real la ubicación mediante Starlink y el sensor de temperatura.</p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-600 shrink-0">Seleccionar Viaje:</label>
                    <select
                        value={selectedTripId}
                        onChange={handleTripChange}
                        className="text-sm rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 min-w-[250px]"
                    >
                        <option value="">-- Selecciona un viaje --</option>
                        {trips.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.dispatch?.dispatchCode} ({t.status}) - {t.driver?.firstName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && !tripDetail ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
            ) : !tripDetail ? (
                <div className="bg-white p-10 text-center rounded-xl border border-slate-100 shadow-sm text-slate-400">
                    <FiNavigation className="text-5xl mx-auto mb-3 animate-bounce" />
                    <p className="font-semibold text-slate-600">Por favor, selecciona un viaje activo para ver su telemetría.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Telemetry info side card */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-900">{tripDetail.dispatch?.dispatchCode}</h3>
                                <span className={`py-1 px-3 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100`}>
                                    {tripDetail.status}
                                </span>
                            </div>

                            <div className="border-t border-slate-100 pt-3 space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400 flex items-center gap-1.5"><FiUser /> Chofer:</span>
                                    <span className="font-semibold text-slate-800">{tripDetail.driver?.firstName} {tripDetail.driver?.lastName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400 flex items-center gap-1.5"><FiTruck /> Vehículo:</span>
                                    <span className="font-semibold text-slate-800">{tripDetail.vehicle?.plate} ({tripDetail.vehicle?.brand})</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400 flex items-center gap-1.5"><FiMapPin /> Origen:</span>
                                    <span className="font-semibold text-slate-800 text-right max-w-[180px] truncate">{tripDetail.dispatch?.farm?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400 flex items-center gap-1.5"><FiNavigation /> Destino:</span>
                                    <span className="font-semibold text-slate-800 text-right max-w-[180px] truncate">{tripDetail.dispatch?.destination?.name}</span>
                                </div>
                            </div>
                        </div>

                        {/* Temperature Card */}
                        <div className={`p-6 rounded-2xl border shadow-sm space-y-4 transition-all
                            ${isTempAlarm 
                                ? 'bg-rose-50 border-rose-200 text-rose-950 shadow-rose-100/50' 
                                : 'bg-white border-slate-100'}`}>
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <FiThermometer className={isTempAlarm ? 'text-rose-600 animate-pulse' : 'text-indigo-600'} /> Temperatura de Carga
                                </h4>
                                {isTempAlarm && (
                                    <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-xs font-bold bg-rose-600 text-white animate-bounce">
                                        <FiAlertTriangle /> ALARMA
                                    </span>
                                )}
                            </div>

                            <div className="flex items-baseline justify-center py-4 gap-1.5">
                                <span className={`text-5xl font-black ${isTempAlarm ? 'text-rose-700' : 'text-slate-950'}`}>
                                    {lastTemp ? `${lastTemp.temperature.toFixed(1)}` : 'N/A'}
                                </span>
                                <span className="text-2xl font-bold text-slate-500">°C</span>
                            </div>

                            <div className="border-t border-slate-100/70 pt-3 flex justify-between text-xs text-slate-500 font-medium">
                                <span>Rango óptimo: 2°C - 8°C</span>
                                <span>Lecturas: {tempData.length}</span>
                            </div>
                        </div>

                        {/* Box Scanner Checklist summary */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <FiActivity className="text-indigo-600" /> Trazabilidad de Cajas
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between py-1 border-b border-slate-50">
                                    <span className="text-slate-500">Cargadas en camión</span>
                                    <span className="font-bold text-indigo-700">
                                        {tripDetail.dispatch?.boxes?.filter(b => b.status === 'Cargada').length || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-50">
                                    <span className="text-slate-500">Entregadas</span>
                                    <span className="font-bold text-emerald-700">
                                        {tripDetail.dispatch?.boxes?.filter(b => b.status === 'Entregada').length || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-50">
                                    <span className="text-slate-500">Pendientes</span>
                                    <span className="font-bold text-amber-700">
                                        {tripDetail.dispatch?.boxes?.filter(b => b.status === 'Pendiente').length || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-slate-500">Faltantes / Alerta</span>
                                    <span className="font-bold text-rose-700">
                                        {tripDetail.dispatch?.boxes?.filter(b => b.status === 'Faltante').length || 0}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Historial de Estados */}
                        {tripDetail.history && tripDetail.history.length > 0 && (
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                    <FiActivity className="text-indigo-600" /> Historial de Estados
                                </h4>
                                <div className="space-y-4 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-slate-100">
                                    {tripDetail.history.map((h, idx) => (
                                        <div key={h.id || idx} className="flex gap-3 text-xs relative pl-6">
                                            <div className={`absolute left-0.5 top-1 w-3 h-3 rounded-full border-2 bg-white
                                                ${idx === 0 ? 'border-indigo-600 ring-4 ring-indigo-50 animate-pulse' : 'border-slate-300'}`}>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800">{h.status}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {new Date(h.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                {h.notes && <p className="text-slate-500 italic leading-snug">{h.notes}</p>}
                                                <p className="text-[10px] text-slate-400">Por: {h.changedBy || 'Sistema'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Map & Temperature Chart (Main View) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Map Container */}
                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-[400px] z-10 relative">
                            {polylinePath.length === 0 ? (
                                <div className="h-full flex items-center justify-center bg-slate-50 rounded-xl text-slate-400 text-sm font-medium">
                                    Aún no hay coordenadas GPS registradas para este viaje.
                                </div>
                            ) : (
                                <MapContainer 
                                    center={polylinePath[polylinePath.length - 1]} 
                                    zoom={12} 
                                    style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                                    ref={mapRef}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />
                                    {polylinePath.length > 0 && (
                                        <Marker position={polylinePath[polylinePath.length - 1]} icon={truckIcon}>
                                            <Popup>
                                                <div className="text-xs">
                                                    <strong>Vehículo:</strong> {tripDetail.vehicle?.plate}<br/>
                                                    <strong>Chofer:</strong> {tripDetail.driver?.firstName}<br/>
                                                    <strong>Temp:</strong> {lastTemp ? `${lastTemp.temperature}°C` : 'N/A'}
                                                </div>
                                            </Popup>
                                        </Marker>
                                    )}
                                    <Polyline pathOptions={{ color: 'indigo', weight: 4 }} positions={polylinePath} />
                                </MapContainer>
                            )}
                        </div>

                        {/* Temperature chart */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                <FiInfo className="text-indigo-600" /> Historial Térmico de la Cadena de Frío
                            </h4>

                            {chartData.length === 0 ? (
                                <div className="h-48 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400 text-sm font-medium">
                                    No hay registros térmicos históricos.
                                </div>
                            ) : (
                                <div className="h-48 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                            <YAxis domain={[0, 15]} stroke="#94a3b8" fontSize={11} tickLine={false} unit="°C" />
                                            <Tooltip 
                                                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: 'white' }}
                                                labelStyle={{ fontWeight: 'bold' }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="temperatura" 
                                                stroke="#4f46e5" 
                                                strokeWidth={2.5} 
                                                dot={{ r: 4, strokeWidth: 0, fill: '#4f46e5' }}
                                                activeDot={{ r: 6 }} 
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonitoringPage;

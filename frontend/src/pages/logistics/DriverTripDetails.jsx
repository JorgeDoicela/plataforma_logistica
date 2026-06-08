import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import logisticsService from '../../services/logisticsService';
import { 
    FiArrowLeft, FiMapPin, FiNavigation, FiBox, 
    FiCamera, FiUpload, FiCheck, FiAlertTriangle, FiInfo, FiFileText,
    FiTruck
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const DriverTripDetails = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingState, setUpdatingState] = useState(false);

    // QR Scan Simulator inputs
    const [selectedBoxToScan, setSelectedBoxToScan] = useState('');
    const [manualBoxCode, setManualBoxCode] = useState('');
    const [scanning, setScanning] = useState(false);

    // File Upload inputs
    const [file, setFile] = useState(null);
    const [docType, setDocType] = useState('Guía firmada');
    const [uploadingDoc, setUploadingDoc] = useState(false);

    const fetchTripInfo = async () => {
        try {
            const res = await logisticsService.getTripById(id);
            if (res.success) {
                setTrip(res.data);
            }
        } catch (error) {
            console.error("Fetch trip details error:", error);
            toast.error("Error al cargar los detalles del viaje");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTripInfo();
    }, [id]);

    const changeTripStatus = async (status, notes) => {
        setUpdatingState(true);
        try {
            const res = await logisticsService.updateTripStatus(id, status, notes);
            if (res.success) {
                toast.success(`Viaje actualizado a: ${status}`);
                fetchTripInfo();
            }
        } catch (error) {
            console.error("Change status error:", error);
            toast.error(error.message || "Error al actualizar estado");
        } finally {
            setUpdatingState(false);
        }
    };

    const handleSimulateScan = async (statusVal = 'Cargada') => {
        const boxCode = manualBoxCode.trim() || selectedBoxToScan;
        if (!boxCode) {
            toast.error("Selecciona o escribe el código de una caja");
            return;
        }

        setScanning(true);
        try {
            // Obtain current location coordinates (simulated or HTML5 Geolocation)
            let latitude = -0.0430;
            let longitude = -78.1420;

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        latitude = position.coords.latitude;
                        longitude = position.coords.longitude;
                    },
                    () => {} // Ignorar errores, usar default
                );
            }

            const res = await logisticsService.scanBox({
                tripId: id,
                boxCode,
                status: statusVal,
                latitude,
                longitude
            });

            if (res.success) {
                toast.success(`Caja ${boxCode} registrada como: ${statusVal}`);
                setManualBoxCode('');
                setSelectedBoxToScan('');
                fetchTripInfo();
            }
        } catch (error) {
            console.error("Scan error:", error);
            toast.error(error.message || "Error al escanear caja");
        } finally {
            setScanning(false);
        }
    };

    const handleUploadDocument = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.error("Selecciona un archivo");
            return;
        }

        setUploadingDoc(true);
        try {
            const formData = new FormData();
            formData.append('dispatchId', trip.dispatchId);
            formData.append('type', docType);
            formData.append('file', file);

            const res = await logisticsService.uploadDocument(formData);
            if (res.success) {
                toast.success("Documento subido exitosamente");
                setFile(null);
                // Reset file input element
                document.getElementById('file-input').value = '';
                fetchTripInfo();
            }
        } catch (error) {
            console.error("Upload document error:", error);
            toast.error(error.message || "Error al subir documento");
        } finally {
            setUploadingDoc(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="p-6 text-center text-slate-400">
                <p>El viaje no existe o no tienes autorización para verlo.</p>
            </div>
        );
    }

    const boxes = trip.dispatch?.boxes || [];
    const pendingBoxes = boxes.filter(b => b.status === 'Pendiente');
    const loadedBoxesCount = boxes.filter(b => b.status === 'Cargada' || b.status === 'En tránsito').length;
    const documents = trip.dispatch?.documents || [];

    return (
        <div className="p-4 max-w-md mx-auto space-y-6 pb-20">
            {/* Header / Back */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/driver/dashboard')} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                    <FiArrowLeft className="text-lg" />
                </button>
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Detalle del Viaje</h2>
                    <p className="text-xs text-indigo-600 font-semibold">{trip.dispatch?.dispatchCode}</p>
                </div>
            </div>

            {/* Trip Info Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado de Viaje</span>
                    <span className="py-0.5 px-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                        {trip.status}
                    </span>
                </div>
                <div className="text-sm text-slate-700 space-y-2 pt-2 border-t border-slate-50">
                    <p className="flex items-start gap-2">
                        <FiMapPin className="text-indigo-600 mt-0.5 shrink-0" />
                        <span><strong>Origen:</strong> {trip.dispatch?.farm?.name}</span>
                    </p>
                    <p className="flex items-start gap-2">
                        <FiNavigation className="text-indigo-600 mt-0.5 shrink-0" />
                        <span><strong>Destino:</strong> {trip.dispatch?.destination?.name}</span>
                    </p>
                    <p className="flex items-start gap-2">
                        <FiBox className="text-indigo-600 mt-0.5 shrink-0" />
                        <span><strong>Cajas cargadas:</strong> {loadedBoxesCount} de {boxes.length}</span>
                    </p>
                </div>
            </div>

            {/* Operative Action Buttons */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Eventos Operativos</h3>
                {trip.status === 'Asignado' && (
                    <button
                        onClick={() => changeTripStatus('En finca', 'Conductor reporta llegada a Finca Origen')}
                        disabled={updatingState}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <FiCheck /> Registrar Llegada a Finca
                    </button>
                )}
                {trip.status === 'En finca' && (
                    <button
                        onClick={() => {
                            if (pendingBoxes.length > 0) {
                                if (!window.confirm(`Tienes ${pendingBoxes.length} cajas pendientes por cargar. ¿Seguro que quieres iniciar el viaje?`)) return;
                            }
                            changeTripStatus('En tránsito', 'Viaje iniciado y salida de finca registrada');
                        }}
                        disabled={updatingState}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <FiTruck /> Iniciar Viaje (Salida de Finca)
                    </button>
                )}
                {trip.status === 'En tránsito' && (
                    <button
                        onClick={() => changeTripStatus('Llegado a aeropuerto', 'Llegada a terminal de carga de aeropuerto registrada por chofer')}
                        disabled={updatingState}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <FiNavigation /> Registrar Llegada a Aeropuerto
                    </button>
                )}
                {trip.status === 'Llegado a aeropuerto' && (
                    <button
                        onClick={() => changeTripStatus('Finalizado', 'Entrega finalizada en aeropuerto con guía física firmada')}
                        disabled={updatingState}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <FiCheck /> Finalizar Entrega (Cerrar)
                    </button>
                )}
                {trip.status === 'Finalizado' && (
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 text-center font-bold text-xs">
                        Este viaje ha sido operativamente cerrado y completado.
                    </div>
                )}
            </div>

            {/* QR Scan Simulator Box (Only if not finalizado) */}
            {trip.status !== 'Finalizado' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <FiCamera className="text-indigo-600" /> Simular Escaneo QR de Cajas
                    </h3>

                    {pendingBoxes.length === 0 ? (
                        <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200 text-center">
                            No quedan cajas pendientes por escanear. ¡Carga al 100%!
                        </p>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-slate-400 font-semibold mb-1">Cajas Pendientes</label>
                                <select
                                    value={selectedBoxToScan}
                                    onChange={(e) => {
                                        setSelectedBoxToScan(e.target.value);
                                        setManualBoxCode('');
                                    }}
                                    className="w-full text-xs rounded-lg border-slate-200"
                                >
                                    <option value="">-- Selecciona caja pendiente --</option>
                                    {pendingBoxes.map(b => (
                                        <option key={b.id} value={b.boxCode}>{b.boxCode}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="text-center text-xs text-slate-400 font-semibold my-1">O escribe código manually (para testear alertas)</div>

                            <input
                                type="text"
                                value={manualBoxCode}
                                onChange={(e) => {
                                    setManualBoxCode(e.target.value);
                                    setSelectedBoxToScan('');
                                }}
                                placeholder="Escribe código (ej: BX-001-999)"
                                className="w-full text-xs rounded-lg border-slate-200 font-mono"
                            />

                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button
                                    onClick={() => handleSimulateScan('Cargada')}
                                    disabled={scanning}
                                    className="py-2.5 bg-indigo-50 hover:bg-indigo-150 border border-indigo-200 text-indigo-700 font-bold rounded-lg text-xs transition-colors"
                                >
                                    Escanear y Cargar
                                </button>
                                <button
                                    onClick={() => handleSimulateScan('Faltante')}
                                    disabled={scanning}
                                    className="py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-lg text-xs transition-colors"
                                >
                                    Marcar Faltante
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Documents & Evidence upload */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FiUpload className="text-indigo-600" /> Carga de Guía & Evidencia
                </h3>

                <form onSubmit={handleUploadDocument} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1">Tipo de Archivo</label>
                            <select
                                value={docType}
                                onChange={(e) => setDocType(e.target.value)}
                                className="w-full text-xs rounded-lg border-slate-200"
                            >
                                <option value="Guía firmada">Guía firmada por chofer</option>
                                <option value="Evidencias">Foto / Evidencia de Carga</option>
                                <option value="Documentos logísticos">Otros Documentos</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1">Seleccionar Archivo</label>
                            <input
                                id="file-input"
                                type="file"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="w-full text-xs"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={uploadingDoc || !file}
                        className="w-full py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-black transition-colors text-xs flex items-center justify-center gap-1.5 shadow-sm"
                    >
                        <FiUpload /> {uploadingDoc ? 'Subiendo...' : 'Subir Archivo'}
                    </button>
                </form>

                {/* List Documents */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Documentos Subidos</h4>
                    {documents.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No hay documentos cargados todavía.</p>
                    ) : (
                        <div className="space-y-1.5">
                            {documents.map((doc) => (
                                <a
                                    key={doc.id}
                                    href={`${import.meta.env.VITE_API_URL || ''}${doc.fileUrl}?token=${localStorage.getItem('token')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 border border-slate-100 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                    <FiFileText className="text-slate-400" />
                                    <span className="font-medium truncate max-w-[180px]">{doc.originalName}</span>
                                    <span className="text-[9px] text-slate-400 ml-auto bg-slate-200 py-0.5 px-1.5 rounded">{doc.type}</span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Boxes checklist view */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Lista de Cajas ({boxes.length})</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {boxes.map((b) => (
                        <div key={b.id} className="flex justify-between items-center text-xs py-2 border-b border-slate-50 last:border-0">
                            <span className="font-bold text-slate-800">{b.boxCode}</span>
                            <span className={`py-0.5 px-2 rounded font-semibold
                                ${b.status === 'Cargada' ? 'bg-indigo-50 text-indigo-700' :
                                  b.status === 'Entregada' ? 'bg-emerald-50 text-emerald-700' :
                                  b.status === 'Faltante' ? 'bg-rose-50 text-rose-700 font-bold' : 'bg-slate-50 text-slate-500'}`}>
                                {b.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Travel History Timeline */}
            {trip.history && trip.history.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                    <h3 className="text-sm font-bold text-slate-900">Historial del Recorrido</h3>
                    <div className="space-y-3 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-slate-100">
                        {trip.history.map((h, idx) => (
                            <div key={h.id || idx} className="flex gap-3 text-xs relative pl-6">
                                <div className={`absolute left-0.5 top-1 w-3 h-3 rounded-full border-2 bg-white
                                    ${idx === 0 ? 'border-indigo-600 ring-4 ring-indigo-50 animate-pulse' : 'border-slate-300'}`}>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800">{h.status}</span>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {new Date(h.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {h.notes && <p className="text-slate-500 italic leading-snug">{h.notes}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriverTripDetails;

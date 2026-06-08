import { useState, useEffect } from 'react';
import logisticsService from '../../services/logisticsService';
import { 
    FiPlus, FiSearch, FiLayers, FiCalendar, 
    FiMapPin, FiPrinter, FiEdit3, FiInfo, FiX, FiCheck 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const DispatchesPage = () => {
    // List and Filters
    const [dispatches, setDispatches] = useState([]);
    const [farms, setFarms] = useState([]);
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filterFarm, setFilterFarm] = useState('');
    const [filterDest, setFilterDest] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterDate, setFilterDate] = useState('');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedDispatch, setSelectedDispatch] = useState(null);

    // Form inputs
    const [dispatchCode, setDispatchCode] = useState('');
    const [farmId, setFarmId] = useState('');
    const [destinationId, setDestinationId] = useState('');
    const [date, setDate] = useState('');
    const [observations, setObservations] = useState('');
    const [boxCount, setBoxCount] = useState(10);
    const [submitting, setSubmitting] = useState(false);

    // Edit inputs
    const [editFarmId, setEditFarmId] = useState('');
    const [editDestinationId, setEditDestinationId] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editObservations, setEditObservations] = useState('');

    // Fetch lists
    const loadDispatches = async () => {
        setLoading(true);
        try {
            const filters = {};
            if (filterFarm) filters.farmId = filterFarm;
            if (filterDest) filters.destinationId = filterDest;
            if (filterStatus) filters.status = filterStatus;
            if (filterDate) filters.date = filterDate;

            const res = await logisticsService.getDispatches(filters);
            if (res.success) {
                setDispatches(res.data);
            }
        } catch (error) {
            console.error("Load dispatches error:", error);
            toast.error("Error al cargar la lista de despachos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchFarmsAndDests = async () => {
            try {
                const [farmsRes, destsRes] = await Promise.all([
                    logisticsService.getFarms(),
                    logisticsService.getDestinations()
                ]);
                if (farmsRes.success) setFarms(farmsRes.data);
                if (destsRes.success) setDestinations(destsRes.data);
            } catch (error) {
                console.error("Farms/Destinations fetch error:", error);
            }
        };

        fetchFarmsAndDests();
    }, []);

    useEffect(() => {
        loadDispatches();
    }, [filterFarm, filterDest, filterStatus, filterDate]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!dispatchCode || !farmId || !destinationId || !date) {
            toast.error("Por favor completa los campos requeridos");
            return;
        }

        setSubmitting(true);
        try {
            const res = await logisticsService.createDispatch({
                dispatchCode,
                farmId,
                destinationId,
                date,
                observations,
                boxCount
            });

            if (res.success) {
                toast.success("Despacho creado exitosamente");
                setShowCreateModal(false);
                // Reset form
                setDispatchCode('');
                setFarmId('');
                setDestinationId('');
                setDate('');
                setObservations('');
                setBoxCount(10);
                loadDispatches();
            }
        } catch (error) {
            console.error("Create dispatch error:", error);
            toast.error(error.message || "Error al crear el despacho");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!editFarmId || !editDestinationId || !editDate) {
            toast.error("Por favor completa los campos requeridos");
            return;
        }

        setSubmitting(true);
        try {
            const res = await logisticsService.updateDispatch(selectedDispatch.id, {
                farmId: editFarmId,
                destinationId: editDestinationId,
                date: editDate,
                observations: editObservations
            });

            if (res.success) {
                toast.success("Despacho actualizado exitosamente");
                setShowEditModal(false);
                loadDispatches();
            }
        } catch (error) {
            console.error("Update dispatch error:", error);
            toast.error(error.message || "Error al actualizar el despacho");
        } finally {
            setSubmitting(false);
        }
    };

    const viewDetails = async (id) => {
        try {
            const res = await logisticsService.getDispatchById(id);
            if (res.success) {
                setSelectedDispatch(res.data);
                setShowDetailModal(true);
            }
        } catch (error) {
            console.error("View details error:", error);
            toast.error("Error al obtener detalle del despacho");
        }
    };

    const printLabel = (box) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Etiqueta de Caja - ${box.boxCode}</title>
                <style>
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        text-align: center;
                        padding: 20px;
                        border: 3px solid black;
                        width: 300px;
                        margin: auto;
                    }
                    .title { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
                    .qr { font-size: 14px; background: #eee; padding: 15px; margin: 10px auto; width: 120px; word-break: break-all; }
                    .details { font-size: 12px; text-align: left; }
                    .details div { margin-bottom: 5px; }
                </style>
            </head>
            <body>
                <div class="title">CAJA DE FLORES</div>
                <div style="margin: 15px auto; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(box.qrCode || box.boxCode)}" alt="QR Code" style="width: 120px; height: 120px;" />
                    <div style="font-size: 10px; font-family: monospace; margin-top: 5px;">${box.qrCode || box.boxCode}</div>
                </div>
                <div class="details">
                    <div><strong>Código Caja:</strong> ${box.boxCode}</div>
                    <div><strong>Despacho:</strong> ${selectedDispatch?.dispatchCode}</div>
                    <div><strong>Origen:</strong> ${selectedDispatch?.farm?.name}</div>
                    <div><strong>Destino:</strong> ${selectedDispatch?.destination?.name}</div>
                    <div><strong>Fecha:</strong> ${new Date(selectedDispatch?.date).toLocaleDateString()}</div>
                </div>
                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Creado': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Preparación': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'En carga': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'Despachado': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'Finalizado': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestión de Despachos</h1>
                    <p className="text-slate-500 text-sm">Crea, consulta y gestiona los despachos desde las fincas hasta los aeropuertos.</p>
                </div>
                <button
                    onClick={() => {
                        setDispatchCode(`DESP-2026-${Math.floor(100 + Math.random() * 900)}`);
                        setDate(new Date().toISOString().split('T')[0]);
                        setShowCreateModal(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all font-semibold flex items-center gap-2 text-sm shadow-sm"
                >
                    <FiPlus /> Crear Despacho
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Farm Filter */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Finca Origen</label>
                    <select
                        value={filterFarm}
                        onChange={(e) => setFilterFarm(e.target.value)}
                        className="w-full text-sm rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">Todas las fincas</option>
                        {farms.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                </div>

                {/* Destination Filter */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Destino</label>
                    <select
                        value={filterDest}
                        onChange={(e) => setFilterDest(e.target.value)}
                        className="w-full text-sm rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">Todos los destinos</option>
                        {destinations.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>

                {/* Status Filter */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Estado</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full text-sm rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">Todos los estados</option>
                        <option value="Creado">Creado</option>
                        <option value="Preparación">Preparación</option>
                        <option value="En carga">En carga</option>
                        <option value="Despachado">Despachado</option>
                        <option value="Finalizado">Finalizado</option>
                    </select>
                </div>

                {/* Date Filter */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Fecha</label>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full text-sm rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                ) : dispatches.length === 0 ? (
                    <div className="p-10 text-center text-slate-400">
                        <FiLayers className="text-4xl mx-auto mb-2" />
                        <p className="text-sm font-medium">No se encontraron despachos con los filtros actuales.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead className="bg-slate-50/75 border-b border-slate-100 font-semibold text-slate-600">
                                <tr>
                                    <th className="py-4 px-6">Código</th>
                                    <th className="py-4 px-6">Finca Origen</th>
                                    <th className="py-4 px-6">Destino</th>
                                    <th className="py-4 px-6">Fecha</th>
                                    <th className="py-4 px-6">Responsable</th>
                                    <th className="py-4 px-6">Cajas</th>
                                    <th className="py-4 px-6">Estado</th>
                                    <th className="py-4 px-6 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {dispatches.map((disp) => (
                                    <tr key={disp.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6 font-bold text-slate-900">{disp.dispatchCode}</td>
                                        <td className="py-4 px-6 flex items-center gap-1.5"><FiMapPin className="text-slate-400" /> {disp.farm?.name}</td>
                                        <td className="py-4 px-6">{disp.destination?.name}</td>
                                        <td className="py-4 px-6"><FiCalendar className="text-slate-400 inline mr-1" /> {new Date(disp.date).toLocaleDateString()}</td>
                                        <td className="py-4 px-6">{disp.responsible ? `${disp.responsible.firstName} ${disp.responsible.lastName}` : 'N/A'}</td>
                                        <td className="py-4 px-6"><span className="py-0.5 px-2 bg-slate-100 rounded text-xs font-semibold">{disp._count?.boxes}</span></td>
                                        <td className="py-4 px-6">
                                            <span className={`py-1 px-2.5 rounded-full border text-xs font-bold ${getStatusColor(disp.status)}`}>
                                                {disp.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex justify-center items-center gap-1">
                                                <button
                                                    onClick={() => viewDetails(disp.id)}
                                                    className="p-2 text-indigo-600 hover:text-indigo-800 rounded-lg hover:bg-indigo-50 transition-all"
                                                    title="Ver detalle"
                                                >
                                                    <FiInfo className="text-base" />
                                                </button>
                                                {disp.status !== 'Despachado' && disp.status !== 'Finalizado' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedDispatch(disp);
                                                            setEditFarmId(disp.farmId);
                                                            setEditDestinationId(disp.destinationId);
                                                            setEditDate(disp.date ? new Date(disp.date).toISOString().split('T')[0] : '');
                                                            setEditObservations(disp.observations || '');
                                                            setShowEditModal(true);
                                                        }}
                                                        className="p-2 text-amber-600 hover:text-amber-800 rounded-lg hover:bg-amber-50 transition-all"
                                                        title="Editar despacho"
                                                    >
                                                        <FiEdit3 className="text-base" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-950">Crear Nuevo Despacho</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600"><FiX className="text-xl" /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1">Código de Despacho (Único)*</label>
                                <input
                                    type="text"
                                    value={dispatchCode}
                                    onChange={(e) => setDispatchCode(e.target.value)}
                                    placeholder="Ej: DESP-2026-003"
                                    className="w-full text-sm rounded-lg border-slate-200"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Finca Origen*</label>
                                    <select
                                        value={farmId}
                                        onChange={(e) => setFarmId(e.target.value)}
                                        className="w-full text-sm rounded-lg border-slate-200"
                                        required
                                    >
                                        <option value="">Selecciona...</option>
                                        {farms.map((f) => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Destino*</label>
                                    <select
                                        value={destinationId}
                                        onChange={(e) => setDestinationId(e.target.value)}
                                        className="w-full text-sm rounded-lg border-slate-200"
                                        required
                                    >
                                        <option value="">Selecciona...</option>
                                        {destinations.map((d) => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Fecha Despacho*</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full text-sm rounded-lg border-slate-200"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Cantidad de Cajas*</label>
                                    <input
                                        type="number"
                                        value={boxCount}
                                        onChange={(e) => setBoxCount(e.target.value)}
                                        min="1"
                                        max="100"
                                        className="w-full text-sm rounded-lg border-slate-200"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1">Observaciones</label>
                                <textarea
                                    value={observations}
                                    onChange={(e) => setObservations(e.target.value)}
                                    placeholder="Detalles sobre carga de frío, transportista, etc."
                                    rows="3"
                                    className="w-full text-sm rounded-lg border-slate-200"
                                />
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
                                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-sm shadow-sm flex items-center gap-1.5"
                                >
                                    {submitting ? 'Creando...' : 'Crear Despacho'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedDispatch && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-950">Detalle del Despacho: {selectedDispatch.dispatchCode}</h3>
                                <p className="text-xs text-slate-500">Estado actual: {selectedDispatch.status}</p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600"><FiX className="text-xl" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Summary info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl">
                                <div>
                                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Finca Origen</span>
                                    <span className="text-sm font-bold text-slate-800">{selectedDispatch.farm?.name}</span>
                                    <span className="block text-xs text-slate-500">{selectedDispatch.farm?.location}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Destino Final</span>
                                    <span className="text-sm font-bold text-slate-800">{selectedDispatch.destination?.name}</span>
                                    <span className="block text-xs text-slate-500">{selectedDispatch.destination?.description}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Responsable / Fecha</span>
                                    <span className="text-sm font-bold text-slate-800">
                                        {selectedDispatch.responsible?.firstName} {selectedDispatch.responsible?.lastName}
                                    </span>
                                    <span className="block text-xs text-slate-500">{new Date(selectedDispatch.date).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Cajas List */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">Cajas Registradas ({selectedDispatch.boxes?.length || 0})</h4>
                                {selectedDispatch.boxes?.length === 0 ? (
                                    <p className="text-sm text-slate-400 border border-dashed border-slate-200 p-4 rounded-lg text-center">No hay cajas asociadas a este despacho.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        {selectedDispatch.boxes?.map((box) => (
                                            <div key={box.id} className="p-3 border border-slate-100 rounded-lg flex items-center justify-between bg-white shadow-sm hover:border-indigo-100 transition-colors">
                                                <div>
                                                    <span className="block font-bold text-slate-800 text-sm">{box.boxCode}</span>
                                                    <span className={`inline-block py-0.5 px-2 rounded-full text-[10px] font-bold mt-1
                                                        ${box.status === 'Cargada' ? 'bg-indigo-50 text-indigo-700' :
                                                          box.status === 'Entregada' ? 'bg-emerald-50 text-emerald-700' :
                                                          box.status === 'Faltante' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                                                        {box.status}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => printLabel(box)}
                                                    className="p-1.5 bg-slate-50 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-slate-200 transition-colors"
                                                    title="Imprimir Código QR"
                                                >
                                                    <FiPrinter className="text-sm" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-5 py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Edit Modal */}
            {showEditModal && selectedDispatch && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-950">Editar Despacho</h3>
                                <p className="text-xs text-indigo-600 font-semibold">{selectedDispatch.dispatchCode}</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600"><FiX className="text-xl" /></button>
                        </div>
                        <form onSubmit={handleEdit} className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Finca Origen*</label>
                                    <select
                                        value={editFarmId}
                                        onChange={(e) => setEditFarmId(e.target.value)}
                                        className="w-full text-sm rounded-lg border-slate-200"
                                        required
                                    >
                                        <option value="">Selecciona...</option>
                                        {farms.map((f) => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Destino*</label>
                                    <select
                                        value={editDestinationId}
                                        onChange={(e) => setEditDestinationId(e.target.value)}
                                        className="w-full text-sm rounded-lg border-slate-200"
                                        required
                                    >
                                        <option value="">Selecciona...</option>
                                        {destinations.map((d) => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1">Fecha Despacho*</label>
                                <input
                                    type="date"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    className="w-full text-sm rounded-lg border-slate-200"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1">Observaciones</label>
                                <textarea
                                    value={editObservations}
                                    onChange={(e) => setEditObservations(e.target.value)}
                                    placeholder="Detalles sobre carga de frío, transportista, etc."
                                    rows="3"
                                    className="w-full text-sm rounded-lg border-slate-200"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-semibold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-sm shadow-sm flex items-center gap-1.5"
                                >
                                    {submitting ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DispatchesPage;

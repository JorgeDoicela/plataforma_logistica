import { useState, useEffect } from 'react';
import logisticsService from '../../services/logisticsService';
import { FiBox, FiSearch, FiPrinter, FiPlus, FiGrid, FiLayers, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const BoxesPage = () => {
    const [boxes, setBoxes] = useState([]);
    const [dispatches, setDispatches] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchCode, setSearchCode] = useState('');
    const [selectedDispatch, setSelectedDispatch] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    // Modal Add
    const [showAddModal, setShowAddModal] = useState(false);
    const [targetDispatchId, setTargetDispatchId] = useState('');
    const [manualCodes, setManualCodes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadBoxes = async () => {
        setLoading(true);
        try {
            const filters = {};
            if (selectedDispatch) filters.dispatchId = selectedDispatch;
            if (selectedStatus) filters.status = selectedStatus;

            const res = await logisticsService.getBoxes(filters);
            if (res.success) {
                let data = res.data;
                if (searchCode) {
                    data = data.filter(box => box.boxCode.toLowerCase().includes(searchCode.toLowerCase()));
                }
                setBoxes(data);
            }
        } catch (error) {
            console.error("Load boxes error:", error);
            toast.error("Error al cargar la lista de cajas");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchDispatchesList = async () => {
            try {
                const res = await logisticsService.getDispatches();
                if (res.success) setDispatches(res.data);
            } catch (error) {
                console.error("Dispatches fetch error:", error);
            }
        };

        fetchDispatchesList();
    }, []);

    useEffect(() => {
        loadBoxes();
    }, [selectedDispatch, selectedStatus, searchCode]);

    const handleAddBoxes = async (e) => {
        e.preventDefault();
        if (!targetDispatchId || !manualCodes.trim()) {
            toast.error("Por favor completa los campos requeridos");
            return;
        }

        const codesArray = manualCodes
            .split(',')
            .map(c => c.trim())
            .filter(c => c.length > 0);

        if (codesArray.length === 0) {
            toast.error("Ingresa al menos un código de caja válido");
            return;
        }

        setSubmitting(true);
        try {
            const res = await logisticsService.createBoxesBatch({
                dispatchId: targetDispatchId,
                boxCodes: codesArray
            });

            if (res.success) {
                toast.success(`Se agregaron ${res.data.length} cajas exitosamente`);
                setShowAddModal(false);
                setManualCodes('');
                loadBoxes();
            }
        } catch (error) {
            console.error("Add boxes error:", error);
            toast.error(error.message || "Error al agregar cajas");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pendiente': return 'bg-slate-100 text-slate-700';
            case 'Cargada': return 'bg-blue-100 text-blue-700';
            case 'En tránsito': return 'bg-indigo-100 text-indigo-700';
            case 'Entregada': return 'bg-emerald-100 text-emerald-700';
            case 'Faltante': return 'bg-rose-100 text-rose-700 font-bold';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const printLabel = (box) => {
        const printWindow = window.open('', '_blank');
        const dispCode = box.dispatch?.dispatchCode || 'N/A';
        printWindow.document.write(`
            <html>
            <head>
                <title>Etiqueta - ${box.boxCode}</title>
                <style>
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        text-align: center;
                        padding: 15px;
                        border: 2px dashed black;
                        width: 250px;
                        margin: auto;
                    }
                    .title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
                    .qr { font-size: 11px; background: #eee; padding: 10px; margin: 10px 0; word-break: break-all; }
                    .info { font-size: 11px; text-align: left; }
                </style>
            </head>
            <body>
                <div class="title">ISTPET LOGISTICS</div>
                <div style="margin: 15px auto; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(box.qrCode || box.boxCode)}" alt="QR Code" style="width: 120px; height: 120px;" />
                    <div style="font-size: 10px; font-family: monospace; margin-top: 5px;">${box.qrCode || box.boxCode}</div>
                </div>
                <div class="info">
                    <div><strong>CAJA ID:</strong> ${box.boxCode}</div>
                    <div><strong>DESPACHO:</strong> ${dispCode}</div>
                    <div><strong>FECHA:</strong> ${new Date().toLocaleDateString()}</div>
                </div>
                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const printAllLabels = () => {
        if (boxes.length === 0) return;
        const printWindow = window.open('', '_blank');
        
        let htmlContent = `
            <html>
            <head>
                <title>Etiquetas en Lote</title>
                <style>
                    .label-card {
                        font-family: 'Courier New', Courier, monospace;
                        text-align: center;
                        padding: 15px;
                        border: 2px dashed black;
                        width: 240px;
                        margin: 10px auto;
                        page-break-after: always;
                    }
                    .title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
                    .qr { font-size: 11px; background: #eee; padding: 8px; margin: 8px 0; word-break: break-all; }
                    .info { font-size: 11px; text-align: left; }
                </style>
            </head>
            <body>
        `;

        boxes.forEach(box => {
            const dispCode = box.dispatch?.dispatchCode || 'N/A';
            htmlContent += `
                <div class="label-card">
                    <div class="title">ISTPET LOGISTICS</div>
                    <div style="margin: 15px auto; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(box.qrCode || box.boxCode)}" alt="QR Code" style="width: 120px; height: 120px;" />
                        <div style="font-size: 10px; font-family: monospace; margin-top: 5px;">${box.qrCode || box.boxCode}</div>
                    </div>
                    <div class="info">
                        <div><strong>CAJA ID:</strong> ${box.boxCode}</div>
                        <div><strong>DESPACHO:</strong> ${dispCode}</div>
                        <div><strong>FECHA:</strong> ${new Date().toLocaleDateString()}</div>
                    </div>
                </div>
            `;
        });

        htmlContent += `
                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Control de Cajas & QR</h1>
                    <p className="text-slate-500 text-sm">Monitorea los códigos QR individuales, imprime etiquetas y asocia cajas a despachos.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={printAllLabels}
                        disabled={boxes.length === 0}
                        className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg transition-all font-semibold flex items-center gap-2 text-sm shadow-sm"
                    >
                        <FiPrinter /> Imprimir Todas
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all font-semibold flex items-center gap-2 text-sm shadow-sm"
                    >
                        <FiPlus /> Registrar Cajas
                    </button>
                </div>
            </div>

            {/* Filter and search */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Search box code */}
                <div className="relative">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Buscar por código</label>
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            value={searchCode}
                            onChange={(e) => setSearchCode(e.target.value)}
                            placeholder="Buscar código de caja..."
                            className="pl-9 w-full text-sm rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Dispatch code filter */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Filtro Despacho</label>
                    <select
                        value={selectedDispatch}
                        onChange={(e) => setSelectedDispatch(e.target.value)}
                        className="w-full text-sm rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">Todos los despachos</option>
                        {dispatches.map((d) => (
                            <option key={d.id} value={d.id}>{d.dispatchCode}</option>
                        ))}
                    </select>
                </div>

                {/* Status filter */}
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Filtro Estado</label>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full text-sm rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">Todos los estados</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Cargada">Cargada</option>
                        <option value="En tránsito">En tránsito</option>
                        <option value="Entregada">Entregada</option>
                        <option value="Faltante">Faltante</option>
                    </select>
                </div>
            </div>

            {/* Boxes list */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                ) : boxes.length === 0 ? (
                    <div className="p-10 text-center text-slate-400">
                        <FiBox className="text-4xl mx-auto mb-2" />
                        <p className="text-sm font-medium">No se encontraron cajas registradas.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead className="bg-slate-50/75 border-b border-slate-100 font-semibold text-slate-600">
                                <tr>
                                    <th className="py-4 px-6">Identificador Caja</th>
                                    <th className="py-4 px-6">Código QR Único</th>
                                    <th className="py-4 px-6">Despacho Asociado</th>
                                    <th className="py-4 px-6">Estado Actual</th>
                                    <th className="py-4 px-6 text-center">Imprimir</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {boxes.map((box) => (
                                    <tr key={box.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-2">
                                            <FiGrid className="text-slate-400" /> {box.boxCode}
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-slate-500">{box.qrCode || `QR_${box.boxCode}`}</td>
                                        <td className="py-4 px-6 flex items-center gap-1.5">
                                            <FiLayers className="text-slate-400" /> {box.dispatch?.dispatchCode || 'N/A'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-block py-1 px-3 rounded-full text-xs font-bold ${getStatusColor(box.status)}`}>
                                                {box.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                onClick={() => printLabel(box)}
                                                className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-100/50"
                                                title="Imprimir etiqueta QR"
                                            >
                                                <FiPrinter className="text-base" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-950">Registrar Cajas de Flores</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><FiX className="text-xl" /></button>
                        </div>
                        <form onSubmit={handleAddBoxes} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1">Despacho Asociado*</label>
                                <select
                                    value={targetDispatchId}
                                    onChange={(e) => setTargetDispatchId(e.target.value)}
                                    className="w-full text-sm rounded-lg border-slate-200"
                                    required
                                >
                                    <option value="">Selecciona despacho...</option>
                                    {dispatches.filter(d => d.status === 'Creado' || d.status === 'Preparación' || d.status === 'En carga').map((d) => (
                                        <option key={d.id} value={d.id}>{d.dispatchCode} - {d.farm?.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1">Códigos de Caja (Separados por Comas)*</label>
                                <textarea
                                    value={manualCodes}
                                    onChange={(e) => setManualCodes(e.target.value)}
                                    placeholder="Ej: CAJA-001, CAJA-002, CAJA-003"
                                    rows="4"
                                    className="w-full text-sm rounded-lg border-slate-200 font-mono"
                                    required
                                />
                                <span className="text-xs text-slate-400 mt-1 block">
                                    Ingresa los códigos de barra/QR que vas a etiquetar en las cajas físicas.
                                </span>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-semibold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-sm shadow-sm"
                                >
                                    {submitting ? 'Registrando...' : 'Registrar Cajas'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BoxesPage;

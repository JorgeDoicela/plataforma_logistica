import { useState, useEffect } from 'react';
import logisticsService from '../../services/logisticsService';
import { FiFileText, FiUpload, FiDownload, FiLayers, FiCalendar, FiUser, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const DocumentsPage = () => {
    const [dispatches, setDispatches] = useState([]);
    const [selectedDispatchId, setSelectedDispatchId] = useState('');
    const [dispatchDetail, setDispatchDetail] = useState(null);
    const [loading, setLoading] = useState(false);

    // Form inputs
    const [file, setFile] = useState(null);
    const [docType, setDocType] = useState('Guía de despacho');
    const [uploading, setUploading] = useState(false);

    const fetchDispatchesList = async () => {
        try {
            const res = await logisticsService.getDispatches();
            if (res.success) setDispatches(res.data);
        } catch (error) {
            console.error("Dispatches fetch error:", error);
        }
    };

    useEffect(() => {
        fetchDispatchesList();
    }, []);

    const fetchDispatchDetails = async (id) => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await logisticsService.getDispatchById(id);
            if (res.success) setDispatchDetail(res.data);
        } catch (error) {
            console.error("Dispatch detail error:", error);
            toast.error("Error al cargar detalles del despacho");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedDispatchId) {
            fetchDispatchDetails(selectedDispatchId);
        } else {
            setDispatchDetail(null);
        }
    }, [selectedDispatchId]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedDispatchId || !file) {
            toast.error("Por favor completa todos los campos obligatorios");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('dispatchId', selectedDispatchId);
            formData.append('type', docType);
            formData.append('file', file);

            const res = await logisticsService.uploadDocument(formData);
            if (res.success) {
                toast.success("Documento cargado exitosamente");
                setFile(null);
                document.getElementById('doc-file-input').value = '';
                fetchDispatchDetails(selectedDispatchId);
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(error.message || "Error al cargar el documento");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Gestión Documental Logística</h1>
                <p className="text-slate-500 text-sm">Carga y consulta guías de despacho, evidencias fotográficas de entrega y documentos de aduana.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Select dispatch & upload form */}
                <div className="space-y-6">
                    {/* Selector */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Seleccionar Despacho*</label>
                            <select
                                value={selectedDispatchId}
                                onChange={(e) => setSelectedDispatchId(e.target.value)}
                                className="w-full text-sm rounded-lg border-slate-200"
                            >
                                <option value="">-- Selecciona un despacho --</option>
                                {dispatches.map((d) => (
                                    <option key={d.id} value={d.id}>{d.dispatchCode} - Finca: {d.farm?.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Upload Form */}
                    {selectedDispatchId && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <FiUpload className="text-indigo-600" /> Cargar Nuevo Archivo
                            </h3>

                            <form onSubmit={handleUpload} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Tipo de Documento</label>
                                    <select
                                        value={docType}
                                        onChange={(e) => setDocType(e.target.value)}
                                        className="w-full text-sm rounded-lg border-slate-200"
                                    >
                                        <option value="Guía de despacho">Guía de despacho</option>
                                        <option value="Documentos logísticos">Documentos logísticos</option>
                                        <option value="Evidencias">Evidencias / Fotos de Carga</option>
                                        <option value="Guía firmada">Guía firmada por Aeropuerto</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Archivo (PDF o Imagen)*</label>
                                    <input
                                        id="doc-file-input"
                                        type="file"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        className="w-full text-sm border border-slate-100 rounded-lg p-2 bg-slate-50/50"
                                        required
                                    />
                                    <span className="text-[10px] text-slate-400 mt-1 block">Tamaño máximo de archivo: 10MB</span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={uploading || !file}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all font-semibold flex items-center justify-center gap-2 text-sm shadow-sm"
                                >
                                    <FiUpload /> {uploading ? 'Cargando...' : 'Subir Documento'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Consult / Details view */}
                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="bg-white p-20 flex justify-center rounded-2xl border border-slate-100 shadow-sm">
                            <div className="animate-spin rounded-full h-10 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : !dispatchDetail ? (
                        <div className="bg-slate-50 border border-dashed border-slate-200 p-12 text-center rounded-2xl text-slate-400">
                            <FiFileText className="text-5xl mx-auto mb-2" />
                            <p className="text-sm font-semibold text-slate-500">Selecciona un despacho para consultar o cargar sus documentos.</p>
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                            <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Historial Documental: {dispatchDetail.dispatchCode}</h3>
                                    <p className="text-xs text-slate-500">
                                        Finca: {dispatchDetail.farm?.name} ➔ Aeropuerto: {dispatchDetail.destination?.name}
                                    </p>
                                </div>
                            </div>

                            {/* Documents list */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 mb-3">Archivos Registrados ({dispatchDetail.documents?.length || 0})</h4>
                                {dispatchDetail.documents?.length === 0 ? (
                                    <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400">
                                        No hay documentos cargados para este despacho.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {dispatchDetail.documents?.map((doc) => (
                                            <div 
                                                key={doc.id}
                                                className="p-4 border border-slate-100 bg-slate-50/50 rounded-xl hover:border-indigo-100 transition-colors flex items-center justify-between"
                                            >
                                                <div className="space-y-1 pr-2 flex-1 min-w-0">
                                                    <span className="font-bold text-slate-800 text-sm truncate block">{doc.originalName}</span>
                                                    <div className="flex gap-2 items-center">
                                                        <span className="text-[10px] bg-slate-200 py-0.5 px-2 rounded-full font-bold text-slate-600">{doc.type}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {new Date(doc.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <a
                                                    href={`${import.meta.env.VITE_API_URL || ''}${doc.fileUrl}?token=${localStorage.getItem('token')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 bg-white border border-slate-200 hover:border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm shrink-0"
                                                    title="Descargar documento"
                                                >
                                                    <FiDownload />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentsPage;

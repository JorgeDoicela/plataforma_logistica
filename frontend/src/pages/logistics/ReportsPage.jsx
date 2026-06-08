import { useState, useEffect } from 'react';
import logisticsService from '../../services/logisticsService';
import { FiFileText, FiDownload, FiSearch, FiCalendar, FiFilter, FiPrinter } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ReportsPage = () => {
    const [reportType, setReportType] = useState('dispatches');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedFarm, setSelectedFarm] = useState('');
    const [selectedDriver, setSelectedDriver] = useState('');

    const [farms, setFarms] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchFiltersList = async () => {
            try {
                const [farmsRes, driversRes] = await Promise.all([
                    logisticsService.getFarms(),
                    logisticsService.getDrivers()
                ]);
                if (farmsRes.success) setFarms(farmsRes.data);
                if (driversRes.success) setDrivers(driversRes.data);
            } catch (error) {
                console.error("Filter list error:", error);
            }
        };

        fetchFiltersList();
        
        // Set default dates for the last month
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 1);
        setEndDate(end.toISOString().split('T')[0]);
        setStartDate(start.toISOString().split('T')[0]);
    }, []);

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            const filters = {
                type: reportType,
                startDate,
                endDate,
            };
            if (selectedStatus) filters.status = selectedStatus;
            if (selectedFarm && reportType === 'dispatches') filters.farmId = selectedFarm;
            if (selectedDriver && reportType === 'trips') filters.driverId = selectedDriver;

            const res = await logisticsService.getReportData(filters);
            if (res.success) {
                setReportData(res.data);
                toast.success(`Reporte generado con ${res.data.length} registros`);
            }
        } catch (error) {
            console.error("Generate report error:", error);
            toast.error("Error al generar el reporte");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (startDate && endDate) {
            handleGenerateReport();
        }
    }, [reportType, selectedStatus, selectedFarm, selectedDriver]);

    // CSV Export function
    const exportToCSV = () => {
        if (reportData.length === 0) return;

        let headers = [];
        let rows = [];

        if (reportType === 'dispatches') {
            headers = ['Código Despacho', 'Finca Origen', 'Destino', 'Fecha', 'Responsable', 'Cajas', 'Estado'];
            rows = reportData.map(d => [
                d.dispatchCode,
                d.farm?.name,
                d.destination?.name,
                new Date(d.date).toLocaleDateString(),
                d.responsible ? `${d.responsible.firstName} ${d.responsible.lastName}` : 'N/A',
                d._count?.boxes || 0,
                d.status
            ]);
        } else if (reportType === 'trips') {
            headers = ['Conductor', 'Vehículo', 'Código Despacho', 'Finca Origen', 'Destino', 'Fecha', 'Hora', 'Estado'];
            rows = reportData.map(t => [
                t.driver ? `${t.driver.firstName} ${t.driver.lastName}` : 'N/A',
                t.vehicle?.plate || 'N/A',
                t.dispatch?.dispatchCode || 'N/A',
                t.dispatch?.farm?.name || 'N/A',
                t.dispatch?.destination?.name || 'N/A',
                new Date(t.date).toLocaleDateString(),
                t.time,
                t.status
            ]);
        } else if (reportType === 'boxes') {
            headers = ['Código Caja', 'Código QR', 'Despacho', 'Finca Origen', 'Destino', 'Estado'];
            rows = reportData.map(b => [
                b.boxCode,
                b.qrCode || 'N/A',
                b.dispatch?.dispatchCode || 'N/A',
                b.dispatch?.farm?.name || 'N/A',
                b.dispatch?.destination?.name || 'N/A',
                b.status
            ]);
        }

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto printable-area">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Reportes & KPIs Operativos</h1>
                    <p className="text-slate-500 text-sm">Genera reportes de despachos, trazabilidad de cajas y bitácora de viajes en formato Excel o PDF.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        disabled={reportData.length === 0}
                        className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg transition-all font-semibold flex items-center gap-2 text-sm shadow-sm"
                    >
                        <FiPrinter /> Imprimir PDF
                    </button>
                    <button
                        onClick={exportToCSV}
                        disabled={reportData.length === 0}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all font-semibold flex items-center gap-2 text-sm shadow-sm"
                    >
                        <FiDownload /> Exportar Excel/CSV
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4 no-print">
                <div className="flex border-b border-slate-100 pb-2 gap-4">
                    <button
                        onClick={() => { setReportType('dispatches'); setReportData([]); }}
                        className={`pb-2 text-sm font-bold border-b-2 transition-all ${reportType === 'dispatches' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Reporte Despachos
                    </button>
                    <button
                        onClick={() => { setReportType('trips'); setReportData([]); }}
                        className={`pb-2 text-sm font-bold border-b-2 transition-all ${reportType === 'trips' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Reporte Viajes
                    </button>
                    <button
                        onClick={() => { setReportType('boxes'); setReportData([]); }}
                        className={`pb-2 text-sm font-bold border-b-2 transition-all ${reportType === 'boxes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Estado de Cajas
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Fecha Inicio</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full text-xs rounded-lg border-slate-200"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Fecha Fin</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full text-xs rounded-lg border-slate-200"
                        />
                    </div>
                    {reportType === 'dispatches' && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Finca</label>
                            <select
                                value={selectedFarm}
                                onChange={(e) => setSelectedFarm(e.target.value)}
                                className="w-full text-xs rounded-lg border-slate-200"
                            >
                                <option value="">Todas</option>
                                {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                    )}
                    {reportType === 'trips' && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Chofer</label>
                            <select
                                value={selectedDriver}
                                onChange={(e) => setSelectedDriver(e.target.value)}
                                className="w-full text-xs rounded-lg border-slate-200"
                            >
                                <option value="">Todos</option>
                                {drivers.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Estado</label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full text-xs rounded-lg border-slate-200"
                        >
                            <option value="">Todos</option>
                            {reportType === 'dispatches' && (
                                <>
                                    <option value="Creado">Creado</option>
                                    <option value="Preparación">Preparación</option>
                                    <option value="En carga">En carga</option>
                                    <option value="Despachado">Despachado</option>
                                    <option value="Finalizado">Finalizado</option>
                                </>
                            )}
                            {reportType === 'trips' && (
                                <>
                                    <option value="Asignado">Asignado</option>
                                    <option value="En finca">En finca</option>
                                    <option value="En tránsito">En tránsito</option>
                                    <option value="Llegado a aeropuerto">Llegado a aeropuerto</option>
                                    <option value="Finalizado">Finalizado</option>
                                </>
                            )}
                            {reportType === 'boxes' && (
                                <>
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Cargada">Cargada</option>
                                    <option value="En tránsito">En tránsito</option>
                                    <option value="Entregada">Entregada</option>
                                    <option value="Faltante">Faltante</option>
                                </>
                            )}
                        </select>
                    </div>
                </div>
            </div>

            {/* Print Only Header */}
            <div className="hidden print:block text-center space-y-2 pb-6 border-b border-slate-200">
                <h1 className="text-xl font-bold uppercase">Reporte Operativo de Logística</h1>
                <p className="text-xs text-slate-500">
                    Tipo de reporte: <span className="font-semibold uppercase">{reportType}</span> • 
                    Rango: <span className="font-semibold">{startDate} / {endDate}</span>
                </p>
                <p className="text-[10px] text-slate-400">Generado el: {new Date().toLocaleString()}</p>
            </div>

            {/* Table / Results */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                ) : reportData.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 no-print">
                        <FiFileText className="text-4xl mx-auto mb-2" />
                        <p className="text-sm font-medium">No se encontraron registros para los filtros seleccionados.</p>
                    </div>
                ) : (
                    <div>
                        {reportType === 'dispatches' && (
                            <table className="w-full border-collapse text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-600">
                                    <tr>
                                        <th className="py-3 px-4">Código</th>
                                        <th className="py-3 px-4">Finca Origen</th>
                                        <th className="py-3 px-4">Destino</th>
                                        <th className="py-3 px-4">Fecha</th>
                                        <th className="py-3 px-4">Responsable</th>
                                        <th className="py-3 px-4">Cajas</th>
                                        <th className="py-3 px-4">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {reportData.map((d) => (
                                        <tr key={d.id}>
                                            <td className="py-3 px-4 font-bold text-slate-900">{d.dispatchCode}</td>
                                            <td className="py-3 px-4">{d.farm?.name}</td>
                                            <td className="py-3 px-4">{d.destination?.name}</td>
                                            <td className="py-3 px-4">{new Date(d.date).toLocaleDateString()}</td>
                                            <td className="py-3 px-4">{d.responsible ? `${d.responsible.firstName} ${d.responsible.lastName}` : 'N/A'}</td>
                                            <td className="py-3 px-4">{d._count?.boxes || 0}</td>
                                            <td className="py-3 px-4"><span className="font-semibold">{d.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {reportType === 'trips' && (
                            <table className="w-full border-collapse text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-600">
                                    <tr>
                                        <th className="py-3 px-4">Conductor</th>
                                        <th className="py-3 px-4">Vehículo</th>
                                        <th className="py-3 px-4">Despacho</th>
                                        <th className="py-3 px-4">Origen ➔ Destino</th>
                                        <th className="py-3 px-4">Fecha</th>
                                        <th className="py-3 px-4">Hora</th>
                                        <th className="py-3 px-4">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {reportData.map((t) => (
                                        <tr key={t.id}>
                                            <td className="py-3 px-4 font-semibold">{t.driver ? `${t.driver.firstName} ${t.driver.lastName}` : 'N/A'}</td>
                                            <td className="py-3 px-4">{t.vehicle?.plate || 'N/A'}</td>
                                            <td className="py-3 px-4 font-mono">{t.dispatch?.dispatchCode || 'N/A'}</td>
                                            <td className="py-3 px-4">
                                                {t.dispatch?.farm?.name} ➔ {t.dispatch?.destination?.name}
                                            </td>
                                            <td className="py-3 px-4">{new Date(t.date).toLocaleDateString()}</td>
                                            <td className="py-3 px-4">{t.time}</td>
                                            <td className="py-3 px-4"><span className="font-semibold">{t.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {reportType === 'boxes' && (
                            <table className="w-full border-collapse text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-600">
                                    <tr>
                                        <th className="py-3 px-4">Código Caja</th>
                                        <th className="py-3 px-4">Código QR</th>
                                        <th className="py-3 px-4">Despacho</th>
                                        <th className="py-3 px-4">Finca Origen</th>
                                        <th className="py-3 px-4">Destino</th>
                                        <th className="py-3 px-4">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {reportData.map((b) => (
                                        <tr key={b.id}>
                                            <td className="py-3 px-4 font-bold text-slate-900">{b.boxCode}</td>
                                            <td className="py-3 px-4 font-mono text-[10px] text-slate-500">{b.qrCode || 'N/A'}</td>
                                            <td className="py-3 px-4">{b.dispatch?.dispatchCode || 'N/A'}</td>
                                            <td className="py-3 px-4">{b.dispatch?.farm?.name || 'N/A'}</td>
                                            <td className="py-3 px-4">{b.dispatch?.destination?.name || 'N/A'}</td>
                                            <td className="py-3 px-4"><span className="font-semibold">{b.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsPage;

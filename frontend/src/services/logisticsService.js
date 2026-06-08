import api from '../api/axios';

const getFarms = async () => {
    const response = await api.get('/logistics/farms');
    return response.data;
};

const getDestinations = async () => {
    const response = await api.get('/logistics/destinations');
    return response.data;
};

const getDispatches = async (filters = {}) => {
    const response = await api.get('/logistics/dispatches', { params: filters });
    return response.data;
};

const getDispatchById = async (id) => {
    const response = await api.get(`/logistics/dispatches/${id}`);
    return response.data;
};

const createDispatch = async (data) => {
    const response = await api.post('/logistics/dispatches', data);
    return response.data;
};

const updateDispatch = async (id, data) => {
    const response = await api.put(`/logistics/dispatches/${id}`, data);
    return response.data;
};

const updateDispatchStatus = async (id, status) => {
    const response = await api.patch(`/logistics/dispatches/${id}/status`, { status });
    return response.data;
};

const getBoxes = async (filters = {}) => {
    const response = await api.get('/logistics/boxes', { params: filters });
    return response.data;
};

const createBoxesBatch = async (data) => {
    const response = await api.post('/logistics/boxes/batch', data);
    return response.data;
};

const updateBoxStatus = async (id, status) => {
    const response = await api.patch(`/logistics/boxes/${id}/status`, { status });
    return response.data;
};

const getVehicles = async () => {
    const response = await api.get('/logistics/vehicles');
    return response.data;
};

const createVehicle = async (data) => {
    const response = await api.post('/logistics/vehicles', data);
    return response.data;
};

const getDrivers = async () => {
    const response = await api.get('/logistics/drivers');
    return response.data;
};

const getTrips = async (filters = {}) => {
    const response = await api.get('/logistics/trips', { params: filters });
    return response.data;
};

const getTripById = async (id) => {
    const response = await api.get(`/logistics/trips/${id}`);
    return response.data;
};

const createTrip = async (data) => {
    const response = await api.post('/logistics/trips', data);
    return response.data;
};

const updateTripStatus = async (id, status, notes = '') => {
    const response = await api.patch(`/logistics/trips/${id}/status`, { status, notes });
    return response.data;
};

const scanBox = async (data) => {
    const response = await api.post('/logistics/scans/box', data);
    return response.data;
};

const recordTelemetry = async (data) => {
    const response = await api.post('/logistics/telemetry', data);
    return response.data;
};

const uploadDocument = async (formData) => {
    const response = await api.post('/logistics/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

const getDashboardStats = async () => {
    const response = await api.get('/logistics/dashboard/stats');
    return response.data;
};

const getReportData = async (filters = {}) => {
    const response = await api.get('/logistics/reports/data', { params: filters });
    return response.data;
};

export default {
    getFarms,
    getDestinations,
    getDispatches,
    getDispatchById,
    createDispatch,
    updateDispatch,
    updateDispatchStatus,
    getBoxes,
    createBoxesBatch,
    updateBoxStatus,
    getVehicles,
    createVehicle,
    getDrivers,
    getTrips,
    getTripById,
    createTrip,
    updateTripStatus,
    scanBox,
    recordTelemetry,
    uploadDocument,
    getDashboardStats,
    getReportData
};

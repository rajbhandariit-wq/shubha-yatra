import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor — attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sy_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, err => Promise.reject(err));

// Response interceptor — handle 401
api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('sy_token');
    localStorage.removeItem('sy_user');
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

export default api;

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  // Auth API - add these methods
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyResetToken: (token) => api.get(`/auth/reset-password/${token}`),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),

};

// Customer
export const customerAPI = {
  getCities: () => api.get('/customer/cities'),
  getPopularRoutes: () => api.get('/customer/popular-routes'),
  searchBuses: (params) => api.get('/customer/search', { params }),
  getSeats: (scheduleId) => api.get(`/customer/seats/${scheduleId}`),
  createBooking: (data) => api.post('/customer/bookings', data),
  getMyBookings: (params) => api.get('/customer/bookings', { params }),
  getBooking: (id) => api.get(`/customer/bookings/${id}`),
  cancelBooking: (id, data) => api.put(`/customer/bookings/${id}/cancel`, data),
};

// Provider
export const providerAPI = {
  getDashboard: () => api.get('/provider/dashboard'),
  // Buses
  getBuses: () => api.get('/provider/buses'),
  createBus: (data) => api.post('/provider/buses', data),
  updateBus: (id, data) => api.put(`/provider/buses/${id}`, data),
  deleteBus: (id) => api.delete(`/provider/buses/${id}`),
  // Routes
  getRoutes: () => api.get('/provider/routes'),
  createRoute: (data) => api.post('/provider/routes', data),
  updateRoute: (id, data) => api.put(`/provider/routes/${id}`, data),
  deleteRoute: (id) => api.delete(`/provider/routes/${id}`),
  // Schedules
  getSchedules: () => api.get('/provider/schedules'),
  createSchedule: (data) => api.post('/provider/schedules', data),
  createBulkSchedules: (data) => api.post('/provider/schedules/bulk', data),
  // Bookings
  getBookings: (params) => api.get('/provider/bookings', { params }),
  // Staff
  getStaff: () => api.get('/provider/staff'),
  createStaff: (data) => api.post('/provider/staff', data),
  updateStaff: (id, data) => api.put(`/provider/staff/${id}`, data),
  deleteStaff: (id) => api.delete(`/provider/staff/${id}`),
  // Messaging
  sendMessage: (data) => api.post('/provider/messages/send', data),
  getNotifications: () => api.get('/provider/messages'),
  // Reports
  getReports: (params) => api.get('/provider/reports', { params }),
  searchSchedules: (params) => api.get('/provider/schedules/search', { params }),
  getSeatLayout: (scheduleId) => api.get(`/provider/schedules/${scheduleId}/seats`),
  createBooking: (data) => api.post('/provider/bookings/create', data),
  // Documents
  getDocuments: () => api.get('/provider/documents'),
  uploadDocument: (formData) => api.post('/provider/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteDocument: (filename) => api.delete(`/provider/documents/${filename}`),
};

// Payment
export const paymentAPI = {
  cancelPayment:      (data) => api.post('/payment/cancel', data),
  createStripeIntent: (data) => api.post('/payment/stripe/create-intent', data),
  confirmStripe:      (data) => api.post('/payment/stripe/confirm', data),
  initiateEsewa:      (data) => api.post('/payment/esewa/initiate', data),
  verifyEsewa:        (data) => api.post('/payment/esewa/verify', data),
  initiateKhalti:     (data) => api.post('/payment/khalti/initiate', data),
  verifyKhalti:       (data) => api.post('/payment/khalti/verify', data),
  payByBank:          (data) => api.post('/payment/bank', data),
};

// Billing (Admin)
export const billingAPI = {
  getDashboard:        ()          => api.get('/admin/billing/dashboard'),
  syncTransactions:    ()          => api.post('/admin/billing/sync'),
  runNightly:          ()          => api.post('/admin/billing/run-nightly'),
  // Operators
  getOperators:        ()          => api.get('/admin/billing/operators'),
  getOperatorDetail:   (id)        => api.get(`/admin/billing/operators/${id}`),
  updateOperatorSettings: (id, d)  => api.put(`/admin/billing/operators/${id}/settings`, d),
  // Transactions
  getTransactions:     (params)    => api.get('/admin/billing/transactions', { params }),
  updateTransactionStatus: (id, d) => api.put(`/admin/billing/transactions/${id}/status`, d),
  // Batches
  getBatches:          (params)    => api.get('/admin/billing/batches', { params }),
  getBatchDetail:      (id)        => api.get(`/admin/billing/batches/${id}`),
  generateBatch:       (d)         => api.post('/admin/billing/batches/generate', d),
  approveBatch:        (id)        => api.put(`/admin/billing/batches/${id}/approve`),
  rejectBatch:         (id, d)     => api.put(`/admin/billing/batches/${id}/reject`, d),
  markBatchPaid:       (id, d)     => api.put(`/admin/billing/batches/${id}/mark-paid`, d),
  exportBatchCSV:      (id)        => api.get(`/admin/billing/batches/${id}/export`, { responseType: 'blob' }),
  // Settings
  getSettings:         ()          => api.get('/admin/billing/settings'),
  updateSettings:      (d)         => api.put('/admin/billing/settings', d),
};

// Admin
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  resetPassword: (id, data) => api.put(`/admin/users/${id}/reset-password`, data),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getCustomerReports: () => api.get('/admin/reports/customers'),
  getProviderReports: () => api.get('/admin/reports/providers'),
  getPendingProviders: () => api.get('/admin/providers/pending'),
  approveProvider: (id) => api.put(`/admin/providers/${id}/approve`),
  rejectProvider: (id) => api.put(`/admin/providers/${id}/reject`),
  // Pending bank transfer bookings
  getPendingBookings: () => api.get('/admin/bookings/pending'),
  approveBooking: (id) => api.put(`/admin/bookings/${id}/approve`),
  rejectBooking: (id, data) => api.put(`/admin/bookings/${id}/reject`, data),
  // User profile editing (with uniqueness check)
  updateUserProfile: (id, data)    => api.put(`/admin/users/${id}/profile`, data),
  // RBAC — admin user management
  createAdminUser: (data)          => api.post('/admin/users/admin', data),
  setAdminRole:    (id, data)      => api.put(`/admin/users/${id}/admin-role`, data),
  // Cross-module list views
  getAllBookings:   (params)       => api.get('/admin/all-bookings', { params }),
  getAllSchedules:  (params)       => api.get('/admin/all-schedules', { params }),
  getAllRoutes:     (params)       => api.get('/admin/all-routes', { params }),
  getAllProviders:  (params)       => api.get('/admin/all-providers', { params }),
};



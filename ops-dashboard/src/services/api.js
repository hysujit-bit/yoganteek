import axios from 'axios';

// Base API setup — proxies /api in local dev, points to Render API in production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://yoganteek-api.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Response Interceptor for Error Handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    const customError = new Error(
      error.response?.data?.detail || error.response?.data?.message || 'An error occurred while connecting to the server.'
    );
    customError.status = error.response?.status;
    return Promise.reject(customError);
  }
);

export const api = {
  // Dashboard
  getDashboardStats: () => apiClient.get('/api/dashboard/stats'),

  // Leads
  getLeads: () => apiClient.get('/api/leads'),
  updateLeadStatus: (type, id, data) => {
    // type: 'leads', 'corporate-inquiries', 'contact-submissions'
    const endpointMap = {
      lead: `/api/leads/${id}/status`,
      corporate: `/api/corporate-inquiries/${id}/status`,
      contact: `/api/contact-submissions/${id}/status`,
    };
    const endpoint = endpointMap[type] || `/api/leads/${id}/status`;
    return apiClient.put(endpoint, data);
  },

  // Patients
  getPatients: () => apiClient.get('/api/patients'),
  getPatient: (id) => apiClient.get(`/api/patients/${id}`),
  createPatient: (data) => apiClient.post('/api/patients', data),
  updatePatient: (id, data) => apiClient.put(`/api/patients/${id}`, data),
  sharePatientBrief: (id, data) => apiClient.post(`/api/patients/${id}/share-brief`, data),

  // Patient Activities & Notes (Timeline)
  getPatientActivities: (patientId) => apiClient.get(`/api/patients/${patientId}/activities`),
  addPatientNote: (patientId, data) => apiClient.post(`/api/patients/${patientId}/notes`, data),
  deletePatientNote: (patientId, noteId) => apiClient.delete(`/api/patients/${patientId}/notes/${noteId}`),

  // Sessions
  getSessions: (upcomingOnly = false) => apiClient.get(`/api/sessions?upcoming=${upcomingOnly}`),
  createSession: (data) => apiClient.post('/api/sessions', data),
  updateSession: (id, data) => apiClient.put(`/api/sessions/${id}`, data),
  shareSessionDetails: (id, data) => apiClient.post(`/api/sessions/${id}/share`, data),

  // Prescriptions
  getPrescriptions: () => apiClient.get('/api/prescriptions'),
  createPrescription: (data) => apiClient.post('/api/prescriptions', data),
  sendPrescription: (id) => apiClient.post(`/api/prescriptions/${id}/send`),

  // Patient Plans
  getPatientPlans: () => apiClient.get('/api/patient-plans'),
  createPatientPlan: (data) => apiClient.post('/api/patient-plans', data),

  // Notifications
  getNotifications: (unreadOnly = false) => apiClient.get(`/api/notifications?unread=${unreadOnly}`),
  markNotificationRead: (id) => apiClient.put(`/api/notifications/${id}/read`),
  markAllNotificationsRead: () => apiClient.put('/api/notifications/read-all'),
  deleteReadNotifications: () => apiClient.delete('/api/notifications/read'),
  generateNotifications: () => apiClient.post('/api/notifications/generate'),

  // Calendly / Consultation Logging
  logConsultation: (leadId, data) => apiClient.post(`/api/leads/${leadId}/log-consultation`, data),

  // Bookings (Custom Booking System)
  getBookings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/api/bookings${query ? '?' + query : ''}`);
  },
  createBooking: (data) => apiClient.post('/api/bookings', data),
  updateBooking: (id, data) => apiClient.put(`/api/bookings/${id}`, data),
  cancelBooking: (id) => apiClient.delete(`/api/bookings/${id}`),
  getAvailability: (date) => apiClient.get(`/api/availability?date=${date}`),

  // Google Calendar Sync
  syncGoogleCalendar: (daysAhead = 30) => apiClient.get(`/api/google-calendar/sync?days_ahead=${daysAhead}`),
  getGoogleCalendarStatus: () => apiClient.get('/api/google-calendar/status'),
};

export default api;

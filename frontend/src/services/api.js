// API service for MentorMesh frontend (single unified backend)
const API_BASE_URL = 'http://localhost:5002/api';

// Generic API call function
const apiCall = async (url, options = {}) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Handle specific status codes
      if (response.status === 409) {
        // Conflict - email already exists
        return { 
          success: false, 
          emailExists: true, 
          message: data.message || 'Email already exists'
        };
      }
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Authentication API functions
export const authAPI = {
  signup: async (userData) =>
    apiCall(`${API_BASE_URL}/signup`, {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  // login now accepts optional requestedRole
  login: async ({ emailOrUsername, password, requestedRole = null }) => {
    const body = { emailOrUsername, password };
    if (requestedRole) body.requestedRole = requestedRole;
    return apiCall(`${API_BASE_URL}/login`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  verifyEmail: async (token, email) =>
    apiCall(`${API_BASE_URL}/verify-email`, {
      method: 'POST',
      body: JSON.stringify({ token, email })
    }),

  resendVerification: async (email) =>
    apiCall(`${API_BASE_URL}/resend-verification`, {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  forgotPassword: async (email) =>
    apiCall(`${API_BASE_URL}/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  resetPassword: async (token, email, newPassword) =>
    apiCall(`${API_BASE_URL}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ token, email, newPassword })
    }),

  verifyToken: async (token) =>
    apiCall(`${API_BASE_URL}/verify-token`, {
      method: 'POST',
      body: JSON.stringify({ token })
    }),

  getProfile: async (token) =>
    apiCall(`${API_BASE_URL}/profile`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),

  updateProfile: async (token, profileData) =>
    apiCall(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(profileData)
    }),

  // Add role endpoint for existing users
  addRole: async (email, role, profileData = {}) =>
    apiCall(`${API_BASE_URL}/add-role`, {
      method: 'POST',
      body: JSON.stringify({ email, role, profileData })
    }),

  // Get user by email (for "Add Role" flow)
  getUserByEmail: async (email) =>
    apiCall(`${API_BASE_URL}/users?email=${encodeURIComponent(email)}`)
};

// Skills API
export const skillsAPI = {
  getSkills: async () => apiCall(`${API_BASE_URL}/skills`)
};

// Stats API
export const statsAPI = {
  getStats: async () => apiCall(`${API_BASE_URL}/stats`)
};

// Featured mentors API
export const mentorsAPI = {
  getFeatured: async (limit = 3) =>
    apiCall(`${API_BASE_URL}/mentors/featured?limit=${limit}`)
};

// Testimonials/Feedback API
export const testimonialsAPI = {
  getAll: async () => apiCall(`${API_BASE_URL}/testimonials`)
};

// Health check functions
export const healthAPI = {
  checkSignupHealth: async () => apiCall(`${API_BASE_URL}/health`),
  checkLoginHealth: async () => apiCall(`${API_BASE_URL}/health`)
};

// Sessions API
export const sessionsAPI = {
  // Create a session request (mentee)
  createRequest: async (token, requestData) =>
    apiCall(`${API_BASE_URL}/sessions/request`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(requestData)
    }),

  // Get menteor's incoming session requests
  getMentorRequests: async (token, status = null) => {
    const query = status ? `?status=${status}` : '';
    return apiCall(`${API_BASE_URL}/sessions/requests/mentor${query}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Get mentee's outgoing session requests
  getMenteeRequests: async (token) =>
    apiCall(`${API_BASE_URL}/sessions/requests/mentee`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }),

  // Accept a session request (mentor)
  acceptRequest: async (token, requestId, meetingLink = null) =>
    apiCall(`${API_BASE_URL}/sessions/${requestId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(meetingLink ? { meetingLink } : {})
    }),

  // Decline a session request (mentor)
  declineRequest: async (token, requestId, reason = '') =>
    apiCall(`${API_BASE_URL}/sessions/${requestId}/decline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason })
    }),

  // Get mentor's scheduled sessions
  getMentorSessions: async (token, includePast = false) => {
    const query = includePast ? '?includePast=true' : '';
    return apiCall(`${API_BASE_URL}/sessions/sessions/mentor${query}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Get mentee's booked sessions
  getMenteeSessions: async (token, includePast = false) => {
    const query = includePast ? '?includePast=true' : '';
    return apiCall(`${API_BASE_URL}/sessions/sessions/mentee${query}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Cancel a session
  cancelSession: async (token, sessionId, reason = '') =>
    apiCall(`${API_BASE_URL}/sessions/${sessionId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason })
    }),

  // Complete a session (mentor)
  completeSession: async (token, sessionId) =>
    apiCall(`${API_BASE_URL}/sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }),

  // Reschedule a session (mentor)
  rescheduleSession: async (token, sessionId, newDate, newTime, reason = '') =>
    apiCall(`${API_BASE_URL}/sessions/${sessionId}/reschedule`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ newDate, newTime, reason })
    }),

  // Get meeting details
  getMeetingDetails: async (token, sessionId) =>
    apiCall(`${API_BASE_URL}/sessions/${sessionId}/meeting`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
};

// Utility functions
export const utils = {
  setToken: (token) => localStorage.setItem('mentormesh_token', token),
  getToken: () => localStorage.getItem('mentormesh_token'),
  removeToken: () => localStorage.removeItem('mentormesh_token'),

  setUserData: (userData) =>
    localStorage.setItem('mentormesh_user', JSON.stringify(userData)),
  getUserData: () => {
    const data = localStorage.getItem('mentormesh_user');
    return data ? JSON.parse(data) : null;
  },
  removeUserData: () => localStorage.removeItem('mentormesh_user'),

  // Active role persistence
  setActiveRole: (role) => localStorage.setItem('mentormesh_activeRole', role),
  getActiveRole: () => localStorage.getItem('mentormesh_activeRole'),
  removeActiveRole: () => localStorage.removeItem('mentormesh_activeRole'),

  isAuthenticated: () => !!localStorage.getItem('mentormesh_token'),

  clearAuth: () => {
    utils.removeToken();
    utils.removeUserData();
    utils.removeActiveRole();
  }
};

export default {
  authAPI,
  skillsAPI,
  statsAPI,
  sessionsAPI,
  mentorsAPI,
  testimonialsAPI,
  healthAPI,
  utils
};

// API service for MentorMesh frontend (single unified backend)
const API_BASE_URL = 'http://localhost:5000/api';

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
  // Signup
  signup: async (userData) => {
    return apiCall(`${API_BASE_URL}/signup`, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  // Login
  login: async (credentials) => {
    return apiCall(`${API_BASE_URL}/login`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  // Verify email
  verifyEmail: async (token, email) => {
    return apiCall(`${API_BASE_URL}/verify-email`, {
      method: 'POST',
      body: JSON.stringify({ token, email })
    });
  },

  // Resend verification email
  resendVerification: async (email) => {
    return apiCall(`${API_BASE_URL}/resend-verification`, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  // Forgot password
  forgotPassword: async (email) => {
    return apiCall(`${API_BASE_URL}/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  // Reset password
  resetPassword: async (token, email, newPassword) => {
    return apiCall(`${API_BASE_URL}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ token, email, newPassword })
    });
  },

  // Verify token
  verifyToken: async (token) => {
    // Verify token endpoint is not explicitly present; use profile as validation when needed
    return apiCall(`${API_BASE_URL}/verify-token`, {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  },

  // Get user profile
  getProfile: async (token) => {
    return apiCall(`${API_BASE_URL}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Update profile
  updateProfile: async (token, profileData) => {
    return apiCall(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
  }
};

// Skills API
export const skillsAPI = {
  getSkills: async () => {
    return apiCall(`${API_BASE_URL}/skills`);
  }
};

// Stats API
export const statsAPI = {
  getStats: async () => {
    return apiCall(`${API_BASE_URL}/stats`);
  }
};

// Health check functions
export const healthAPI = {
  checkSignupHealth: async () => {
    return apiCall(`${API_BASE_URL}/health`);
  },
  
  checkLoginHealth: async () => {
    return apiCall(`${API_BASE_URL}/health`);
  }
};

// Utility functions
export const utils = {
  // Store token in localStorage
  setToken: (token) => {
    localStorage.setItem('mentormesh_token', token);
  },

  // Get token from localStorage
  getToken: () => {
    return localStorage.getItem('mentormesh_token');
  },

  // Remove token from localStorage
  removeToken: () => {
    localStorage.removeItem('mentormesh_token');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = utils.getToken();
    return !!token;
  },

  // Get user data from localStorage
  getUserData: () => {
    const userData = localStorage.getItem('mentormesh_user');
    return userData ? JSON.parse(userData) : null;
  },

  // Store user data in localStorage
  setUserData: (userData) => {
    localStorage.setItem('mentormesh_user', JSON.stringify(userData));
  },

  // Remove user data from localStorage
  removeUserData: () => {
    localStorage.removeItem('mentormesh_user');
  },

  // Clear all auth data
  clearAuth: () => {
    utils.removeToken();
    utils.removeUserData();
  }
};

export default {
  authAPI,
  skillsAPI,
  statsAPI,
  healthAPI,
  utils
};

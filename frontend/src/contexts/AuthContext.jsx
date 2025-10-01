import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, utils } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = utils.getToken();
        const storedUser = utils.getUserData();

        if (storedToken && storedUser) {
          // Verify token is still valid
          try {
            const response = await authAPI.verifyToken(storedToken);
            if (response.success) {
              setToken(storedToken);
              setUser(storedUser);
            } else {
              // Token is invalid, clear storage
              utils.clearAuth();
            }
          } catch (error) {
            console.error('Token verification failed:', error);
            utils.clearAuth();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        utils.clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (emailOrUsername, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.login({
        emailOrUsername,
        password
      });

      if (response.success) {
        const { user: userData, token: authToken } = response.data;
        
        // Store in localStorage
        utils.setToken(authToken);
        utils.setUserData(userData);
        
        // Update state
        setToken(authToken);
        setUser(userData);
        
        return { success: true, user: userData };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.signup(userData);

      if (response.success) {
        const { user: newUser, token: authToken } = response.data;
        
        // Store in localStorage
        utils.setToken(authToken);
        utils.setUserData(newUser);
        
        // Update state
        setToken(authToken);
        setUser(newUser);
        
        return { 
          success: true, 
          user: newUser,
          nextSteps: response.nextSteps,
          debug: response.debug
        };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    utils.clearAuth();
    setUser(null);
    setToken(null);
    setError(null);
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.updateProfile(token, profileData);

      if (response.success) {
        const updatedUser = response.data.user;
        
        // Update localStorage
        utils.setUserData(updatedUser);
        
        // Update state
        setUser(updatedUser);
        
        return { success: true, user: updatedUser };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Verify email
  const verifyEmail = async (token, email) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.verifyEmail(token, email);

      if (response.success) {
        // Update user verification status
        if (user) {
          const updatedUser = { ...user, isVerified: true };
          utils.setUserData(updatedUser);
          setUser(updatedUser);
        }
        
        return { success: true };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.forgotPassword(email);

      if (response.success) {
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (token, email, newPassword) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.resetPassword(token, email, newPassword);

      if (response.success) {
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user && !!token,
    login,
    signup,
    logout,
    updateProfile,
    verifyEmail,
    forgotPassword,
    resetPassword,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

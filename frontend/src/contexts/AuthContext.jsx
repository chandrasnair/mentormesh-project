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
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = utils.getToken();
        const storedUser = utils.getUserData();

        if (storedToken && storedUser) {
          try {
            const response = await authAPI.verifyToken(storedToken);
            if (response.success) {
              setToken(storedToken);
              setUser(storedUser);

              if (storedUser.roles?.length === 1) {
                setActiveRole(storedUser.roles[0]);
              } else {
                const storedRole = utils.getActiveRole();
                if (storedRole) setActiveRole(storedRole);
              }
            } else {
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

  // Login
  const login = async (emailOrUsername, password, requestedRole) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.login({ emailOrUsername, password, requestedRole });

      if (response.success) {
        const userData = response.data.user;
        const authToken = response.data.token;

        utils.setToken(authToken);
        utils.setUserData(userData);

        setToken(authToken);
        setUser(userData);

        if (userData.roles?.length === 1) {
          setActiveRole(userData.roles[0]);
          utils.setActiveRole(userData.roles[0]);
        }

        return { success: true, user: userData };
      } else {
        // "role missing" handling
        if (response.message?.toLowerCase().includes("role missing")) {
          return { success: false, roleMissing: true };
        }
        throw new Error(response.message);
      }
    } catch (error) {
      if (error.message.toLowerCase().includes("role missing")) {
        return { success: false, roleMissing: true };
      }
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Signup
  const signup = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.signup(userData);

      if (response.success) {
        const newUser = response.data.user;
        const authToken = response.data.token;

        utils.setToken(authToken);
        utils.setUserData(newUser);

        setToken(authToken);
        setUser(newUser);

        if (newUser.roles?.length === 1) {
          setActiveRole(newUser.roles[0]);
          utils.setActiveRole(newUser.roles[0]);
        }

        return { success: true, user: newUser };
      } else {
        // detect duplicate email
        if (response.message?.toLowerCase().includes("already exists")) {
          return { 
            success: false, 
            emailExists: true,
            message: response.message 
          };
        }
        throw new Error(response.message);
      }
    } catch (error) {
      if (error.message?.toLowerCase().includes("already exists")) {
        return { 
          success: false, 
          emailExists: true,
          message: error.message 
        };
      }
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Add role for existing user (uses email instead of userId)
  const addRole = async (email, role, profileData = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.addRole(email, role, profileData);

      if (response.success) {
        const updatedUser = response.data?.user;

        // Only update context if this is for the current logged-in user
        if (user && user.email === email) {
          setUser(updatedUser);
          utils.setUserData(updatedUser);

          if (!activeRole) {
            setActiveRole(role);
            utils.setActiveRole(role);
          }
        }

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

  // Logout
  const logout = () => {
    utils.clearAuth();
    setUser(null);
    setToken(null);
    setActiveRole(null);
    setError(null);
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.updateProfile(token, profileData);

      if (response.success) {
        const updatedUser = response.data.user;
        utils.setUserData(updatedUser);
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

  // Switch role
  const selectRole = (role) => {
    setActiveRole(role);
    utils.setActiveRole(role);
  };

  const value = {
    user,
    token,
    activeRole,
    setActiveRole: selectRole,
    loading,
    error,
    isAuthenticated: !!user && !!token,
    login,
    signup,
    addRole,
    logout,
    updateProfile,
    clearError: () => setError(null)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

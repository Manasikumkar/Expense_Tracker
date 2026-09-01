import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem('token');
      
      if (token) {
        try {
          const response = await api.get('/auth/me');
          if (response.data.success && response.data.user) {
            setUser(response.data.user);
          } else {
            // Backend says no valid user — clear session
            sessionStorage.removeItem('token');
            setUser(null);
          }
        } catch (error) {
          // API call failed — clear session, force login
          console.log('Auth check failed, clearing session');
          sessionStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        sessionStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        return { success: true, data: response.data };
      }
      return { success: false, message: response.data.error };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || 'Login failed.' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        sessionStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        return { success: true, data: response.data };
      }
      return { success: false, message: response.data.error };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  const value = {
    user,
    api,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

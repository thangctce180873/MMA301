import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateCurrentUser,
} from "../utils/authUtils";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const currentUser = await getCurrentUser();

      setUser(currentUser);
    } catch (error) {
      console.error("Lỗi khi khôi phục phiên:", error);

      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    const result = await registerUser(formData);

    if (result.success) {
      setUser(result.user);
    }

    return result;
  };

  const login = async (formData) => {
    const result = await loginUser(formData);

    if (result.success) {
      setUser(result.user);
    }

    return result;
  };

  const updateProfile = async (updates) => {
    const result = await updateCurrentUser(updates);

    if (result.success) {
      setUser(result.user);
    }

    return result;
  };

  const logout = async () => {
    const result = await logoutUser();

    if (result.success) {
      setUser(null);
    }

    return result;
  };

  const contextValue = useMemo(
    () => ({
      user,
      loading,

      isAuthenticated: Boolean(user),

      register,
      login,
      logout,
      updateProfile,
      restoreSession,
    }),
    [user, loading],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider");
  }

  return context;
}

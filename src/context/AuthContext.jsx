import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  changeCurrentUserPassword,
  deleteCurrentUser,
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
    const loadSession = async () => {
      try {
        const currentUser = await getCurrentUser();

        setUser(currentUser);
      } catch (error) {
        console.error("Lỗi khi tải phiên đăng nhập:", error);

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const register = async (data) => {
    const result = await registerUser(data);

    if (result.success && result.user) {
      setUser(result.user);
    }

    return result;
  };

  const login = async (data) => {
    const result = await loginUser(data);

    if (result.success && result.user) {
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

  const updateProfile = async (updates) => {
    const result = await updateCurrentUser(updates);

    if (result.success && result.user) {
      setUser(result.user);
    }

    return result;
  };

  const changePassword = async (data) => {
    const result = await changeCurrentUserPassword(data);

    if (result.success && result.user) {
      setUser(result.user);
    }

    return result;
  };

  const deleteAccount = async () => {
    const result = await deleteCurrentUser();

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
      changePassword,
      deleteAccount,
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

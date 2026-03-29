import { createContext, useState, useEffect } from "react";
import { connectSocket, disconnectSocket } from "../services/socket";

export const AuthContext = createContext();

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && isTokenExpired(token)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    } else if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Re-connect socket on page refresh if user was already logged in
        connectSocket(parsedUser._id);
      } catch {
        localStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  const login = (data) => {
    localStorage.setItem("token", data.token);
    const { token, ...userWithoutToken } = data;
    localStorage.setItem("user", JSON.stringify(userWithoutToken));
    setUser(userWithoutToken);
    // Connect socket and join the user's personal room for notifications
    connectSocket(userWithoutToken._id);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    // Disconnect socket cleanly on logout
    disconnectSocket();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

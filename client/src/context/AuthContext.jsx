import React, { createContext, useContext, useState } from 'react';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('airvoice-token'));
  const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem('airvoice-user') || 'null'));

  const login = (t, u) => {
    sessionStorage.setItem('airvoice-token', t);
    sessionStorage.setItem('airvoice-user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    sessionStorage.removeItem('airvoice-token');
    sessionStorage.removeItem('airvoice-user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;


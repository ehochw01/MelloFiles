import { createContext, useContext, useEffect, useState } from 'react';
import { getMe, login as apiLogin, signup as apiSignup, logout as apiLogout } from '../services/userApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { loggedIn, userId } or null while loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(data => setUser(data))
      .catch(() => setUser({ loggedIn: false }))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    await apiLogin(email, password);
    const me = await getMe();
    setUser(me);
  }

  async function signup(username, email, password) {
    await apiSignup(username, email, password);
    const me = await getMe();
    setUser(me);
  }

  async function logout() {
    await apiLogout();
    setUser({ loggedIn: false });
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

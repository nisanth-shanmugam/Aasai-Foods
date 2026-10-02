import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/admin/users/");
      setUsers(
        data.map((u) => ({
          id:     u.id,
          name:   u.name,
          email:  u.email,
          phone:  u.phone,
          role:   u.role,
          status: u.is_active ? "Active" : "Blocked",
          joined: u.date_joined,
        }))
      );
    } catch {
      // keep empty if backend unreachable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user?.role === "admin") fetchUsers(); else setLoading(false); }, [user, fetchUsers]);

  const toggleBlock = async (id) => {
    try {
      const { data } = await api.patch(`/auth/admin/users/${id}/`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, status: data.is_active ? "Active" : "Blocked" } : u
        )
      );
    } catch (err) {
      throw err;
    }
  };

  return (
    <UserContext.Provider value={{ users, loading, toggleBlock, fetchUsers }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUsers = () => useContext(UserContext);

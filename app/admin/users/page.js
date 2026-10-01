"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    try {
      const loggedInUser = JSON.parse(storedUser);

      // Only admin can access this page
      if (loggedInUser.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      fetchUsers(token, "");
    } catch {
      router.push("/login");
    }
  }, [router]);

  const fetchUsers = async (token, searchValue) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users", {
        params: {
          search: searchValue,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Your API returns users inside "data"
      const allUsers = response.data.data || [];

      // Show only normal users
      const normalUsers = allUsers.filter((user) => user.role === "user");

      setUsers(normalUsers);
    } catch (error) {
      console.error(error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        router.push("/login");
        return;
      }

      if (error.response?.status === 403) {
        router.push("/dashboard");
        return;
      }

      setError(error.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    fetchUsers(token, search.trim());
  };

  const handleClear = () => {
    setSearch("");

    const token = localStorage.getItem("token");

    if (token) {
      fetchUsers(token, "");
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading users...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Users</h1>

            <p style={styles.subtitle}>
              Manage and search normal registered users.
            </p>
          </div>

          <div style={styles.userCount}>
            {users.length} {users.length === 1 ? "User" : "Users"}
          </div>
        </div>

        {/* SEARCH */}
        <div style={styles.searchCard}>
          <div style={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Search user by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              style={styles.searchInput}
            />

            <button onClick={handleSearch} style={styles.searchButton}>
              Search
            </button>

            {search && (
              <button onClick={handleClear} style={styles.clearButton}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ERROR */}
        {error && <div style={styles.error}>{error}</div>}

        {/* EMPTY */}
        {!error && users.length === 0 && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>👥</div>

            <h2 style={styles.emptyTitle}>
              {search ? "No user found" : "No users found"}
            </h2>

            <p style={styles.emptyText}>
              {search
                ? `No normal user found with the name "${search}".`
                : "Registered normal users will appear here."}
            </p>
          </div>
        )}

        {/* USERS TABLE */}
        {users.length > 0 && (
          <div style={styles.tableCard}>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>

                    <th style={styles.th}>Name</th>

                    <th style={styles.th}>Email</th>

                    <th style={styles.th}>Age</th>

                    <th style={styles.th}>Registered</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user, index) => (
                    <tr
                      key={user.id || user._id || user.email || `user-${index}`}
                    >
                      <td style={styles.td}>{index + 1}</td>

                      <td style={styles.td}>
                        <div style={styles.nameWrapper}>
                          <div style={styles.avatar}>
                            {user.name?.charAt(0)?.toUpperCase()}
                          </div>

                          <span style={styles.name}>{user.name}</span>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.email}>{user.email}</span>
                      </td>

                      <td style={styles.td}>{user.age}</td>

                      <td style={styles.td}>{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(date) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f8fafc, #eef2ff)",
    padding: "35px 25px",
  },

  container: {
    maxWidth: "1250px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "25px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    marginTop: "7px",
    color: "#6b7280",
    fontSize: "15px",
  },

  userCount: {
    background: "#4f46e5",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  searchCard: {
    background: "#fff",
    padding: "18px",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.05)",
    marginBottom: "20px",
  },

  searchWrapper: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  searchInput: {
    flex: 1,
    height: "44px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "0 14px",
    fontSize: "14px",
    outline: "none",
    color: "#111827",
    minWidth: 0,
  },

  searchButton: {
    height: "44px",
    border: "none",
    borderRadius: "8px",
    padding: "0 20px",
    background: "#4f46e5",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  clearButton: {
    height: "44px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "0 18px",
    background: "#fff",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  error: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "20px",
    fontWeight: "600",
  },

  tableCard: {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.07)",
    overflow: "hidden",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "800px",
  },

  th: {
    textAlign: "left",
    padding: "16px 18px",
    background: "#f8fafc",
    color: "#6b7280",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "16px 18px",
    color: "#374151",
    fontSize: "14px",
    borderBottom: "1px solid #f1f5f9",
    whiteSpace: "nowrap",
  },

  nameWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#e0e7ff",
    color: "#4338ca",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "14px",
  },

  name: {
    fontWeight: "700",
    color: "#111827",
  },

  email: {
    color: "#6b7280",
  },

  empty: {
    background: "#fff",
    borderRadius: "16px",
    padding: "70px 20px",
    textAlign: "center",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.06)",
  },

  emptyIcon: {
    fontSize: "45px",
    marginBottom: "15px",
  },

  emptyTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#111827",
  },

  emptyText: {
    color: "#6b7280",
    marginTop: "8px",
  },

  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
  },

  loadingText: {
    fontSize: "18px",
    color: "#4f46e5",
    fontWeight: "700",
  },
};

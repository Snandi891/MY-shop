"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");

  const [toast, setToast] = useState("");

  // =========================
  // LOAD USER
  // =========================

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const storedUser = JSON.parse(localStorage.getItem("user") || "null");

      if (!storedUser?.id) {
        router.push("/login");
        return;
      }

      const response = await api.get(`/users/${storedUser.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData =
        response.data.user || response.data.data || response.data;

      setUser(userData);

      setName(userData.name || "");
      setAge(userData.age || "");
      setEmail(userData.email || "");
    } catch (error) {
      console.error(error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        router.push("/login");
        return;
      }

      showToast(error.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // TOAST
  // =========================

  const showToast = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 2500);
  };

  // =========================
  // UPDATE PROFILE
  // =========================

  const updateProfile = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast("Name is required.");
      return;
    }

    if (!age || Number(age) < 1 || Number(age) > 120) {
      showToast("Enter a valid age.");
      return;
    }

    if (!email.trim()) {
      showToast("Email is required.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      const response = await api.put(
        `/users/${user.id || user._id}`,
        {
          name: name.trim(),
          age: Number(age),
          email: email.trim().toLowerCase(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const updatedUser =
        response.data.user || response.data.data || response.data;

      const finalUser = {
        ...user,
        ...updatedUser,
        name: name.trim(),
        age: Number(age),
        email: email.trim().toLowerCase(),
      };

      setUser(finalUser);

      // Keep localStorage user updated
      localStorage.setItem("user", JSON.stringify(finalUser));

      window.dispatchEvent(new Event("auth-change"));

      setEditing(false);

      showToast("Profile updated successfully.");
    } catch (error) {
      console.error(error);

      showToast(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // CANCEL EDIT
  // =========================

  const cancelEdit = () => {
    setName(user.name || "");
    setAge(user.age || "");
    setEmail(user.email || "");

    setEditing(false);
  };

  // =========================
  // LOGOUT
  // =========================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.dispatchEvent(new Event("auth-change"));

    router.push("/login");
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading your profile...</p>
        </div>
      </main>
    );
  }

  // =========================
  // NO USER
  // =========================

  if (!user) {
    return null;
  }

  const userId = user.id || user._id;

  return (
    <main style={styles.page}>
      {/* TOAST */}

      {toast && (
        <div style={styles.toast}>
          <span style={styles.toastIcon}>✓</span>
          {toast}
        </div>
      )}

      <div style={styles.container}>
        {/* HEADER */}

        <div style={styles.pageHeader}>
          <div>
            <span style={styles.smallTitle}>ACCOUNT</span>

            <h1 style={styles.title}>My Profile</h1>

            <p style={styles.subtitle}>
              Manage your personal information and account settings.
            </p>
          </div>

          <button
            onClick={() => router.push("/orders")}
            style={styles.ordersButton}
          >
            View My Orders
          </button>
        </div>

        {/* PROFILE CARD */}

        <div style={styles.profileCard}>
          {/* PROFILE HEADER */}

          <div style={styles.profileHeader}>
            <div style={styles.avatar}>
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>

            <div>
              <h2 style={styles.profileName}>{user.name}</h2>

              <p style={styles.profileEmail}>{user.email}</p>

              <span style={styles.roleBadge}>
                {user.role === "admin" ? "Administrator" : "Customer"}
              </span>
            </div>
          </div>

          {/* PROFILE INFORMATION */}

          {!editing ? (
            <>
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <div>
                    <h3 style={styles.sectionTitle}>Personal Information</h3>

                    <p style={styles.sectionText}>Your account information</p>
                  </div>

                  <button
                    onClick={() => setEditing(true)}
                    style={styles.editButton}
                  >
                    Edit Profile
                  </button>
                </div>

                <div style={styles.infoGrid}>
                  <div style={styles.infoBox}>
                    <span style={styles.label}>Full Name</span>

                    <strong style={styles.value}>
                      {user.name || "Not provided"}
                    </strong>
                  </div>

                  <div style={styles.infoBox}>
                    <span style={styles.label}>Email Address</span>

                    <strong style={styles.value}>
                      {user.email || "Not provided"}
                    </strong>
                  </div>

                  <div style={styles.infoBox}>
                    <span style={styles.label}>Age</span>

                    <strong style={styles.value}>
                      {user.age || "Not provided"}
                    </strong>
                  </div>

                  <div style={styles.infoBox}>
                    <span style={styles.label}>Account Type</span>

                    <strong style={styles.value}>
                      {user.role === "admin" ? "Administrator" : "Customer"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* QUICK ACTIONS */}

              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Quick Actions</h3>

                <div style={styles.actionsGrid}>
                  <button
                    onClick={() => router.push("/orders")}
                    style={styles.actionCard}
                  >
                    <span style={styles.actionIcon}>🛍️</span>

                    <span>
                      <strong>My Orders</strong>

                      <small>View your order history</small>
                    </span>
                  </button>

                  <button
                    onClick={() => router.push("/cart")}
                    style={styles.actionCard}
                  >
                    <span style={styles.actionIcon}>🛒</span>

                    <span>
                      <strong>My Cart</strong>

                      <small>View products in your cart</small>
                    </span>
                  </button>
                </div>
              </div>

              {/* ACCOUNT */}

              <div style={styles.accountSection}>
                <div>
                  <h3 style={styles.sectionTitle}>Account</h3>

                  <p style={styles.sectionText}>Sign out from your account</p>
                </div>

                <button onClick={logout} style={styles.logoutButton}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            /* EDIT FORM */
            <form onSubmit={updateProfile} style={styles.form}>
              <div style={styles.formHeader}>
                <div>
                  <h3 style={styles.sectionTitle}>Edit Profile</h3>

                  <p style={styles.sectionText}>
                    Update your personal information
                  </p>
                </div>
              </div>

              <div style={styles.formGrid}>
                {/* NAME */}

                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Full Name</label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    style={styles.input}
                  />
                </div>

                {/* EMAIL */}

                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Email Address</label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    style={styles.input}
                  />
                </div>

                {/* AGE */}

                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Age</label>

                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="1"
                    max="120"
                    placeholder="Enter your age"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formActions}>
                <button
                  type="button"
                  onClick={cancelEdit}
                  style={styles.cancelButton}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={styles.saveButton}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  page: {
    minHeight: "calc(100vh - 72px)",
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
    padding: "50px 20px 80px",
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },

  // HEADER

  pageHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "30px",
  },

  smallTitle: {
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "2px",
    color: "#2563eb",
  },

  title: {
    margin: "8px 0 8px",
    fontSize: "clamp(30px, 5vw, 42px)",
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    margin: "0",
    color: "#6b7280",
    lineHeight: "1.6",
  },

  ordersButton: {
    padding: "11px 18px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  // CARD

  profileCard: {
    background: "#ffffff",
    borderRadius: "22px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 35px rgba(15, 23, 42, 0.07)",
    overflow: "hidden",
  },

  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    padding: "30px",
    borderBottom: "1px solid #e5e7eb",
    background: "linear-gradient(135deg, #eff6ff, #eef2ff)",
  },

  avatar: {
    width: "76px",
    height: "76px",
    minWidth: "76px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #2563eb, #4f46e5)",
    color: "#ffffff",
    fontSize: "30px",
    fontWeight: "800",
  },

  profileName: {
    margin: "0 0 5px",
    color: "#111827",
    fontSize: "24px",
  },

  profileEmail: {
    margin: "0 0 9px",
    color: "#6b7280",
    fontSize: "14px",
  },

  roleBadge: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "11px",
    fontWeight: "800",
  },

  // SECTION

  section: {
    padding: "30px",
    borderBottom: "1px solid #e5e7eb",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    marginBottom: "22px",
  },

  sectionTitle: {
    margin: "0",
    color: "#111827",
    fontSize: "18px",
    fontWeight: "750",
  },

  sectionText: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  editButton: {
    padding: "9px 15px",
    border: "1px solid #2563eb",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: "700",
  },

  // INFO

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
  },

  infoBox: {
    padding: "17px",
    borderRadius: "12px",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    color: "#6b7280",
    fontSize: "12px",
    fontWeight: "600",
  },

  value: {
    display: "block",
    color: "#111827",
    fontSize: "15px",
    wordBreak: "break-word",
  },

  // ACTIONS

  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "14px",
    marginTop: "18px",
  },

  actionCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "17px",
    textAlign: "left",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    background: "#ffffff",
    cursor: "pointer",
  },

  actionIcon: {
    width: "42px",
    height: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background: "#eff6ff",
    fontSize: "20px",
  },

  // ACCOUNT

  accountSection: {
    padding: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
  },

  logoutButton: {
    padding: "10px 18px",
    border: "1px solid #fecaca",
    borderRadius: "9px",
    background: "#fef2f2",
    color: "#dc2626",
    cursor: "pointer",
    fontWeight: "700",
  },

  // FORM

  form: {
    padding: "30px",
  },

  formHeader: {
    marginBottom: "25px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  inputLabel: {
    color: "#374151",
    fontSize: "13px",
    fontWeight: "700",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    outline: "none",
    background: "#ffffff",
    color: "#111827",
    fontSize: "14px",
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "28px",
    paddingTop: "22px",
    borderTop: "1px solid #e5e7eb",
  },

  cancelButton: {
    padding: "11px 18px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "700",
  },

  saveButton: {
    padding: "11px 20px",
    border: "none",
    borderRadius: "9px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "700",
  },

  // LOADING

  loading: {
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
  },

  spinner: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    border: "4px solid #dbeafe",
    borderTopColor: "#2563eb",
    animation: "spin 0.8s linear infinite",
    marginBottom: "15px",
  },

  // TOAST

  toast: {
    position: "fixed",
    top: "90px",
    right: "25px",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "13px 18px",
    borderRadius: "10px",
    background: "#111827",
    color: "#ffffff",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
    fontSize: "14px",
    fontWeight: "600",
  },

  toastIcon: {
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#22c55e",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "800",
  },
};

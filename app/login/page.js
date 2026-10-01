"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/users/login", {
        email: formData.email,
        password: formData.password,
      });

      const token = response.data.token;
      const user = response.data.user;

      if (!token) {
        setMessage("Token was not received from server");
        return;
      }

      if (!user) {
        setMessage("User information was not received from server");
        return;
      }

      // Save authentication data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Tell Header that login happened
      window.dispatchEvent(new Event("auth-change"));

      // Redirect according to role
      if (user.role === "admin") {
        router.push("/admin/products");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.container}>
      <div style={styles.card} className="auth-card">
        <h1 style={styles.title}>Login</h1>

        <p style={styles.subtitle}>Login to your account</p>

        {message && (
          <div style={styles.message} role="alert">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            name="email"
            placeholder="Enter email"
            value={formData.email}
            onChange={handleChange}
            style={styles.input}
            autoComplete="email"
            required
          />

          <input
            className="auth-input"
            type="password"
            name="password"
            placeholder="Enter password"
            value={formData.password}
            onChange={handleChange}
            style={styles.input}
            autoComplete="current-password"
            required
          />

          <div style={styles.forgotWrapper}>
            <Link
              href="/forget-password"
              className="auth-forgot"
              style={styles.forgotLink}
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-button"
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={styles.bottomText}>Don't have an account?</p>

        <button
          onClick={() => router.push("/register")}
          className="auth-link-button"
          style={styles.linkButton}
        >
          Create Account
        </button>
      </div>

      {/* Responsive + interactive states that inline styles can't handle */}
      <style>{`
        .auth-input::placeholder {
          color: #9ca3af;
        }

        .auth-input:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
        }

        .auth-button:hover:not(:disabled) {
          background: #1d4ed8 !important;
          box-shadow: 0 10px 22px rgba(37, 99, 235, 0.28);
        }

        .auth-button:active:not(:disabled) {
          transform: translateY(1px);
        }

        .auth-link-button:hover {
          background: #eff6ff !important;
        }

        .auth-link-button:active {
          transform: translateY(1px);
        }

        .auth-forgot:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .auth-card {
            border-radius: 14px;
            box-shadow: 0 10px 28px rgba(0, 0, 0, 0.08);
          }
        }

        @media (max-width: 360px) {
          .auth-card {
            padding: 20px 16px;
          }
        }
      `}</style>
    </main>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "clamp(16px, 4vw, 24px)",
    background: "linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%)",
    boxSizing: "border-box",
    fontFamily:
      "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "450px",
    padding: "clamp(24px, 6vw, 38px)",
    background: "#ffffff",
    borderRadius: "18px",
    boxShadow: "0 15px 40px rgba(0, 0, 0, 0.08)",
    boxSizing: "border-box",
  },

  title: {
    margin: "0 0 8px",
    textAlign: "center",
    color: "#111827",
    fontSize: "clamp(1.5rem, 5vw, 1.85rem)",
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },

  subtitle: {
    margin: "0 0 25px",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "clamp(0.9rem, 3.5vw, 1rem)",
  },

  message: {
    marginBottom: "20px",
    padding: "12px 14px",
    borderRadius: "8px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    textAlign: "center",
    fontSize: "0.9rem",
    lineHeight: 1.4,
    wordBreak: "break-word",
  },

  input: {
    width: "100%",
    padding: "13px 14px",
    marginBottom: "15px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    outline: "none",
    fontSize: "16px", // prevents auto-zoom on iOS
    fontFamily: "inherit",
    color: "#111827",
    background: "#ffffff",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  },

  forgotWrapper: {
    textAlign: "right",
    marginTop: "8px",
  },

  forgotLink: {
    color: "#2563eb",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 500,
  },

  button: {
    width: "100%",
    padding: "13px",
    marginTop: "20px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 600,
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition:
      "background 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease",
  },

  buttonDisabled: {
    background: "#93c5fd",
    cursor: "not-allowed",
  },

  bottomText: {
    marginTop: "25px",
    marginBottom: "8px",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "14px",
  },

  linkButton: {
    display: "block",
    width: "100%",
    margin: "0 auto",
    padding: "11px",
    border: "1px solid #2563eb",
    borderRadius: "8px",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "background 0.2s ease, transform 0.1s ease",
  },
};

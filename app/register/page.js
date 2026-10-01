"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    age: "",
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
      const response = await api.post("/users/register", {
        name: formData.name,
        age: Number(formData.age),
        email: formData.email,
        password: formData.password,
      });

      setMessage(response.data.message || "Registration successful");

      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create Account</h1>

        <p style={styles.subtitle}>Register a new user</p>

        {message && <div style={styles.message}>{message}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Enter name"
            value={formData.name}
            onChange={handleChange}
            style={styles.input}
            required
          />

          <input
            type="number"
            name="age"
            placeholder="Enter age"
            value={formData.age}
            onChange={handleChange}
            style={styles.input}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Enter email"
            value={formData.email}
            onChange={handleChange}
            style={styles.input}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Enter password"
            value={formData.password}
            onChange={handleChange}
            style={styles.input}
            required
          />

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        <p style={styles.bottomText}>Already have an account?</p>

        <button onClick={() => router.push("/login")} style={styles.linkButton}>
          Login
        </button>
      </div>
    </main>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    background: "linear-gradient(135deg, #eef2ff, #f8fafc)",
  },

  card: {
    width: "100%",
    maxWidth: "450px",
    padding: "35px",
    background: "#ffffff",
    borderRadius: "18px",
    boxShadow: "0 15px 40px rgba(0, 0, 0, 0.08)",
  },

  title: {
    margin: "0 0 8px",
    textAlign: "center",
    color: "#111827",
  },

  subtitle: {
    marginBottom: "25px",
    textAlign: "center",
    color: "#6b7280",
  },

  message: {
    marginBottom: "20px",
    padding: "12px",
    borderRadius: "8px",
    background: "#eff6ff",
    color: "#1d4ed8",
    textAlign: "center",
  },

  input: {
    width: "100%",
    padding: "13px",
    marginBottom: "15px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    outline: "none",
  },

  button: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: "8px",
    background: "#16a34a",
    color: "#ffffff",
    cursor: "pointer",
  },

  bottomText: {
    marginTop: "25px",
    marginBottom: "8px",
    textAlign: "center",
    color: "#6b7280",
  },

  linkButton: {
    display: "block",
    margin: "0 auto",
    border: "none",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
  },
};

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!password || !confirmPassword) {
      setError("Please fill all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://my-commerce-backend.vercel.app/api/users/reset-password/${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Something went wrong");
        return;
      }

      setMessage(data.message);

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      console.error(error);
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page">
        <div className="card">
          <h1>Reset Password</h1>

          <p className="description">Enter your new password below.</p>

          <form onSubmit={handleSubmit}>
            <label>New Password</label>

            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <label>Confirm Password</label>

            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>

          {message && <div className="success">{message}</div>}

          {error && <div className="error">{error}</div>}
        </div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #e0f2fe, #ede9fe);
        }

        .card {
          width: 100%;
          max-width: 420px;
          padding: 35px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12);
        }

        h1 {
          margin: 0 0 10px;
          font-size: 30px;
          color: #111827;
        }

        .description {
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 25px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
        }

        input {
          width: 100%;
          box-sizing: border-box;
          padding: 14px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          outline: none;
          font-size: 16px;
          margin-bottom: 18px;
        }

        input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }

        button {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 10px;
          background: #4f46e5;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .success {
          margin-top: 20px;
          padding: 12px;
          border-radius: 8px;
          background: #dcfce7;
          color: #166534;
        }

        .error {
          margin-top: 20px;
          padding: 12px;
          border-radius: 8px;
          background: #fee2e2;
          color: #b91c1c;
        }
      `}</style>
    </>
  );
}

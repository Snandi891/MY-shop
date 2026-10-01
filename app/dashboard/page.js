"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const QUICK_ACTIONS = [
  {
    href: "/products",
    icon: "🛍️",
    tone: "blue",
    title: "Browse Products",
    description: "Explore all available products and start shopping.",
    cta: "Shop now",
  },
  {
    href: "/cart",
    icon: "🛒",
    tone: "green",
    title: "My Cart",
    description: "View your cart and manage your selected products.",
    cta: "View cart",
  },
  {
    href: "/orders",
    icon: "📦",
    tone: "amber",
    title: "My Orders",
    description: "Track your orders and check their current status.",
    cta: "View orders",
  },
];

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      if (!parsedUser || typeof parsedUser !== "object") {
        throw new Error("Invalid user data");
      }

      setUser(parsedUser);
      setLoading(false);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = () => {
    setLoggingOut(true);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("cart");

    window.dispatchEvent(new Event("auth-change"));

    router.replace("/");
  };

  const displayName = user?.name?.trim() || "there";
  const initial = displayName.charAt(0).toUpperCase();
  const role = user?.role ? String(user.role) : "customer";

  return (
    <main className="page">
      {loading ? (
        <div className="loading" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <p className="loadingText">Loading your dashboard…</p>
        </div>
      ) : !user ? null : (
        <div className="wrapper">
          {/* Welcome */}
          <section className="welcome">
            <div className="welcomeText">
              <p className="eyebrow">Welcome back</p>

              <h1 className="title">Hello, {displayName} 👋</h1>

              <p className="subtitle">
                Manage your account, orders and shopping — all in one place.
              </p>
            </div>

            <div className="avatar" aria-hidden="true">
              {initial}
            </div>
          </section>

          {/* Quick Actions */}
          <section aria-labelledby="quick-actions-heading">
            <h2 id="quick-actions-heading" className="sectionTitle">
              Quick actions
            </h2>

            <div className="grid">
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.href} href={action.href} className="card">
                  <span
                    className={`icon icon--${action.tone}`}
                    aria-hidden="true"
                  >
                    {action.icon}
                  </span>

                  <h3 className="cardTitle">{action.title}</h3>

                  <p className="cardText">{action.description}</p>

                  <span className="cardLink">
                    {action.cta}
                    <span className="arrow" aria-hidden="true">
                      →
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Profile */}
          <section aria-labelledby="profile-heading" className="profileSection">
            <h2 id="profile-heading" className="sectionTitle">
              My profile
            </h2>

            <dl className="profileCard">
              <div className="profileRow">
                <dt className="label">Name</dt>
                <dd className="value">{displayName}</dd>
              </div>

              <div className="profileRow">
                <dt className="label">Email</dt>
                <dd className="value">{user?.email || "—"}</dd>
              </div>

              <div className="profileRow">
                <dt className="label">Account type</dt>
                <dd className="value role">{role}</dd>
              </div>
            </dl>
          </section>

          {/* Logout */}
          <div className="logoutContainer">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="logout"
            >
              {loggingOut ? "Logging out…" : "Logout"}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ---------- Layout ---------- */
        .page {
          min-height: calc(100vh - 72px);
          background: #f5f7fb;
          color: #111827;
          -webkit-font-smoothing: antialiased;
        }

        .wrapper {
          box-sizing: border-box;
          width: 100%;
          max-width: 1140px;
          margin: 0 auto;
          padding: 40px 20px 64px;
        }

        /* ---------- Loading ---------- */
        .loading {
          min-height: calc(100vh - 72px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 40px 20px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid #dbeafe;
          border-top-color: #2563eb;
          animation: spin 0.8s linear infinite;
        }

        .loadingText {
          margin: 0;
          color: #6b7280;
          font-size: 15px;
          font-weight: 500;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ---------- Welcome ---------- */
        .welcome {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 32px;
          margin-bottom: 40px;
          border: 1px solid #dbeafe;
          border-radius: 20px;
          background: linear-gradient(135deg, #eff6ff 0%, #ffffff 70%);
        }

        .welcomeText {
          min-width: 0;
        }

        .eyebrow {
          margin: 0 0 6px;
          color: #2563eb;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .title {
          margin: 0;
          font-size: clamp(24px, 4vw, 32px);
          font-weight: 700;
          line-height: 1.2;
          overflow-wrap: anywhere;
        }

        .subtitle {
          margin: 10px 0 0;
          max-width: 60ch;
          color: #6b7280;
          font-size: 15px;
          line-height: 1.55;
        }

        .avatar {
          flex-shrink: 0;
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #ffffff;
          font-size: 28px;
          font-weight: 700;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.28);
        }

        /* ---------- Section titles ---------- */
        .sectionTitle {
          margin: 0 0 18px;
          font-size: clamp(18px, 2.5vw, 22px);
          font-weight: 700;
          color: #111827;
        }

        /* ---------- Cards grid ---------- */
        .grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(min(100%, 280px), 1fr)
          );
          gap: 20px;
        }

        .card {
          display: flex;
          flex-direction: column;
          padding: 24px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            border-color 0.2s ease;
        }

        .card:hover {
          transform: translateY(-4px);
          border-color: #dbeafe;
          box-shadow: 0 16px 35px rgba(0, 0, 0, 0.09);
        }

        .card:focus-visible {
          outline: 3px solid #93c5fd;
          outline-offset: 2px;
        }

        .icon {
          width: 50px;
          height: 50px;
          margin-bottom: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          font-size: 22px;
        }

        .icon--blue {
          background: #dbeafe;
        }

        .icon--green {
          background: #dcfce7;
        }

        .icon--amber {
          background: #fef3c7;
        }

        .cardTitle {
          margin: 0 0 8px;
          font-size: 19px;
          font-weight: 700;
        }

        .cardText {
          margin: 0 0 20px;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.55;
        }

        .cardLink {
          margin-top: auto;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #2563eb;
          font-size: 14px;
          font-weight: 600;
        }

        .arrow {
          transition: transform 0.2s ease;
        }

        .card:hover .arrow {
          transform: translateX(4px);
        }

        /* ---------- Profile ---------- */
        .profileSection {
          margin-top: 44px;
        }

        .profileCard {
          margin: 0;
          padding: 6px 24px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.04);
        }

        .profileRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 18px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .profileRow:last-child {
          border-bottom: none;
        }

        .label {
          color: #6b7280;
          font-size: 14px;
        }

        .value {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          text-align: right;
          overflow-wrap: anywhere;
        }

        .role {
          text-transform: capitalize;
        }

        /* ---------- Logout ---------- */
        .logoutContainer {
          margin-top: 36px;
          display: flex;
          justify-content: center;
        }

        .logout {
          padding: 12px 32px;
          border: none;
          border-radius: 10px;
          background: #dc2626;
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition:
            background 0.2s ease,
            transform 0.15s ease,
            box-shadow 0.2s ease;
        }

        .logout:hover:not(:disabled) {
          background: #b91c1c;
          box-shadow: 0 8px 18px rgba(220, 38, 38, 0.25);
        }

        .logout:active:not(:disabled) {
          transform: scale(0.98);
        }

        .logout:focus-visible {
          outline: 3px solid #fca5a5;
          outline-offset: 2px;
        }

        .logout:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* ---------- Responsive ---------- */
        @media (max-width: 768px) {
          .wrapper {
            padding: 28px 16px 52px;
          }

          .welcome {
            padding: 24px 20px;
            margin-bottom: 32px;
            border-radius: 16px;
            gap: 16px;
            align-items: flex-start;
          }

          .avatar {
            width: 54px;
            height: 54px;
            font-size: 22px;
          }

          .profileSection {
            margin-top: 34px;
          }

          .profileCard {
            padding: 4px 18px;
          }

          .profileRow {
            padding: 15px 0;
          }
        }

        @media (max-width: 480px) {
          .wrapper {
            padding: 22px 14px 44px;
          }

          .welcome {
            padding: 20px 16px;
            margin-bottom: 26px;
          }

          .subtitle {
            font-size: 14px;
          }

          .grid {
            gap: 14px;
          }

          .card {
            padding: 20px;
            border-radius: 14px;
          }

          .profileRow {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .value {
            text-align: left;
          }

          .logoutContainer {
            margin-top: 28px;
          }

          .logout {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .card,
          .arrow,
          .logout,
          .spinner {
            transition: none;
            animation: none;
          }

          .card:hover {
            transform: none;
          }
        }
      `}</style>
    </main>
  );
}

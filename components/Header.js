"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  CSS — plain string, injected via <style>. No styled-jsx,          */
/*  no hashed classNames, no hydration mismatch.                      */
/* ------------------------------------------------------------------ */
const CSS = `
  .mh-header {
    position: sticky;
    top: 0;
    z-index: 1000;
    width: 100%;
    background: #ffffff;
    border-bottom: 1px solid #f3f4f6;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  .mh-inner {
    max-width: 1280px;
    margin: 0 auto;
    height: 80px;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }

  /* ---------------- LOGO ---------------- */
  .mh-logo {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    flex-shrink: 0;
  }
  .mh-logo-mark {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
    color: #fff;
    font-size: 18px;
    font-weight: 800;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
    flex-shrink: 0;
  }
  .mh-logo-text {
    font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.5px;
    /* GRADIENT TEXT EFFECT */
    background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    white-space: nowrap;
  }

  /* ---------------- NAV ---------------- */
  .mh-nav {
    display: flex;
    align-items: center;
    gap: 32px;
    margin-left: 40px;
    flex: 1;
  }
  .mh-nav-link {
    position: relative;
    text-decoration: none;
    color: #4b5563;
    font-size: 15px;
    font-weight: 500;
    padding: 6px 0;
    transition: color 0.2s ease;
  }
  .mh-nav-link:hover, .mh-nav-link.is-active {
    color: #111827;
  }
  /* Gradient underline on hover/active */
  .mh-nav-link::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899);
    transition: width 0.3s ease;
    border-radius: 2px;
  }
  .mh-nav-link:hover::after, .mh-nav-link.is-active::after {
    width: 100%;
  }

  /* ---------------- RIGHT SIDE ICONS ---------------- */
  .mh-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: auto;
    flex-shrink: 0;
  }

  /* Base circular icon button */
  .mh-icon-btn {
    position: relative;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 1px solid #e5e7eb;
    background: transparent;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    flex-shrink: 0;
  }
  .mh-icon-btn:hover {
    border-color: #a855f7;
    color: #6366f1;
    background: #f5f3ff;
  }

  /* Search button (Gradient ONLY on hover) */
  .mh-search-btn {
    /* Inherits base .mh-icon-btn styles by default */
  }
  .mh-search-btn:hover {
    background: linear-gradient(135deg, #6366f1, #a855f7) !important;
    border-color: transparent !important;
    color: #ffffff !important;
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
    transform: translateY(-1px);
  }

  /* Cart Badge */
  .mh-cart-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 20px;
    height: 20px;
    padding: 0 5px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    border: 2px solid #fff;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    line-height: 1;
    transition: all 0.2s ease;
  }

  /* ---------------- PROFILE DROPDOWN ---------------- */
  .mh-profile { position: relative; }

  .mh-dropdown {
    position: absolute;
    top: calc(100% + 12px);
    right: 0;
    width: 260px;
    padding: 8px;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.2);
    z-index: 1200;
    animation: mh-drop-in 0.2s ease-out;
    transform-origin: top right;
  }
  @keyframes mh-drop-in {
    from { opacity: 0; transform: translateY(-8px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .mh-drop-user {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    margin-bottom: 6px;
    border-bottom: 1px solid #f3f4f6;
  }
  .mh-avatar {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    color: #fff;
    font-size: 15px;
    font-weight: 700;
  }
  .mh-drop-user-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .mh-drop-user-info strong {
    font-size: 14px;
    font-weight: 700;
    color: #111827;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mh-drop-user-info small {
    font-size: 12px;
    color: #6b7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mh-role-pill {
    align-self: flex-start;
    margin-top: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
    color: #6366f1;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .mh-drop-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    color: #374151;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    transition: background 0.15s ease, color 0.15s ease;
  }
  .mh-drop-link:hover {
    background: #f5f3ff;
    color: #6366f1;
  }
  .mh-drop-count {
    margin-left: auto;
    min-width: 22px;
    height: 22px;
    padding: 0 7px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
    font-size: 11px;
    font-weight: 700;
  }
  .mh-drop-logout {
    width: 100%;
    margin-top: 6px;
    padding: 11px 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: none;
    border-radius: 10px;
    background: #fef2f2;
    color: #dc2626;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .mh-drop-logout:hover { background: #fee2e2; }

  /* ---------------- HAMBURGER (Mobile) ---------------- */
  .mh-burger {
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    width: 44px;
    height: 44px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: #fff;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.2s ease;
  }
  .mh-burger span {
    display: block;
    width: 18px;
    height: 2px;
    border-radius: 2px;
    background: #374151;
    transition: transform 0.25s ease, opacity 0.25s ease, width 0.2s ease;
  }
  .mh-burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .mh-burger.open span:nth-child(2) { opacity: 0; }
  .mh-burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

  /* ---------------- MOBILE DRAWER ---------------- */
  .mh-overlay {
    position: fixed;
    inset: 0;
    z-index: 1400;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(2px);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.25s ease, visibility 0.25s ease;
  }
  .mh-overlay.show { opacity: 1; visibility: visible; }

  .mh-drawer {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 1500;
    width: min(340px, 88vw);
    height: 100dvh;
    padding: 24px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    background: #fff;
    box-shadow: -20px 0 50px -20px rgba(15, 23, 42, 0.3);
    transform: translateX(100%);
    visibility: hidden;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.3s ease;
  }
  .mh-drawer.show { transform: translateX(0); visibility: visible; }

  .mh-drawer-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }
  .mh-drawer-close {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border: 1px solid #e5e7eb;
    border-radius: 50%;
    background: #fff;
    color: #4b5563;
    cursor: pointer;
  }
  .mh-drawer-nav { display: flex; flex-direction: column; gap: 8px; }
  .mh-drawer-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-radius: 12px;
    color: #374151;
    font-size: 16px;
    font-weight: 500;
    text-decoration: none;
  }
  .mh-drawer-link:hover, .mh-drawer-link.is-active {
    background: #f5f3ff;
    color: #6366f1;
  }
  .mh-drawer-count {
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
  }
  .mh-drawer-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: auto;
    padding-top: 24px;
  }
  .mh-drawer-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 14px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    border: none;
  }
  .mh-drawer-btn-primary {
    background: linear-gradient(135deg, #6366f1, #a855f7);
    color: #fff;
  }
  .mh-drawer-btn-ghost {
    background: transparent;
    border: 1px solid #e5e7eb;
    color: #374151;
  }

  /* ---------------- RESPONSIVE ---------------- */
  @media (max-width: 1024px) {
    .mh-nav { display: none; }
    .mh-burger { display: flex; }
    .mh-actions { gap: 8px; }
  }

  @media (min-width: 1025px) {
    .mh-drawer, .mh-overlay { display: none; }
  }

  /* Mobile & Tablet Adjustments */
  @media (max-width: 768px) {
    .mh-inner {
      height: 64px;
      padding: 0 16px;
      gap: 12px;
    }
    .mh-logo-mark {
      width: 32px;
      height: 32px;
      font-size: 14px;
      border-radius: 8px;
    }
    .mh-logo-text {
      font-size: 20px;
    }
    .mh-icon-btn, .mh-burger {
      width: 38px;
      height: 38px;
    }
    .mh-icon-btn {
      border-radius: 50%;
    }
    .mh-burger {
      border-radius: 10px;
    }
    .mh-actions {
      gap: 6px;
    }
    .mh-cart-badge {
      top: -2px;
      right: -2px;
      min-width: 16px;
      height: 16px;
      font-size: 9px;
      border-width: 1.5px;
    }
  }

  /* Small Mobile Adjustments */
  @media (max-width: 480px) {
    .mh-inner {
      padding: 0 12px;
      gap: 8px;
    }
    .mh-logo-text {
      font-size: 18px;
    }
    .mh-icon-btn, .mh-burger {
      width: 36px;
      height: 36px;
    }
    .mh-icon-btn svg, .mh-burger svg {
      width: 16px;
      height: 16px;
    }
    .mh-actions {
      gap: 4px;
    }
    .mh-burger span {
      width: 16px;
    }
  }

  /* Extra Small Mobile (Hide Logo Text to save space) */
  @media (max-width: 360px) {
    .mh-logo-text {
      display: none;
    }
    .mh-logo {
      gap: 0;
    }
    .mh-inner {
      gap: 6px;
    }
    .mh-actions {
      gap: 3px;
    }
    .mh-icon-btn, .mh-burger {
      width: 34px;
      height: 34px;
    }
    .mh-icon-btn svg, .mh-burger svg {
      width: 15px;
      height: 15px;
    }
  }
`;

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const profileRef = useRef(null);

  /* ---------------- DATA LOADERS ---------------- */
  const loadUser = useCallback(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (!token || !stored) return setUser(null);
    try {
      setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }
  }, []);

  const loadCartCount = useCallback(() => {
    try {
      const raw = localStorage.getItem("cart");
      if (!raw) return setCartCount(0);
      const cart = JSON.parse(raw);
      if (!Array.isArray(cart)) return setCartCount(0);
      const total = cart.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0,
      );
      setCartCount(total);
    } catch {
      setCartCount(0);
    }
  }, []);

  /* ---------------- EFFECTS ---------------- */
  useEffect(() => {
    loadUser();
    loadCartCount();

    const onAuth = () => loadUser();
    const onCart = () => loadCartCount();
    const onStorage = () => {
      loadUser();
      loadCartCount();
    };

    window.addEventListener("auth-change", onAuth);
    window.addEventListener("cart-change", onCart);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("auth-change", onAuth);
      window.removeEventListener("cart-change", onCart);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadUser, loadCartCount]);

  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onPointer = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  /* ---------------- ACTIONS ---------------- */
  const closeAll = () => {
    setMenuOpen(false);
    setMobileOpen(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("cart");
    setUser(null);
    setCartCount(0);
    closeAll();
    window.dispatchEvent(new Event("auth-change"));
    window.dispatchEvent(new Event("cart-change"));
    router.push("/");
  };

  if (pathname.startsWith("/admin")) return null;

  const initial = user?.name?.charAt(0)?.toUpperCase() || "U";
  const badge = cartCount > 99 ? "99+" : cartCount;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="mh-header">
        <div className="mh-inner">
          {/* LOGO */}
          <Link href="/" className="mh-logo" onClick={closeAll}>
            <span className="mh-logo-mark">M</span>
            <span className="mh-logo-text">MyShop</span>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="mh-nav" aria-label="Main">
            <Link
              href="/"
              className={`mh-nav-link${pathname === "/" ? " is-active" : ""}`}
            >
              Home
            </Link>
            <Link
              href="/products"
              className={`mh-nav-link${pathname.startsWith("/products") ? " is-active" : ""}`}
            >
              Products
            </Link>
            <Link
              href="/dashboard"
              className={`mh-nav-link${pathname.startsWith("/dashboard") ? " is-active" : ""}`}
            >
              dashboard
            </Link>
            <Link
              href="/orders"
              className={`mh-nav-link${pathname.startsWith("/about") ? " is-active" : ""}`}
            >
              Orders
            </Link>
          </nav>

          {/* RIGHT SIDE ICONS */}
          <div className="mh-actions">
            {/* Search Button (Gradient ONLY on hover) */}
            <Link
              href="/search"
              className="mh-icon-btn mh-search-btn"
              aria-label="Search"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </Link>

            {/* User / Profile Dropdown */}
            <div className="mh-profile" ref={profileRef}>
              <button
                type="button"
                className="mh-icon-btn"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Account"
                aria-expanded={menuOpen}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>

              {menuOpen && (
                <div className="mh-dropdown" role="menu">
                  {!user ? (
                    <div style={{ padding: "8px" }}>
                      <Link
                        href="/login"
                        className="mh-drop-link"
                        onClick={closeAll}
                        style={{
                          justifyContent: "center",
                          background: "#f9fafb",
                          marginBottom: "8px",
                        }}
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        className="mh-drop-link"
                        onClick={closeAll}
                        style={{
                          justifyContent: "center",
                          background:
                            "linear-gradient(135deg, #6366f1, #a855f7)",
                          color: "#fff",
                        }}
                      >
                        Register
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="mh-drop-user">
                        <span className="mh-avatar">{initial}</span>
                        <div className="mh-drop-user-info">
                          <strong>{user.name}</strong>
                          <small>{user.email}</small>
                          <span className="mh-role-pill">{user.role}</span>
                        </div>
                      </div>

                      <Link
                        href="/dashboard"
                        className="mh-drop-link"
                        onClick={closeAll}
                      >
                        <svg
                          width="17"
                          height="17"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="3" width="7" height="9" rx="1.5" />
                          <rect x="14" y="3" width="7" height="5" rx="1.5" />
                          <rect x="14" y="12" width="7" height="9" rx="1.5" />
                          <rect x="3" y="16" width="7" height="5" rx="1.5" />
                        </svg>
                        Dashboard
                      </Link>

                      <Link
                        href="/orders"
                        className="mh-drop-link"
                        onClick={closeAll}
                      >
                        <svg
                          width="17"
                          height="17"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M16.5 9.4 7.5 4.21" />
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                          <path d="M3.3 7 12 12l8.7-5" />
                          <path d="M12 22V12" />
                        </svg>
                        My Orders
                      </Link>

                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          className="mh-drop-link"
                          onClick={closeAll}
                        >
                          <svg
                            width="17"
                            height="17"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                          </svg>
                          Admin Panel
                        </Link>
                      )}

                      <button
                        type="button"
                        className="mh-drop-logout"
                        onClick={logout}
                      >
                        <svg
                          width="17"
                          height="17"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <path d="m16 17 5-5-5-5" />
                          <path d="M21 12H9" />
                        </svg>
                        Logout
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="mh-icon-btn"
              aria-label={`Cart, ${cartCount} items`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartCount > 0 && <span className="mh-cart-badge">{badge}</span>}
            </Link>

            {/* Hamburger (Mobile) */}
            <button
              type="button"
              className={`mh-burger${mobileOpen ? " open" : ""}`}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE OVERLAY */}
      <div
        className={`mh-overlay${mobileOpen ? " show" : ""}`}
        onClick={closeAll}
      />

      {/* MOBILE DRAWER */}
      <aside className={`mh-drawer${mobileOpen ? " show" : ""}`}>
        <div className="mh-drawer-head">
          <Link href="/" className="mh-logo" onClick={closeAll}>
            <span className="mh-logo-mark">M</span>
            <span className="mh-logo-text">MyShop</span>
          </Link>
          <button
            type="button"
            className="mh-drawer-close"
            onClick={closeAll}
            aria-label="Close menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mh-drawer-nav">
          <Link
            href="/"
            className={`mh-drawer-link${pathname === "/" ? " is-active" : ""}`}
            onClick={closeAll}
          >
            Home
          </Link>
          <Link
            href="/products"
            className={`mh-drawer-link${pathname.startsWith("/products") ? " is-active" : ""}`}
            onClick={closeAll}
          >
            Products
          </Link>
          <Link
            href="/dashboard"
            className={`mh-drawer-link${pathname.startsWith("/dashboard") ? " is-active" : ""}`}
            onClick={closeAll}
          >
            dashboard
          </Link>
          <Link
            href="/orders"
            className={`mh-drawer-link${pathname.startsWith("/about") ? " is-active" : ""}`}
            onClick={closeAll}
          >
            Orders
          </Link>

          {user && (
            <Link
              href="/orders"
              className={`mh-drawer-link${pathname.startsWith("/orders") ? " is-active" : ""}`}
              onClick={closeAll}
            >
              My Orders
            </Link>
          )}
        </nav>

        <div className="mh-drawer-actions">
          {!user ? (
            <>
              <Link
                href="/login"
                className="mh-drawer-btn mh-drawer-btn-ghost"
                onClick={closeAll}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="mh-drawer-btn mh-drawer-btn-primary"
                onClick={closeAll}
              >
                Register
              </Link>
            </>
          ) : (
            <button
              type="button"
              className="mh-drawer-btn mh-drawer-btn-ghost"
              style={{ color: "#dc2626" }}
              onClick={logout}
            >
              Logout
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

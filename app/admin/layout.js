"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const SIDEBAR_WIDTH = 264;
const SIDEBAR_COLLAPSED_WIDTH = 80;
const MOBILE_BREAKPOINT = 900;

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const isMobileRef = useRef(null);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: "⌂",
    },
    {
      name: "Products",
      path: "/admin/products",
      icon: "▣",
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: "♙",
    },
    {
      name: "Orders",
      path: "/admin/orders",
      icon: "▤",
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: "⚙",
    },
  ];

  /* ---------- RESPONSIVE DETECTION ---------- */
  useEffect(() => {
    const checkScreen = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;

      if (isMobileRef.current !== mobile) {
        isMobileRef.current = mobile;
        setIsMobile(mobile);
        setSidebarOpen(!mobile);
      }
    };

    checkScreen();

    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  /* ---------- CLOSE SIDEBAR WITH ESC (MOBILE) ---------- */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isMobile) setSidebarOpen(false);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isMobile]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    router.push("/login");
  };

  const handleNavigate = (path) => {
    router.push(path);
    if (isMobile) setSidebarOpen(false);
  };

  const showLabels = isMobile ? true : sidebarOpen;
  const sidebarWidth = isMobile
    ? SIDEBAR_WIDTH
    : sidebarOpen
      ? SIDEBAR_WIDTH
      : SIDEBAR_COLLAPSED_WIDTH;

  const currentPage =
    menuItems.find(
      (item) =>
        pathname === item.path ||
        (item.path !== "/admin" && pathname.startsWith(item.path)),
    )?.name || "Dashboard";

  return (
    <>
      <style>{globalCss}</style>

      <div style={styles.app}>
        {/* MOBILE BACKDROP */}
        {isMobile && sidebarOpen && (
          <div
            className="admin-backdrop"
            style={styles.backdrop}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <aside
          className="admin-sidebar"
          style={{
            ...styles.sidebar,
            width: sidebarWidth,
            transform:
              isMobile && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
          }}
        >
          {/* LOGO */}
          <div
            style={{
              ...styles.logoArea,
              justifyContent: showLabels ? "flex-start" : "center",
              padding: showLabels ? "0 18px" : "0 10px",
            }}
          >
            <div style={styles.logo}>A</div>

            {showLabels && (
              <div style={styles.logoTextWrap}>
                <h2 style={styles.logoTitle}>AdminPanel</h2>
                <p style={styles.logoSubtitle}>Management System</p>
              </div>
            )}
          </div>

          {/* MENU */}
          <nav className="admin-nav" style={styles.nav}>
            <p
              style={{
                ...styles.sectionTitle,
                display: showLabels ? "block" : "none",
              }}
            >
              MENU
            </p>

            {menuItems.map((item) => {
              const active =
                pathname === item.path ||
                (item.path !== "/admin" && pathname.startsWith(item.path));

              return (
                <button
                  key={item.path}
                  type="button"
                  title={!showLabels ? item.name : undefined}
                  aria-current={active ? "page" : undefined}
                  onClick={() => handleNavigate(item.path)}
                  className={`admin-menu-item${active ? " is-active" : ""}`}
                  style={{
                    ...styles.menuItem,
                    ...(active ? styles.activeMenuItem : {}),
                    justifyContent: showLabels ? "flex-start" : "center",
                    padding: showLabels ? "12px 14px" : "12px 0",
                  }}
                >
                  <span style={styles.icon}>{item.icon}</span>

                  {showLabels && (
                    <span style={styles.menuLabel}>{item.name}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* BOTTOM */}
          <div style={styles.sidebarBottom}>
            <button
              type="button"
              onClick={handleLogout}
              title={!showLabels ? "Logout" : undefined}
              className="admin-logout"
              style={{
                ...styles.logoutButton,
                justifyContent: showLabels ? "flex-start" : "center",
                padding: showLabels ? "12px 14px" : "12px 0",
              }}
            >
              <span style={styles.icon}>↪</span>

              {showLabels && <span style={styles.menuLabel}>Logout</span>}
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main
          style={{
            ...styles.main,
            marginLeft: isMobile ? 0 : sidebarWidth,
          }}
        >
          {/* TOP BAR */}
          <header className="admin-header" style={styles.header}>
            <div style={styles.headerLeft}>
              <button
                type="button"
                aria-label="Toggle sidebar"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="admin-toggle"
                style={styles.toggleButton}
              >
                ☰
              </button>

              <div style={styles.titleWrap}>
                <h1 className="admin-page-title" style={styles.pageTitle}>
                  {currentPage}
                </h1>
                <span
                  className="admin-page-subtitle"
                  style={styles.pageSubtitle}
                >
                  Welcome back, here's what's happening today.
                </span>
              </div>
            </div>

            <div style={styles.headerRight}>
              <button
                type="button"
                aria-label="Notifications"
                className="admin-icon-btn"
                style={styles.iconButton}
              >
                <span style={styles.bellIcon}>🔔</span>
                <span style={styles.badge} />
              </button>

              <div className="admin-profile" style={styles.profile}>
                <div style={styles.avatar}>A</div>

                <div className="admin-profile-text" style={styles.profileText}>
                  <strong style={styles.profileName}>Admin</strong>
                  <span style={styles.profileRole}>Administrator</span>
                </div>
              </div>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <section className="admin-content" style={styles.content}>
            {children}
          </section>
        </main>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  GLOBAL CSS (hover states, scrollbar, responsive overrides)         */
/* ------------------------------------------------------------------ */
const globalCss = `
  * { box-sizing: border-box; }

  @keyframes adminFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes adminSidebarIn {
    from { opacity: 0; transform: translateX(-12px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  /* ---------- SIDEBAR LINKS ---------- */
  .admin-menu-item {
    transition: background .18s ease, color .18s ease, transform .15s ease;
  }
  .admin-menu-item:not(.is-active):hover {
    background: rgba(255, 255, 255, 0.08) !important;
    color: #ffffff !important;
  }
  .admin-menu-item:not(.is-active):active { transform: scale(.97); }
  .admin-menu-item.is-active:hover { filter: brightness(1.07); }

  /* ---------- LOGOUT ---------- */
  .admin-logout {
    transition: background .18s ease, color .18s ease, transform .15s ease;
  }
  .admin-logout:hover {
    background: rgba(248, 113, 113, 0.14) !important;
    color: #fecaca !important;
  }
  .admin-logout:active { transform: scale(.97); }

  /* ---------- HEADER CONTROLS ---------- */
  .admin-toggle { transition: background .18s ease, transform .15s ease; }
  .admin-toggle:hover { background: #f3f4f6 !important; }
  .admin-toggle:active { transform: scale(.95); }

  .admin-icon-btn { transition: background .18s ease, border-color .18s ease, transform .15s ease; }
  .admin-icon-btn:hover { background: #f9fafb !important; border-color: #d1d5db !important; }
  .admin-icon-btn:active { transform: scale(.95); }

  .admin-profile { transition: background .18s ease, border-color .18s ease; }
  .admin-profile:hover { background: #f9fafb !important; border-color: #d1d5db !important; }

  /* ---------- SIDEBAR SCROLLBAR ---------- */
  .admin-nav::-webkit-scrollbar { width: 6px; }
  .admin-nav::-webkit-scrollbar-track { background: transparent; }
  .admin-nav::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.14);
    border-radius: 99px;
  }
  .admin-nav::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.24); }

  /* ---------- RESPONSIVE ---------- */
  @media (max-width: 900px) {
    .admin-header {
      height: 68px !important;
      padding: 0 16px !important;
    }
    .admin-content { padding: 18px !important; }
    .admin-page-subtitle { display: none !important; }
  }

  @media (max-width: 640px) {
    .admin-content { padding: 14px !important; }
    .admin-page-title { font-size: 16px !important; }
    .admin-profile-text { display: none !important; }
    .admin-profile { padding: 5px !important; border-radius: 50% !important; }
    .admin-bell-hide { display: none !important; }
  }

  @media (max-width: 400px) {
    .admin-icon-btn { display: none !important; }
  }
`;

/* ------------------------------------------------------------------ */
/*  STYLES                                                             */
/* ------------------------------------------------------------------ */
const styles = {
  app: {
    minHeight: "100vh",
    background: "#f5f7fb",
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    WebkitFontSmoothing: "antialiased",
  },

  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    backdropFilter: "blur(3px)",
    WebkitBackdropFilter: "blur(3px)",
    zIndex: 90,
    animation: "adminFadeIn 0.2s ease both",
  },

  /* ---------------- SIDEBAR ---------------- */
  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    background:
      "linear-gradient(180deg, #0f172a 0%, #111827 55%, #0b1220 100%)",
    color: "#ffffff",
    transition: "width 0.25s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    zIndex: 100,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "6px 0 30px rgba(15, 23, 42, 0.12)",
  },

  logoArea: {
    height: "76px",
    minHeight: "76px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  logo: {
    width: "42px",
    height: "42px",
    minWidth: "42px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "20px",
    color: "#ffffff",
    boxShadow: "0 8px 20px -8px rgba(37, 99, 235, 0.9)",
  },

  logoTextWrap: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    animation: "adminSidebarIn 0.3s ease both",
  },

  logoTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: 700,
    letterSpacing: "-0.2px",
    color: "#ffffff",
  },

  logoSubtitle: {
    margin: "3px 0 0",
    fontSize: "11px",
    color: "#94a3b8",
    whiteSpace: "nowrap",
  },

  nav: {
    padding: "20px 14px",
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
  },

  sectionTitle: {
    margin: "0 12px 12px",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1.2px",
  },

  menuItem: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "6px",
    borderRadius: "11px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    textAlign: "left",
    whiteSpace: "nowrap",
    outline: "none",
  },

  activeMenuItem: {
    background: "linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)",
    color: "#ffffff",
    fontWeight: 600,
    boxShadow: "0 10px 22px -12px rgba(37, 99, 235, 1)",
  },

  icon: {
    width: "22px",
    minWidth: "22px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
    flexShrink: 0,
  },

  menuLabel: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  sidebarBottom: {
    padding: "14px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },

  logoutButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#fca5a5",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    borderRadius: "11px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    whiteSpace: "nowrap",
    outline: "none",
  },

  /* ---------------- MAIN ---------------- */
  main: {
    minHeight: "100vh",
    transition: "margin-left 0.25s ease",
    display: "flex",
    flexDirection: "column",
  },

  header: {
    height: "76px",
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "0 26px",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minWidth: 0,
  },

  titleWrap: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  pageTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: "-0.3px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  pageSubtitle: {
    fontSize: "12px",
    color: "#6b7280",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  toggleButton: {
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#0f172a",
    width: "42px",
    height: "42px",
    minWidth: "42px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    outline: "none",
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexShrink: 0,
  },

  iconButton: {
    position: "relative",
    width: "42px",
    height: "42px",
    minWidth: "42px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#374151",
    outline: "none",
  },

  bellIcon: {
    fontSize: "16px",
    lineHeight: 1,
  },

  badge: {
    position: "absolute",
    top: "9px",
    right: "10px",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#ef4444",
    boxShadow: "0 0 0 2px #ffffff",
  },

  profile: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "5px 14px 5px 5px",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    cursor: "default",
  },

  avatar: {
    width: "38px",
    height: "38px",
    minWidth: "38px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "15px",
    boxShadow: "0 6px 14px -6px rgba(37, 99, 235, 0.9)",
  },

  profileText: {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.2,
    whiteSpace: "nowrap",
  },

  profileName: {
    fontSize: "13px",
    color: "#0f172a",
    fontWeight: 700,
  },

  profileRole: {
    fontSize: "11px",
    color: "#6b7280",
    marginTop: "2px",
  },

  content: {
    padding: "28px",
    flex: 1,
    width: "100%",
  },
};

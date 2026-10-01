"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

export default function AdminDashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken || !storedUser) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      if (parsedUser.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      setUser(parsedUser);
      loadDashboard(storedToken);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }
  }, []);

  const loadDashboard = async (token) => {
    try {
      setLoading(true);
      setError("");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [productsResponse, usersResponse, ordersResponse] =
        await Promise.all([
          api.get("/products"),
          api.get("/users", config),
          api.get("/orders", config),
        ]);

      setProducts(productsResponse.data.products || []);
      setUsers(usersResponse.data.data || []);
      setOrders(ordersResponse.data.orders || []);
    } catch (error) {
      console.error(
        "Admin dashboard error:",
        error.response?.data || error.message,
      );

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.dispatchEvent(new Event("auth-change"));

        router.push("/login");
        return;
      }

      if (error.response?.status === 403) {
        router.push("/dashboard");
        return;
      }

      setError(error.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- PRODUCT STATS ---------------- */

  const activeProducts = products.filter(
    (product) => product.status === "active",
  ).length;

  const inactiveProducts = products.filter(
    (product) => product.status === "inactive",
  ).length;

  const outOfStockProducts = products.filter(
    (product) => Number(product.stock || 0) <= 0,
  ).length;

  /* ---------------- ORDER STATS ---------------- */

  const pendingOrders = orders.filter(
    (order) => order.status === "Pending",
  ).length;

  const confirmedOrders = orders.filter(
    (order) => order.status === "Confirmed",
  ).length;

  const shippedOrders = orders.filter(
    (order) => order.status === "Shipped",
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered",
  ).length;

  const cancelledOrders = orders.filter(
    (order) => order.status === "Cancelled",
  ).length;

  const totalSales = orders
    .filter((order) => order.status !== "Cancelled")
    .reduce((total, order) => total + Number(order.totalAmount || 0), 0);

  if (loading) {
    return (
      <main className="admin-loading">
        <DashboardStyles />

        <div className="admin-spinner"></div>

        <h3 className="admin-loading-title">Loading admin dashboard...</h3>

        <p className="admin-loading-text">Please wait.</p>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <DashboardStyles />

      <div className="admin-container">
        {/* HEADER */}
        <div className="admin-header">
          <div className="admin-header-text">
            <p className="admin-eyebrow">ADMIN PANEL</p>

            <h1 className="admin-title">Dashboard</h1>

            <p className="admin-subtitle">
              Welcome back, {user?.name}. Here&apos;s what&apos;s happening with
              your store.
            </p>
          </div>

          <button
            className="admin-refresh"
            onClick={() => {
              const token = localStorage.getItem("token");

              if (token) {
                loadDashboard(token);
              }
            }}
          >
            <span className="admin-refresh-icon">↻</span>
            Refresh
          </button>
        </div>

        {/* ERROR */}
        {error && <div className="admin-error">{error}</div>}

        {/* MAIN STATS */}
        <div className="admin-stats">
          {/* PRODUCTS */}
          <Link href="/admin/products" className="admin-card-link">
            <div className="admin-stat">
              <div className="admin-stat-icon icon-violet">📦</div>

              <div className="admin-stat-body">
                <p className="admin-stat-label">Products</p>

                <h2 className="admin-stat-value">{products.length}</h2>

                <p className="admin-stat-hint">{activeProducts} active</p>
              </div>
            </div>
          </Link>

          {/* USERS */}
          <Link href="/admin/users" className="admin-card-link">
            <div className="admin-stat">
              <div className="admin-stat-icon icon-blue">👥</div>

              <div className="admin-stat-body">
                <p className="admin-stat-label">Users</p>

                <h2 className="admin-stat-value">{users.length}</h2>

                <p className="admin-stat-hint">Registered users</p>
              </div>
            </div>
          </Link>

          {/* ORDERS */}
          <Link href="/admin/orders" className="admin-card-link">
            <div className="admin-stat">
              <div className="admin-stat-icon icon-green">🛒</div>

              <div className="admin-stat-body">
                <p className="admin-stat-label">Orders</p>

                <h2 className="admin-stat-value">{orders.length}</h2>

                <p className="admin-stat-hint">{pendingOrders} pending</p>
              </div>
            </div>
          </Link>

          {/* SALES */}
          <div className="admin-stat">
            <div className="admin-stat-icon icon-amber">
              <span className="admin-currency">₹</span>
            </div>

            <div className="admin-stat-body">
              <p className="admin-stat-label">Sales</p>

              <h2 className="admin-stat-value">₹{totalSales.toFixed(2)}</h2>

              <p className="admin-stat-hint">Excluding cancelled orders</p>
            </div>
          </div>
        </div>

        {/* PRODUCT OVERVIEW */}
        <section className="admin-section">
          <div className="admin-section-head">
            <div>
              <h2 className="admin-section-title">Product Overview</h2>

              <p className="admin-section-sub">
                Current product inventory status.
              </p>
            </div>

            <Link href="/admin/products" className="admin-link">
              Manage Products →
            </Link>
          </div>

          <div className="admin-overview">
            <div className="admin-overview-card">
              <span
                className="admin-dot"
                style={{ background: "#22c55e" }}
              ></span>

              <div className="admin-overview-body">
                <p className="admin-overview-label">Active Products</p>

                <h3 className="admin-overview-value">{activeProducts}</h3>
              </div>
            </div>

            <div className="admin-overview-card">
              <span
                className="admin-dot"
                style={{ background: "#94a3b8" }}
              ></span>

              <div className="admin-overview-body">
                <p className="admin-overview-label">Inactive Products</p>

                <h3 className="admin-overview-value">{inactiveProducts}</h3>
              </div>
            </div>

            <div className="admin-overview-card">
              <span
                className="admin-dot"
                style={{ background: "#ef4444" }}
              ></span>

              <div className="admin-overview-body">
                <p className="admin-overview-label">Out of Stock</p>

                <h3 className="admin-overview-value">{outOfStockProducts}</h3>
              </div>
            </div>
          </div>
        </section>

        {/* ORDER OVERVIEW */}
        <section className="admin-section">
          <div className="admin-section-head">
            <div>
              <h2 className="admin-section-title">Order Overview</h2>

              <p className="admin-section-sub">Current order status summary.</p>
            </div>

            <Link href="/admin/orders" className="admin-link">
              Manage Orders →
            </Link>
          </div>

          <div className="admin-overview admin-overview-orders">
            <div className="admin-overview-card">
              <span
                className="admin-dot"
                style={{ background: "#f59e0b" }}
              ></span>

              <div className="admin-overview-body">
                <p className="admin-overview-label">Pending</p>

                <h3 className="admin-overview-value">{pendingOrders}</h3>
              </div>
            </div>

            <div className="admin-overview-card">
              <span
                className="admin-dot"
                style={{ background: "#8b5cf6" }}
              ></span>

              <div className="admin-overview-body">
                <p className="admin-overview-label">Confirmed</p>

                <h3 className="admin-overview-value">{confirmedOrders}</h3>
              </div>
            </div>

            <div className="admin-overview-card">
              <span
                className="admin-dot"
                style={{ background: "#3b82f6" }}
              ></span>

              <div className="admin-overview-body">
                <p className="admin-overview-label">Shipped</p>

                <h3 className="admin-overview-value">{shippedOrders}</h3>
              </div>
            </div>

            <div className="admin-overview-card">
              <span
                className="admin-dot"
                style={{ background: "#22c55e" }}
              ></span>

              <div className="admin-overview-body">
                <p className="admin-overview-label">Delivered</p>

                <h3 className="admin-overview-value">{deliveredOrders}</h3>
              </div>
            </div>

            <div className="admin-overview-card">
              <span
                className="admin-dot"
                style={{ background: "#ef4444" }}
              ></span>

              <div className="admin-overview-body">
                <p className="admin-overview-label">Cancelled</p>

                <h3 className="admin-overview-value">{cancelledOrders}</h3>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="admin-section">
          <div className="admin-section-head">
            <div>
              <h2 className="admin-section-title">Quick Actions</h2>

              <p className="admin-section-sub">Manage your store quickly.</p>
            </div>
          </div>

          <div className="admin-actions">
            <Link href="/admin/products" className="admin-action">
              <span className="admin-action-icon">📦</span>

              <div className="admin-action-body">
                <h3 className="admin-action-title">Manage Products</h3>

                <p className="admin-action-text">
                  Add, edit and remove products.
                </p>
              </div>

              <span className="admin-action-arrow">→</span>
            </Link>

            <Link href="/admin/users" className="admin-action">
              <span className="admin-action-icon">👥</span>

              <div className="admin-action-body">
                <h3 className="admin-action-title">Manage Users</h3>

                <p className="admin-action-text">View registered users.</p>
              </div>

              <span className="admin-action-arrow">→</span>
            </Link>

            <Link href="/admin/orders" className="admin-action">
              <span className="admin-action-icon">🛒</span>

              <div className="admin-action-body">
                <h3 className="admin-action-title">Manage Orders</h3>

                <p className="admin-action-text">
                  View orders and update status.
                </p>
              </div>

              <span className="admin-action-arrow">→</span>
            </Link>
          </div>
        </section>

        {/* RECENT ORDERS */}
        <section className="admin-section">
          <div className="admin-section-head">
            <div>
              <h2 className="admin-section-title">Recent Orders</h2>

              <p className="admin-section-sub">
                Latest orders from your customers.
              </p>
            </div>

            <Link href="/admin/orders" className="admin-link">
              View All →
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="admin-empty">No orders found.</div>
          ) : (
            <div className="admin-orders">
              {/* TABLE HEADER */}
              <div className="admin-order-row head">
                <div>PRODUCT</div>
                <div>CUSTOMER</div>
                <div>QTY</div>
                <div>AMOUNT</div>
                <div>STATUS</div>
                <div>DATE</div>
              </div>

              {/* ORDERS */}
              {orders.slice(0, 5).map((order) => (
                <div className="admin-order-row" key={order._id}>
                  {/* PRODUCT */}
                  <div className="admin-order-product">
                    {order.product?.image ? (
                      <img
                        src={order.product.image}
                        alt={order.product?.name || "Product"}
                        className="admin-order-thumb"
                      />
                    ) : (
                      <div className="admin-order-thumb-fallback">📦</div>
                    )}

                    <div className="admin-order-product-body">
                      <strong className="admin-order-name">
                        {order.product?.name || "Unknown Product"}
                      </strong>

                      <p className="admin-order-cat">
                        {order.product?.category || "No category"}
                      </p>
                    </div>
                  </div>

                  {/* CUSTOMER */}
                  <div className="admin-order-customer">
                    <strong className="admin-order-customer-name">
                      {order.user?.name || "Unknown User"}
                    </strong>

                    <p className="admin-order-customer-email">
                      {order.user?.email || ""}
                    </p>
                  </div>

                  {/* QUANTITY */}
                  <div
                    className="admin-order-cell admin-order-qty"
                    data-label="Qty"
                  >
                    {order.product?.quantity || 1}
                  </div>

                  {/* AMOUNT */}
                  <div
                    className="admin-order-cell admin-order-amount"
                    data-label="Amount"
                  >
                    ₹{Number(order.totalAmount || 0).toFixed(2)}
                  </div>

                  {/* STATUS */}
                  <div className="admin-order-cell" data-label="Status">
                    <span
                      className="admin-pill"
                      style={getStatusStyle(order.status)}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* DATE */}
                  <div
                    className="admin-order-cell admin-order-date"
                    data-label="Date"
                  >
                    {formatDate(order.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* ---------------- STATUS ---------------- */

function getStatusStyle(status) {
  switch (status) {
    case "Delivered":
      return {
        background: "#dcfce7",
        color: "#15803d",
      };

    case "Shipped":
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
      };

    case "Confirmed":
      return {
        background: "#ede9fe",
        color: "#6d28d9",
      };

    case "Cancelled":
      return {
        background: "#fee2e2",
        color: "#b91c1c",
      };

    default:
      return {
        background: "#fef3c7",
        color: "#b45309",
      };
  }
}

/* ---------------- DATE ---------------- */

function formatDate(date) {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/* ---------------- STYLES ---------------- */

function DashboardStyles() {
  return (
    <style jsx global>{`
      /* ============ PAGE ============ */
      .admin-page {
        min-height: calc(100vh - 72px);
        background:
          radial-gradient(1200px 520px at 8% -12%, #e0e7ff 0%, transparent 60%),
          radial-gradient(900px 420px at 100% -5%, #ede9fe 0%, transparent 55%),
          linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
        padding: 38px 20px 72px;
      }

      .admin-container {
        max-width: 1200px;
        margin: 0 auto;
      }

      /* ============ HEADER ============ */
      .admin-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 20px;
        margin-bottom: 28px;
      }

      .admin-header-text {
        min-width: 0;
      }

      .admin-eyebrow {
        margin: 0 0 7px;
        color: #4f46e5;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1.7px;
      }

      .admin-title {
        margin: 0;
        font-size: clamp(27px, 4vw, 38px);
        line-height: 1.08;
        color: #0f172a;
        font-weight: 800;
        letter-spacing: -0.7px;
      }

      .admin-subtitle {
        margin: 9px 0 0;
        color: #64748b;
        font-size: 14px;
        line-height: 1.55;
        max-width: 560px;
      }

      .admin-refresh {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid #e2e8f0;
        background: #ffffff;
        color: #334155;
        padding: 11px 18px;
        border-radius: 11px;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        transition:
          transform 0.18s ease,
          box-shadow 0.18s ease,
          border-color 0.18s ease,
          background 0.18s ease,
          color 0.18s ease;
      }

      .admin-refresh:hover {
        border-color: #c7d2fe;
        background: #f5f3ff;
        color: #4f46e5;
        transform: translateY(-1px);
        box-shadow: 0 8px 20px rgba(79, 70, 229, 0.14);
      }

      .admin-refresh:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(79, 70, 229, 0.12);
      }

      .admin-refresh-icon {
        font-size: 15px;
        line-height: 1;
        display: inline-block;
      }

      /* ============ ERROR ============ */
      .admin-error {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #b91c1c;
        padding: 14px 18px;
        border-radius: 12px;
        margin-bottom: 20px;
        font-size: 14px;
        font-weight: 600;
        line-height: 1.45;
      }

      /* ============ STATS ============ */
      .admin-stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 18px;
        margin-bottom: 34px;
      }

      .admin-card-link {
        display: flex;
        text-decoration: none;
        color: inherit;
        min-width: 0;
        border-radius: 18px;
      }

      .admin-stat {
        position: relative;
        flex: 1;
        min-width: 0;
        background: #ffffff;
        border: 1px solid #e8ecf3;
        border-radius: 18px;
        padding: 22px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease,
          border-color 0.2s ease;
      }

      .admin-card-link:hover .admin-stat {
        transform: translateY(-4px);
        border-color: #c7d2fe;
        box-shadow: 0 18px 38px rgba(79, 70, 229, 0.15);
      }

      .admin-stat-icon {
        width: 54px;
        height: 54px;
        border-radius: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        flex-shrink: 0;
        line-height: 1;
      }

      .icon-violet {
        background: linear-gradient(135deg, #ede9fe, #ddd6fe);
      }

      .icon-blue {
        background: linear-gradient(135deg, #dbeafe, #bfdbfe);
      }

      .icon-green {
        background: linear-gradient(135deg, #dcfce7, #bbf7d0);
      }

      .icon-amber {
        background: linear-gradient(135deg, #fef3c7, #fde68a);
      }

      .admin-currency {
        font-size: 22px;
        font-weight: 800;
        color: #b45309;
      }

      .admin-stat-body {
        min-width: 0;
      }

      .admin-stat-label {
        margin: 0;
        color: #64748b;
        font-size: 11.5px;
        font-weight: 800;
        letter-spacing: 0.6px;
        text-transform: uppercase;
      }

      .admin-stat-value {
        margin: 6px 0 0;
        color: #0f172a;
        font-size: clamp(20px, 2.2vw, 27px);
        font-weight: 800;
        line-height: 1.12;
        letter-spacing: -0.6px;
        word-break: break-word;
      }

      .admin-stat-hint {
        margin: 5px 0 0;
        color: #94a3b8;
        font-size: 11px;
        font-weight: 600;
      }

      /* ============ SECTIONS ============ */
      .admin-section {
        margin-top: 34px;
      }

      .admin-section-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 14px;
        margin-bottom: 15px;
      }

      .admin-section-title {
        margin: 0;
        font-size: 19px;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.3px;
      }

      .admin-section-sub {
        margin: 5px 0 0;
        color: #64748b;
        font-size: 13px;
        line-height: 1.45;
      }

      .admin-link {
        color: #4f46e5;
        text-decoration: none;
        font-size: 13px;
        font-weight: 700;
        white-space: nowrap;
        flex-shrink: 0;
        transition: opacity 0.15s ease;
      }

      .admin-link:hover {
        opacity: 0.72;
      }

      /* ============ OVERVIEW ============ */
      .admin-overview {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }

      .admin-overview-orders {
        grid-template-columns: repeat(5, minmax(0, 1fr));
      }

      .admin-overview-card {
        background: #ffffff;
        border: 1px solid #e8ecf3;
        border-radius: 15px;
        padding: 18px;
        display: flex;
        align-items: center;
        gap: 13px;
        min-width: 0;
        transition:
          transform 0.18s ease,
          box-shadow 0.18s ease,
          border-color 0.18s ease;
      }

      .admin-overview-card:hover {
        transform: translateY(-2px);
        border-color: #e0e7ff;
        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.07);
      }

      .admin-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .admin-overview-body {
        min-width: 0;
      }

      .admin-overview-label {
        margin: 0;
        color: #64748b;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.4px;
        text-transform: uppercase;
      }

      .admin-overview-value {
        margin: 6px 0 0;
        color: #0f172a;
        font-size: 22px;
        font-weight: 800;
        line-height: 1;
        letter-spacing: -0.4px;
      }

      /* ============ ACTIONS ============ */
      .admin-actions {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }

      .admin-action {
        display: flex;
        align-items: center;
        gap: 14px;
        background: #ffffff;
        border: 1px solid #e8ecf3;
        border-radius: 16px;
        padding: 18px;
        text-decoration: none;
        color: inherit;
        min-width: 0;
        box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
        transition:
          transform 0.18s ease,
          box-shadow 0.18s ease,
          border-color 0.18s ease;
      }

      .admin-action:hover {
        transform: translateY(-3px);
        border-color: #c7d2fe;
        box-shadow: 0 16px 34px rgba(79, 70, 229, 0.13);
      }

      .admin-action-icon {
        font-size: 26px;
        line-height: 1;
        flex-shrink: 0;
      }

      .admin-action-body {
        min-width: 0;
      }

      .admin-action-title {
        margin: 0;
        font-size: 15px;
        font-weight: 700;
        color: #0f172a;
      }

      .admin-action-text {
        margin: 4px 0 0;
        color: #64748b;
        font-size: 12px;
        line-height: 1.45;
      }

      .admin-action-arrow {
        margin-left: auto;
        color: #4f46e5;
        font-size: 18px;
        font-weight: 800;
        flex-shrink: 0;
        transition: transform 0.18s ease;
      }

      .admin-action:hover .admin-action-arrow {
        transform: translateX(3px);
      }

      /* ============ ORDERS TABLE ============ */
      .admin-orders {
        background: #ffffff;
        border: 1px solid #e8ecf3;
        border-radius: 18px;
        overflow: hidden;
        box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
      }

      .admin-order-row {
        display: grid;
        grid-template-columns: 2fr 1.4fr 0.5fr 0.9fr 1fr 1.2fr;
        align-items: center;
        gap: 14px;
        padding: 15px 20px;
        border-bottom: 1px solid #f1f5f9;
        min-width: 0;
      }

      .admin-order-row:last-child {
        border-bottom: none;
      }

      .admin-order-row.head {
        background: #f8fafc;
        color: #64748b;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.7px;
      }

      .admin-order-product {
        display: flex;
        align-items: center;
        gap: 11px;
        min-width: 0;
      }

      .admin-order-thumb {
        width: 42px;
        height: 42px;
        border-radius: 11px;
        object-fit: cover;
        border: 1px solid #e8ecf3;
        background: #f8fafc;
        flex-shrink: 0;
      }

      .admin-order-thumb-fallback {
        width: 42px;
        height: 42px;
        border-radius: 11px;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
      }

      .admin-order-product-body {
        min-width: 0;
      }

      .admin-order-name {
        display: block;
        color: #0f172a;
        font-size: 13px;
        font-weight: 700;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .admin-order-cat {
        margin: 3px 0 0;
        color: #94a3b8;
        font-size: 11px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .admin-order-customer {
        min-width: 0;
      }

      .admin-order-customer-name {
        display: block;
        color: #0f172a;
        font-size: 12.5px;
        font-weight: 700;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .admin-order-customer-email {
        margin: 3px 0 0;
        color: #94a3b8;
        font-size: 10.5px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .admin-order-cell {
        min-width: 0;
      }

      .admin-order-qty {
        color: #334155;
        font-weight: 700;
        font-size: 13px;
      }

      .admin-order-amount {
        color: #0f172a;
        font-weight: 800;
        font-size: 13px;
        white-space: nowrap;
      }

      .admin-order-date {
        color: #64748b;
        font-size: 11.5px;
        white-space: nowrap;
      }

      .admin-pill {
        display: inline-block;
        padding: 5px 11px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.3px;
        white-space: nowrap;
      }

      /* ============ EMPTY ============ */
      .admin-empty {
        background: #ffffff;
        border: 1px dashed #dbe2ea;
        padding: 46px 20px;
        border-radius: 16px;
        text-align: center;
        color: #64748b;
        font-size: 14px;
      }

      /* ============ LOADING ============ */
      .admin-loading {
        min-height: calc(100vh - 72px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 24px;
        background: linear-gradient(180deg, #f8fafc, #eef2ff);
      }

      .admin-spinner {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 4px solid #e2e8f0;
        border-top-color: #4f46e5;
        animation: admin-spin 0.8s linear infinite;
        margin-bottom: 18px;
      }

      @keyframes admin-spin {
        to {
          transform: rotate(360deg);
        }
      }

      .admin-loading-title {
        margin: 0;
        color: #0f172a;
        font-size: 18px;
        font-weight: 700;
      }

      .admin-loading-text {
        margin: 6px 0 0;
        color: #64748b;
        font-size: 14px;
      }

      /* ============ RESPONSIVE ============ */
      @media (max-width: 1100px) {
        .admin-stats {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .admin-overview-orders {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }

      @media (max-width: 980px) {
        .admin-actions {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 900px) {
        .admin-page {
          padding: 28px 16px 60px;
        }

        .admin-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
        }

        .admin-refresh {
          align-self: stretch;
          justify-content: center;
        }

        /* Orders table -> cards */
        .admin-orders {
          background: transparent;
          border: none;
          border-radius: 0;
          box-shadow: none;
          overflow: visible;
        }

        .admin-order-row.head {
          display: none;
        }

        .admin-order-row {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px 12px;
          background: #ffffff;
          border: 1px solid #e8ecf3;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
        }

        .admin-order-row:last-child {
          margin-bottom: 0;
        }

        .admin-order-product,
        .admin-order-customer {
          grid-column: 1 / -1;
        }

        .admin-order-cell::before {
          content: attr(data-label);
          display: block;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 5px;
        }
      }

      @media (max-width: 700px) {
        .admin-overview,
        .admin-overview-orders {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .admin-section-head {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
      }

      @media (max-width: 560px) {
        .admin-stats {
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .admin-stat {
          padding: 18px;
          gap: 14px;
          border-radius: 16px;
        }

        .admin-stat-icon {
          width: 48px;
          height: 48px;
          font-size: 21px;
          border-radius: 13px;
        }

        .admin-overview-card {
          padding: 15px;
          gap: 11px;
        }

        .admin-overview-value {
          font-size: 19px;
        }

        .admin-action {
          padding: 16px;
          gap: 12px;
        }

        .admin-order-row {
          padding: 15px;
        }
      }

      @media (max-width: 420px) {
        .admin-page {
          padding: 22px 12px 50px;
        }

        .admin-overview,
        .admin-overview-orders {
          grid-template-columns: 1fr;
        }

        .admin-order-row {
          grid-template-columns: 1fr;
          gap: 12px;
        }
      }
    `}</style>
  );
}

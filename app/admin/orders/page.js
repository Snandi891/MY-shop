"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";

const statuses = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

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

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  /* FILTERS */

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  /* ---------------- AUTH + LOAD ---------------- */

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(storedUser);

      if (user.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      fetchOrders(token);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }
  }, [router]);

  /* ---------------- FETCH ALL ORDERS ---------------- */

  const fetchOrders = async (token = localStorage.getItem("token")) => {
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Orders error:", error.response?.data || error.message);

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

      setError(error.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- CATEGORIES ---------------- */

  const categories = useMemo(() => {
    const categorySet = new Set();

    orders.forEach((order) => {
      const currentCategory = order.product?.category;

      if (currentCategory) {
        categorySet.add(currentCategory);
      }
    });

    return Array.from(categorySet).sort((a, b) => a.localeCompare(b));
  }, [orders]);

  /* ---------------- FILTER + SEARCH + SORT ---------------- */

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    /* SEARCH */

    const searchText = search.trim().toLowerCase();

    if (searchText) {
      result = result.filter((order) => {
        const customerName = order.user?.name?.toLowerCase() || "";

        const customerEmail = order.user?.email?.toLowerCase() || "";

        const productName = order.product?.name?.toLowerCase() || "";

        return (
          customerName.includes(searchText) ||
          customerEmail.includes(searchText) ||
          productName.includes(searchText)
        );
      });
    }

    /* CATEGORY */

    if (category) {
      result = result.filter((order) => order.product?.category === category);
    }

    /* STATUS */

    if (status) {
      result = result.filter((order) => order.status === status);
    }

    /* SORT BY DATE */

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      if (sortOrder === "asc") {
        return dateA - dateB;
      }

      return dateB - dateA;
    });

    return result;
  }, [orders, search, category, status, sortOrder]);

  /* ---------------- STATUS COUNTS ---------------- */

  const getCount = (currentStatus) => {
    return orders.filter((order) => order.status === currentStatus).length;
  };

  /* ---------------- CLEAR FILTERS ---------------- */

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setStatus("");
    setSortOrder("desc");
  };

  /* ---------------- REFRESH ---------------- */

  const handleRefresh = async () => {
    await fetchOrders();
    showToast("Orders refreshed");
  };

  /* ---------------- UPDATE STATUS ---------------- */

  const updateStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setUpdatingId(orderId);

      await api.put(
        `/orders/${orderId}/status`,
        {
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      /*
       * Update the order locally.
       * No need to call the API again.
       */
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                status: newStatus,
              }
            : order,
        ),
      );

      showToast("Order status updated");
    } catch (error) {
      console.error(error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        router.push("/login");
        return;
      }

      showToast(
        error.response?.data?.message || "Failed to update order status",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  /* ---------------- TOAST ---------------- */

  const showToast = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 2500);
  };

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <div className="aop-loading">
        <div className="aop-spinner"></div>

        <div className="aop-loading-text">Loading orders...</div>

        <style jsx global>{`
          @keyframes aopSpin {
            to {
              transform: rotate(360deg);
            }
          }

          .aop-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            background:
              radial-gradient(circle at 0% 0%, #eef2ff 0%, transparent 45%),
              radial-gradient(circle at 100% 0%, #f5f3ff 0%, transparent 40%),
              #f7f8fc;
          }

          .aop-spinner {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 3px solid #e2e8f0;
            border-top-color: #4f46e5;
            animation: aopSpin 0.8s linear infinite;
          }

          .aop-loading-text {
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.3px;
            color: #4f46e5;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-orders-page">
      <div className="aop-container">
        {/* TOAST */}

        {toast && (
          <div className="aop-toast">
            <span className="aop-toast-icon">✓</span>
            {toast}
          </div>
        )}

        {/* HEADER */}

        <header className="aop-header">
          <div className="aop-header-text">
            <p className="aop-eyebrow">Admin Panel</p>

            <h1 className="aop-title">Orders</h1>

            <p className="aop-subtitle">
              Manage customer orders and update order status.
            </p>
          </div>

          <button onClick={handleRefresh} className="aop-refresh">
            <span className="aop-refresh-icon">↻</span>
            Refresh
          </button>
        </header>

        {/* STATUS CARDS */}

        <section className="aop-status-grid">
          {/* ALL */}

          <button
            onClick={() => setStatus("")}
            className={`aop-status-card ${status === "" ? "is-active" : ""}`}
          >
            <span
              className="aop-status-dot"
              style={{ background: "#4f46e5" }}
            />

            <span className="aop-status-meta">
              <span className="aop-status-label">All Orders</span>

              <span className="aop-status-count">{orders.length}</span>
            </span>
          </button>

          {/* STATUS */}

          {statuses.map((currentStatus) => (
            <button
              key={currentStatus}
              onClick={() => setStatus(currentStatus)}
              className={`aop-status-card ${
                status === currentStatus ? "is-active" : ""
              }`}
            >
              <span
                className="aop-status-dot"
                style={{ background: getStatusDotColor(currentStatus) }}
              />

              <span className="aop-status-meta">
                <span className="aop-status-label">{currentStatus}</span>

                <span className="aop-status-count">
                  {getCount(currentStatus)}
                </span>
              </span>
            </button>
          ))}
        </section>

        {/* SEARCH + FILTER */}

        <section className="aop-filters">
          {/* SEARCH */}

          <div className="aop-search">
            <span className="aop-search-icon">🔍</span>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer name, email or product..."
              className="aop-search-input"
            />
          </div>

          {/* CATEGORY */}

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="aop-select"
          >
            <option value="">All Categories</option>

            {categories.map((currentCategory) => (
              <option key={currentCategory} value={currentCategory}>
                {currentCategory}
              </option>
            ))}
          </select>

          {/* SORT */}

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="aop-select"
          >
            <option value="desc">Newest → Oldest</option>

            <option value="asc">Oldest → Newest</option>
          </select>

          {/* CLEAR */}

          {(search || category || status) && (
            <button onClick={clearFilters} className="aop-clear">
              Clear
            </button>
          )}
        </section>

        {/* RESULT INFO */}

        <div className="aop-result-bar">
          <span>
            Showing <strong>{filteredOrders.length}</strong> of{" "}
            <strong>{orders.length}</strong> orders
          </span>

          <span>{status ? `Status: ${status}` : "All statuses"}</span>
        </div>

        {/* ERROR */}

        {error && (
          <div className="aop-error">
            <span className="aop-error-icon">!</span>
            {error}
          </div>
        )}

        {/* EMPTY */}

        {!error && filteredOrders.length === 0 && (
          <div className="aop-empty">
            <div className="aop-empty-icon">📦</div>

            <h2 className="aop-empty-title">No orders found</h2>

            <p className="aop-empty-text">
              No orders match your current search or filters.
            </p>

            {(search || category || status) && (
              <button onClick={clearFilters} className="aop-empty-btn">
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* ORDERS */}

        {filteredOrders.length > 0 && (
          <div className="aop-orders">
            {filteredOrders.map((order) => {
              const sellingPrice =
                order.product?.salePrice !== null &&
                order.product?.salePrice !== undefined
                  ? Number(order.product.salePrice)
                  : Number(order.product?.price || 0);

              const customerName = order.user?.name || "Unknown User";

              const customerInitial =
                customerName.trim().charAt(0).toUpperCase() || "?";

              return (
                <article key={order._id} className="aop-order-card">
                  {/* TOP */}

                  <div className="aop-order-top">
                    <div className="aop-order-id-block">
                      <p className="aop-order-id-label">Order ID</p>

                      <span className="aop-order-id">#{order._id}</span>
                    </div>

                    <div className="aop-order-date">
                      <span className="aop-order-date-icon">🕒</span>
                      {formatDate(order.createdAt)}
                    </div>
                  </div>

                  {/* MAIN */}

                  <div className="aop-order-main">
                    {/* CUSTOMER */}

                    <div className="aop-order-block">
                      <h3 className="aop-block-title">Customer</h3>

                      <div className="aop-customer">
                        <div className="aop-avatar">{customerInitial}</div>

                        <div className="aop-customer-info">
                          <p className="aop-customer-name">{customerName}</p>

                          <p className="aop-customer-email">
                            {order.user?.email || "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* PRODUCT */}

                    <div className="aop-order-block">
                      <h3 className="aop-block-title">Product</h3>

                      <div className="aop-product">
                        {order.product?.image ? (
                          <img
                            src={order.product.image}
                            alt={order.product?.name || "Product"}
                            className="aop-product-img"
                          />
                        ) : (
                          <div className="aop-product-noimg">No Image</div>
                        )}

                        <div className="aop-product-info">
                          <p className="aop-product-name">
                            {order.product?.name || "Unknown Product"}
                          </p>

                          <p className="aop-product-meta">
                            Category: {order.product?.category || "-"}
                          </p>

                          {order.product?.brand && (
                            <p className="aop-product-meta">
                              Brand: {order.product.brand}
                            </p>
                          )}

                          <p className="aop-product-meta">
                            Price: ₹{sellingPrice.toFixed(2)}
                          </p>

                          <p className="aop-product-meta">
                            Quantity: {order.product?.quantity || 1}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* TOTAL */}

                    <div className="aop-total-block">
                      <span className="aop-total-label">Total</span>

                      <strong className="aop-total">
                        ₹{Number(order.totalAmount || 0).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  {/* STATUS */}

                  <div className="aop-order-footer">
                    <div className="aop-status-current">
                      <p className="aop-status-label-sm">Order Status</p>

                      <span
                        className="aop-status-badge"
                        style={getStatusStyle(order.status)}
                      >
                        <span className="aop-badge-dot" />
                        {order.status}
                      </span>
                    </div>

                    {/* CHANGE STATUS */}

                    <div className="aop-update">
                      <label className="aop-update-label">Change Status</label>

                      <select
                        value={order.status}
                        disabled={updatingId === order._id}
                        onChange={(e) =>
                          updateStatus(order._id, e.target.value)
                        }
                        className="aop-update-select"
                      >
                        {statuses.map((currentStatus) => (
                          <option key={currentStatus} value={currentStatus}>
                            {currentStatus}
                          </option>
                        ))}
                      </select>

                      {updatingId === order._id && (
                        <span className="aop-updating">
                          <span className="aop-updating-dot" />
                          Updating...
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------------- STYLES ---------------- */}

      <style jsx global>{`
        @keyframes aopSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes aopToastIn {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes aopPulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.25;
          }
        }

        .admin-orders-page {
          min-height: 100vh;
          padding: 34px 22px 80px;
          background:
            radial-gradient(circle at 0% 0%, #eef2ff 0%, transparent 45%),
            radial-gradient(circle at 100% 0%, #f5f3ff 0%, transparent 40%),
            #f7f8fc;
          color: #0f172a;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        .admin-orders-page *,
        .admin-orders-page *::before,
        .admin-orders-page *::after {
          box-sizing: border-box;
        }

        .aop-container {
          max-width: 1220px;
          margin: 0 auto;
        }

        /* ---------------- TOAST ---------------- */

        .aop-toast {
          position: fixed;
          top: 22px;
          right: 22px;
          z-index: 1000;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 12px 18px;
          border-radius: 12px;
          background: #0f172a;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.1px;
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.3);
          animation: aopToastIn 0.28s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .aop-toast-icon {
          display: grid;
          place-items: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #22c55e;
          color: #ffffff;
          font-size: 11px;
          font-weight: 900;
        }

        /* ---------------- HEADER ---------------- */

        .aop-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 26px;
        }

        .aop-header-text {
          min-width: 0;
        }

        .aop-eyebrow {
          margin: 0 0 7px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          color: #4f46e5;
        }

        .aop-title {
          margin: 0;
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.6px;
          color: #0f172a;
          line-height: 1.15;
        }

        .aop-subtitle {
          margin: 8px 0 0;
          font-size: 14px;
          color: #64748b;
        }

        .aop-refresh {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 18px;
          border: 1px solid #e2e8f0;
          border-radius: 11px;
          background: #ffffff;
          color: #334155;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
          transition: all 0.2s ease;
        }

        .aop-refresh:hover {
          background: #f5f3ff;
          border-color: #c7d2fe;
          color: #4f46e5;
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(79, 70, 229, 0.14);
        }

        .aop-refresh:active {
          transform: translateY(0);
        }

        .aop-refresh-icon {
          font-size: 15px;
          line-height: 1;
          transition: transform 0.4s ease;
        }

        .aop-refresh:hover .aop-refresh-icon {
          transform: rotate(180deg);
        }

        /* ---------------- STATUS CARDS ---------------- */

        .aop-status-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 18px;
        }

        .aop-status-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 15px;
          border: 1px solid #e8ecf3;
          border-radius: 14px;
          background: #ffffff;
          font-family: inherit;
          text-align: left;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          transition: all 0.2s ease;
        }

        .aop-status-card:hover {
          border-color: #c7d2fe;
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(79, 70, 229, 0.1);
        }

        .aop-status-card.is-active {
          border-color: #4f46e5;
          background: #f5f3ff;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
        }

        .aop-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex: 0 0 auto;
        }

        .aop-status-meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .aop-status-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .aop-status-count {
          font-size: 20px;
          font-weight: 800;
          line-height: 1.2;
          color: #0f172a;
        }

        /* ---------------- FILTERS ---------------- */

        .aop-filters {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          padding: 14px;
          margin-bottom: 14px;
          background: #ffffff;
          border: 1px solid #e8ecf3;
          border-radius: 16px;
          box-shadow: 0 4px 18px rgba(15, 23, 42, 0.04);
        }

        .aop-search {
          position: relative;
          flex: 1 1 260px;
          min-width: 0;
        }

        .aop-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 13px;
          opacity: 0.65;
          pointer-events: none;
        }

        .aop-search-input {
          width: 100%;
          padding: 11px 14px 11px 38px;
          border: 1px solid #e2e8f0;
          border-radius: 11px;
          background: #f8fafc;
          color: #0f172a;
          font-family: inherit;
          font-size: 13px;
          outline: none;
          transition: all 0.2s ease;
        }

        .aop-search-input::placeholder {
          color: #94a3b8;
        }

        .aop-search-input:focus {
          background: #ffffff;
          border-color: #a5b4fc;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
        }

        .aop-select {
          flex: 0 1 168px;
          min-width: 0;
          padding: 11px 34px 11px 13px;
          border: 1px solid #e2e8f0;
          border-radius: 11px;
          background-color: #f8fafc;
          background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 12px;
          color: #334155;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
          appearance: none;
          -webkit-appearance: none;
          transition: all 0.2s ease;
        }

        .aop-select:hover {
          border-color: #cbd5e1;
        }

        .aop-select:focus {
          background-color: #ffffff;
          border-color: #a5b4fc;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
        }

        .aop-clear {
          padding: 11px 16px;
          border: 1px solid #fecaca;
          border-radius: 11px;
          background: #fef2f2;
          color: #b91c1c;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .aop-clear:hover {
          background: #fee2e2;
          border-color: #fca5a5;
        }

        /* ---------------- RESULT BAR ---------------- */

        .aop-result-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 16px;
          font-size: 12.5px;
          color: #64748b;
        }

        .aop-result-bar strong {
          color: #0f172a;
          font-weight: 700;
        }

        /* ---------------- ERROR ---------------- */

        .aop-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          margin-bottom: 18px;
          border: 1px solid #fecaca;
          border-radius: 12px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 13px;
          font-weight: 600;
        }

        .aop-error-icon {
          display: grid;
          place-items: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ef4444;
          color: #ffffff;
          font-size: 11px;
          font-weight: 900;
          flex: 0 0 auto;
        }

        /* ---------------- ORDERS LIST ---------------- */

        .aop-orders {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .aop-order-card {
          padding: 20px 22px;
          background: #ffffff;
          border: 1px solid #e8ecf3;
          border-radius: 18px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
          transition:
            box-shadow 0.25s ease,
            transform 0.25s ease,
            border-color 0.25s ease;
        }

        .aop-order-card:hover {
          border-color: #dbe1ee;
          transform: translateY(-2px);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.09);
        }

        .aop-order-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 1px dashed #e8ecf3;
        }

        .aop-order-id-block {
          min-width: 0;
        }

        .aop-order-id-label {
          margin: 0 0 5px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.9px;
          text-transform: uppercase;
          color: #94a3b8;
        }

        .aop-order-id {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          word-break: break-all;
        }

        .aop-order-date {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: 1px solid #eef2f7;
          border-radius: 999px;
          background: #f8fafc;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .aop-order-date-icon {
          font-size: 11px;
          opacity: 0.75;
        }

        /* ---------------- ORDER MAIN ---------------- */

        .aop-order-main {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.9fr) minmax(
              0,
              0.8fr
            );
          gap: 24px;
          align-items: center;
          padding: 20px 0;
        }

        .aop-order-block {
          min-width: 0;
        }

        .aop-block-title {
          margin: 0 0 10px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.9px;
          text-transform: uppercase;
          color: #94a3b8;
        }

        .aop-customer {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .aop-avatar {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          flex: 0 0 auto;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          box-shadow: 0 6px 14px rgba(99, 102, 241, 0.32);
        }

        .aop-customer-info {
          min-width: 0;
        }

        .aop-customer-name {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          word-break: break-word;
        }

        .aop-customer-email {
          margin: 4px 0 0;
          font-size: 12px;
          color: #64748b;
          word-break: break-word;
        }

        .aop-product {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .aop-product-img {
          width: 66px;
          height: 66px;
          border-radius: 12px;
          object-fit: cover;
          border: 1px solid #eef2f7;
          background: #f8fafc;
          flex: 0 0 auto;
        }

        .aop-product-noimg {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 66px;
          height: 66px;
          border-radius: 12px;
          background: #f1f5f9;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 700;
          flex: 0 0 auto;
        }

        .aop-product-info {
          min-width: 0;
        }

        .aop-product-name {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          word-break: break-word;
        }

        .aop-product-meta {
          margin: 4px 0 0;
          font-size: 12px;
          color: #64748b;
        }

        .aop-total-block {
          text-align: right;
        }

        .aop-total-label {
          display: block;
          margin-bottom: 6px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.9px;
          text-transform: uppercase;
          color: #94a3b8;
        }

        .aop-total {
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -0.4px;
          color: #0f172a;
        }

        /* ---------------- ORDER FOOTER ---------------- */

        .aop-order-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          padding-top: 16px;
          border-top: 1px solid #eef2f7;
        }

        .aop-status-current {
          min-width: 0;
        }

        .aop-status-label-sm {
          margin: 0 0 8px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.9px;
          text-transform: uppercase;
          color: #94a3b8;
        }

        .aop-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 13px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.2px;
        }

        .aop-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .aop-update {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .aop-update-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          white-space: nowrap;
        }

        .aop-update-select {
          min-width: 156px;
          padding: 9px 32px 9px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background-color: #f8fafc;
          background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 11px center;
          background-size: 12px;
          color: #334155;
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
          appearance: none;
          -webkit-appearance: none;
          transition: all 0.2s ease;
        }

        .aop-update-select:hover:not(:disabled) {
          border-color: #c7d2fe;
          background-color: #f5f3ff;
          color: #4f46e5;
        }

        .aop-update-select:focus {
          background-color: #ffffff;
          border-color: #a5b4fc;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
        }

        .aop-update-select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .aop-updating {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 700;
          color: #4f46e5;
        }

        .aop-updating-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4f46e5;
          animation: aopPulse 1s ease-in-out infinite;
        }

        /* ---------------- EMPTY ---------------- */

        .aop-empty {
          padding: 72px 24px;
          text-align: center;
          background: #ffffff;
          border: 1px solid #e8ecf3;
          border-radius: 18px;
          box-shadow: 0 4px 18px rgba(15, 23, 42, 0.04);
        }

        .aop-empty-icon {
          font-size: 44px;
          margin-bottom: 14px;
        }

        .aop-empty-title {
          margin: 0;
          font-size: 21px;
          font-weight: 800;
          color: #0f172a;
        }

        .aop-empty-text {
          margin: 8px 0 0;
          font-size: 13.5px;
          color: #64748b;
        }

        .aop-empty-btn {
          margin-top: 18px;
          padding: 11px 20px;
          border: none;
          border-radius: 11px;
          background: #4f46e5;
          color: #ffffff;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25);
          transition: all 0.2s ease;
        }

        .aop-empty-btn:hover {
          background: #4338ca;
          transform: translateY(-1px);
          box-shadow: 0 12px 26px rgba(79, 70, 229, 0.32);
        }

        /* ---------------- RESPONSIVE ---------------- */

        @media (max-width: 1080px) {
          .aop-status-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .aop-order-main {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr);
            gap: 20px;
          }

          .aop-total-block {
            grid-column: 1 / -1;
            text-align: left;
            padding-top: 14px;
            border-top: 1px solid #f1f5f9;
          }
        }

        @media (max-width: 820px) {
          .aop-order-main {
            grid-template-columns: minmax(0, 1fr);
            gap: 18px;
          }

          .aop-total-block {
            padding-top: 0;
            border-top: none;
          }

          .aop-product {
            align-items: flex-start;
          }
        }

        @media (max-width: 640px) {
          .admin-orders-page {
            padding: 24px 14px 64px;
          }

          .aop-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
            margin-bottom: 22px;
          }

          .aop-title {
            font-size: 26px;
          }

          .aop-subtitle {
            font-size: 13px;
          }

          .aop-refresh {
            justify-content: center;
            width: 100%;
          }

          .aop-status-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .aop-status-card {
            padding: 12px 13px;
          }

          .aop-status-count {
            font-size: 18px;
          }

          .aop-filters {
            flex-direction: column;
            align-items: stretch;
            padding: 12px;
          }

          .aop-search,
          .aop-select,
          .aop-clear {
            flex: 1 1 auto;
            width: 100%;
          }

          .aop-order-card {
            padding: 16px;
            border-radius: 16px;
          }

          .aop-order-top {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .aop-order-date {
            align-self: flex-start;
          }

          .aop-order-footer {
            flex-direction: column;
            align-items: stretch;
            gap: 14px;
          }

          .aop-update {
            justify-content: space-between;
          }

          .aop-update-select {
            flex: 1;
            min-width: 0;
          }

          .aop-result-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .aop-toast {
            top: 14px;
            left: 14px;
            right: 14px;
            justify-content: center;
          }

          .aop-empty {
            padding: 54px 18px;
          }
        }

        @media (max-width: 400px) {
          .aop-status-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .aop-update {
            flex-direction: column;
            align-items: stretch;
          }

          .aop-update-select {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

/* ---------------- STATUS STYLE ---------------- */

function getStatusStyle(status) {
  switch (status) {
    case "Pending":
      return {
        background: "#fef3c7",
        color: "#92400e",
      };

    case "Confirmed":
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
      };

    case "Shipped":
      return {
        background: "#e0e7ff",
        color: "#4338ca",
      };

    case "Delivered":
      return {
        background: "#dcfce7",
        color: "#166534",
      };

    case "Cancelled":
      return {
        background: "#fee2e2",
        color: "#b91c1c",
      };

    default:
      return {
        background: "#f3f4f6",
        color: "#374151",
      };
  }
}

/* ---------------- STATUS DOT ---------------- */

function getStatusDotColor(status) {
  switch (status) {
    case "Pending":
      return "#f59e0b";

    case "Confirmed":
      return "#3b82f6";

    case "Shipped":
      return "#6366f1";

    case "Delivered":
      return "#22c55e";

    case "Cancelled":
      return "#ef4444";

    default:
      return "#64748b";
  }
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [sortBy, setSortBy] = useState("createdAt");

  const [sortOrder, setSortOrder] = useState("desc");

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [showDetails, setShowDetails] = useState(false);

  // =====================================================
  // GET ORDERS
  // =====================================================

  const getOrders = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      setLoading(true);
      setError("");

      const params = {};

      if (statusFilter !== "All") {
        params.status = statusFilter;
      }

      params.sortBy = sortBy;
      params.order = sortOrder;

      const response = await api.get("/orders/my-orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });

      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Get orders error:", error.response?.data || error.message);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.dispatchEvent(new Event("auth-change"));

        router.push("/login");
        return;
      }

      setError(error.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getOrders();
  }, [statusFilter, sortBy, sortOrder]);

  // =====================================================
  // ORDER COUNTS
  // =====================================================

  const orderCounts = useMemo(() => {
    return {
      all: orders.length,

      pending: orders.filter((order) => order.status === "Pending").length,

      confirmed: orders.filter((order) => order.status === "Confirmed").length,

      shipped: orders.filter((order) => order.status === "Shipped").length,

      delivered: orders.filter((order) => order.status === "Delivered").length,

      cancelled: orders.filter((order) => order.status === "Cancelled").length,
    };
  }, [orders]);

  // =====================================================
  // OPEN ORDER DETAILS
  // =====================================================

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setShowDetails(false);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main style={styles.page} className="order-page">
        <div style={styles.loading}>
          <div style={styles.spinner}></div>

          <h3 style={styles.loadingTitle}>Loading your orders...</h3>

          <p style={styles.loadingText}>
            Please wait while we get your order history.
          </p>
        </div>

        <style jsx global>{`
          @keyframes orderSpinner {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main style={styles.page} className="order-page">
      <div style={styles.container} className="order-container">
        {/* =================================================
            HEADER
        ================================================= */}

        <div style={styles.header} className="order-header">
          <div style={styles.headerText}>
            <p style={styles.eyebrow}>ORDER HISTORY</p>

            <h1 style={styles.title} className="order-title">
              My Orders
            </h1>

            <p style={styles.subtitle} className="order-subtitle">
              Track and manage your recent purchases.
            </p>
          </div>

          <button
            type="button"
            onClick={getOrders}
            style={styles.refreshButton}
            className="order-refresh-button"
          >
            ↻ Refresh
          </button>
        </div>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div style={styles.summaryGrid} className="order-summary-grid">
          <SummaryCard
            title="All Orders"
            value={orderCounts.all}
            icon="📦"
            active={statusFilter === "All"}
            onClick={() => setStatusFilter("All")}
          />

          <SummaryCard
            title="Pending"
            value={orderCounts.pending}
            icon="⏳"
            active={statusFilter === "Pending"}
            onClick={() => setStatusFilter("Pending")}
          />

          <SummaryCard
            title="Confirmed"
            value={orderCounts.confirmed}
            icon="✓"
            active={statusFilter === "Confirmed"}
            onClick={() => setStatusFilter("Confirmed")}
          />

          <SummaryCard
            title="Shipped"
            value={orderCounts.shipped}
            icon="🚚"
            active={statusFilter === "Shipped"}
            onClick={() => setStatusFilter("Shipped")}
          />

          <SummaryCard
            title="Delivered"
            value={orderCounts.delivered}
            icon="✓"
            active={statusFilter === "Delivered"}
            onClick={() => setStatusFilter("Delivered")}
          />

          <SummaryCard
            title="Cancelled"
            value={orderCounts.cancelled}
            icon="×"
            active={statusFilter === "Cancelled"}
            onClick={() => setStatusFilter("Cancelled")}
          />
        </div>

        {/* =================================================
            FILTER BAR
        ================================================= */}

        <div style={styles.filterBar} className="order-filter-bar">
          <div style={styles.filterGroup} className="order-filter-group">
            <label style={styles.filterLabel}>Status</label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={styles.select}
              className="order-filter-select"
            >
              <option value="All">All Orders</option>

              <option value="Pending">Pending</option>

              <option value="Confirmed">Confirmed</option>

              <option value="Shipped">Shipped</option>

              <option value="Delivered">Delivered</option>

              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div style={styles.filterGroup} className="order-filter-group">
            <label style={styles.filterLabel}>Sort By</label>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(event) => {
                const [newSortBy, newOrder] = event.target.value.split("-");

                setSortBy(newSortBy);
                setSortOrder(newOrder);
              }}
              style={styles.select}
              className="order-filter-select"
            >
              <option value="createdAt-desc">Newest First</option>

              <option value="createdAt-asc">Oldest First</option>

              <option value="totalAmount-desc">Highest Amount</option>

              <option value="totalAmount-asc">Lowest Amount</option>

              <option value="status-asc">Status A-Z</option>
            </select>
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div style={styles.errorBox} className="order-error-box">
            <div style={styles.errorTextWrap}>
              <strong>Unable to load orders</strong>

              <p style={styles.errorText}>{error}</p>
            </div>

            <button
              type="button"
              onClick={getOrders}
              style={styles.retryButton}
              className="order-retry-button"
            >
              Try Again
            </button>
          </div>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!error && orders.length === 0 && (
          <div style={styles.emptyCard} className="order-empty-card">
            <div style={styles.emptyIcon}>📦</div>

            <h2 style={styles.emptyTitle}>
              {statusFilter === "All"
                ? "No orders yet"
                : `No ${statusFilter.toLowerCase()} orders`}
            </h2>

            <p style={styles.emptyText}>
              {statusFilter === "All"
                ? "You haven't placed any orders yet. Browse our products and place your first order."
                : "There are no orders matching this status."}
            </p>

            <button
              type="button"
              onClick={() => router.push("/products")}
              style={styles.shopButton}
              className="order-shop-button"
            >
              Start Shopping
            </button>
          </div>
        )}

        {/* =================================================
            ORDERS
        ================================================= */}

        {!error && orders.length > 0 && (
          <div style={styles.ordersList}>
            {orders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onDetails={openOrderDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* =================================================
          ORDER DETAILS MODAL
      ================================================= */}

      {showDetails && selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={closeOrderDetails} />
      )}

      {/* =================================================
          RESPONSIVE CSS
      ================================================= */}

      <style jsx global>{`
        @keyframes orderSpinner {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        /* ---------------------------------------------
           FOCUS RINGS (accessibility)
        --------------------------------------------- */

        .order-page button:focus-visible,
        .order-page select:focus-visible {
          outline: 3px solid rgba(79, 70, 229, 0.35);
          outline-offset: 2px;
        }

        /* ---------------------------------------------
           HOVER STATES
        --------------------------------------------- */

        .order-refresh-button:hover {
          background: #f8fafc !important;
          border-color: #4f46e5 !important;
          color: #4f46e5 !important;
        }

        .order-summary-card:hover {
          border-color: #c7d2fe !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(79, 70, 229, 0.12);
        }

        .order-view-button:hover {
          background: #4f46e5 !important;
          border-color: #4f46e5 !important;
          color: #ffffff !important;
        }

        .order-shop-button:hover {
          background: #4338ca !important;
        }

        .order-retry-button:hover {
          background: #dc2626 !important;
          color: #ffffff !important;
        }

        .order-modal-close:hover {
          background: #e2e8f0 !important;
        }

        .order-modal-primary:hover {
          background: #4338ca !important;
        }

        .order-spec-row:last-child {
          border-bottom: none !important;
        }

        /* ---------------------------------------------
           TABLET
        --------------------------------------------- */

        @media (max-width: 1024px) {
          .order-summary-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }

        /* ---------------------------------------------
           MOBILE / SMALL TABLET
        --------------------------------------------- */

        @media (max-width: 600px) {
          .order-page {
            padding: 20px 12px 50px !important;
          }

          .order-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
            margin-bottom: 20px !important;
          }

          .order-refresh-button {
            width: 100% !important;
          }

          .order-title {
            font-size: 28px !important;
          }

          .order-subtitle {
            font-size: 14px !important;
          }

          .order-summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
          }

          .order-summary-card {
            padding: 10px !important;
          }

          .order-summary-value {
            font-size: 16px !important;
          }

          .order-filter-bar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            padding: 12px !important;
          }

          .order-filter-group {
            width: 100% !important;
          }

          .order-filter-select {
            width: 100% !important;
            min-width: 0 !important;
          }

          .order-error-box {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .order-retry-button {
            width: 100% !important;
          }

          .order-card-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
            padding: 14px 16px !important;
          }

          .order-id-box {
            text-align: left !important;
            margin-left: 0 !important;
          }

          /* FIX: Product section uses Grid to prevent text squishing */
          .order-product-section {
            display: grid !important;
            grid-template-columns: 80px 1fr !important;
            gap: 12px !important;
            align-items: start !important;
            padding: 16px !important;
          }

          .order-image-wrapper {
            width: 80px !important;
            height: 80px !important;
            border-radius: 10px !important;
          }

          .order-status-badge {
            grid-column: 1 / -1 !important;
            justify-self: start !important;
            margin-top: 4px !important;
          }

          /* FIX: Timeline horizontal scroll with smaller elements */
          .order-tracking {
            padding: 16px 12px !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
            gap: 8px !important;
          }

          .order-tracking::-webkit-scrollbar {
            display: none !important;
          }

          .order-track-item {
            flex: 0 0 auto !important;
            min-width: 90px !important;
          }

          .order-track-circle {
            width: 24px !important;
            height: 24px !important;
            font-size: 10px !important;
          }

          .order-track-label {
            font-size: 9px !important;
            margin-left: 4px !important;
          }

          .order-track-line {
            min-width: 20px !important;
            margin: 0 4px !important;
          }

          .order-card-footer {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            padding: 14px 16px !important;
          }

          .order-details-button {
            width: 100% !important;
          }

          .order-modal-overlay {
            padding: 0 !important;
            align-items: flex-end !important;
          }

          .order-modal {
            max-width: 100% !important;
            max-height: 95vh !important;
            border-radius: 20px 20px 0 0 !important;
            padding: 16px !important;
          }

          .order-modal-info {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }

          .order-modal-product {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }

          .order-modal-image-wrapper {
            width: 100% !important;
            height: 140px !important;
            border-radius: 12px !important;
          }

          .order-modal-image-wrapper img {
            object-fit: contain !important;
          }

          .order-modal-price {
            align-items: flex-start !important;
            width: 100% !important;
            margin-top: 4px !important;
          }

          .order-spec-row {
            flex-direction: column !important;
            gap: 4px !important;
          }
        }
      `}</style>
    </main>
  );
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({ title, value, icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="order-summary-card"
      style={{
        ...styles.summaryCard,
        ...(active ? styles.summaryCardActive : {}),
      }}
    >
      <div
        style={{
          ...styles.summaryIcon,
          ...(active ? styles.summaryIconActive : {}),
        }}
      >
        {icon}
      </div>

      <div style={styles.summaryContent}>
        <span style={styles.summaryTitle}>{title}</span>

        <strong style={styles.summaryValue}>{value}</strong>
      </div>
    </button>
  );
}

// =====================================================
// ORDER CARD
// =====================================================

function OrderCard({ order, onDetails }) {
  const statuses = ["Pending", "Confirmed", "Shipped", "Delivered"];

  const currentIndex = statuses.indexOf(order.status);

  const isCancelled = order.status === "Cancelled";

  const statusStyle = getStatusStyle(order.status);

  const product = order.product || {};

  const quantity = Number(product.quantity || 1);

  const originalPrice = Number(product.price || 0);

  const salePrice =
    product.salePrice !== null &&
    product.salePrice !== undefined &&
    Number(product.salePrice) > 0
      ? Number(product.salePrice)
      : originalPrice;

  const hasDiscount = salePrice < originalPrice;

  const discount = hasDiscount
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;

  return (
    <article style={styles.card}>
      {/* =================================================
          ORDER HEADER
      ================================================= */}

      <div
        style={{
          ...styles.orderHeader,
        }}
        className="order-card-header"
      >
        <div>
          <span style={styles.smallLabel}>ORDER PLACED</span>

          <strong style={styles.date}>{formatDate(order.createdAt)}</strong>
        </div>

        <div style={styles.orderIdBox} className="order-id-box">
          <span style={styles.smallLabel}>ORDER ID</span>

          <strong style={styles.orderId}>
            #
            {String(order._id || "")
              .slice(-8)
              .toUpperCase()}
          </strong>
        </div>
      </div>

      {/* =================================================
          PRODUCT
      ================================================= */}

      <div style={styles.productSection} className="order-product-section">
        <div style={styles.imageWrapper} className="order-image-wrapper">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name || "Product"}
              style={styles.image}
              loading="lazy"
            />
          ) : (
            <div style={styles.noImage}>📦</div>
          )}
        </div>

        <div style={styles.productInfo}>
          {product.brand && <div style={styles.brand}>{product.brand}</div>}

          <h2 style={styles.productName} className="order-product-name">
            {product.name || "Product"}
          </h2>

          {product.category && (
            <span style={styles.categoryBadge}>{product.category}</span>
          )}

          {/* PRICE */}

          <div style={styles.priceRow}>
            <strong style={styles.salePrice}>
              ₹{salePrice.toLocaleString("en-IN")}
            </strong>

            {hasDiscount && (
              <>
                <span style={styles.originalPrice}>
                  ₹{originalPrice.toLocaleString("en-IN")}
                </span>

                <span style={styles.discount}>{discount}% OFF</span>
              </>
            )}
          </div>

          {/* DETAILS */}

          <div style={styles.details}>
            <span>
              Qty: <strong>{quantity}</strong>
            </span>

            <span style={styles.separator}>•</span>

            <span>
              Total:{" "}
              <strong>
                ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
              </strong>
            </span>
          </div>
        </div>

        {/* STATUS */}

        <div
          className="order-status-badge"
          style={{
            ...styles.statusBadge,
            background: statusStyle.background,
            color: statusStyle.color,
          }}
        >
          {order.status}
        </div>
      </div>

      {/* =================================================
          TRACKING
      ================================================= */}

      {isCancelled ? (
        <div style={styles.cancelled}>
          <div style={styles.cancelIcon}>×</div>

          <div>
            <strong>Order Cancelled</strong>

            <p style={styles.cancelledText}>This order has been cancelled.</p>
          </div>
        </div>
      ) : (
        <div style={styles.tracking} className="order-tracking">
          {statuses.map((status, index) => {
            const active = index <= currentIndex;

            const lineActive = index < currentIndex;

            return (
              <div
                key={status}
                style={styles.trackItem}
                className="order-track-item"
              >
                <div
                  style={{
                    ...styles.trackCircle,
                    background: active ? "#4f46e5" : "#e5e7eb",
                    color: active ? "#fff" : "#9ca3af",
                  }}
                  className="order-track-circle"
                >
                  {active ? "✓" : ""}
                </div>

                <span
                  style={{
                    ...styles.trackLabel,
                    color: active ? "#111827" : "#9ca3af",
                  }}
                  className="order-track-label"
                >
                  {status}
                </span>

                {index < statuses.length - 1 && (
                  <div
                    className="order-track-line"
                    style={{
                      ...styles.trackLine,
                      background: lineActive ? "#4f46e5" : "#e5e7eb",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* =================================================
          FOOTER
      ================================================= */}

      <div style={styles.cardFooter} className="order-card-footer">
        <div>
          <span style={styles.totalLabel}>ORDER TOTAL</span>

          <strong style={styles.total}>
            ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
          </strong>
        </div>

        <button
          type="button"
          onClick={() => onDetails(order)}
          style={styles.viewButton}
          className="order-details-button"
        >
          View Order Details →
        </button>
      </div>
    </article>
  );
}

// =====================================================
// ORDER DETAILS MODAL
// =====================================================

function OrderDetailsModal({ order, onClose }) {
  const product = order.product || {};

  const originalPrice = Number(product.price || 0);

  const salePrice =
    product.salePrice !== null &&
    product.salePrice !== undefined &&
    Number(product.salePrice) > 0
      ? Number(product.salePrice)
      : originalPrice;

  const quantity = Number(product.quantity || 1);

  const hasDiscount = salePrice < originalPrice;

  const specifications =
    product.specifications &&
    typeof product.specifications === "object" &&
    !Array.isArray(product.specifications)
      ? Object.entries(product.specifications)
      : [];

  return (
    <div
      style={styles.modalOverlay}
      className="order-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        style={styles.modal}
        className="order-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Order details"
      >
        {/* HEADER */}

        <div style={styles.modalHeader}>
          <div>
            <span style={styles.modalEyebrow}>ORDER DETAILS</span>

            <h2 style={styles.modalTitle}>
              #
              {String(order._id || "")
                .slice(-8)
                .toUpperCase()}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={styles.closeButton}
            className="order-modal-close"
            aria-label="Close order details"
          >
            ×
          </button>
        </div>

        {/* STATUS */}

        <div style={styles.modalStatusRow}>
          <span style={styles.modalStatusLabel}>Current Status</span>

          <span
            style={{
              ...styles.statusBadge,
              background: getStatusStyle(order.status).background,
              color: getStatusStyle(order.status).color,
            }}
          >
            {order.status}
          </span>
        </div>

        {/* ORDER INFO */}

        <div style={styles.modalInfoGrid} className="order-modal-info">
          <InfoItem label="Order Date" value={formatDate(order.createdAt)} />

          <InfoItem label="Order ID" value={order._id} />

          <InfoItem label="Customer" value={order.user?.name || "Customer"} />

          <InfoItem label="Email" value={order.user?.email || "—"} />
        </div>

        {/* PRODUCT */}

        <div style={styles.modalSection}>
          <h3 style={styles.modalSectionTitle}>Product</h3>

          <div style={styles.modalProduct} className="order-modal-product">
            <div
              style={styles.modalImageWrapper}
              className="order-modal-image-wrapper"
            >
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name || "Product"}
                  style={styles.modalImage}
                  loading="lazy"
                />
              ) : (
                <span style={styles.modalNoImage}>📦</span>
              )}
            </div>

            <div style={styles.modalProductInfo}>
              <h4 style={styles.modalProductName}>
                {product.name || "Product"}
              </h4>

              {product.brand && (
                <p style={styles.modalMeta}>
                  Brand: <strong>{product.brand}</strong>
                </p>
              )}

              {product.category && (
                <p style={styles.modalMeta}>
                  Category: <strong>{product.category}</strong>
                </p>
              )}

              <p style={styles.modalMeta}>
                Quantity: <strong>{quantity}</strong>
              </p>
            </div>

            <div style={styles.modalProductPrice} className="order-modal-price">
              <strong>₹{salePrice.toLocaleString("en-IN")}</strong>

              {hasDiscount && (
                <span style={styles.originalPrice}>
                  ₹{originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* SPECIFICATIONS */}

        {specifications.length > 0 && (
          <div style={styles.modalSection}>
            <h3 style={styles.modalSectionTitle}>Product Specifications</h3>

            <div style={styles.specifications}>
              {specifications.map(([key, value]) => (
                <div
                  key={key}
                  style={styles.specificationRow}
                  className="order-spec-row"
                >
                  <span>{formatKey(key)}</span>

                  <strong>{formatValue(value)}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TOTAL */}

        <div style={styles.totalBox}>
          <span>Order Total</span>

          <strong>
            ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
          </strong>
        </div>

        {/* CLOSE */}

        <button
          type="button"
          onClick={onClose}
          style={styles.modalCloseButton}
          className="order-modal-primary"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// =====================================================
// INFO ITEM
// =====================================================

function InfoItem({ label, value }) {
  return (
    <div style={styles.infoItem}>
      <span style={styles.infoLabel}>{label}</span>

      <strong style={styles.infoValue}>{value}</strong>
    </div>
  );
}

// =====================================================
// STATUS STYLE
// =====================================================

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

// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(date) {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
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

// =====================================================
// FORMAT SPECIFICATION KEY
// =====================================================

function formatKey(key) {
  if (!key) return "";

  return String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// =====================================================
// FORMAT SPECIFICATION VALUE
// =====================================================

function formatValue(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => `${formatKey(key)}: ${formatValue(item)}`)
      .join(" • ");
  }

  return String(value);
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  // =====================================================
  // PAGE
  // =====================================================

  page: {
    minHeight: "calc(100vh - 72px)",
    background: "linear-gradient(135deg, #f8fafc, #eef2ff)",
    padding: "45px 20px 70px",
    boxSizing: "border-box",
  },

  container: {
    width: "100%",
    maxWidth: "1100px",
    margin: "0 auto",
  },

  // =====================================================
  // HEADER
  // =====================================================

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "28px",
  },

  headerText: {
    minWidth: 0,
  },

  eyebrow: {
    margin: "0 0 7px",
    color: "#4f46e5",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1.5px",
  },

  title: {
    margin: 0,
    color: "#111827",
    fontSize: "38px",
    fontWeight: "800",
    lineHeight: 1.15,
    letterSpacing: "-0.5px",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#6b7280",
    fontSize: "15px",
  },

  refreshButton: {
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    padding: "11px 17px",
    borderRadius: "9px",
    fontWeight: "700",
    fontSize: "14px",
    fontFamily: "inherit",
    cursor: "pointer",
    boxSizing: "border-box",
    transition: "all 0.18s ease",
    whiteSpace: "nowrap",
  },

  // =====================================================
  // SUMMARY
  // =====================================================

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: "10px",
    marginBottom: "20px",
  },

  summaryCard: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    minWidth: 0,
    padding: "12px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    background: "#fff",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition:
      "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
  },

  summaryCardActive: {
    border: "1px solid #4f46e5",
    boxShadow: "0 5px 18px rgba(79, 70, 229, 0.12)",
  },

  summaryIcon: {
    width: "32px",
    height: "32px",
    flexShrink: 0,
    borderRadius: "9px",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
  },

  summaryIconActive: {
    background: "#eef2ff",
  },

  summaryContent: {
    minWidth: 0,
    overflow: "hidden",
  },

  summaryTitle: {
    display: "block",
    color: "#64748b",
    fontSize: "10px",
    fontWeight: "700",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  summaryValue: {
    display: "block",
    marginTop: "2px",
    color: "#111827",
    fontSize: "18px",
    fontWeight: "800",
    lineHeight: 1.2,
  },

  // =====================================================
  // FILTERS
  // =====================================================

  filterBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: "15px",
    padding: "15px",
    marginBottom: "20px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "13px",
    boxSizing: "border-box",
  },

  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: 0,
  },

  filterLabel: {
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "800",
  },

  select: {
    minWidth: "190px",
    height: "40px",
    padding: "0 35px 0 11px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "#fff",
    color: "#374151",
    fontSize: "13px",
    fontWeight: "600",
    fontFamily: "inherit",
    outline: "none",
    cursor: "pointer",
    boxSizing: "border-box",
  },

  // =====================================================
  // ORDERS
  // =====================================================

  ordersList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  card: {
    background: "#fff",
    borderRadius: "18px",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
    boxSizing: "border-box",
  },

  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "12px",
    padding: "18px 24px",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    boxSizing: "border-box",
  },

  smallLabel: {
    display: "block",
    color: "#9ca3af",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1px",
    marginBottom: "5px",
  },

  date: {
    color: "#374151",
    fontSize: "13px",
  },

  orderIdBox: {
    textAlign: "right",
    marginLeft: "auto",
  },

  orderId: {
    color: "#4f46e5",
    fontSize: "13px",
    wordBreak: "break-all",
  },

  // =====================================================
  // PRODUCT
  // =====================================================

  productSection: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    padding: "25px 24px",
    boxSizing: "border-box",
  },

  imageWrapper: {
    width: "105px",
    height: "105px",
    flexShrink: 0,
    borderRadius: "14px",
    overflow: "hidden",
    background: "#f3f4f6",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  noImage: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
  },

  productInfo: {
    flex: 1,
    minWidth: 0,
  },

  brand: {
    marginBottom: "3px",
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: "700",
  },

  productName: {
    margin: 0,
    color: "#111827",
    fontSize: "18px",
    fontWeight: "800",
    lineHeight: 1.3,
    overflowWrap: "break-word",
    wordBreak: "normal",
  },

  categoryBadge: {
    display: "inline-block",
    marginTop: "6px",
    padding: "4px 8px",
    borderRadius: "6px",
    background: "#eff6ff",
    color: "#2563eb",
    fontSize: "10px",
    fontWeight: "800",
  },

  priceRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "8px",
  },

  salePrice: {
    color: "#4f46e5",
    fontSize: "17px",
    fontWeight: "800",
  },

  originalPrice: {
    color: "#94a3b8",
    fontSize: "12px",
    textDecoration: "line-through",
  },

  discount: {
    padding: "3px 6px",
    borderRadius: "5px",
    background: "#dcfce7",
    color: "#15803d",
    fontSize: "9px",
    fontWeight: "800",
  },

  details: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "8px",
    marginTop: "7px",
    color: "#6b7280",
    fontSize: "12px",
  },

  separator: {
    color: "#d1d5db",
  },

  statusBadge: {
    padding: "8px 13px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "800",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  // =====================================================
  // TRACKING
  // =====================================================

  tracking: {
    display: "flex",
    alignItems: "flex-start",
    padding: "25px 45px 20px",
    borderTop: "1px solid #f3f4f6",
    boxSizing: "border-box",
  },

  trackItem: {
    display: "flex",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  trackCircle: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "800",
    flexShrink: 0,
  },

  trackLabel: {
    marginLeft: "7px",
    fontSize: "10px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  trackLine: {
    height: "3px",
    flex: 1,
    minWidth: "10px",
    margin: "0 8px",
    borderRadius: "999px",
  },

  // =====================================================
  // CANCELLED
  // =====================================================

  cancelled: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "0 24px 20px",
    padding: "14px",
    borderRadius: "10px",
    background: "#fef2f2",
    color: "#b91c1c",
    boxSizing: "border-box",
  },

  cancelIcon: {
    width: "30px",
    height: "30px",
    flexShrink: 0,
    borderRadius: "50%",
    background: "#fee2e2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    fontWeight: "800",
  },

  cancelledText: {
    margin: "3px 0 0",
    fontSize: "12px",
    opacity: 0.9,
  },

  // =====================================================
  // FOOTER
  // =====================================================

  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
    padding: "17px 24px",
    borderTop: "1px solid #e5e7eb",
    background: "#fafafa",
    boxSizing: "border-box",
  },

  totalLabel: {
    display: "block",
    color: "#9ca3af",
    fontSize: "10px",
    marginBottom: "3px",
    fontWeight: "700",
  },

  total: {
    color: "#111827",
    fontSize: "20px",
  },

  viewButton: {
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    padding: "10px 15px",
    borderRadius: "8px",
    fontWeight: "700",
    fontSize: "13px",
    fontFamily: "inherit",
    cursor: "pointer",
    boxSizing: "border-box",
    transition: "all 0.18s ease",
    whiteSpace: "nowrap",
  },

  // =====================================================
  // EMPTY
  // =====================================================

  emptyCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "65px 25px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
    border: "1px solid #e5e7eb",
    boxSizing: "border-box",
  },

  emptyIcon: {
    fontSize: "55px",
    marginBottom: "15px",
    lineHeight: 1,
  },

  emptyTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "27px",
  },

  emptyText: {
    maxWidth: "450px",
    margin: "10px auto 25px",
    color: "#6b7280",
    lineHeight: 1.6,
    fontSize: "14px",
  },

  shopButton: {
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    padding: "13px 22px",
    borderRadius: "9px",
    fontWeight: "700",
    fontSize: "14px",
    fontFamily: "inherit",
    cursor: "pointer",
    boxSizing: "border-box",
    transition: "background 0.18s ease",
  },

  // =====================================================
  // ERROR
  // =====================================================

  errorBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
    padding: "15px 18px",
    marginBottom: "20px",
    borderRadius: "10px",
    background: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    boxSizing: "border-box",
  },

  errorTextWrap: {
    minWidth: 0,
  },

  errorText: {
    margin: "4px 0 0",
    fontSize: "13px",
  },

  retryButton: {
    border: "1px solid #dc2626",
    background: "#fff",
    color: "#dc2626",
    padding: "8px 13px",
    borderRadius: "7px",
    fontWeight: "700",
    fontSize: "13px",
    fontFamily: "inherit",
    cursor: "pointer",
    boxSizing: "border-box",
    transition: "all 0.18s ease",
    whiteSpace: "nowrap",
  },

  // =====================================================
  // LOADING
  // =====================================================

  loading: {
    minHeight: "calc(100vh - 72px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "0 20px",
    textAlign: "center",
  },

  spinner: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #4f46e5",
    animation: "orderSpinner 0.8s linear infinite",
    marginBottom: "18px",
  },

  loadingTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "20px",
  },

  loadingText: {
    marginTop: "7px",
    color: "#6b7280",
    fontSize: "14px",
  },

  // =====================================================
  // MODAL
  // =====================================================

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background: "rgba(15, 23, 42, 0.55)",
    backdropFilter: "blur(5px)",
    WebkitBackdropFilter: "blur(5px)",
    boxSizing: "border-box",
  },

  modal: {
    width: "100%",
    maxWidth: "720px",
    maxHeight: "90vh",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    background: "#fff",
    borderRadius: "18px",
    boxShadow: "0 25px 70px rgba(15, 23, 42, 0.25)",
    padding: "24px",
    boxSizing: "border-box",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
    paddingBottom: "18px",
    borderBottom: "1px solid #e5e7eb",
  },

  modalEyebrow: {
    color: "#4f46e5",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1.3px",
  },

  modalTitle: {
    margin: "5px 0 0",
    color: "#111827",
    fontSize: "24px",
    wordBreak: "break-all",
  },

  closeButton: {
    width: "34px",
    height: "34px",
    flexShrink: 0,
    border: "none",
    borderRadius: "8px",
    background: "#f1f5f9",
    color: "#475569",
    fontSize: "22px",
    lineHeight: 1,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "background 0.18s ease",
  },

  modalStatusRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "15px",
    padding: "16px 0",
    borderBottom: "1px solid #e5e7eb",
  },

  modalStatusLabel: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "700",
  },

  modalInfoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
    marginTop: "18px",
  },

  infoItem: {
    padding: "12px",
    borderRadius: "9px",
    background: "#f8fafc",
    minWidth: 0,
  },

  infoLabel: {
    display: "block",
    color: "#94a3b8",
    fontSize: "10px",
    fontWeight: "700",
    marginBottom: "4px",
  },

  infoValue: {
    display: "block",
    color: "#334155",
    fontSize: "12px",
    wordBreak: "break-word",
  },

  modalSection: {
    marginTop: "22px",
  },

  modalSectionTitle: {
    margin: "0 0 10px",
    color: "#111827",
    fontSize: "15px",
    fontWeight: "800",
  },

  modalProduct: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    boxSizing: "border-box",
  },

  modalImageWrapper: {
    width: "80px",
    height: "80px",
    flexShrink: 0,
    borderRadius: "10px",
    overflow: "hidden",
    background: "#f1f5f9",
  },

  modalImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  modalNoImage: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
  },

  modalProductInfo: {
    flex: 1,
    minWidth: 0,
  },

  modalProductName: {
    margin: 0,
    color: "#111827",
    fontSize: "15px",
    wordBreak: "break-word",
  },

  modalMeta: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "11px",
  },

  modalProductPrice: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "3px",
    color: "#4f46e5",
    fontSize: "16px",
    fontWeight: "800",
    flexShrink: 0,
  },

  specifications: {
    border: "1px solid #e5e7eb",
    borderRadius: "9px",
    overflow: "hidden",
  },

  specificationRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    padding: "10px 12px",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "11px",
    color: "#64748b",
  },

  totalBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginTop: "22px",
    padding: "16px",
    borderRadius: "10px",
    background: "#eef2ff",
    color: "#111827",
    fontSize: "15px",
    boxSizing: "border-box",
  },

  modalCloseButton: {
    width: "100%",
    height: "44px",
    marginTop: "15px",
    border: "none",
    borderRadius: "9px",
    background: "#4f46e5",
    color: "#fff",
    fontWeight: "800",
    fontSize: "14px",
    fontFamily: "inherit",
    cursor: "pointer",
    boxSizing: "border-box",
    transition: "background 0.18s ease",
  },
};

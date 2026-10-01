"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // =====================================================
  // USER
  // =====================================================

  const [user, setUser] = useState(null);

  // =====================================================
  // ADDRESS
  // =====================================================

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
  });

  // =====================================================
  // PAYMENT
  // =====================================================

  const [paymentMethod, setPaymentMethod] = useState("COD");

  // =====================================================
  // LOAD CHECKOUT
  // =====================================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    // ===================================================
    // LOAD USER
    // ===================================================

    let loggedInUser = null;

    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        loggedInUser = JSON.parse(storedUser);
        setUser(loggedInUser);
      }
    } catch (error) {
      console.error("User parsing error:", error);
    }

    // ===================================================
    // LOAD CART
    // ===================================================

    try {
      const storedCart = localStorage.getItem("cart");

      if (!storedCart) {
        setCart([]);
      } else {
        const parsedCart = JSON.parse(storedCart);

        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        } else {
          setCart([]);
        }
      }
    } catch (error) {
      console.error("Cart parsing error:", error);
      setCart([]);
    }

    // ===================================================
    // LOAD SAVED ADDRESS
    // ===================================================

    try {
      const savedAddress = localStorage.getItem("checkoutAddress");

      if (savedAddress) {
        const parsedAddress = JSON.parse(savedAddress);

        if (parsedAddress) {
          setAddress((current) => ({
            ...current,
            ...parsedAddress,

            // Always use logged-in user's email if available
            email: loggedInUser?.email || parsedAddress.email || "",
          }));
        }
      } else if (loggedInUser) {
        setAddress((current) => ({
          ...current,
          fullName: loggedInUser.name || "",
          email: loggedInUser.email || "",
        }));
      }
    } catch (error) {
      console.error("Address parsing error:", error);

      if (loggedInUser) {
        setAddress((current) => ({
          ...current,
          fullName: loggedInUser.name || "",
          email: loggedInUser.email || "",
        }));
      }
    }

    setLoading(false);
  }, [router]);

  // =====================================================
  // TOAST
  // =====================================================

  const showToast = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 2500);
  };

  // =====================================================
  // PRICE HELPER
  // =====================================================

  const getProductPrice = (product) => {
    const salePrice = Number(product?.salePrice);

    if (
      product?.salePrice !== null &&
      product?.salePrice !== undefined &&
      !Number.isNaN(salePrice)
    ) {
      return salePrice;
    }

    return Number(product?.price || 0);
  };

  // =====================================================
  // TOTAL ITEMS
  // =====================================================

  const totalItems = cart.reduce((total, item) => {
    return total + Number(item.quantity || 0);
  }, 0);

  // =====================================================
  // SUBTOTAL
  // =====================================================

  const subtotal = cart.reduce((total, item) => {
    const price = getProductPrice(item);
    const quantity = Number(item.quantity || 0);

    return total + price * quantity;
  }, 0);

  // =====================================================
  // ORIGINAL PRICE
  // =====================================================

  const originalTotal = cart.reduce((total, item) => {
    const price = Number(item.price || 0);
    const quantity = Number(item.quantity || 0);

    return total + price * quantity;
  }, 0);

  // =====================================================
  // TOTAL SAVINGS
  // =====================================================

  const totalSavings = Math.max(originalTotal - subtotal, 0);

  // =====================================================
  // ADDRESS CHANGE
  // =====================================================

  const handleAddressChange = (field, value) => {
    setAddress((current) => ({
      ...current,
      [field]: value,
    }));

    // Remove old error while typing
    if (error) {
      setError("");
    }
  };

  // =====================================================
  // VALIDATE CHECKOUT
  // =====================================================

  const validateCheckout = () => {
    if (!address.fullName.trim()) {
      return "Full name is required.";
    }

    if (!address.phone.trim()) {
      return "Phone number is required.";
    }

    const phone = address.phone.replace(/\D/g, "");

    if (phone.length !== 10) {
      return "Enter a valid 10-digit phone number.";
    }

    if (!address.email.trim()) {
      return "Email address is required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(address.email.trim())) {
      return "Enter a valid email address.";
    }

    if (!address.addressLine.trim()) {
      return "Delivery address is required.";
    }

    if (!address.city.trim()) {
      return "City is required.";
    }

    if (!address.state.trim()) {
      return "State is required.";
    }

    if (!address.pincode.trim()) {
      return "PIN code is required.";
    }

    const pincode = address.pincode.replace(/\D/g, "");

    if (pincode.length !== 6) {
      return "Enter a valid 6-digit PIN code.";
    }

    if (!paymentMethod) {
      return "Please select a payment method.";
    }

    return "";
  };

  // =====================================================
  // PLACE ORDER
  // =====================================================

  const placeOrder = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    // ===================================================
    // VALIDATE
    // ===================================================

    const validationError = validateCheckout();

    if (validationError) {
      setError(validationError);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    // ===================================================
    // CLIENT STOCK CHECK
    // Server will validate stock again.
    // ===================================================

    for (const item of cart) {
      const quantity = Number(item.quantity || 0);
      const stock = Number(item.stock || 0);

      if (!Number.isInteger(quantity) || quantity < 1) {
        setError(`Invalid quantity for ${item.name || "product"}`);
        return;
      }

      if (stock < quantity) {
        setError(`${item.name || "This product"} does not have enough stock.`);

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }
    }

    try {
      setPlacingOrder(true);
      setError("");

      // =================================================
      // SAVE ADDRESS
      // =================================================

      const checkoutAddress = {
        fullName: address.fullName.trim(),
        phone: address.phone.trim(),
        email: address.email.trim().toLowerCase(),
        addressLine: address.addressLine.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        pincode: address.pincode.trim(),
      };

      localStorage.setItem("checkoutAddress", JSON.stringify(checkoutAddress));

      // =================================================
      // CREATE ONE ORDER FOR EACH PRODUCT
      // =================================================

      for (const item of cart) {
        const productId = item._id || item.id;

        if (!productId) {
          throw new Error(`Invalid product: ${item.name || "Unknown product"}`);
        }

        const quantity = Number(item.quantity || 1);

        if (!Number.isInteger(quantity) || quantity < 1) {
          throw new Error(`Invalid quantity for ${item.name || "product"}`);
        }

        // =================================================
        // IMPORTANT:
        // Backend expects addressLine, NOT address
        // =================================================

        await api.post(
          "/orders",
          {
            productId,
            quantity,

            shippingAddress: {
              fullName: checkoutAddress.fullName,
              phone: checkoutAddress.phone,
              email: checkoutAddress.email,
              addressLine: checkoutAddress.addressLine,
              city: checkoutAddress.city,
              state: checkoutAddress.state,
              pincode: checkoutAddress.pincode,
            },

            paymentMethod,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      }

      // =================================================
      // CLEAR CART
      // =================================================

      localStorage.removeItem("cart");

      window.dispatchEvent(new Event("cart-change"));

      // =================================================
      // SUCCESS
      // =================================================

      showToast("Order placed successfully.");

      setTimeout(() => {
        router.push("/orders");
      }, 700);
    } catch (error) {
      console.error("Order error:", error);

      // =================================================
      // UNAUTHORIZED
      // =================================================

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.dispatchEvent(new Event("auth-change"));

        router.push("/login");

        return;
      }

      // =================================================
      // ERROR MESSAGE
      // =================================================

      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to place order. Please try again.";

      setError(message);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setPlacingOrder(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <>
        <style jsx global>{`
          @keyframes checkoutSpin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}</style>

        <main style={styles.center}>
          <div style={styles.loadingBox}>
            <div style={styles.spinner}></div>

            <h3 style={styles.loadingTitle}>Loading checkout...</h3>

            <p style={styles.loadingText}>Preparing your order summary.</p>
          </div>
        </main>
      </>
    );
  }

  // =====================================================
  // EMPTY CART
  // =====================================================

  if (cart.length === 0) {
    return (
      <>
        <style jsx global>{`
          @media (max-width: 600px) {
            .checkout-empty-card {
              margin: 40px 15px !important;
              padding: 45px 20px !important;
            }
          }
        `}</style>

        <main style={styles.page}>
          <div className="checkout-empty-card" style={styles.emptyCard}>
            <div style={styles.emptyIcon}>🛒</div>

            <h1 style={styles.emptyTitle}>Your cart is empty</h1>

            <p style={styles.emptyText}>
              Add some products to your cart before proceeding to checkout.
            </p>

            <button
              onClick={() => router.push("/products")}
              className="checkout-btn-primary"
              style={styles.primaryButton}
            >
              Continue Shopping
            </button>
          </div>
        </main>
      </>
    );
  }

  // =====================================================
  // MAIN CHECKOUT
  // =====================================================

  return (
    <>
      <style jsx global>{`
        @keyframes checkoutSpin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes checkoutFadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes checkoutToastIn {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.96);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        html {
          -webkit-text-size-adjust: 100%;
        }

        .checkout-page * {
          -webkit-tap-highlight-color: transparent;
        }

        /* ============================================
           INPUT FOCUS STATES
        ============================================ */

        .checkout-input:focus,
        .checkout-textarea:focus {
          border-color: #4f46e5 !important;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12) !important;
          background: #ffffff !important;
        }

        .checkout-input:hover:not(:disabled),
        .checkout-textarea:hover:not(:disabled) {
          border-color: #c7cbd4 !important;
        }

        .checkout-input:disabled,
        .checkout-textarea:disabled {
          background: #f9fafb !important;
          color: #9ca3af !important;
          cursor: not-allowed;
        }

        .checkout-input::placeholder,
        .checkout-textarea::placeholder {
          color: #b0b6c0;
        }

        /* ============================================
           BUTTONS
        ============================================ */

        .checkout-btn-primary,
        .checkout-btn-dark {
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease;
        }

        .checkout-btn-primary:hover:not(:disabled),
        .checkout-btn-dark:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .checkout-btn-primary:active:not(:disabled),
        .checkout-btn-dark:active:not(:disabled) {
          transform: translateY(0);
        }

        .checkout-btn-ghost {
          transition:
            background 0.18s ease,
            border-color 0.18s ease,
            color 0.18s ease;
        }

        .checkout-btn-ghost:hover:not(:disabled) {
          background: #f9fafb !important;
          border-color: #b9bec9 !important;
          color: #111827 !important;
        }

        /* ============================================
           CARD / PRODUCT TRANSITIONS
        ============================================ */

        .checkout-card {
          animation: checkoutFadeUp 0.45s ease both;
        }

        .checkout-product {
          transition: background 0.2s ease;
          border-radius: 12px;
        }

        .checkout-product:hover {
          background: #fbfcff;
        }

        .checkout-payment-option {
          transition:
            border-color 0.18s ease,
            background 0.18s ease,
            box-shadow 0.18s ease;
        }

        .checkout-payment-option:hover {
          border-color: #c7c9f5 !important;
          background: #fbfbff;
        }

        .checkout-radio-hidden {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
          pointer-events: none;
        }

        /* ============================================
           TOAST
        ============================================ */

        .checkout-toast {
          animation: checkoutToastIn 0.28s ease both;
        }

        /* ============================================
           MOBILE STICKY BAR (hidden on desktop)
        ============================================ */

        .checkout-mobile-bar {
          display: none;
        }

        /* ============================================
           TABLET / SMALL LAPTOP
        ============================================ */

        @media (max-width: 1024px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
          }

          .checkout-summary {
            position: static !important;
            top: auto !important;
            margin-top: 4px;
          }
        }

        /* ============================================
           MOBILE
        ============================================ */

        @media (max-width: 768px) {
          .checkout-page {
            padding: 26px 14px 130px !important;
          }

          .checkout-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
            margin-bottom: 22px !important;
          }

          .checkout-title {
            font-size: 28px !important;
          }

          .checkout-subtitle {
            font-size: 14px !important;
          }

          .checkout-back-top {
            width: 100% !important;
            text-align: center !important;
            padding: 13px 16px !important;
          }

          .checkout-card {
            padding: 20px !important;
            border-radius: 16px !important;
            margin-bottom: 18px !important;
          }

          .checkout-form-grid {
            grid-template-columns: 1fr !important;
            gap: 15px !important;
          }

          .checkout-full-width {
            grid-column: auto !important;
          }

          .checkout-card-header {
            padding-bottom: 15px !important;
            margin-bottom: 18px !important;
          }

          .checkout-card-title {
            font-size: 18px !important;
          }

          /* ---- Product rows ---- */

          .checkout-product {
            flex-wrap: wrap !important;
            align-items: flex-start !important;
            gap: 14px !important;
            padding: 18px 0 !important;
          }

          .checkout-product-image {
            width: 78px !important;
            height: 78px !important;
            border-radius: 12px !important;
          }

          .checkout-product-info {
            flex: 1 1 calc(100% - 92px) !important;
            min-width: 0 !important;
          }

          .checkout-product-name {
            font-size: 15px !important;
          }

          .checkout-product-total {
            width: 100% !important;
            min-width: 0 !important;
            text-align: right !important;
            margin: 4px 0 0 0 !important;
            padding-top: 10px !important;
            border-top: 1px dashed #e5e7eb !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
          }

          .checkout-item-total-label {
            margin-bottom: 0 !important;
            font-size: 11px !important;
          }

          .checkout-item-total {
            font-size: 16px !important;
          }

          /* ---- Summary ---- */

          .checkout-summary {
            padding: 20px !important;
            border-radius: 16px !important;
          }

          .checkout-total-amount {
            font-size: 24px !important;
          }

          /* ---- Toast ---- */

          .checkout-toast {
            top: auto !important;
            bottom: 96px !important;
            left: 14px !important;
            right: 14px !important;
            justify-content: center !important;
            text-align: center !important;
          }

          /* ---- Sticky mobile action bar ---- */

          .checkout-mobile-bar {
            display: flex !important;
          }
        }

        /* ============================================
           SMALL MOBILE
        ============================================ */

        @media (max-width: 480px) {
          .checkout-page {
            padding: 20px 10px 125px !important;
          }

          .checkout-title {
            font-size: 24px !important;
          }

          .checkout-subtitle {
            font-size: 13px !important;
          }

          .checkout-card {
            padding: 16px !important;
            border-radius: 14px !important;
          }

          .checkout-card-title {
            font-size: 17px !important;
          }

          .checkout-payment-option {
            padding: 13px !important;
            gap: 11px !important;
          }

          .checkout-payment-icon {
            width: 38px !important;
            height: 38px !important;
            font-size: 18px !important;
          }

          .checkout-product-image {
            width: 68px !important;
            height: 68px !important;
          }

          .checkout-product-info {
            flex: 1 1 calc(100% - 82px) !important;
          }

          .checkout-summary {
            padding: 17px !important;
          }

          .checkout-total-amount {
            font-size: 22px !important;
          }
        }

        /* ============================================
           VERY SMALL MOBILE
        ============================================ */

        @media (max-width: 360px) {
          .checkout-title {
            font-size: 21px !important;
          }

          .checkout-product-image {
            width: 60px !important;
            height: 60px !important;
          }

          .checkout-product-info {
            flex: 1 1 100% !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .checkout-card,
          .checkout-toast,
          .checkout-btn-primary,
          .checkout-btn-dark {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <main className="checkout-page" style={styles.page}>
        {/* =================================================
            TOAST
        ================================================= */}

        {toast && (
          <div className="checkout-toast" style={styles.toast}>
            <span style={styles.toastIcon}>✓</span>
            {toast}
          </div>
        )}

        <div style={styles.container}>
          {/* =================================================
              HEADER
          ================================================= */}

          <div className="checkout-header" style={styles.header}>
            <div>
              <p style={styles.eyebrow}>CHECKOUT</p>

              <h1 className="checkout-title" style={styles.title}>
                Complete Your Order
              </h1>

              <p className="checkout-subtitle" style={styles.subtitle}>
                Enter your delivery details and review your order before placing
                it.
              </p>
            </div>

            <button
              onClick={() => router.push("/cart")}
              disabled={placingOrder}
              className="checkout-back-top checkout-btn-ghost"
              style={styles.backToCart}
            >
              ← Back to Cart
            </button>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div style={styles.errorBox}>
              <div style={styles.errorIcon}>!</div>

              <div style={styles.errorContent}>
                <strong>Unable to place order</strong>

                <p>{error}</p>
              </div>

              <button
                onClick={() => setError("")}
                style={styles.closeError}
                aria-label="Close error"
              >
                ×
              </button>
            </div>
          )}

          <div className="checkout-grid" style={styles.grid}>
            {/* =================================================
                LEFT
            ================================================= */}

            <div>
              {/* =============================================
                  DELIVERY ADDRESS
              ============================================= */}

              <section className="checkout-card" style={styles.card}>
                <div className="checkout-card-header" style={styles.cardHeader}>
                  <div>
                    <h2
                      className="checkout-card-title"
                      style={styles.cardTitle}
                    >
                      Delivery Address
                    </h2>

                    <p style={styles.cardSubtitle}>
                      Where should we deliver your order?
                    </p>
                  </div>

                  <span style={styles.stepBadge}>1</span>
                </div>

                <div className="checkout-form-grid" style={styles.formGrid}>
                  {/* FULL NAME */}

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Full Name</label>

                    <input
                      type="text"
                      value={address.fullName}
                      onChange={(e) =>
                        handleAddressChange("fullName", e.target.value)
                      }
                      placeholder="Enter full name"
                      className="checkout-input"
                      style={styles.input}
                      disabled={placingOrder}
                    />
                  </div>

                  {/* PHONE */}

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Phone Number</label>

                    <input
                      type="tel"
                      inputMode="numeric"
                      value={address.phone}
                      onChange={(e) =>
                        handleAddressChange(
                          "phone",
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                        )
                      }
                      placeholder="10-digit mobile number"
                      className="checkout-input"
                      style={styles.input}
                      maxLength={10}
                      disabled={placingOrder}
                    />
                  </div>

                  {/* EMAIL */}

                  <div
                    style={{
                      ...styles.inputGroup,
                      gridColumn: "1 / -1",
                    }}
                    className="checkout-full-width"
                  >
                    <label style={styles.label}>Email Address</label>

                    <input
                      type="email"
                      value={address.email}
                      onChange={(e) =>
                        handleAddressChange("email", e.target.value)
                      }
                      placeholder="Enter email address"
                      className="checkout-input"
                      style={styles.input}
                      disabled={placingOrder}
                    />
                  </div>

                  {/* ADDRESS */}

                  <div
                    style={{
                      ...styles.inputGroup,
                      gridColumn: "1 / -1",
                    }}
                    className="checkout-full-width"
                  >
                    <label style={styles.label}>Complete Address</label>

                    <textarea
                      value={address.addressLine}
                      onChange={(e) =>
                        handleAddressChange("addressLine", e.target.value)
                      }
                      placeholder="House/Flat number, Street, Area..."
                      rows={4}
                      className="checkout-textarea"
                      style={styles.textarea}
                      disabled={placingOrder}
                    />
                  </div>

                  {/* CITY */}

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>City</label>

                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) =>
                        handleAddressChange("city", e.target.value)
                      }
                      placeholder="Enter city"
                      className="checkout-input"
                      style={styles.input}
                      disabled={placingOrder}
                    />
                  </div>

                  {/* STATE */}

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>State</label>

                    <input
                      type="text"
                      value={address.state}
                      onChange={(e) =>
                        handleAddressChange("state", e.target.value)
                      }
                      placeholder="Enter state"
                      className="checkout-input"
                      style={styles.input}
                      disabled={placingOrder}
                    />
                  </div>

                  {/* PIN */}

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>PIN Code</label>

                    <input
                      type="text"
                      inputMode="numeric"
                      value={address.pincode}
                      onChange={(e) =>
                        handleAddressChange(
                          "pincode",
                          e.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      placeholder="6-digit PIN"
                      className="checkout-input"
                      style={styles.input}
                      maxLength={6}
                      disabled={placingOrder}
                    />
                  </div>
                </div>
              </section>

              {/* =============================================
                  PAYMENT
              ============================================= */}

              <section className="checkout-card" style={styles.card}>
                <div className="checkout-card-header" style={styles.cardHeader}>
                  <div>
                    <h2
                      className="checkout-card-title"
                      style={styles.cardTitle}
                    >
                      Payment Method
                    </h2>

                    <p style={styles.cardSubtitle}>
                      Choose how you want to pay.
                    </p>
                  </div>

                  <span style={styles.stepBadge}>2</span>
                </div>

                <div style={styles.paymentOptions}>
                  {/* COD */}

                  <label
                    className="checkout-payment-option"
                    style={{
                      ...styles.paymentOption,
                      ...(paymentMethod === "COD"
                        ? styles.paymentOptionActive
                        : {}),
                    }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      disabled={placingOrder}
                      className="checkout-radio-hidden"
                    />

                    <div
                      className="checkout-payment-icon"
                      style={styles.paymentIcon}
                    >
                      💵
                    </div>

                    <div style={styles.paymentText}>
                      <strong style={styles.paymentStrong}>
                        Cash on Delivery
                      </strong>

                      <span style={styles.paymentSpan}>
                        Pay when your order arrives
                      </span>
                    </div>

                    {paymentMethod === "COD" && (
                      <span style={styles.selectedMark}>✓</span>
                    )}
                  </label>

                  {/* ONLINE */}

                  <label
                    className="checkout-payment-option"
                    style={styles.paymentOptionDisabled}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="ONLINE"
                      disabled
                      className="checkout-radio-hidden"
                    />

                    <div
                      className="checkout-payment-icon"
                      style={styles.paymentIcon}
                    >
                      💳
                    </div>

                    <div style={styles.paymentText}>
                      <strong style={styles.paymentStrong}>
                        Online Payment
                      </strong>

                      <span style={styles.paymentSpan}>Coming soon</span>
                    </div>

                    <span style={styles.comingSoon}>Coming Soon</span>
                  </label>
                </div>
              </section>

              {/* =============================================
                  ORDER ITEMS
              ============================================= */}

              <section className="checkout-card" style={styles.card}>
                <div className="checkout-card-header" style={styles.cardHeader}>
                  <div>
                    <h2
                      className="checkout-card-title"
                      style={styles.cardTitle}
                    >
                      Order Items
                    </h2>

                    <p style={styles.cardSubtitle}>
                      Review the products in your order.
                    </p>
                  </div>

                  <span style={styles.itemCount}>
                    {totalItems} item
                    {totalItems !== 1 ? "s" : ""}
                  </span>
                </div>

                <div>
                  {cart.map((item, index) => {
                    const originalPrice = Number(item.price || 0);

                    const salePrice =
                      item.salePrice !== null && item.salePrice !== undefined
                        ? Number(item.salePrice)
                        : null;

                    const finalPrice = getProductPrice(item);

                    const quantity = Number(item.quantity || 0);

                    const itemTotal = finalPrice * quantity;

                    const itemSavings = Math.max(
                      (originalPrice - finalPrice) * quantity,
                      0,
                    );

                    return (
                      <div
                        key={item._id || item.id || index}
                        className="checkout-product"
                        style={{
                          ...styles.product,
                          borderBottom:
                            index === cart.length - 1
                              ? "none"
                              : "1px solid #e5e7eb",
                        }}
                      >
                        {/* IMAGE */}

                        <div
                          className="checkout-product-image"
                          style={styles.imageWrapper}
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name || "Product"}
                              style={styles.image}
                            />
                          ) : (
                            <div style={styles.noImage}>No Image</div>
                          )}
                        </div>

                        {/* INFO */}

                        <div
                          className="checkout-product-info"
                          style={styles.productInfo}
                        >
                          <h3
                            className="checkout-product-name"
                            style={styles.productName}
                          >
                            {item.name || "Unnamed Product"}
                          </h3>

                          <div style={styles.badges}>
                            {item.category && (
                              <span style={styles.categoryBadge}>
                                {item.category}
                              </span>
                            )}

                            {item.brand && (
                              <span style={styles.brandBadge}>
                                {item.brand}
                              </span>
                            )}
                          </div>

                          <div style={styles.priceSection}>
                            {salePrice !== null &&
                              salePrice < originalPrice && (
                                <span style={styles.oldPrice}>
                                  ₹{originalPrice.toLocaleString("en-IN")}
                                </span>
                              )}

                            <strong style={styles.currentPrice}>
                              ₹{finalPrice.toLocaleString("en-IN")}
                            </strong>

                            {item.discount > 0 && (
                              <span style={styles.discountBadge}>
                                {Number(item.discount)}% OFF
                              </span>
                            )}
                          </div>

                          <div style={styles.productDetails}>
                            <span>
                              Qty: <strong>{quantity}</strong>
                            </span>

                            <span style={styles.dot}>•</span>

                            <span>
                              Stock: <strong>{Number(item.stock || 0)}</strong>
                            </span>
                          </div>

                          {itemSavings > 0 && (
                            <div style={styles.savingText}>
                              You save ₹{itemSavings.toLocaleString("en-IN")}
                            </div>
                          )}
                        </div>

                        {/* ITEM TOTAL */}

                        <div
                          className="checkout-product-total"
                          style={styles.itemTotalBox}
                        >
                          <span
                            className="checkout-item-total-label"
                            style={styles.itemTotalLabel}
                          >
                            Item Total
                          </span>

                          <strong
                            className="checkout-item-total"
                            style={styles.itemTotal}
                          >
                            ₹{itemTotal.toLocaleString("en-IN")}
                          </strong>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* INVENTORY INFO */}

                <div style={styles.infoBox}>
                  <div style={styles.infoIcon}>✓</div>

                  <div>
                    <strong style={styles.infoTitle}>
                      Inventory checked at order time
                    </strong>

                    <p style={styles.infoText}>
                      Product availability and stock are validated by the server
                      when you place the order.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* =================================================
                RIGHT SIDE - SUMMARY
            ================================================= */}

            <aside className="checkout-summary" style={styles.summaryCard}>
              <div style={styles.summaryHeader}>
                <h2 className="checkout-card-title" style={styles.cardTitle}>
                  Order Summary
                </h2>

                <span style={styles.secureBadge}>Secure</span>
              </div>

              {/* ITEMS */}

              <div style={styles.summaryRow}>
                <span>Items</span>

                <strong>{totalItems}</strong>
              </div>

              {/* ORIGINAL */}

              {totalSavings > 0 && (
                <div style={styles.summaryRow}>
                  <span>Original Price</span>

                  <span style={styles.oldSummaryPrice}>
                    ₹{originalTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              {/* SUBTOTAL */}

              <div style={styles.summaryRow}>
                <span>Subtotal</span>

                <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
              </div>

              {/* SAVINGS */}

              {totalSavings > 0 && (
                <div style={styles.summaryRow}>
                  <span>You Save</span>

                  <strong style={styles.savings}>
                    -₹
                    {totalSavings.toLocaleString("en-IN")}
                  </strong>
                </div>
              )}

              {/* DELIVERY */}

              <div style={styles.summaryRow}>
                <span>Delivery</span>

                <span style={styles.free}>FREE</span>
              </div>

              <div style={styles.divider} />

              {/* PAYMENT */}

              <div style={styles.summaryRow}>
                <span>Payment</span>

                <strong>
                  {paymentMethod === "COD"
                    ? "Cash on Delivery"
                    : "Online Payment"}
                </strong>
              </div>

              <div style={styles.divider} />

              {/* TOTAL */}

              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Total Amount</span>

                <strong
                  className="checkout-total-amount"
                  style={styles.totalAmount}
                >
                  ₹{subtotal.toLocaleString("en-IN")}
                </strong>
              </div>

              {/* PLACE ORDER */}

              <button
                onClick={placeOrder}
                disabled={placingOrder}
                className="checkout-btn-dark"
                style={{
                  ...styles.confirmButton,
                  opacity: placingOrder ? 0.7 : 1,
                  cursor: placingOrder ? "not-allowed" : "pointer",
                }}
              >
                {placingOrder ? (
                  <span style={styles.buttonContent}>
                    <span style={styles.buttonSpinner}></span>
                    Placing Order...
                  </span>
                ) : (
                  <>Place Order — ₹{subtotal.toLocaleString("en-IN")}</>
                )}
              </button>

              {/* BACK */}

              <button
                onClick={() => router.push("/cart")}
                disabled={placingOrder}
                className="checkout-btn-ghost"
                style={{
                  ...styles.backButton,
                  opacity: placingOrder ? 0.6 : 1,
                }}
              >
                Back to Cart
              </button>

              {/* SECURITY */}

              <div style={styles.securityBox}>
                <span style={styles.securityIcon}>🔒</span>

                <div>
                  <strong style={styles.securityTitle}>Secure Checkout</strong>

                  <p style={styles.securityText}>
                    Your order is processed securely through authenticated APIs.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* =================================================
            STICKY MOBILE ACTION BAR (mobile only)
        ================================================= */}

        <div className="checkout-mobile-bar" style={styles.mobileBar}>
          <div style={styles.mobileBarLeft}>
            <span style={styles.mobileBarLabel}>Total</span>

            <strong style={styles.mobileBarTotal}>
              ₹{subtotal.toLocaleString("en-IN")}
            </strong>
          </div>

          <button
            onClick={placeOrder}
            disabled={placingOrder}
            className="checkout-btn-primary"
            style={{
              ...styles.mobileBarButton,
              opacity: placingOrder ? 0.7 : 1,
              cursor: placingOrder ? "not-allowed" : "pointer",
            }}
          >
            {placingOrder ? (
              <span style={styles.buttonContent}>
                <span style={styles.buttonSpinner}></span>
                Placing...
              </span>
            ) : (
              "Place Order"
            )}
          </button>
        </div>
      </main>
    </>
  );
}

/* ==================================================
   STYLES
================================================== */

const styles = {
  page: {
    minHeight: "calc(100vh - 72px)",
    background:
      "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f8fafc 100%)",
    padding: "45px 20px 80px",
  },

  center: {
    minHeight: "calc(100vh - 72px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    padding: "20px",
  },

  loadingBox: {
    textAlign: "center",
  },

  spinner: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #4f46e5",
    margin: "0 auto 18px",
    animation: "checkoutSpin 1s linear infinite",
  },

  loadingTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "18px",
  },

  loadingText: {
    marginTop: "7px",
    color: "#6b7280",
    fontSize: "14px",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "30px",
  },

  eyebrow: {
    margin: "0 0 8px",
    color: "#4f46e5",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "1.6px",
  },

  title: {
    margin: 0,
    fontSize: "38px",
    lineHeight: 1.15,
    fontWeight: "850",
    color: "#111827",
  },

  subtitle: {
    margin: "9px 0 0",
    color: "#6b7280",
    fontSize: "15px",
    lineHeight: 1.6,
  },

  backToCart: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#374151",
    padding: "11px 17px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  // ==================================================
  // ERROR
  // ==================================================

  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    background: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    padding: "14px 17px",
    borderRadius: "11px",
    marginBottom: "22px",
  },

  errorIcon: {
    width: "25px",
    height: "25px",
    minWidth: "25px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#dc2626",
    color: "#ffffff",
    fontWeight: "800",
    fontSize: "13px",
  },

  errorContent: {
    flex: 1,
    fontSize: "14px",
    lineHeight: 1.55,
    wordBreak: "break-word",
  },

  errorContentStrong: {
    color: "#991b1b",
  },

  closeError: {
    border: "none",
    background: "transparent",
    color: "#991b1b",
    fontSize: "22px",
    lineHeight: 1,
    cursor: "pointer",
    padding: "0 2px",
  },

  // ==================================================
  // GRID
  // ==================================================

  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 370px",
    gap: "25px",
    alignItems: "start",
  },

  // ==================================================
  // CARD
  // ==================================================

  card: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "26px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 12px 35px rgba(15, 23, 42, 0.07)",
    marginBottom: "25px",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    paddingBottom: "18px",
    borderBottom: "1px solid #e5e7eb",
    marginBottom: "22px",
  },

  cardTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "20px",
    fontWeight: "800",
  },

  cardSubtitle: {
    margin: "5px 0 0",
    color: "#9ca3af",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  stepBadge: {
    width: "30px",
    height: "30px",
    minWidth: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#eef2ff",
    color: "#4f46e5",
    fontWeight: "800",
    fontSize: "13px",
  },

  // ==================================================
  // FORM
  // ==================================================

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "18px",
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    minWidth: 0,
  },

  label: {
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
    fontSize: "15px",
    transition: "border-color 0.18s ease, box-shadow 0.18s ease",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    outline: "none",
    background: "#ffffff",
    color: "#111827",
    fontSize: "15px",
    resize: "vertical",
    fontFamily: "inherit",
    lineHeight: 1.55,
    transition: "border-color 0.18s ease, box-shadow 0.18s ease",
  },

  // ==================================================
  // PAYMENT
  // ==================================================

  paymentOptions: {
    display: "grid",
    gap: "12px",
  },

  paymentOption: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "16px",
    border: "1px solid #e5e7eb",
    borderRadius: "13px",
    cursor: "pointer",
    position: "relative",
    minWidth: 0,
  },

  paymentOptionActive: {
    border: "2px solid #4f46e5",
    background: "#f8f7ff",
    boxShadow: "0 4px 14px rgba(79, 70, 229, 0.12)",
  },

  paymentOptionDisabled: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "16px",
    border: "1px solid #e5e7eb",
    borderRadius: "13px",
    position: "relative",
    opacity: 0.65,
    cursor: "not-allowed",
    minWidth: 0,
  },

  paymentIcon: {
    width: "42px",
    height: "42px",
    minWidth: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background: "#eef2ff",
    fontSize: "20px",
  },

  paymentText: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
    minWidth: 0,
  },

  paymentStrong: {
    color: "#111827",
    fontSize: "14px",
  },

  paymentSpan: {
    color: "#9ca3af",
    fontSize: "12px",
  },

  selectedMark: {
    width: "24px",
    height: "24px",
    minWidth: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#4f46e5",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "800",
  },

  comingSoon: {
    padding: "5px 8px",
    borderRadius: "6px",
    background: "#f3f4f6",
    color: "#6b7280",
    fontSize: "10px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  // ==================================================
  // ORDER ITEMS
  // ==================================================

  itemCount: {
    color: "#4f46e5",
    background: "#eef2ff",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  product: {
    display: "flex",
    alignItems: "center",
    gap: "17px",
    padding: "20px 8px",
  },

  imageWrapper: {
    width: "105px",
    height: "105px",
    flexShrink: 0,
    borderRadius: "14px",
    overflow: "hidden",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
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
    color: "#9ca3af",
    fontSize: "12px",
  },

  productInfo: {
    flex: 1,
    minWidth: 0,
  },

  productName: {
    margin: 0,
    color: "#111827",
    fontSize: "17px",
    fontWeight: "800",
    lineHeight: 1.3,
    wordBreak: "break-word",
  },

  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "8px",
  },

  categoryBadge: {
    display: "inline-flex",
    padding: "4px 8px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#4f46e5",
    fontSize: "10px",
    fontWeight: "800",
  },

  brandBadge: {
    display: "inline-flex",
    padding: "4px 8px",
    borderRadius: "999px",
    background: "#f3f4f6",
    color: "#4b5563",
    fontSize: "10px",
    fontWeight: "700",
  },

  priceSection: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "11px",
  },

  oldPrice: {
    color: "#9ca3af",
    fontSize: "12px",
    textDecoration: "line-through",
  },

  currentPrice: {
    color: "#4f46e5",
    fontSize: "17px",
    fontWeight: "850",
  },

  discountBadge: {
    padding: "4px 7px",
    borderRadius: "6px",
    background: "#dcfce7",
    color: "#15803d",
    fontSize: "10px",
    fontWeight: "800",
  },

  productDetails: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "7px",
    marginTop: "8px",
    color: "#6b7280",
    fontSize: "12px",
  },

  dot: {
    color: "#d1d5db",
  },

  savingText: {
    marginTop: "7px",
    color: "#16a34a",
    fontSize: "12px",
    fontWeight: "700",
  },

  itemTotalBox: {
    minWidth: "105px",
    textAlign: "right",
    flexShrink: 0,
  },

  itemTotalLabel: {
    display: "block",
    color: "#9ca3af",
    fontSize: "10px",
    fontWeight: "700",
    marginBottom: "4px",
    letterSpacing: "0.3px",
  },

  itemTotal: {
    color: "#111827",
    fontSize: "16px",
    fontWeight: "850",
  },

  // ==================================================
  // INFO
  // ==================================================

  infoBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    marginTop: "8px",
    padding: "14px",
    borderRadius: "11px",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },

  infoIcon: {
    width: "27px",
    height: "27px",
    minWidth: "27px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#dcfce7",
    color: "#15803d",
    fontSize: "12px",
    fontWeight: "900",
  },

  infoTitle: {
    display: "block",
    color: "#374151",
    fontSize: "12px",
  },

  infoText: {
    margin: "4px 0 0",
    color: "#9ca3af",
    fontSize: "11px",
    lineHeight: 1.55,
  },

  // ==================================================
  // SUMMARY
  // ==================================================

  summaryCard: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "26px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 12px 35px rgba(15, 23, 42, 0.07)",
    position: "sticky",
    top: "95px",
  },

  summaryHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    paddingBottom: "18px",
    borderBottom: "1px solid #e5e7eb",
    marginBottom: "12px",
  },

  secureBadge: {
    padding: "5px 9px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#15803d",
    fontSize: "10px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  summaryRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    padding: "9px 0",
    color: "#6b7280",
    fontSize: "14px",
  },

  oldSummaryPrice: {
    color: "#9ca3af",
    textDecoration: "line-through",
  },

  savings: {
    color: "#16a34a",
  },

  free: {
    color: "#16a34a",
    fontWeight: "800",
  },

  divider: {
    height: "1px",
    background: "#e5e7eb",
    margin: "15px 0",
  },

  totalRow: {
    marginBottom: "20px",
  },

  totalLabel: {
    display: "block",
    color: "#6b7280",
    fontSize: "12px",
    marginBottom: "4px",
  },

  totalAmount: {
    color: "#111827",
    fontSize: "27px",
    fontWeight: "900",
    letterSpacing: "-0.5px",
  },

  confirmButton: {
    width: "100%",
    minHeight: "52px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #4f46e5, #4338ca)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
    boxShadow: "0 8px 18px rgba(79, 70, 229, 0.22)",
    cursor: "pointer",
  },

  buttonContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
  },

  buttonSpinner: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.4)",
    borderTop: "2px solid #ffffff",
    animation: "checkoutSpin 0.8s linear infinite",
  },

  backButton: {
    width: "100%",
    marginTop: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "13px",
    background: "#ffffff",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  securityBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    marginTop: "18px",
    paddingTop: "17px",
    borderTop: "1px solid #e5e7eb",
  },

  securityIcon: {
    fontSize: "14px",
  },

  securityTitle: {
    color: "#374151",
    fontSize: "12px",
  },

  securityText: {
    margin: "4px 0 0",
    color: "#9ca3af",
    fontSize: "11px",
    lineHeight: 1.55,
  },

  // ==================================================
  // MOBILE STICKY BAR
  // ==================================================

  mobileBar: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 900,
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
    background: "rgba(255, 255, 255, 0.96)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderTop: "1px solid #e5e7eb",
    boxShadow: "0 -6px 22px rgba(15, 23, 42, 0.09)",
  },

  mobileBarLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
    minWidth: 0,
  },

  mobileBarLabel: {
    color: "#9ca3af",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.4px",
  },

  mobileBarTotal: {
    color: "#111827",
    fontSize: "19px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  mobileBarButton: {
    flexShrink: 0,
    minHeight: "46px",
    padding: "0 22px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #4f46e5, #4338ca)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "800",
    boxShadow: "0 8px 18px rgba(79, 70, 229, 0.24)",
    cursor: "pointer",
  },

  // ==================================================
  // EMPTY
  // ==================================================

  emptyCard: {
    maxWidth: "560px",
    margin: "80px auto",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "60px 30px",
    textAlign: "center",
    border: "1px solid #e5e7eb",
    boxShadow: "0 15px 40px rgba(15, 23, 42, 0.08)",
  },

  emptyIcon: {
    fontSize: "50px",
    marginBottom: "15px",
  },

  emptyTitle: {
    margin: 0,
    fontSize: "27px",
    color: "#111827",
    fontWeight: "850",
  },

  emptyText: {
    maxWidth: "440px",
    margin: "10px auto 25px",
    color: "#6b7280",
    lineHeight: 1.6,
  },

  primaryButton: {
    border: "none",
    background: "#4f46e5",
    color: "#ffffff",
    padding: "14px 24px",
    borderRadius: "9px",
    fontWeight: "800",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(79, 70, 229, 0.22)",
  },

  // ==================================================
  // TOAST
  // ==================================================

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
    minWidth: "20px",
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

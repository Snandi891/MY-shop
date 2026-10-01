"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    loadCart();
  }, [router]);

  const loadCart = () => {
    try {
      const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");

      if (Array.isArray(savedCart)) {
        setCart(savedCart);
      } else {
        setCart([]);
      }
    } catch {
      setCart([]);
    }

    setLoading(false);
  };

  const updateCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cart-change"));
  };

  // Get product ID
  const getProductId = (item) => {
    return item._id || item.id;
  };

  // Get actual selling price
  const getSellingPrice = (item) => {
    const salePrice = Number(item.salePrice);

    if (
      item.salePrice !== null &&
      item.salePrice !== undefined &&
      !Number.isNaN(salePrice)
    ) {
      return salePrice;
    }

    return Number(item.price || 0);
  };

  // Get original price
  const getOriginalPrice = (item) => {
    return Number(item.price || 0);
  };

  // Get quantity
  const getQuantity = (item) => {
    return Math.max(1, Number(item.quantity || 1));
  };

  // Increase quantity
  const increaseQuantity = (productId) => {
    const updatedCart = cart.map((item) => {
      if (getProductId(item) !== productId) {
        return item;
      }

      const currentQuantity = getQuantity(item);
      const stock = Number(item.stock || 0);

      if (stock > 0 && currentQuantity >= stock) {
        return item;
      }

      return {
        ...item,
        quantity: currentQuantity + 1,
      };
    });

    updateCart(updatedCart);
  };

  // Decrease quantity
  const decreaseQuantity = (productId) => {
    const updatedCart = cart
      .map((item) => {
        if (getProductId(item) !== productId) {
          return item;
        }

        return {
          ...item,
          quantity: getQuantity(item) - 1,
        };
      })
      .filter((item) => Number(item.quantity) > 0);

    updateCart(updatedCart);
  };

  // Remove product
  const removeItem = (productId) => {
    const updatedCart = cart.filter((item) => getProductId(item) !== productId);
    updateCart(updatedCart);
  };

  // Clear cart
  const clearCart = () => {
    localStorage.removeItem("cart");
    setCart([]);
    window.dispatchEvent(new Event("cart-change"));
  };

  // Total quantity
  const totalItems = cart.reduce((total, item) => total + getQuantity(item), 0);

  // Total price
  const totalPrice = cart.reduce((total, item) => {
    const price = getSellingPrice(item);
    const quantity = getQuantity(item);

    return total + price * quantity;
  }, 0);

  // Total original price
  const totalOriginalPrice = cart.reduce((total, item) => {
    const price = getOriginalPrice(item);
    const quantity = getQuantity(item);

    return total + price * quantity;
  }, 0);

  // Total savings
  const totalSavings = Math.max(0, totalOriginalPrice - totalPrice);

  if (loading) {
    return (
      <>
        <style>{cartCss}</style>

        <main className="cart-page cart-loading">
          <div className="cart-spinner" />
          <p>Loading your cart…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{cartCss}</style>

      <main className="cart-page">
        <div className="cart-container">
          {/* ================= HEADER ================= */}
          <div className="cart-header">
            <div>
              <span className="eyebrow">MY SHOP</span>

              <h1 className="cart-title">Shopping Cart</h1>

              <p className="cart-subtitle">
                Review your products before placing your order.
              </p>
            </div>

            <Link href="/products" className="btn-ghost">
              Continue Shopping
            </Link>
          </div>

          {/* ================= EMPTY CART ================= */}
          {cart.length === 0 ? (
            <div className="empty-card">
              <div className="empty-icon">🛒</div>

              <h2 className="empty-title">Your cart is empty</h2>

              <p className="empty-text">
                You haven&apos;t added any products yet.
              </p>

              <Link href="/products" className="btn-primary">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="cart-content">
              {/* ============ CART ITEMS ============ */}
              <section className="cart-card">
                <div className="cart-card-head">
                  <div>
                    <h2 className="section-title">Cart Items</h2>

                    <p className="item-count">
                      {totalItems} item{totalItems !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={clearCart}
                    className="clear-btn"
                  >
                    Clear Cart
                  </button>
                </div>

                <div className="cart-items">
                  {cart.map((item) => {
                    const productId = getProductId(item);
                    const quantity = getQuantity(item);
                    const sellingPrice = getSellingPrice(item);
                    const originalPrice = getOriginalPrice(item);
                    const stock = Number(item.stock || 0);

                    const hasDiscount =
                      item.salePrice !== null &&
                      item.salePrice !== undefined &&
                      originalPrice > sellingPrice;

                    const itemTotal = sellingPrice * quantity;

                    const maxReached = stock > 0 && quantity >= stock;

                    return (
                      <article key={productId} className="cart-item">
                        {/* ---------- MAIN ---------- */}
                        <div className="item-main">
                          <div className="item-image">
                            {item.image ? (
                              <img src={item.image} alt={item.name} />
                            ) : (
                              <span className="no-image">📦</span>
                            )}
                          </div>

                          <div className="item-info">
                            <h3 className="item-name">
                              {item.name || "Unnamed Product"}
                            </h3>

                            <p className="item-category">
                              {item.category || "Uncategorized"}
                            </p>

                            {item.brand && (
                              <p className="item-brand">Brand: {item.brand}</p>
                            )}

                            <div className="price-row">
                              <strong className="price-now">
                                ₹{sellingPrice.toLocaleString("en-IN")}
                              </strong>

                              {hasDiscount && (
                                <span className="price-old">
                                  ₹{originalPrice.toLocaleString("en-IN")}
                                </span>
                              )}

                              {hasDiscount && item.discount > 0 && (
                                <span className="badge-off">
                                  {item.discount}% OFF
                                </span>
                              )}
                            </div>

                            <div className="stock-row">
                              {stock === 0 ? (
                                <span className="stock-pill out">
                                  Out of stock
                                </span>
                              ) : stock <= 5 ? (
                                <span className="stock-pill low">
                                  Only {stock} left
                                </span>
                              ) : (
                                <span className="stock-pill in">In stock</span>
                              )}

                              {item.sku && (
                                <span className="sku">SKU: {item.sku}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ---------- ACTIONS ---------- */}
                        <div className="item-actions">
                          <div className="qty-section">
                            <span className="qty-label">Quantity</span>

                            <div className="qty-control">
                              <button
                                type="button"
                                onClick={() => decreaseQuantity(productId)}
                                className="qty-btn"
                                aria-label="Decrease quantity"
                              >
                                −
                              </button>

                              <span className="qty-value">{quantity}</span>

                              <button
                                type="button"
                                onClick={() => increaseQuantity(productId)}
                                disabled={maxReached}
                                className="qty-btn"
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>

                            {maxReached && (
                              <span className="qty-limit">
                                Maximum stock reached
                              </span>
                            )}
                          </div>

                          <div className="item-total-box">
                            <span className="item-total-label">Total</span>

                            <strong className="item-total">
                              ₹{itemTotal.toLocaleString("en-IN")}
                            </strong>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(productId)}
                            className="remove-btn"
                            aria-label={`Remove ${item.name || "product"} from cart`}
                          >
                            Remove
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              {/* ============ ORDER SUMMARY ============ */}
              <aside className="cart-summary">
                <h2 className="summary-title">Order Summary</h2>

                <div className="summary-row">
                  <span>Items</span>
                  <span>{totalItems}</span>
                </div>

                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                </div>

                {totalSavings > 0 && (
                  <div className="summary-row">
                    <span>You Save</span>
                    <span className="green">
                      −₹{totalSavings.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

                <div className="summary-row">
                  <span>Shipping</span>
                  <span className="green">FREE</span>
                </div>

                <div className="summary-divider" />

                <div className="summary-total">
                  <span>Total</span>
                  <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                </div>

                {totalSavings > 0 && (
                  <div className="saved-note">
                    🎉 You save ₹{totalSavings.toLocaleString("en-IN")} on this
                    order
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => router.push("/checkout")}
                  className="checkout-btn"
                >
                  Proceed to Checkout
                </button>

                <p className="secure-note">
                  🔒 Secure checkout · Free delivery
                </p>

                <Link href="/products" className="back-link">
                  ← Continue Shopping
                </Link>
              </aside>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

/* =========================================================
   STYLES
   ========================================================= */
const cartCss = `
  .cart-page {
    min-height: 100vh;
    padding: 44px 20px 80px;
    background:
      radial-gradient(900px 460px at 8% -10%, #eef2ff 0%, rgba(238, 242, 255, 0) 62%),
      radial-gradient(760px 420px at 102% -4%, #f5f3ff 0%, rgba(245, 243, 255, 0) 58%),
      linear-gradient(180deg, #fbfcff 0%, #f4f6fc 100%);
    color: #0f172a;
    -webkit-font-smoothing: antialiased;
    box-sizing: border-box;
  }

  .cart-page *,
  .cart-page *::before,
  .cart-page *::after {
    box-sizing: border-box;
  }

  .cart-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  /* ---------- LOADING ---------- */
  .cart-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    min-height: 80vh;
  }

  .cart-spinner {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 4px solid #e6e9f2;
    border-top-color: #4f46e5;
    animation: cartSpin 0.8s linear infinite;
  }

  @keyframes cartSpin {
    to { transform: rotate(360deg); }
  }

  .cart-loading p {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #64748b;
  }

  /* ---------- HEADER ---------- */
  .cart-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 22px;
    margin-bottom: 30px;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 999px;
    background: #ffffff;
    border: 1px solid #e4e9fb;
    color: #4f46e5;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.16em;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
  }

  .eyebrow::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
  }

  .cart-title {
    margin: 14px 0 8px;
    font-size: clamp(28px, 4.4vw, 40px);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
    color: #0b1220;
  }

  .cart-subtitle {
    margin: 0;
    font-size: 15px;
    color: #64748b;
  }

  /* ---------- BUTTONS ---------- */
  .btn-ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 12px;
    background: #ffffff;
    border: 1px solid #e4e8f2;
    color: #0f172a;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
    transition: all 0.2s ease;
  }

  .btn-ghost:hover {
    border-color: #c7d0ee;
    color: #4f46e5;
    transform: translateY(-1px);
    box-shadow: 0 10px 20px -12px rgba(79, 70, 229, 0.55);
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 24px;
    padding: 14px 26px;
    border-radius: 12px;
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 12px 24px -12px rgba(79, 70, 229, 0.75);
    transition: all 0.2s ease;
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 30px -12px rgba(79, 70, 229, 0.85);
  }

  /* ---------- LAYOUT ---------- */
  .cart-content {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 24px;
    align-items: start;
  }

  .cart-card {
    background: #ffffff;
    border: 1px solid #eaeef8;
    border-radius: 22px;
    padding: 24px;
    box-shadow:
      0 1px 2px rgba(16, 24, 40, 0.03),
      0 18px 40px -24px rgba(16, 24, 40, 0.22);
  }

  .cart-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .section-title {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.01em;
    color: #0b1220;
  }

  .item-count {
    margin: 6px 0 0;
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
  }

  .clear-btn {
    border: 1px solid transparent;
    background: #fff5f5;
    color: #dc2626;
    font-size: 13px;
    font-weight: 700;
    padding: 9px 16px;
    border-radius: 10px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  .clear-btn:hover {
    background: #fee2e2;
  }

  /* ---------- CART ITEM ---------- */
  .cart-items {
    margin-top: 8px;
  }

  .cart-item {
    display: flex;
    align-items: center;
    gap: 22px;
    padding: 20px 0;
    border-top: 1px solid #eef1f8;
  }

  .item-main {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1 1 auto;
    min-width: 0;
  }

  .item-image {
    flex: 0 0 92px;
    width: 92px;
    height: 92px;
    border-radius: 16px;
    background: linear-gradient(140deg, #f7f9ff, #eef2ff);
    border: 1px solid #e8edfa;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .no-image {
    font-size: 28px;
    opacity: 0.75;
  }

  .item-info {
    min-width: 0;
  }

  .item-name {
    margin: 0;
    font-size: 16.5px;
    font-weight: 700;
    line-height: 1.35;
    color: #0b1220;
    overflow-wrap: anywhere;
  }

  .item-category {
    margin: 5px 0 0;
    font-size: 12.5px;
    font-weight: 600;
    color: #64748b;
  }

  .item-brand {
    margin: 4px 0 0;
    font-size: 12px;
    color: #94a3b8;
  }

  .price-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 9px;
  }

  .price-now {
    font-size: 16px;
    font-weight: 800;
    color: #4f46e5;
  }

  .price-old {
    font-size: 13px;
    color: #a3adc2;
    text-decoration: line-through;
  }

  .badge-off {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: #15803d;
    background: #e8f9ee;
    border: 1px solid #cdf0da;
    padding: 3px 8px;
    border-radius: 999px;
  }

  .stock-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 9px;
    margin-top: 9px;
  }

  .stock-pill {
    font-size: 10.5px;
    font-weight: 800;
    padding: 4px 9px;
    border-radius: 999px;
    letter-spacing: 0.02em;
  }

  .stock-pill.in {
    color: #15803d;
    background: #eefbf3;
    border: 1px solid #d3f2e0;
  }

  .stock-pill.low {
    color: #b45309;
    background: #fff8ec;
    border: 1px solid #fbe6c2;
  }

  .stock-pill.out {
    color: #dc2626;
    background: #fef3f2;
    border: 1px solid #fbdedb;
  }

  .sku {
    font-size: 10.5px;
    letter-spacing: 0.02em;
    color: #9aa5b8;
  }

  /* ---------- ITEM ACTIONS ---------- */
  .item-actions {
    display: flex;
    align-items: center;
    gap: 26px;
    flex: 0 0 auto;
  }

  .qty-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
  }

  .qty-label {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #9aa5b8;
  }

  .qty-control {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    border-radius: 13px;
    background: #f7f9fd;
    border: 1px solid #e8edf8;
  }

  .qty-btn {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 10px;
    background: #ffffff;
    color: #334155;
    font-size: 17px;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);
    transition: all 0.16s ease;
  }

  .qty-btn:hover:not(:disabled) {
    background: #4f46e5;
    color: #ffffff;
  }

  .qty-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    box-shadow: none;
  }

  .qty-value {
    min-width: 30px;
    text-align: center;
    font-size: 15px;
    font-weight: 800;
    color: #0b1220;
  }

  .qty-limit {
    font-size: 9.5px;
    font-weight: 700;
    color: #b45309;
    white-space: nowrap;
  }

  .item-total-box {
    min-width: 96px;
    text-align: right;
  }

  .item-total-label {
    display: block;
    margin-bottom: 5px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #9aa5b8;
  }

  .item-total {
    font-size: 17px;
    font-weight: 800;
    color: #0b1220;
  }

  .remove-btn {
    padding: 9px 14px;
    border-radius: 10px;
    border: 1px solid #eef1f8;
    background: #ffffff;
    color: #94a3b8;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  .remove-btn:hover {
    color: #dc2626;
    border-color: #fbdedb;
    background: #fff5f5;
  }

  /* ---------- SUMMARY ---------- */
  .cart-summary {
    position: sticky;
    top: 24px;
    padding: 26px 24px;
    background: #ffffff;
    border: 1px solid #eaeef8;
    border-radius: 22px;
    box-shadow:
      0 1px 2px rgba(16, 24, 40, 0.03),
      0 18px 40px -24px rgba(16, 24, 40, 0.22);
  }

  .summary-title {
    margin: 0 0 16px;
    font-size: 19px;
    font-weight: 800;
    letter-spacing: -0.01em;
    color: #0b1220;
  }

  .summary-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 9px 0;
    font-size: 14px;
    color: #4b5563;
  }

  .summary-row > span:last-child {
    font-weight: 700;
    color: #0b1220;
  }

  .summary-row .green {
    color: #16a34a;
    font-weight: 800;
  }

  .summary-divider {
    height: 1px;
    margin: 16px 0;
    background: linear-gradient(90deg, transparent, #e6ebf6, transparent);
  }

  .summary-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.01em;
    color: #0b1220;
  }

  .saved-note {
    margin-top: 16px;
    padding: 11px 14px;
    border-radius: 12px;
    background: #f0fdf4;
    border: 1px solid #d6f5e3;
    color: #15803d;
    font-size: 12.5px;
    font-weight: 700;
    text-align: center;
  }

  .checkout-btn {
    width: 100%;
    margin-top: 20px;
    padding: 16px;
    border: none;
    border-radius: 13px;
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    color: #ffffff;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.01em;
    cursor: pointer;
    box-shadow: 0 12px 24px -12px rgba(79, 70, 229, 0.75);
    transition: all 0.2s ease;
  }

  .checkout-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 30px -12px rgba(79, 70, 229, 0.85);
  }

  .checkout-btn:active {
    transform: translateY(0);
  }

  .secure-note {
    margin: 12px 0 0;
    text-align: center;
    font-size: 11.5px;
    font-weight: 600;
    color: #94a3b8;
  }

  .back-link {
    display: block;
    margin-top: 14px;
    text-align: center;
    font-size: 13px;
    font-weight: 700;
    color: #4f46e5;
    text-decoration: none;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  /* ---------- EMPTY ---------- */
  .empty-card {
    padding: 72px 24px;
    text-align: center;
    background: #ffffff;
    border: 1px solid #eaeef8;
    border-radius: 24px;
    box-shadow:
      0 1px 2px rgba(16, 24, 40, 0.03),
      0 18px 40px -24px rgba(16, 24, 40, 0.22);
  }

  .empty-icon {
    width: 96px;
    height: 96px;
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    border-radius: 50%;
    background: linear-gradient(140deg, #eef2ff, #f7f9ff);
    border: 1px solid #e6ecfb;
  }

  .empty-title {
    margin: 0 0 8px;
    font-size: 22px;
    font-weight: 800;
    color: #0b1220;
  }

  .empty-text {
    margin: 0;
    font-size: 14.5px;
    color: #64748b;
  }

  /* ---------- FOCUS ---------- */
  .cart-page button:focus-visible,
  .cart-page a:focus-visible {
    outline: 2px solid #4f46e5;
    outline-offset: 2px;
  }

  /* =========================================================
     RESPONSIVE
     ========================================================= */
  @media (max-width: 1080px) {
    .cart-content {
      grid-template-columns: minmax(0, 1fr) 320px;
    }
  }

  @media (max-width: 980px) {
    .cart-content {
      grid-template-columns: 1fr;
    }

    .cart-summary {
      position: static;
    }
  }

  @media (max-width: 720px) {
    .cart-page {
      padding: 30px 14px 64px;
    }

    .cart-card,
    .cart-summary {
      padding: 20px 16px;
      border-radius: 18px;
    }

    .cart-header {
      margin-bottom: 22px;
    }

    .btn-ghost {
      width: 100%;
    }

    .cart-item {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
      padding: 18px 0;
    }

    .item-main {
      align-items: flex-start;
      gap: 14px;
    }

    .item-image {
      flex: 0 0 76px;
      width: 76px;
      height: 76px;
      border-radius: 13px;
    }

    .item-name {
      font-size: 15.5px;
    }

    .item-actions {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: 12px;
      padding-top: 14px;
      border-top: 1px dashed #e8edf8;
    }

    .qty-section {
      align-items: flex-start;
    }

    .item-total-box {
      text-align: right;
    }

    .remove-btn {
      grid-column: 1 / -1;
      width: 100%;
      text-align: center;
      padding: 11px 14px;
    }

    .empty-card {
      padding: 56px 18px;
      border-radius: 20px;
    }

    .empty-icon {
      width: 82px;
      height: 82px;
      font-size: 34px;
    }
  }

  @media (max-width: 420px) {
    .cart-title {
      font-size: 26px;
    }

    .qty-btn {
      width: 32px;
      height: 32px;
    }

    .qty-value {
      min-width: 26px;
      font-size: 14px;
    }

    .item-total {
      font-size: 16px;
    }

    .item-total-box {
      min-width: 80px;
    }

    .summary-total {
      font-size: 18px;
    }
  }
`;

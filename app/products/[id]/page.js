"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../../lib/api";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });

  // =====================================================
  // FETCH PRODUCT
  // =====================================================

  useEffect(() => {
    if (params?.id) {
      fetchProduct();
    }
  }, [params?.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/products/${params.id}`);

      const productData =
        response.data?.product || response.data?.data || response.data;

      if (!productData) {
        setError("Product not found");
        return;
      }

      setProduct(productData);
    } catch (error) {
      console.error(error.response?.data || error.message);

      setError(error.response?.data?.message || "Unable to load this product.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // TOAST
  // =====================================================

  const showToast = (type, message) => {
    setToast({
      show: true,
      type,
      message,
    });

    setTimeout(() => {
      setToast({
        show: false,
        type: "success",
        message: "",
      });
    }, 2800);
  };

  // =====================================================
  // PRICE
  // =====================================================

  const originalPrice = Number(product?.price ?? 0);

  const sellingPrice = useMemo(() => {
    if (!product) return 0;

    const price = Number(product.price ?? 0);

    const hasSalePrice =
      product.salePrice !== null &&
      product.salePrice !== undefined &&
      product.salePrice !== "";

    if (hasSalePrice) {
      const salePrice = Number(product.salePrice);

      if (Number.isFinite(salePrice) && salePrice >= 0 && salePrice < price) {
        return salePrice;
      }
    }

    return price;
  }, [product]);

  // =====================================================
  // DISCOUNT
  // =====================================================

  const discountPercentage = useMemo(() => {
    if (!product) return 0;

    const backendDiscount = Number(product.discount ?? 0);

    if (backendDiscount > 0) {
      return backendDiscount;
    }

    if (originalPrice > 0 && sellingPrice < originalPrice) {
      return Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
    }

    return 0;
  }, [product, originalPrice, sellingPrice]);

  const savingsAmount = Math.max(originalPrice - sellingPrice, 0);

  // =====================================================
  // STOCK
  // =====================================================

  const stock = Number(product?.stock ?? 0);

  const isOutOfStock = stock <= 0;

  const isLowStock = stock > 0 && stock <= 5;

  const isInactive =
    product?.status && product.status.toLowerCase() !== "active";

  const unavailable = isOutOfStock || isInactive;

  // =====================================================
  // TOTAL
  // =====================================================

  const totalPrice = sellingPrice * quantity;

  // =====================================================
  // QUANTITY
  // =====================================================

  const increaseQuantity = () => {
    if (unavailable) return;

    if (quantity < stock) {
      setQuantity((current) => current + 1);
      return;
    }

    showToast(
      "error",
      `Only ${stock} item${stock === 1 ? "" : "s"} available.`,
    );
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((current) => current - 1);
    }
  };

  // =====================================================
  // CART
  // =====================================================

  const getCart = () => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const storedCart = localStorage.getItem("cart");

      if (!storedCart) {
        return [];
      }

      const cart = JSON.parse(storedCart);

      return Array.isArray(cart) ? cart : [];
    } catch {
      return [];
    }
  };

  const getProductId = () => {
    return product?._id || product?.id;
  };

  // =====================================================
  // LOGIN CHECK
  // =====================================================

  const requireLogin = () => {
    showToast("error", "Please login first to continue.");

    setTimeout(() => {
      router.push("/login");
    }, 700);
  };

  // =====================================================
  // SAVE CART
  // =====================================================

  const saveCart = (cart) => {
    localStorage.setItem("cart", JSON.stringify(cart));

    window.dispatchEvent(new Event("cart-change"));
  };

  // =====================================================
  // ADD TO CART
  // =====================================================

  const addToCart = () => {
    if (!product) return;

    const token = localStorage.getItem("token");

    if (!token) {
      requireLogin();
      return;
    }

    if (unavailable) {
      showToast(
        "error",
        isInactive
          ? "This product is currently unavailable."
          : "This product is out of stock.",
      );

      return;
    }

    const productId = getProductId();

    if (!productId) {
      showToast("error", "Product ID is missing.");

      return;
    }

    const cart = getCart();

    const existingIndex = cart.findIndex(
      (item) => String(item?._id || item?.id) === String(productId),
    );

    let updatedCart;

    if (existingIndex !== -1) {
      updatedCart = [...cart];

      const existingProduct = updatedCart[existingIndex];

      const currentQuantity = Number(existingProduct.quantity || 0);

      const newQuantity = currentQuantity + quantity;

      if (newQuantity > stock) {
        showToast(
          "error",
          `You can only have up to ${stock} item${
            stock === 1 ? "" : "s"
          } of this product.`,
        );

        return;
      }

      updatedCart[existingIndex] = {
        ...existingProduct,
        ...product,
        quantity: newQuantity,
      };
    } else {
      updatedCart = [
        ...cart,
        {
          ...product,
          quantity,
        },
      ];
    }

    saveCart(updatedCart);

    showToast("success", `${product.name} added to cart.`);
  };

  // =====================================================
  // BUY NOW
  // =====================================================

  const buyNow = () => {
    if (!product) return;

    const token = localStorage.getItem("token");

    if (!token) {
      requireLogin();
      return;
    }

    if (unavailable) {
      showToast(
        "error",
        isInactive
          ? "This product is currently unavailable."
          : "This product is out of stock.",
      );

      return;
    }

    const productId = getProductId();

    if (!productId) {
      showToast("error", "Product ID is missing.");

      return;
    }

    const cart = getCart();

    const existingIndex = cart.findIndex(
      (item) => String(item?._id || item?.id) === String(productId),
    );

    let updatedCart;

    if (existingIndex !== -1) {
      updatedCart = [...cart];

      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        ...product,
        quantity,
      };
    } else {
      updatedCart = [
        ...cart,
        {
          ...product,
          quantity,
        },
      ];
    }

    saveCart(updatedCart);

    router.push("/checkout");
  };

  // =====================================================
  // SPECIFICATIONS
  // =====================================================

  const specifications = useMemo(() => {
    if (!product?.specifications) {
      return [];
    }

    const specs = product.specifications;

    if (typeof specs !== "object" || Array.isArray(specs)) {
      return [];
    }

    return Object.entries(specs);
  }, [product]);

  // =====================================================
  // RATING
  // =====================================================

  const rating = Math.min(5, Math.max(0, Number(product?.rating || 0)));
  const reviews = Number(product?.reviews || 0);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="pd">
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="pd-state">
          <div className="pd-spinner" />
          <h3>Loading product…</h3>
          <p>Just a moment.</p>
        </div>
      </main>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error || !product) {
    return (
      <main className="pd">
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="pd-state">
          <div className="pd-state-icon">📦</div>
          <h1>Product not found</h1>
          <p>{error || "This product may have been removed."}</p>
          <Link href="/products" className="pd-btn">
            Back to products
          </Link>
        </div>
      </main>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="pd">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* TOAST */}
      {toast.show && (
        <div
          role="status"
          className={`pd-toast ${toast.type === "success" ? "ok" : "err"}`}
        >
          <i>{toast.type === "success" ? "✓" : "!"}</i>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="pd-wrap pd-main">
        {/* PRODUCT */}
        <section className="pd-card">
          {/* MEDIA */}
          <div className="pd-media">
            <div className="pd-media-frame">
              {product.image ? (
                <img src={product.image} alt={product.name || "Product"} />
              ) : (
                <div className="pd-noimg">📦</div>
              )}

              {/* discount badge */}
              {discountPercentage > 0 && !unavailable && (
                <span className="pd-badge pd-badge-off">
                  −{discountPercentage}%
                </span>
              )}

              {/* status badge */}
              {isInactive ? (
                <span className="pd-badge pd-badge-status inactive">
                  Unavailable
                </span>
              ) : isOutOfStock ? (
                <span className="pd-badge pd-badge-status out">
                  Out of stock
                </span>
              ) : isLowStock ? (
                <span className="pd-badge pd-badge-status low">
                  Only {stock} left
                </span>
              ) : (
                <span className="pd-badge pd-badge-status in">
                  <span className="pd-dot" /> In stock
                </span>
              )}
            </div>

            {/* mini trust row */}
            <div className="pd-trust">
              <span>
                <b>✦</b> Quality checked
              </span>
              <span>
                <b>✦</b> Free delivery
              </span>
              <span>
                <b>✦</b> 7-day returns
              </span>
            </div>
          </div>

          {/* DETAILS */}
          <div className="pd-details">
            {/* eyebrow / brand */}
            {product.brand && <span className="pd-brand">{product.brand}</span>}

            {/* category */}
            <span className="pd-cat">
              {product.category || "Uncategorized"}
            </span>

            {/* title */}
            <h1 className="pd-title">{product.name}</h1>

            {/* rating */}
            <div className="pd-rating">
              <span
                className="pd-stars"
                style={{ "--r": `${(rating / 5) * 100}%` }}
                role="img"
                aria-label={`${rating.toFixed(1)} out of 5`}
              >
                ★★★★★
              </span>
              <b>{rating.toFixed(1)}</b>
              <small>
                {reviews > 0
                  ? `${reviews} review${reviews === 1 ? "" : "s"}`
                  : "No reviews yet"}
              </small>
            </div>

            {/* price */}
            <div className="pd-price-block">
              <div className="pd-price-row">
                <span className="pd-price">
                  ₹{sellingPrice.toLocaleString("en-IN")}
                </span>

                {sellingPrice < originalPrice && (
                  <s className="pd-price-old">
                    ₹{originalPrice.toLocaleString("en-IN")}
                  </s>
                )}

                {discountPercentage > 0 && (
                  <span className="pd-price-off">−{discountPercentage}%</span>
                )}
              </div>

              {savingsAmount > 0 && (
                <div className="pd-savings">
                  You save ₹{savingsAmount.toLocaleString("en-IN")}
                </div>
              )}
            </div>

            {/* stock status pill */}
            <div className="pd-status">
              {isInactive ? (
                <span className="pd-pill inactive">Currently unavailable</span>
              ) : isOutOfStock ? (
                <span className="pd-pill out">
                  <span className="pd-dot" /> Out of stock
                </span>
              ) : (
                <span className="pd-pill in">
                  <span className="pd-dot" /> In stock
                </span>
              )}

              {!isInactive && isLowStock && (
                <span className="pd-pill low">
                  <span className="pd-dot" /> Only {stock} left
                </span>
              )}
            </div>

            {/* sku */}
            {product.sku && (
              <div className="pd-sku">
                <span>SKU</span>
                <b>{product.sku}</b>
              </div>
            )}

            {/* purchase */}
            {!unavailable && (
              <div className="pd-buy-box">
                {/* qty row */}
                <div className="pd-qty-row">
                  <div className="pd-qty-copy">
                    <span className="pd-qty-label">Quantity</span>
                    <span className="pd-qty-note">{stock} available</span>
                  </div>

                  <div className="pd-qty">
                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>

                    <span className="pd-qty-val">{quantity}</span>

                    <button
                      type="button"
                      onClick={increaseQuantity}
                      disabled={quantity >= stock}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* total */}
                <div className="pd-total">
                  <span>Total</span>
                  <strong>₹{totalPrice.toLocaleString("en-IN")}</strong>
                </div>

                {/* actions */}
                <div className="pd-actions">
                  <button
                    type="button"
                    onClick={addToCart}
                    className="pd-btn-add"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="9" cy="20" r="1.6" />
                      <circle cx="18" cy="20" r="1.6" />
                      <path d="M3 3h2l2.4 12.3a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 7H6" />
                    </svg>
                    <span>Add to cart</span>
                  </button>

                  <button type="button" onClick={buyNow} className="pd-btn-buy">
                    Buy now
                  </button>
                </div>
              </div>
            )}

            {/* disabled action for out of stock / inactive */}
            {unavailable && (
              <button type="button" disabled className="pd-btn-disabled">
                {isInactive ? "Currently unavailable" : "Out of stock"}
              </button>
            )}

            {/* description */}
            <div className="pd-section">
              <h2>Description</h2>
              <p>{product.description || "No description available."}</p>
            </div>

            {/* specifications */}
            {specifications.length > 0 && (
              <div className="pd-section">
                <h2>Specifications</h2>

                <div className="pd-specs">
                  {specifications.map(([key, value]) => (
                    <div key={key} className="pd-spec-row">
                      <span className="pd-spec-key">
                        {formatSpecificationKey(key)}
                      </span>
                      <span className="pd-spec-val">
                        {formatSpecificationValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* INFO CARDS */}
        <section className="pd-info-grid">
          <div className="pd-info-card">
            <div className="pd-info-icon">✓</div>
            <div>
              <h3>Quality product</h3>
              <p>Carefully selected for your shopping needs.</p>
            </div>
          </div>

          <div className="pd-info-card">
            <div className="pd-info-icon">🔒</div>
            <div>
              <h3>Secure shopping</h3>
              <p>Your checkout is protected and encrypted.</p>
            </div>
          </div>

          <div className="pd-info-card">
            <div className="pd-info-icon">↻</div>
            <div>
              <h3>Easy ordering</h3>
              <p>Add to cart and checkout in two taps.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// =====================================================
// SPECIFICATION HELPERS
// =====================================================

function formatSpecificationKey(key) {
  if (!key) return "";

  return String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatSpecificationValue(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(
        ([key, item]) =>
          `${formatSpecificationKey(key)}: ${formatSpecificationValue(item)}`,
      )
      .join(" • ");
  }

  return String(value);
}

// =====================================================
// STYLES
// =====================================================

const css = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* ============ ROOT ============ */
.pd{
  --ink:#1b1436;
  --ink-2:#2c2450;
  --mut:#6f6a8a;
  --mut-2:#9a94b8;
  --paper:#fdfcff;
  --card:#ffffff;
  --line:#eeeaf9;
  --line-2:#f5f2fc;
  --pink:#ec4899;
  --purple:#8b5cf6;
  --blue:#3b82f6;
  --grad:linear-gradient(120deg,#ec4899 0%,#8b5cf6 52%,#3b82f6 100%);
  --grad-soft:linear-gradient(120deg,#fde7f3 0%,#ece5ff 50%,#e0edff 100%);
  --shadow-sm:0 12px 26px -22px rgba(27,20,54,.55);
  --shadow-md:0 26px 44px -32px rgba(139,92,246,.6);
  --shadow-lg:0 40px 70px -50px rgba(27,20,54,.6);
  background:var(--paper);
  color:var(--ink);
  font:400 15px/1.6 'Plus Jakarta Sans',system-ui,-apple-system,'Segoe UI',sans-serif;
  -webkit-font-smoothing:antialiased;
  min-height:100vh;
  padding-bottom:96px;
  overflow-x:hidden;
  width:100%;
  max-width:100vw;
}
.pd *{box-sizing:border-box;min-width:0}
.pd a{color:inherit;text-decoration:none}
.pd button,.pd input{font:inherit;color:inherit}
.pd button{cursor:pointer;touch-action:manipulation}
.pd img{max-width:100%;display:block;height:auto}
.pd :focus-visible{outline:2px solid var(--purple);outline-offset:3px;border-radius:8px}
.pd h1,.pd h2,.pd h3{
  font-family:'Fraunces',Georgia,serif;
  font-weight:500;margin:0;letter-spacing:-.02em;color:var(--ink);
  overflow-wrap:anywhere;
}
.pd-wrap{max-width:1240px;margin:0 auto;padding:0 28px;width:100%}

/* ============ HERO HEADER ============ */
.pd-top{
  position:relative;overflow:hidden;
  padding:56px 0 40px;
  background:
    radial-gradient(900px 460px at 6% -10%, #fde7f3 0%, rgba(253,231,243,0) 60%),
    radial-gradient(820px 460px at 96% -12%, #e0edff 0%, rgba(224,237,255,0) 58%),
    radial-gradient(700px 420px at 55% -20%, #ece5ff 0%, rgba(236,229,255,0) 62%),
    linear-gradient(180deg,#fefdff 0%, var(--paper) 100%);
  border-bottom:1px solid var(--line);
}
.pd-blob{position:absolute;border-radius:50%;filter:blur(70px);opacity:.5;pointer-events:none;z-index:0}
.pd-blob-1{width:380px;height:380px;left:-120px;top:-40px;background:radial-gradient(circle,#f9c9e5,transparent 70%)}
.pd-blob-2{width:420px;height:420px;right:-140px;top:-80px;background:radial-gradient(circle,#cdb8fb,transparent 70%)}
.pd-grid-tex{
  position:absolute;inset:0;pointer-events:none;z-index:0;
  background-image:radial-gradient(rgba(27,20,54,.05) 1px, transparent 1px);
  background-size:24px 24px;
  -webkit-mask-image:linear-gradient(180deg,#000 0%, transparent 88%);
  mask-image:linear-gradient(180deg,#000 0%, transparent 88%);
}
.pd-top .pd-wrap{position:relative;z-index:1}

/* breadcrumb */
.pd-crumb{
  display:flex;align-items:center;gap:8px;
  color:var(--mut);font-size:13.5px;font-weight:500;
  flex-wrap:nowrap;overflow-x:auto;
  scrollbar-width:none;-ms-overflow-style:none;
  padding-bottom:4px;
}
.pd-crumb::-webkit-scrollbar{display:none}
.pd-crumb a{white-space:nowrap;transition:color .25s ease}
.pd-crumb a:hover{
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
}
.pd-crumb > span{white-space:nowrap}
.pd-crumb-current{
  color:var(--ink-2);font-weight:600;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  max-width:60%;
}

/* ============ MAIN ============ */
.pd-main{padding-top:36px}

/* ============ CARD ============ */
.pd-card{
  display:grid;
  grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);
  gap:56px;
  align-items:start;
}

/* ---------- MEDIA ---------- */
.pd-media{position:relative}
.pd-media-frame{
  position:relative;overflow:hidden;
  border-radius:26px;
  background:
    radial-gradient(120% 90% at 50% 0%, #faf7ff 0%, #f1ecfb 100%);
  border:1px solid var(--line);
  box-shadow:0 30px 60px -46px rgba(27,20,54,.55);
  display:flex;align-items:center;justify-content:center;
  aspect-ratio:1/1;
  padding:6%;
}
.pd-media-frame img{
  width:100%;height:100%;object-fit:contain;
  border-radius:18px;
  transition:transform .8s cubic-bezier(.2,.8,.2,1);
}
.pd-media-frame:hover img{transform:scale(1.04)}
.pd-noimg{
  font-size:96px;opacity:.5;
}

/* badges */
.pd-badge{
  position:absolute;z-index:2;
  display:inline-flex;align-items:center;gap:7px;
  font-size:11.5px;font-weight:700;letter-spacing:.06em;
  padding:8px 14px;border-radius:999px;
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
  white-space:nowrap;
}
.pd-badge-off{
  left:16px;top:16px;
  color:#fff;background:var(--grad);
  box-shadow:0 16px 26px -18px rgba(139,92,246,.95);
}
.pd-badge-status{
  right:16px;top:16px;
  border:1px solid rgba(255,255,255,.7);
  background:rgba(255,255,255,.92);
  box-shadow:0 10px 22px -16px rgba(27,20,54,.5);
}
.pd-badge-status.in{color:#15803d}
.pd-badge-status.in .pd-dot{background:#22c55e}
.pd-badge-status.low{color:#b45309}
.pd-badge-status.low .pd-dot{background:#f59e0b;animation:pdPulse 1.6s ease-in-out infinite}
.pd-badge-status.out{color:#b42318}
.pd-badge-status.out .pd-dot{background:#ef4444}
.pd-badge-status.inactive{color:#475569}
.pd-dot{
  width:6px;height:6px;border-radius:50%;flex:none;
  box-shadow:0 0 0 3px rgba(0,0,0,.04);
}

/* trust row */
.pd-trust{
  display:flex;flex-wrap:wrap;gap:8px 18px;
  margin-top:20px;
  font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;
  color:var(--mut);
}
.pd-trust span{display:inline-flex;align-items:center;gap:7px}
.pd-trust b{
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
  font-weight:700;
}

/* ---------- DETAILS ---------- */
.pd-details{
  display:flex;flex-direction:column;gap:14px;
  min-width:0;
}

.pd-brand{
  font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
}

.pd-cat{
  align-self:flex-start;
  font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  color:var(--purple);
  padding:5px 12px;border-radius:999px;
  background:var(--grad-soft);
}

.pd-title{
  font-size:clamp(30px,4.2vw,52px);
  line-height:1.06;
  letter-spacing:-.03em;
  margin-top:2px;
  max-width:20ch;
}

/* rating */
.pd-rating{
  display:flex;align-items:center;flex-wrap:wrap;gap:9px;
  font-size:13px;color:var(--mut);
  margin-top:4px;
}
.pd-rating b{color:var(--ink);font-weight:700;font-size:13.5px}
.pd-rating small{color:var(--mut-2)}
.pd-stars{
  background:linear-gradient(90deg,#f59e0b var(--r),#e6e3f3 var(--r));
  -webkit-background-clip:text;background-clip:text;color:transparent;
  letter-spacing:2px;font-size:15px;line-height:1;flex:none;
}

/* price */
.pd-price-block{margin-top:8px}
.pd-price-row{
  display:flex;align-items:baseline;flex-wrap:wrap;gap:12px;
}
.pd-price{
  font-family:'Fraunces',Georgia,serif;font-weight:600;
  font-size:clamp(30px,4.2vw,44px);
  letter-spacing:-.03em;color:var(--ink);
  line-height:1;
}
.pd-price-old{color:#b3aecb;font-size:16px;font-weight:500}
.pd-price-off{
  display:inline-flex;align-items:center;
  font-size:12px;font-weight:700;letter-spacing:.05em;
  color:#15803d;
  background:#f0fdf4;
  padding:4px 10px;border-radius:999px;
}
.pd-savings{
  margin-top:8px;font-size:13px;font-weight:700;color:#15803d;
}

/* status pill */
.pd-status{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.pd-pill{
  display:inline-flex;align-items:center;gap:7px;
  font-size:11.5px;font-weight:700;letter-spacing:.04em;
  padding:6px 12px;border-radius:999px;
}
.pd-pill.in{color:#15803d;background:#f0fdf4}
.pd-pill.in .pd-dot{background:#22c55e}
.pd-pill.low{color:#b45309;background:#fffbeb}
.pd-pill.low .pd-dot{background:#f59e0b;animation:pdPulse 1.6s ease-in-out infinite}
.pd-pill.out{color:#b42318;background:#fef2f2}
.pd-pill.out .pd-dot{background:#ef4444}
.pd-pill.inactive{color:#475569;background:#f1f5f9}

/* sku */
.pd-sku{
  display:flex;align-items:center;gap:10px;
  font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--mut-2);font-weight:700;
  margin-top:2px;
}
.pd-sku b{
  color:var(--ink-2);font-weight:700;
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
  letter-spacing:.02em;font-size:12px;
}

/* buy box */
.pd-buy-box{
  margin-top:14px;
  padding:20px;
  border-radius:20px;
  background:linear-gradient(180deg,#fbfaff 0%, #f5f2fc 100%);
  border:1px solid var(--line);
  display:flex;flex-direction:column;gap:16px;
}
.pd-qty-row{
  display:flex;align-items:center;justify-content:space-between;
  gap:16px;flex-wrap:wrap;
}
.pd-qty-copy{display:flex;flex-direction:column;line-height:1.3}
.pd-qty-label{font-size:13px;font-weight:700;color:var(--ink)}
.pd-qty-note{font-size:11.5px;color:var(--mut);margin-top:2px}

.pd-qty{
  display:inline-flex;align-items:center;
  background:var(--card);
  border:1px solid var(--line);
  border-radius:999px;
  padding:4px;
  box-shadow:0 1px 2px rgba(27,20,54,.04);
}
.pd-qty button{
  width:36px;height:36px;border-radius:50%;
  border:0;background:transparent;color:var(--ink-2);
  font-size:18px;font-weight:600;line-height:1;
  display:grid;place-items:center;
  transition:background .25s ease,color .25s ease,transform .25s ease;
}
.pd-qty button:hover:not(:disabled){
  background:var(--grad);color:#fff;transform:scale(1.05);
}
.pd-qty button:disabled{opacity:.3;cursor:not-allowed}
.pd-qty-val{
  min-width:44px;text-align:center;
  font-weight:700;font-size:15px;color:var(--ink);
  padding:0 4px;
}

.pd-total{
  display:flex;align-items:center;justify-content:space-between;
  gap:12px;
  padding-top:14px;
  border-top:1px dashed rgba(139,92,246,.25);
}
.pd-total span{
  font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  color:var(--mut);
}
.pd-total strong{
  font-family:'Fraunces',Georgia,serif;font-weight:600;
  font-size:24px;letter-spacing:-.02em;color:var(--ink);
}

.pd-actions{
  display:grid;grid-template-columns:1fr 1fr;gap:10px;
}
.pd-actions button{
  min-height:52px;border-radius:999px;
  font-weight:600;font-size:14px;letter-spacing:.01em;
  border:1px solid transparent;
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  transition:background .3s ease,color .3s ease,border-color .3s ease,
             transform .3s ease,box-shadow .3s ease;
}
.pd-btn-add{
  background:var(--grad);color:#fff;
  background-size:180% 180%;background-position:0% 50%;
  box-shadow:0 16px 28px -18px rgba(139,92,246,.95);
}
.pd-btn-add:hover{
  background-position:100% 50%;transform:translateY(-1px);
  box-shadow:0 22px 36px -18px rgba(139,92,246,1);
}
.pd-btn-add svg{flex:none}
.pd-btn-buy{
  background:var(--card);color:var(--ink);border-color:var(--line);
}
.pd-btn-buy:hover{
  background:var(--ink);color:#fff;border-color:var(--ink);
  transform:translateY(-1px);
}

.pd-btn-disabled{
  margin-top:14px;width:100%;min-height:54px;
  border-radius:999px;border:1px dashed var(--line);
  background:var(--line-2);color:var(--mut);
  font-weight:600;font-size:14px;
  cursor:not-allowed;
}

/* sections */
.pd-section{
  margin-top:22px;padding-top:22px;
  border-top:1px solid var(--line);
}
.pd-section h2{
  font-size:18px;font-weight:500;letter-spacing:-.015em;
  margin-bottom:12px;
}
.pd-section p{
  margin:0;color:var(--mut);font-size:14.5px;line-height:1.75;
  max-width:62ch;
}

/* specs */
.pd-specs{
  border:1px solid var(--line);
  border-radius:16px;
  overflow:hidden;
  background:var(--card);
}
.pd-spec-row{
  display:grid;
  grid-template-columns:minmax(120px,.7fr) minmax(0,1.3fr);
  border-bottom:1px solid var(--line-2);
}
.pd-spec-row:last-child{border-bottom:0}
.pd-spec-key{
  padding:12px 16px;
  background:var(--line-2);
  color:var(--ink-2);
  font-size:11.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
}
.pd-spec-val{
  padding:12px 16px;
  color:var(--ink-2);
  font-size:13.5px;word-break:break-word;
}

/* ============ INFO CARDS ============ */
.pd-info-grid{
  display:grid;grid-template-columns:repeat(3,1fr);gap:18px;
  margin-top:56px;
}
.pd-info-card{
  position:relative;overflow:hidden;
  display:flex;align-items:flex-start;gap:14px;
  padding:22px;
  background:var(--card);
  border:1px solid var(--line);
  border-radius:20px;
  box-shadow:var(--shadow-sm);
  transition:transform .4s cubic-bezier(.2,.8,.2,1),box-shadow .4s ease,border-color .4s ease;
}
.pd-info-card::after{
  content:"";position:absolute;right:-40px;top:-40px;width:140px;height:140px;border-radius:50%;
  background:var(--grad-soft);opacity:.45;z-index:0;pointer-events:none;
}
.pd-info-card:hover{
  transform:translateY(-4px);
  box-shadow:var(--shadow-md);
  border-color:transparent;
}
.pd-info-icon{
  position:relative;z-index:1;flex:none;
  width:44px;height:44px;border-radius:12px;
  display:grid;place-items:center;
  background:var(--grad);color:#fff;
  font-size:18px;font-weight:700;
  box-shadow:0 14px 22px -16px rgba(139,92,246,.9);
}
.pd-info-card > div:last-child{position:relative;z-index:1}
.pd-info-card h3{
  font-size:14.5px;font-weight:600;margin-bottom:4px;
}
.pd-info-card p{
  margin:0;color:var(--mut);font-size:13px;line-height:1.55;
}

/* ============ TOAST ============ */
.pd-toast{
  position:fixed;top:22px;right:22px;z-index:99;
  display:flex;gap:12px;align-items:center;
  padding:14px 20px;border-radius:16px;
  font-weight:500;font-size:14px;max-width:340px;
  background:rgba(255,255,255,.94);
  -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
  border:1px solid var(--line);
  box-shadow:0 34px 60px -36px rgba(27,20,54,.75);
  animation:pdIn .32s cubic-bezier(.2,.8,.2,1);
}
.pd-toast i{
  font-style:normal;flex:none;width:24px;height:24px;border-radius:50%;
  display:grid;place-items:center;font-size:12px;color:#fff;
}
.pd-toast.ok i{background:var(--grad)}
.pd-toast.ok{box-shadow:0 34px 60px -36px rgba(139,92,246,.85),0 0 0 1px rgba(139,92,246,.14)}
.pd-toast.err i{background:#e11d48}
.pd-toast.err{box-shadow:0 34px 60px -36px rgba(225,29,72,.6),0 0 0 1px rgba(225,29,72,.14)}

/* ============ STATES ============ */
.pd-state{
  min-height:80vh;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:40px 24px;
}
.pd-state h1,.pd-state h3{
  font-size:clamp(24px,3.4vw,34px);
  margin:18px 0 10px;
}
.pd-state p{
  color:var(--mut);max-width:44ch;line-height:1.7;margin:0 0 26px;
}
.pd-state-icon{
  width:96px;height:96px;border-radius:50%;
  display:grid;place-items:center;
  background:var(--grad-soft);
  font-size:44px;
}
.pd-spinner{
  width:46px;height:46px;border-radius:50%;
  border:4px solid rgba(139,92,246,.18);
  border-top-color:var(--purple);
  animation:pdSpin .9s linear infinite;
}
.pd-btn{
  display:inline-flex;align-items:center;gap:8px;
  padding:14px 30px;border-radius:999px;
  background:var(--grad);color:#fff;
  background-size:180% 180%;background-position:0% 50%;
  font-weight:600;font-size:14px;
  box-shadow:0 16px 28px -18px rgba(139,92,246,.95);
  transition:background-position .5s ease,transform .3s ease,box-shadow .3s ease;
}
.pd-btn:hover{
  background-position:100% 50%;transform:translateY(-1px);
  box-shadow:0 22px 36px -18px rgba(139,92,246,1);
}

/* ============ KEYFRAMES ============ */
@keyframes pdIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
@keyframes pdSpin{to{transform:rotate(360deg)}}
@keyframes pdPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.35);opacity:.7}}

/* ============ RESPONSIVE ============ */
@media(max-width:1080px){
  .pd-card{gap:40px}
}

@media(max-width:980px){
  .pd-card{
    grid-template-columns:1fr;
    gap:32px;
  }
  .pd-media-frame{aspect-ratio:1/.85}
  .pd-info-grid{grid-template-columns:1fr 1fr}
  .pd-info-grid .pd-info-card:last-child{grid-column:span 2}
}

@media(max-width:720px){
  .pd-top{padding:42px 0 32px}
  .pd-main{padding-top:24px}
  .pd-title{max-width:100%}
}

@media(max-width:640px){
  .pd-wrap{padding:0 18px}
  .pd-card{gap:26px}
  .pd-media-frame{
    aspect-ratio:1/1;
    border-radius:20px;
    padding:5%;
  }
  .pd-badge{font-size:10.5px;padding:6px 11px}
  .pd-badge-off{left:12px;top:12px}
  .pd-badge-status{right:12px;top:12px}
  .pd-trust{gap:6px 14px;font-size:11px}

  .pd-title{font-size:clamp(26px,7.5vw,36px)}
  .pd-price{font-size:clamp(26px,7.5vw,36px)}
  .pd-price-old{font-size:14px}

  .pd-buy-box{padding:16px;border-radius:16px;gap:14px}
  .pd-actions{grid-template-columns:1fr}
  .pd-total strong{font-size:20px}

  .pd-section{margin-top:18px;padding-top:18px}
  .pd-section h2{font-size:16.5px}
  .pd-section p{font-size:14px}

  .pd-spec-row{grid-template-columns:1fr}
  .pd-spec-key{border-bottom:1px solid var(--line-2)}

  .pd-info-grid{
    grid-template-columns:1fr;gap:12px;
    margin-top:40px;
  }
  .pd-info-grid .pd-info-card:last-child{grid-column:auto}
  .pd-info-card{padding:18px;border-radius:16px}

  .pd-toast{
    top:14px;left:14px;right:14px;max-width:none;
    padding:12px 14px;font-size:13px;gap:10px;
  }

  .pd-crumb{font-size:12.5px}
  .pd-crumb-current{max-width:50%}
}

@media(max-width:420px){
  .pd-wrap{padding:0 14px}
  .pd-title{font-size:clamp(22px,7vw,30px)}
  .pd-price{font-size:clamp(24px,7vw,30px)}
  .pd-qty button{width:32px;height:32px;font-size:16px}
  .pd-qty-val{min-width:36px;font-size:14px}
  .pd-actions button{min-height:46px;font-size:13px}
  .pd-media-frame{padding:4%}
}

/* --- Reduced motion --- */
@media(prefers-reduced-motion:reduce){
  .pd *{animation:none!important;transition:none!important}
}
`;

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../lib/api";

// ---------- Content ----------
const PAGE_SIZE = 12;
const SORTS = [
  ["newest", "Newest"],
  ["name-asc", "Name: A to Z"],
  ["price-low", "Price: low to high"],
  ["price-high", "Price: high to low"],
  ["rating", "Highest rated"],
  ["stock", "Most in stock"],
  ["discount", "Biggest discount"],
];

// ---------- Helpers ----------
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const idOf = (p) => p._id || p.id;

const sellPrice = (p) => {
  const price = Number(p.price) || 0;
  const sale = Number(p.salePrice);
  return p.salePrice != null && sale > 0 && sale < price ? sale : price;
};

const discountOf = (p) => {
  const price = Number(p.price) || 0;
  const sp = sellPrice(p);
  if (Number(p.discount) > 0) return Number(p.discount);
  return sp < price && price > 0 ? Math.round(((price - sp) / price) * 100) : 0;
};

const readCart = () => {
  try {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
};

// ---------- Page ----------
export default function ProductsPage() {
  const router = useRouter();
  const timer = useRef(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });

  const showToast = useCallback((type, message) => {
    clearTimeout(timer.current);
    setToast({ show: true, type, message });
    timer.current = setTimeout(
      () => setToast({ show: false, type: "success", message: "" }),
      2800,
    );
  }, []);

  const getProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/products");
      const data =
        response.data.products || response.data.data || response.data || [];
      setProducts(
        Array.isArray(data)
          ? data.filter((p) => !p.status || p.status.toLowerCase() === "active")
          : [],
      );
    } catch (error) {
      console.error(error.response?.data || error.message);
      showToast(
        "error",
        error.response?.data?.message || "Failed to load products.",
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    getProducts();
    return () => clearTimeout(timer.current);
  }, [getProducts]);

  useEffect(
    () => setVisible(PAGE_SIZE),
    [search, category, sortBy, inStockOnly],
  );

  const isLoggedIn = () =>
    typeof window !== "undefined" && Boolean(localStorage.getItem("token"));

  const requireLogin = () => {
    showToast("error", "Log in to continue. Taking you there now.");
    setTimeout(() => router.push("/login"), 700);
  };

  // ----- Derived -----
  const categories = useMemo(
    () =>
      [...new Set(products.map((p) => p.category).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [products],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (!inStockOnly || Number(p.stock) > 0) &&
        (!q ||
          [p.name, p.brand, p.category, p.sku].some((v) =>
            v?.toString().toLowerCase().includes(q),
          )),
    );
    const sorters = {
      "name-asc": (a, b) => (a.name || "").localeCompare(b.name || ""),
      "price-low": (a, b) => sellPrice(a) - sellPrice(b),
      "price-high": (a, b) => sellPrice(b) - sellPrice(a),
      rating: (a, b) => Number(b.rating || 0) - Number(a.rating || 0),
      stock: (a, b) => Number(b.stock || 0) - Number(a.stock || 0),
      discount: (a, b) => discountOf(b) - discountOf(a),
      newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    };
    return [...list].sort(sorters[sortBy] || sorters.newest);
  }, [products, search, category, sortBy, inStockOnly]);

  const shown = filtered.slice(0, visible);
  const hasFilters =
    search || category !== "All" || sortBy !== "newest" || inStockOnly;

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setSortBy("newest");
    setInStockOnly(false);
  };

  // ----- Actions -----
  const upsertCart = (product, quantityFor) => {
    const cart = readCart();
    const id = idOf(product);
    const index = cart.findIndex((item) => idOf(item) === id);
    const stock = Number(product.stock || 0);

    if (index === -1) return [...cart, { ...product, quantity: 1 }];

    const quantity = quantityFor(Number(cart[index].quantity || 0), stock);
    if (quantity === null) return null;
    const updated = [...cart];
    updated[index] = { ...cart[index], ...product, quantity };
    return updated;
  };

  const addToCart = (product) => {
    if (!isLoggedIn()) return requireLogin();
    const stock = Number(product.stock || 0);
    if (stock <= 0) return showToast("error", "This product is out of stock.");

    const updated = upsertCart(product, (qty, max) =>
      qty >= max ? null : qty + 1,
    );
    if (!updated)
      return showToast(
        "error",
        `Only ${stock} item${stock === 1 ? "" : "s"} available.`,
      );

    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart-change"));
    showToast("success", `${product.name} added to cart.`);
  };

  const orderNow = (product) => {
    if (!isLoggedIn()) return requireLogin();
    if (Number(product.stock || 0) <= 0)
      return showToast("error", "This product is out of stock.");

    const updated = upsertCart(product, () => 1);
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart-change"));
    router.push("/checkout");
  };

  return (
    <main className="pp">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div aria-live="polite">
        {toast.show && (
          <div
            role="status"
            className={`pp-toast ${toast.type === "success" ? "ok" : "err"}`}
          >
            <i>{toast.type === "success" ? "✓" : "!"}</i>
            <span>{toast.message}</span>
          </div>
        )}
      </div>

      {/* HEADER */}
      <header className="pp-top">
        <span className="pp-blob pp-blob-1" aria-hidden="true" />
        <span className="pp-blob pp-blob-2" aria-hidden="true" />
        <span className="pp-grid-tex" aria-hidden="true" />

        <div className="pp-wrap">
          <h1>
            Everything in the <em>shop</em>
          </h1>
          <p>
            Search, filter and sort to find what you need. Free delivery on
            eligible orders.
          </p>

          <div className="pp-find">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, brand, category or SKU"
              aria-label="Search products"
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search">
                ×
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="pp-wrap pp-main">
        {/* CONTROLS */}
        {!loading && products.length > 0 && (
          <div className="pp-bar">
            <div
              className="pp-chips"
              role="group"
              aria-label="Filter by category"
            >
              {["All", ...categories].map((c) => (
                <button
                  key={c}
                  className={category === c ? "on" : ""}
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                >
                  {c === "All" ? "All categories" : c}
                </button>
              ))}
            </div>

            <div className="pp-ctl">
              <label className="pp-switch">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                />
                <span aria-hidden="true" />
                In stock only
              </label>

              <div className="pp-select">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort products"
                >
                  {SORTS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="pp-count">
          <span>
            {loading ? (
              "Loading products…"
            ) : (
              <>
                <b>{filtered.length}</b>{" "}
                {filtered.length === 1 ? "product" : "products"} found
              </>
            )}
          </span>
          {hasFilters && !loading && (
            <button onClick={clearFilters}>Clear all filters</button>
          )}
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="pp-grid" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="pp-sk" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="pp-empty">
            <div>📦</div>
            <h2>No products yet</h2>
            <p>
              New arrivals are on the way. Check back soon or reload the list.
            </p>
            <button className="pp-btn" onClick={getProducts}>
              Reload products
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="pp-empty">
            <div>🔎</div>
            <h2>No matching products</h2>
            <p>Try a shorter search, another category, or remove a filter.</p>
            <button className="pp-btn" onClick={clearFilters}>
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="pp-grid">
              {shown.map((p) => {
                const id = idOf(p);
                const stock = Number(p.stock || 0);
                const price = Number(p.price || 0);
                const sp = sellPrice(p);
                const off = discountOf(p);
                const out = stock <= 0;
                const low = stock > 0 && stock <= 5;
                const rating = Math.min(5, Math.max(0, Number(p.rating) || 0));
                const reviews = Number(p.reviews) || 0;

                return (
                  <article
                    key={id}
                    className={`pp-card ${out ? "is-out" : ""}`}
                  >
                    {/* Media */}
                    <div className="pp-media">
                      <Link
                        href={`/products/${id}`}
                        className="pp-media-link"
                        aria-label={`View ${p.name || "product"}`}
                      >
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name || "Product"}
                            loading="lazy"
                          />
                        ) : (
                          <div className="pp-noimg">📦</div>
                        )}
                      </Link>

                      {/* Top-left discount badge */}
                      {off > 0 && !out && (
                        <span className="pp-badge pp-badge-off">−{off}%</span>
                      )}

                      {/* Top-right wishlist */}
                      <button
                        type="button"
                        className="pp-wish"
                        aria-label="Add to wishlist"
                        onClick={(e) => {
                          e.preventDefault();
                          showToast(
                            "success",
                            `${p.name || "Product"} saved to wishlist.`,
                          );
                        }}
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
                          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
                        </svg>
                      </button>

                      {/* Hover quick-view overlay */}
                      <Link
                        href={`/products/${id}`}
                        className="pp-quick"
                        aria-hidden="true"
                        tabIndex={-1}
                      >
                        Quick view
                      </Link>

                      {/* Sold out veil */}
                      {out && (
                        <div className="pp-sold">
                          <span>Sold out</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="pp-info">
                      <div className="pp-meta">
                        <span className="pp-cat">
                          {p.category || "Uncategorized"}
                        </span>
                        {p.brand && <span className="pp-brand">{p.brand}</span>}
                      </div>

                      <Link href={`/products/${id}`} className="pp-title">
                        {p.name || "Untitled product"}
                      </Link>

                      <div className="pp-rating">
                        <span
                          className="pp-stars"
                          style={{ "--r": `${(rating / 5) * 100}%` }}
                          role="img"
                          aria-label={`${rating.toFixed(1)} out of 5`}
                        >
                          ★★★★★
                        </span>
                        <b>{rating.toFixed(1)}</b>
                        <small>
                          {reviews > 0 ? `(${reviews})` : "No reviews"}
                        </small>
                      </div>

                      <div className="pp-price">
                        <b>{money(sp)}</b>
                        {sp < price && <s>{money(price)}</s>}
                      </div>

                      <div
                        className={`pp-status ${out ? "out" : low ? "low" : "in"}`}
                      >
                        <span className="pp-dot" aria-hidden="true" />
                        <span>
                          {out
                            ? "Out of stock"
                            : low
                              ? `Only ${stock} left`
                              : "In stock"}
                        </span>
                      </div>

                      {p.sku && <small className="pp-sku">SKU · {p.sku}</small>}
                    </div>

                    {/* Actions */}
                    <div className="pp-acts">
                      <button
                        className="pp-add"
                        onClick={() => addToCart(p)}
                        disabled={out}
                        aria-label={`Add ${p.name || "product"} to cart`}
                      >
                        <svg
                          width="15"
                          height="15"
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
                        <span>Add</span>
                      </button>
                      <button
                        className="pp-buy"
                        onClick={() => orderNow(p)}
                        disabled={out}
                        aria-label={`Buy ${p.name || "product"} now`}
                      >
                        <span>Buy now</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {visible < filtered.length && (
              <div className="pp-more">
                <p>
                  Showing {shown.length} of {filtered.length}
                </p>
                <button
                  className="pp-ghost"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                >
                  Show more products
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

// ---------- Styles ----------
const css = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* ============ ROOT ============ */
.pp{
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
  --r-md:20px;
  --r-lg:26px;
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
.pp *{box-sizing:border-box;min-width:0}
.pp a{color:inherit;text-decoration:none}
.pp button,.pp input,.pp select{font:inherit;color:inherit}
.pp button{cursor:pointer;touch-action:manipulation}
.pp img{max-width:100%;display:block;height:auto}
.pp :focus-visible{outline:2px solid var(--purple);outline-offset:3px;border-radius:8px}
.pp h1,.pp h2,.pp h3{
  font-family:'Fraunces',Georgia,serif;
  font-weight:500;margin:0;letter-spacing:-.02em;color:var(--ink);
  overflow-wrap:anywhere;
}
.pp-wrap{max-width:1240px;margin:0 auto;padding:0 28px;width:100%}

/* ============ HEADER ============ */
.pp-top{
  position:relative;overflow:hidden;
  padding:64px 0 72px;
  background:
    radial-gradient(900px 460px at 6% -10%, #fde7f3 0%, rgba(253,231,243,0) 60%),
    radial-gradient(820px 460px at 96% -12%, #e0edff 0%, rgba(224,237,255,0) 58%),
    radial-gradient(700px 420px at 55% -20%, #ece5ff 0%, rgba(236,229,255,0) 62%),
    linear-gradient(180deg,#fefdff 0%, var(--paper) 100%);
  border-bottom:1px solid var(--line);
}
.pp-blob{position:absolute;border-radius:50%;filter:blur(70px);opacity:.5;pointer-events:none;z-index:0}
.pp-blob-1{width:380px;height:380px;left:-120px;top:-40px;background:radial-gradient(circle,#f9c9e5,transparent 70%)}
.pp-blob-2{width:420px;height:420px;right:-140px;top:-80px;background:radial-gradient(circle,#cdb8fb,transparent 70%)}
.pp-grid-tex{
  position:absolute;inset:0;pointer-events:none;z-index:0;
  background-image:radial-gradient(rgba(27,20,54,.05) 1px, transparent 1px);
  background-size:24px 24px;
  -webkit-mask-image:linear-gradient(180deg,#000 0%, transparent 88%);
  mask-image:linear-gradient(180deg,#000 0%, transparent 88%);
}
.pp-top .pp-wrap{position:relative;z-index:1}

.pp-crumb{
  display:flex;gap:8px;color:var(--mut);font-size:13.5px;margin-bottom:20px;
  font-weight:500;flex-wrap:wrap;
}
.pp-crumb a{transition:color .25s ease}
.pp-crumb a:hover{
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
}
.pp-crumb span[aria-current]{color:var(--ink-2);font-weight:600}

.pp-top h1{
  font-size:clamp(36px,5.6vw,72px);
  font-weight:500;line-height:1.05;letter-spacing:-.03em;
  max-width:16ch;
}
.pp-top h1 em{
  font-style:italic;font-weight:600;
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
}
.pp-top p{
  color:var(--mut);font-size:16.5px;line-height:1.7;
  max-width:52ch;margin:22px 0 32px;
}

.pp-find{
  display:flex;align-items:center;gap:10px;
  max-width:560px;width:100%;
  background:var(--card);
  border:1px solid var(--line);
  border-radius:999px;
  padding:7px 7px 7px 20px;
  color:var(--mut);
  box-shadow:0 1px 2px rgba(27,20,54,.04),0 26px 44px -32px rgba(139,92,246,.55);
  transition:border-color .3s ease,box-shadow .3s ease,transform .3s ease;
}
.pp-find:hover{transform:translateY(-1px)}
.pp-find:focus-within{
  border-color:var(--purple);
  box-shadow:0 0 0 4px rgba(139,92,246,.12),0 26px 44px -32px rgba(139,92,246,.6);
}
.pp-find input{
  flex:1;min-width:0;border:0;outline:0;background:none;
  padding:13px 0;font-size:15px;color:var(--ink);width:100%;
}
.pp-find input::placeholder{color:#a9a4c0}
.pp-find input:focus-visible{outline:0}
.pp-find button{
  border:0;background:var(--line-2);color:var(--ink-2);
  border-radius:50%;width:26px;height:26px;line-height:1;font-size:16px;
  flex:none;transition:background .25s ease,color .25s ease;
}
.pp-find button:hover{background:var(--grad);color:#fff}

/* ============ MAIN ============ */
.pp-main{padding-top:32px}

.pp-bar{
  display:flex;justify-content:space-between;align-items:center;
  gap:16px 24px;flex-wrap:wrap;padding-bottom:20px;
  border-bottom:1px solid var(--line);
}
.pp-chips{display:flex;gap:8px;flex-wrap:wrap}
.pp-chips button{
  border:1px solid var(--line);background:var(--card);
  border-radius:999px;padding:8px 18px;
  font-weight:600;font-size:13px;color:var(--ink-2);
  transition:border-color .3s ease,color .3s ease,background .3s ease,transform .3s ease,box-shadow .3s ease;
}
.pp-chips button:hover{border-color:var(--purple);color:var(--purple);transform:translateY(-1px)}
.pp-chips button.on{
  background:var(--grad);border-color:transparent;color:#fff;
  box-shadow:0 14px 26px -18px rgba(139,92,246,.95);
}

.pp-ctl{display:flex;align-items:center;gap:20px;flex-wrap:wrap}
.pp-select{position:relative;display:inline-flex;align-items:center}
.pp-select::after{
  content:"";position:absolute;right:16px;top:50%;width:8px;height:8px;
  border-right:2px solid var(--mut);border-bottom:2px solid var(--mut);
  transform:translateY(-70%) rotate(45deg);pointer-events:none;
  transition:border-color .25s ease;
}
.pp-ctl select{
  background:var(--card);border:1px solid var(--line);
  border-radius:999px;padding:11px 42px 11px 18px;
  font-weight:600;font-size:13.5px;color:var(--ink-2);
  cursor:pointer;outline:none;
  -webkit-appearance:none;appearance:none;
  transition:border-color .3s ease,box-shadow .3s ease,color .25s ease;
}
.pp-select:hover::after{border-color:var(--purple)}
.pp-select:hover select{border-color:var(--purple);color:var(--purple)}
.pp-select select:focus{border-color:var(--purple);box-shadow:0 0 0 4px rgba(139,92,246,.12)}

.pp-switch{
  display:inline-flex;align-items:center;gap:10px;
  font-weight:600;font-size:13.5px;color:var(--ink-2);
  cursor:pointer;position:relative;padding:8px 4px;
}
.pp-switch input{position:absolute;opacity:0;width:1px;height:1px}
.pp-switch span{
  width:42px;height:24px;border-radius:999px;
  background:var(--line);position:relative;
  transition:background .3s ease;flex:none;
}
.pp-switch span::after{
  content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;
  border-radius:50%;background:#fff;
  box-shadow:0 2px 6px rgba(27,20,54,.25);
  transition:transform .3s ease;
}
.pp-switch input:checked+span{background:var(--grad)}
.pp-switch input:checked+span::after{transform:translateX(18px)}
.pp-switch input:focus-visible+span{outline:2px solid var(--purple);outline-offset:3px}

.pp-count{
  display:flex;justify-content:space-between;align-items:center;
  gap:12px;color:var(--mut);margin:20px 0 24px;font-size:14px;
  flex-wrap:wrap;
}
.pp-count b{color:var(--ink);font-weight:700}
.pp-count button{
  border:0;background:none;color:var(--purple);
  font-weight:600;padding:0;font-size:13.5px;
  transition:color .25s ease;
}
.pp-count button:hover{
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
}

/* ============ GRID ============ */
.pp-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(252px,1fr));
  gap:26px;
}

/* ============ CARD ============ */
.pp-card{
  position:relative;background:var(--card);
  border:1px solid var(--line);border-radius:22px;
  overflow:hidden;display:flex;flex-direction:column;min-width:0;
  box-shadow:0 18px 40px -34px rgba(27,20,54,.55);
  transition:transform .5s cubic-bezier(.2,.8,.2,1),
             box-shadow .5s ease,
             border-color .5s ease;
  isolation:isolate;
}
.pp-card::before{
  content:"";position:absolute;inset:0;border-radius:inherit;
  pointer-events:none;z-index:3;padding:1px;opacity:0;
  background:var(--grad);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;
  transition:opacity .5s ease;
}
.pp-card:hover{
  transform:translateY(-8px);
  box-shadow:0 46px 70px -40px rgba(139,92,246,.55),
             0 22px 30px -26px rgba(27,20,54,.4);
  border-color:transparent;
}
.pp-card:hover::before{opacity:1}
.pp-card.is-out{opacity:.96}

/* ---- Media ---- */
.pp-media{
  position:relative;aspect-ratio:1/1;overflow:hidden;
  background:
    radial-gradient(120% 90% at 50% 0%, #faf7ff 0%, #f1ecfb 100%);
}
.pp-media-link{display:block;width:100%;height:100%}
.pp-media img{
  width:100%;height:100%;object-fit:cover;display:block;
  transition:transform .9s cubic-bezier(.2,.8,.2,1);
}
.pp-card:hover .pp-media img{transform:scale(1.08)}
.pp-card.is-out .pp-media img{filter:grayscale(1) blur(.3px);opacity:.55}
.pp-noimg{
  height:100%;display:grid;place-items:center;font-size:56px;opacity:.5;
}

/* soft bottom fade inside media for label legibility */
.pp-media::after{
  content:"";position:absolute;inset:auto 0 0 0;height:46%;
  pointer-events:none;z-index:1;opacity:0;
  background:linear-gradient(180deg,rgba(27,20,54,0) 0%,rgba(27,20,54,.32) 100%);
  transition:opacity .4s ease;
}
.pp-card:hover .pp-media::after{opacity:1}

/* badges */
.pp-badge{
  position:absolute;z-index:2;
  display:inline-flex;align-items:center;
  font-size:11px;font-weight:700;letter-spacing:.06em;
  padding:6px 11px;border-radius:999px;
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
}
.pp-badge-off{
  left:12px;top:12px;
  color:#fff;background:var(--grad);
  box-shadow:0 14px 24px -16px rgba(139,92,246,.95);
}

/* wishlist */
.pp-wish{
  position:absolute;right:12px;top:12px;z-index:2;
  width:34px;height:34px;border-radius:50%;
  display:grid;place-items:center;
  background:rgba(255,255,255,.9);
  border:1px solid rgba(255,255,255,.85);
  color:var(--ink-2);
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
  box-shadow:0 10px 20px -14px rgba(27,20,54,.5);
  transition:transform .3s ease,color .3s ease,background .3s ease,border-color .3s ease;
}
.pp-wish:hover{
  background:var(--grad);color:#fff;border-color:transparent;
  transform:scale(1.08);
}
.pp-wish svg{display:block}

/* quick view */
.pp-quick{
  position:absolute;left:14px;right:14px;bottom:14px;z-index:2;
  padding:11px 16px;border-radius:999px;
  text-align:center;font-weight:600;font-size:12.5px;letter-spacing:.02em;
  color:#fff;background:rgba(27,20,54,.85);
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
  border:1px solid rgba(255,255,255,.14);
  opacity:0;transform:translateY(10px);
  transition:opacity .35s ease,transform .35s ease,background .35s ease;
}
.pp-card:hover .pp-quick{opacity:1;transform:translateY(0)}
.pp-quick:hover{background:var(--grad)}

/* sold out veil */
.pp-sold{
  position:absolute;inset:0;z-index:2;
  display:grid;place-items:center;
  background:rgba(253,252,255,.7);
  -webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);
}
.pp-sold span{
  font-family:'Fraunces',Georgia,serif;font-weight:600;
  font-size:13.5px;letter-spacing:.16em;text-transform:uppercase;
  padding:9px 18px;border-radius:999px;
  background:rgba(27,20,54,.9);color:#fff;
  box-shadow:0 18px 30px -18px rgba(27,20,54,.9);
}

/* ---- Info ---- */
.pp-info{
  padding:18px 18px 14px;display:flex;flex-direction:column;gap:9px;
  flex:1;min-width:0;
}
.pp-meta{
  display:flex;justify-content:space-between;align-items:center;gap:10px;
  font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
}
.pp-cat{
  color:var(--purple);
  padding:4px 10px;border-radius:999px;
  background:var(--grad-soft);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  max-width:65%;
  letter-spacing:.08em;
}
.pp-brand{
  color:var(--mut-2);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  font-weight:700;letter-spacing:.12em;
}

.pp-title{
  font-family:'Fraunces',Georgia,serif;
  font-size:17.5px;font-weight:600;line-height:1.32;
  color:var(--ink);letter-spacing:-.015em;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
  overflow:hidden;min-height:calc(1.32em * 2);
  transition:color .3s ease;
  overflow-wrap:anywhere;
}
.pp-title:hover{
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
}

.pp-rating{
  display:flex;align-items:center;gap:8px;
  font-size:12px;color:var(--mut);flex-wrap:wrap;
}
.pp-rating b{color:var(--ink);font-weight:700;font-size:12.5px}
.pp-rating small{color:var(--mut-2)}
.pp-stars{
  background:linear-gradient(90deg,#f59e0b var(--r),#e6e3f3 var(--r));
  -webkit-background-clip:text;background-clip:text;color:transparent;
  letter-spacing:1.5px;font-size:13px;line-height:1;flex:none;
}

.pp-price{
  display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;
  margin-top:2px;
}
.pp-price b{
  font-family:'Fraunces',Georgia,serif;font-weight:600;
  font-size:24px;letter-spacing:-.025em;color:var(--ink);
}
.pp-price s{color:#b3aecb;font-size:12.5px;font-weight:500}

.pp-status{
  display:inline-flex;align-items:center;gap:7px;
  font-size:11.5px;font-weight:700;letter-spacing:.04em;
  padding:5px 11px;border-radius:999px;
  width:fit-content;
}
.pp-status .pp-dot{
  width:6px;height:6px;border-radius:50%;flex:none;
  box-shadow:0 0 0 3px rgba(0,0,0,.04);
}
.pp-status.in{color:#15803d;background:#f0fdf4}
.pp-status.in .pp-dot{background:#22c55e}
.pp-status.low{color:#b45309;background:#fffbeb}
.pp-status.low .pp-dot{background:#f59e0b;animation:ppPulse 1.6s ease-in-out infinite}
.pp-status.out{color:#b42318;background:#fef2f2}
.pp-status.out .pp-dot{background:#ef4444}

.pp-sku{
  color:#b3aecb;font-size:11px;font-weight:500;letter-spacing:.06em;
  text-transform:uppercase;
}

/* ---- Actions ---- */
.pp-acts{
  display:grid;grid-template-columns:1.15fr 1fr;gap:8px;
  padding:14px 18px 18px;
  border-top:1px solid var(--line-2);
  background:linear-gradient(180deg,rgba(245,242,252,0) 0%,rgba(245,242,252,.45) 100%);
}
.pp-acts button{
  border-radius:999px;padding:11px 8px;
  font-weight:600;font-size:12.5px;letter-spacing:.02em;
  border:1px solid transparent;min-height:40px;
  display:inline-flex;align-items:center;justify-content:center;gap:7px;
  transition:background .3s ease,color .3s ease,border-color .3s ease,
             transform .3s ease,box-shadow .3s ease;
}
.pp-add{
  background:var(--grad);color:#fff;
  background-size:180% 180%;background-position:0% 50%;
  box-shadow:0 14px 26px -18px rgba(139,92,246,.95);
}
.pp-add:hover:not(:disabled){
  background-position:100% 50%;transform:translateY(-1px);
  box-shadow:0 20px 34px -18px rgba(139,92,246,1);
}
.pp-add svg{flex:none}
.pp-buy{
  background:transparent;color:var(--ink);border-color:var(--line);
}
.pp-buy:hover:not(:disabled){
  background:var(--ink);color:#fff;border-color:var(--ink);
  transform:translateY(-1px);
}
.pp-acts button:disabled{opacity:.35;cursor:not-allowed;filter:saturate(.6)}

/* ============ MISC ============ */
.pp-btn{
  border:0;border-radius:999px;padding:14px 30px;
  font-weight:600;font-size:14px;
  background:var(--grad);color:#fff;
  background-size:180% 180%;background-position:0% 50%;
  box-shadow:0 14px 28px -18px rgba(139,92,246,.95);
  transition:background-position .5s ease,transform .3s ease,box-shadow .3s ease;
}
.pp-btn:hover{background-position:100% 50%;transform:translateY(-1px);box-shadow:0 20px 34px -18px rgba(139,92,246,1)}

.pp-more{display:grid;justify-items:center;gap:14px;margin-top:48px}
.pp-more p{margin:0;color:var(--mut);font-size:13.5px}
.pp-ghost{
  background:var(--card);border:1px solid var(--line);
  border-radius:999px;padding:14px 32px;
  font-weight:600;font-size:14px;color:var(--ink);
  box-shadow:0 20px 36px -30px rgba(27,20,54,.7);
  transition:background .35s ease,color .35s ease,border-color .35s ease,transform .35s ease,box-shadow .35s ease;
}
.pp-ghost:hover{
  background:var(--grad);color:#fff;border-color:transparent;transform:translateY(-2px);
  box-shadow:0 26px 44px -26px rgba(139,92,246,.95);
}

.pp-empty{
  max-width:560px;margin:48px auto;padding:68px 32px;text-align:center;
  background:var(--card);border:1px dashed var(--line);border-radius:24px;
}
.pp-empty>div{
  font-size:40px;
  width:84px;height:84px;margin:0 auto 18px;
  display:grid;place-items:center;
  border-radius:50%;background:var(--grad-soft);
}
.pp-empty h2{font-size:30px;font-weight:500;margin-bottom:10px}
.pp-empty p{color:var(--mut);margin:0 auto 26px;max-width:38ch;line-height:1.65}

.pp-sk{
  height:460px;border-radius:22px;
  background:linear-gradient(100deg,#f3eefc 25%,#faf7ff 50%,#f3eefc 75%);
  background-size:200% 100%;animation:ppSh 1.4s linear infinite;
}

.pp-toast{
  position:fixed;top:22px;right:22px;z-index:99;
  display:flex;gap:12px;align-items:center;
  padding:14px 20px;border-radius:16px;
  font-weight:500;font-size:14px;max-width:340px;
  background:rgba(255,255,255,.94);
  -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
  border:1px solid var(--line);
  box-shadow:0 34px 60px -36px rgba(27,20,54,.75);
  animation:ppIn .32s cubic-bezier(.2,.8,.2,1);
}
.pp-toast i{
  font-style:normal;flex:none;width:24px;height:24px;border-radius:50%;
  display:grid;place-items:center;font-size:12px;color:#fff;
}
.pp-toast.ok i{background:var(--grad)}
.pp-toast.ok{box-shadow:0 34px 60px -36px rgba(139,92,246,.85),0 0 0 1px rgba(139,92,246,.14)}
.pp-toast.err i{background:#e11d48}
.pp-toast.err{box-shadow:0 34px 60px -36px rgba(225,29,72,.6),0 0 0 1px rgba(225,29,72,.14)}

@keyframes ppSh{to{background-position:-200% 0}}
@keyframes ppIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
@keyframes ppPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.35);opacity:.7}}

/* ============ RESPONSIVE ============ */
@media(max-width:1080px){
  .pp-grid{grid-template-columns:repeat(auto-fill,minmax(232px,1fr));gap:22px}
}

@media(max-width:980px){
  .pp-top{padding:52px 0 56px}
}

@media(max-width:720px){
  .pp-grid{grid-template-columns:repeat(2,1fr);gap:16px}
}

@media(max-width:640px){
  .pp-wrap{padding:0 18px}
  .pp-top{padding:36px 0 40px}
  .pp-top h1{font-size:clamp(30px,8vw,44px);max-width:100%}
  .pp-top p{font-size:15px;margin:16px 0 24px;max-width:100%}
  .pp-find{padding:6px 6px 6px 16px;gap:8px}
  .pp-find input{font-size:14px;padding:11px 0}

  .pp-bar{flex-direction:column;align-items:stretch;gap:14px}
  .pp-chips{
    flex-wrap:nowrap;overflow-x:auto;padding-bottom:6px;
    margin:0 -18px;padding-inline:18px;width:calc(100% + 36px);
    scrollbar-width:none;-ms-overflow-style:none;
  }
  .pp-chips::-webkit-scrollbar{display:none}
  .pp-chips button{white-space:nowrap;flex:none;padding:7px 15px;font-size:12.5px}
  .pp-ctl{justify-content:space-between;width:100%;gap:12px}
  .pp-ctl select{padding:10px 36px 10px 14px;font-size:13px}
  .pp-switch{font-size:13px}

  .pp-count{margin:16px 0 20px;font-size:13px}

  .pp-grid{grid-template-columns:repeat(2,1fr);gap:12px}
  .pp-card{border-radius:18px}
  .pp-media{aspect-ratio:1/1}
  .pp-info{padding:14px 14px 10px;gap:7px}
  .pp-title{font-size:14.5px;min-height:calc(1.32em * 2)}
  .pp-price b{font-size:19px}
  .pp-price s{font-size:11px}
  .pp-cat{font-size:9.5px;padding:3px 9px;letter-spacing:.06em}
  .pp-brand{font-size:9.5px;letter-spacing:.1em}
  .pp-rating{font-size:11.5px;gap:6px}
  .pp-rating b{font-size:11.5px}
  .pp-stars{font-size:12px;letter-spacing:1px}
  .pp-status{font-size:10.5px;padding:4px 9px}
  .pp-sku{display:none}
  .pp-badge-off{font-size:10px;padding:5px 10px;left:10px;top:10px}
  .pp-wish{width:30px;height:30px;right:10px;top:10px}
  .pp-wish svg{width:14px;height:14px}
  .pp-quick{display:none}

  .pp-acts{grid-template-columns:1fr;padding:10px 12px 12px;gap:6px}
  .pp-acts button{padding:10px 6px;font-size:12px;min-height:38px}

  .pp-sk{height:320px}
  .pp-more{margin-top:36px}
  .pp-ghost{padding:12px 24px;font-size:13.5px}

  .pp-empty{padding:48px 22px;margin:32px auto}
  .pp-empty h2{font-size:22px}
  .pp-empty p{font-size:14px}
  .pp-empty>div{width:64px;height:64px;font-size:30px;margin-bottom:14px}

  .pp-toast{top:14px;left:14px;right:14px;max-width:none;padding:12px 14px;font-size:13px;gap:10px}
}

@media(max-width:420px){
  .pp-wrap{padding:0 14px}
  .pp-top h1{font-size:clamp(26px,8vw,36px)}
  .pp-grid{gap:10px}
  .pp-card{border-radius:16px}
  .pp-info{padding:12px 12px 8px}
  .pp-title{font-size:13.5px}
  .pp-price b{font-size:17px}
  .pp-acts{padding:10px;gap:6px}
  .pp-acts button{font-size:11.5px;padding:9px 4px}
  .pp-sk{height:280px}
}

@media(prefers-reduced-motion:reduce){
  .pp *{animation:none!important;transition:none!important}
}
`;

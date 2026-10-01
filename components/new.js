"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../lib/api";

// ---------- Editable content ----------
const BRAND = "MyShop";
const STICKER = "Free delivery";
const TAGLINE = "Curated essentials · Fair prices · Delivered fast";

const PERKS = [
  "Free delivery on eligible orders",
  "Easy 7-day returns",
  "Secure UPI, card and COD payments",
  "Support every day, 9am to 9pm",
];

const PERK_DETAILS = [
  {
    icon: "🚚",
    title: "Free delivery",
    text: "On orders above ₹499, pan-India.",
  },
  { icon: "↩️", title: "Easy returns", text: "7-day no-questions returns." },
  {
    icon: "🔒",
    title: "Secure payments",
    text: "UPI, cards, net banking & COD.",
  },
  { icon: "💬", title: "Always here", text: "Support daily, 9am to 9pm." },
];

const PROMISES = [
  {
    num: "01",
    title: "Curated",
    text: "Every product hand-checked for quality.",
  },
  { num: "02", title: "Fair", text: "Honest pricing with no hidden fees." },
  { num: "03", title: "Fast", text: "Dispatched within 24 hours, always." },
  { num: "04", title: "Trusted", text: "Over 40,000 happy customers served." },
];

const TESTIMONIALS = [
  {
    name: "Ananya Sharma",
    role: "Verified buyer · Bengaluru",
    quote:
      "Beautifully packed, arrived a day early, and the quality beats anything I've bought online this year. MyShop is now my default.",
    initials: "AS",
  },
  {
    name: "Rohan Mehta",
    role: "Verified buyer · Mumbai",
    quote:
      "I'm picky about checkout experiences. Theirs is the smoothest I've used — two taps, done. Support replied within minutes too.",
    initials: "RM",
  },
  {
    name: "Priya Nair",
    role: "Verified buyer · Kochi",
    quote:
      "The curated selection saves me scrolling for hours. Every purchase has felt premium without the premium price tag.",
    initials: "PN",
  },
];

const STATS = [
  { value: "40k+", label: "Happy customers" },
  { value: "1.2k", label: "Curated products" },
  { value: "4.9", label: "Average rating" },
  { value: "24h", label: "Dispatch time" },
];

const FAQS = [
  {
    q: "How long does delivery take?",
    a: "Most orders are dispatched within 24 hours and delivered in 2–5 business days across India. Metro cities typically receive within 48 hours.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept UPI, all major credit and debit cards, net banking, wallets, and cash on delivery for eligible pin codes.",
  },
  {
    q: "Can I return or exchange an item?",
    a: "Yes — you have 7 days from delivery for a free return or exchange on most items. Just start the request from your orders page.",
  },
  {
    q: "Is there free shipping?",
    a: "Free delivery is available on all orders above ₹499. For smaller orders, a flat ₹49 shipping fee applies at checkout.",
  },
  {
    q: "Do you ship outside India?",
    a: "Currently we ship only within India. International shipping is on our roadmap — subscribe to be notified when it launches.",
  },
];

const FOOT = [
  [
    "Shop",
    [
      ["All products", "/products"],
      ["My cart", "/cart"],
      ["My orders", "/orders"],
      ["Login", "/login"],
    ],
  ],
  [
    "Help",
    [
      ["Help center", "/help"],
      ["Shipping", "/shipping"],
      ["Returns", "/returns"],
      ["Contact us", "/contact"],
    ],
  ],
  [
    "Company",
    [
      ["About us", "/about"],
      ["Privacy policy", "/privacy"],
      ["Terms of service", "/terms"],
    ],
  ],
];

const SOCIAL = ["IG", "FB", "X", "YT"];
const PRESS = ["VOGUE", "FORBES", "WIRED", "GQ", "ELLE", "MINT"];

const TINTS = [
  "linear-gradient(150deg,#fde7f3 0%,#f7d9ec 100%)",
  "linear-gradient(150deg,#ece5ff 0%,#e0d7fb 100%)",
  "linear-gradient(150deg,#e0edff 0%,#d3e2fc 100%)",
  "linear-gradient(150deg,#ffe9f2 0%,#f9d8ea 100%)",
  "linear-gradient(150deg,#eae3ff 0%,#ddd3fa 100%)",
  "linear-gradient(150deg,#e2efff 0%,#d5e3fb 100%)",
];

const ARCH_TINTS = [
  "linear-gradient(160deg,#fde7f3 0%,#f4cfe7 100%)",
  "linear-gradient(160deg,#ece5ff 0%,#d9cbfa 100%)",
  "linear-gradient(160deg,#e0edff 0%,#caddfb 100%)",
];

const ICONS = [
  [/phone|mobile|electr|gadget/i, "📱"],
  [/laptop|computer/i, "💻"],
  [/cloth|fashion|wear|shirt/i, "👕"],
  [/shoe|foot/i, "👟"],
  [/home|kitchen|furnit/i, "🏠"],
  [/beauty|care|cosmetic/i, "💄"],
  [/book|stationery/i, "📚"],
  [/toy|kid|baby/i, "🧸"],
  [/sport|fitness|gym/i, "🏋️"],
  [/watch|access|jewel/i, "⌚"],
  [/food|grocer/i, "🛒"],
  [/audio|head|music/i, "🎧"],
];

// ---------- Helpers ----------
const iconFor = (name) => (ICONS.find(([re]) => re.test(name)) || [0, "🛍️"])[1];
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const sellPrice = (p) => {
  const sale = Number(p.salePrice);
  const price = Number(p.price) || 0;
  return sale > 0 && sale < price ? sale : price;
};

const discountOf = (p) => {
  const price = Number(p.price) || 0;
  const sp = sellPrice(p);
  if (Number(p.discount) > 0) return Number(p.discount);
  return sp < price ? Math.round(((price - sp) / price) * 100) : 0;
};

// ---------- Page ----------
export default function HomePage() {
  const router = useRouter();
  const timer = useRef(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState({ show: false, type: "", message: "" });

  useEffect(() => {
    getProducts();
    return () => clearTimeout(timer.current);
  }, []);

  // ----- Data -----
  const getProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/products");
      const list =
        response.data.products || response.data.data || response.data || [];
      const active = Array.isArray(list)
        ? list.filter((p) => !p.status || p.status.toLowerCase() === "active")
        : [];

      setProducts(active);
      setCategories(
        [...new Set(active.map((p) => p.category).filter(Boolean))].sort(
          (a, b) => a.localeCompare(b),
        ),
      );
    } catch (error) {
      console.error(error.response?.data || error.message);
      showToast(
        "error",
        error.response?.data?.message || "Failed to load products",
      );
    } finally {
      setLoading(false);
    }
  };

  // ----- UI helpers -----
  const showToast = (type, message) => {
    clearTimeout(timer.current);
    setToast({ show: true, type, message });
    timer.current = setTimeout(
      () => setToast({ show: false, type: "", message: "" }),
      3000,
    );
  };

  const goProducts = () =>
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });

  const pickCategory = (category) => {
    setSelectedCategory(category);
    goProducts();
  };

  const getToken = () =>
    typeof window === "undefined" ? null : localStorage.getItem("token");

  const requireLogin = () => {
    showToast("error", "Please log in first to continue.");
    setTimeout(() => router.push("/login"), 700);
  };

  const getCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      return Array.isArray(cart) ? cart : [];
    } catch {
      return [];
    }
  };

  // ----- Actions -----
  const addToCart = (product) => {
    if (!getToken()) return requireLogin();
    if (Number(product.stock) <= 0)
      return showToast("error", "This product is out of stock.");

    const cart = getCart();
    const index = cart.findIndex((item) => item._id === product._id);
    let updated;

    if (index !== -1) {
      const qty = Number(cart[index].quantity) || 0;
      if (qty >= Number(product.stock)) {
        return showToast(
          "error",
          `Only ${product.stock} item${Number(product.stock) === 1 ? "" : "s"} available.`,
        );
      }
      updated = [...cart];
      updated[index] = { ...updated[index], quantity: qty + 1 };
    } else {
      updated = [...cart, { ...product, quantity: 1 }];
    }

    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart-change"));
    showToast("success", `${product.name} added to cart.`);
  };

  const orderNow = async (product) => {
    const token = getToken();
    if (!token) return requireLogin();
    if (Number(product.stock) <= 0)
      return showToast("error", "This product is out of stock.");

    try {
      setActionLoading(product._id);
      const response = await api.post(
        "/orders",
        { productId: product._id, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showToast(
        "success",
        response.data?.message || "Order placed successfully.",
      );
      setTimeout(() => router.push("/orders"), 800);
    } catch (error) {
      console.error(error.response?.data || error.message);
      showToast(
        "error",
        error.response?.data?.message || "Failed to place order.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const subscribe = (e) => {
    e.preventDefault();
    e.target.reset();
    showToast("success", "You're subscribed. Watch your inbox for offers.");
  };

  // ----- Derived -----
  const q = search.trim().toLowerCase();
  const filtered = products.filter(
    (p) =>
      (selectedCategory === "All" || p.category === selectedCategory) &&
      (!q ||
        [p.name, p.brand, p.category, p.sku].some((v) =>
          v?.toString().toLowerCase().includes(q),
        )),
  );
  const shown = filtered.slice(0, 10);
  const heroPool = [...products].sort(
    (a, b) => Boolean(b.image) - Boolean(a.image),
  );

  return (
    <main className="hp">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {toast.show && (
        <div
          role="status"
          className={`hp-toast ${toast.type === "success" ? "ok" : "err"}`}
        >
          <i>{toast.type === "success" ? "✓" : "!"}</i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ================= ANNOUNCEMENT ================= */}
      <div className="hp-ann">
        <div className="hp-ann-track">
          {[0, 1].map((k) => (
            <div className="hp-ann-row" key={k} aria-hidden={k === 1}>
              <span>Free delivery on orders above ₹499</span>
              <span>7-day easy returns</span>
              <span>New season edit — up to 40% off</span>
              <span>Secure UPI, cards & COD</span>
              <span>Support daily, 9am to 9pm</span>
              <span>Free delivery on orders above ₹499</span>
              <span>7-day easy returns</span>
              <span>New season edit — up to 40% off</span>
            </div>
          ))}
        </div>
      </div>

      {/* ================= HERO ================= */}
      <section className="hp-hero">
        <span className="hp-blob hp-blob-1" aria-hidden="true" />
        <span className="hp-blob hp-blob-2" aria-hidden="true" />
        <span className="hp-blob hp-blob-3" aria-hidden="true" />
        <span className="hp-grid-tex" aria-hidden="true" />

        <div className="hp-wrap hp-hero-grid">
          <div className="hp-copy">
            <span className="hp-eyebrow">
              <span className="hp-dot" />
              New season · 2025 edit
            </span>

            <h1>
              Good things,
              <br />
              <em>delivered</em> to your door.
            </h1>

            <p>
              Everyday essentials and little luxuries at fair prices, with
              secure checkout and delivery you can count on.
            </p>

            <form
              className="hp-search"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                goProducts();
              }}
            >
              <span className="hp-search-ic" aria-hidden="true">
                ⌕
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products"
                aria-label="Search products"
              />
              <button type="submit" className="hp-btn hp-search-btn">
                Search
              </button>
            </form>

            {categories.length > 0 && (
              <div className="hp-quick">
                <span>Popular</span>
                {categories.slice(0, 4).map((c) => (
                  <button key={c} onClick={() => pickCategory(c)} type="button">
                    {c}
                  </button>
                ))}
              </div>
            )}

            <div className="hp-hero-meta">
              <div className="hp-hero-avatars" aria-hidden="true">
                <span>AS</span>
                <span>RM</span>
                <span>PN</span>
                <span>+</span>
              </div>
              <div className="hp-hero-note">
                <b>40,000+ happy shoppers</b>
                <small>Rated 4.9/5 across reviews</small>
              </div>
            </div>
          </div>

          <div className="hp-arches">
            {[0, 1, 2].map((i) => {
              const p = heroPool[i];
              return (
                <Link
                  key={i}
                  href={p ? `/products/${p._id}` : "/products"}
                  className={`hp-arch hp-arch-${i}`}
                  style={{ background: ARCH_TINTS[i] }}
                >
                  {p?.image ? (
                    <img src={p.image} alt={p.name} />
                  ) : (
                    <span className="hp-ph">🛍️</span>
                  )}
                  <span className="hp-lbl">
                    <b>{p ? p.name : "Your next favourite"}</b>
                    <small>{p ? money(sellPrice(p)) : "Coming soon"}</small>
                  </span>
                </Link>
              );
            })}
            <span className="hp-stk">{STICKER}</span>
          </div>
        </div>
      </section>

      {/* ================= PERKS BAND ================= */}
      <div className="hp-band">
        <div className="hp-wrap hp-band-row">
          {PERKS.map((perk) => (
            <span key={perk}>{perk}</span>
          ))}
        </div>
      </div>

      {/* ================= PERK CARDS ================= */}
      <section className="hp-sec hp-sec-tight">
        <div className="hp-wrap">
          <div className="hp-perks">
            {PERK_DETAILS.map((p) => (
              <div className="hp-perk" key={p.title}>
                <span className="hp-perk-ic" aria-hidden="true">
                  {p.icon}
                </span>
                <b>{p.title}</b>
                <small>{p.text}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PRESS ================= */}
      <section className="hp-press">
        <div className="hp-wrap hp-press-wrap">
          <span className="hp-press-label">As featured in</span>
          <div className="hp-press-row">
            {PRESS.map((p) => (
              <span key={p} className="hp-press-item">
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section className="hp-sec">
        <div className="hp-wrap">
          <div className="hp-head">
            <div className="hp-head-copy">
              <span className="hp-kicker">Browse</span>
              <h2>Shop by category</h2>
              <p>Pick a category to filter the products below.</p>
            </div>
            <Link href="/products" className="hp-head-link">
              View all categories
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="hp-cats">
            <button
              className={`hp-cat all ${selectedCategory === "All" ? "on" : ""}`}
              onClick={() => pickCategory("All")}
              type="button"
            >
              <span className="ic">✨</span>
              <b>All products</b>
              <small>{products.length} items</small>
            </button>

            {categories.map((category, i) => (
              <button
                key={category}
                className={`hp-cat ${selectedCategory === category ? "on" : ""}`}
                style={{ background: TINTS[i % TINTS.length] }}
                onClick={() => pickCategory(category)}
                type="button"
              >
                <span className="ic">{iconFor(category)}</span>
                <b>{category}</b>
                <small>
                  {products.filter((p) => p.category === category).length} items
                </small>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURED SPLIT ================= */}
      <section className="hp-sec hp-sec-tight">
        <div className="hp-wrap">
          <div className="hp-split">
            <div className="hp-split-card hp-split-pink">
              <span className="hp-split-eyebrow">Limited edition</span>
              <h3>The pink edit</h3>
              <p>Soft hues, bold silhouettes. Only 200 pieces available.</p>
              <Link href="/products" className="hp-split-link">
                Explore the drop <span aria-hidden="true">→</span>
              </Link>
              <span className="hp-split-orb" aria-hidden="true" />
            </div>
            <div className="hp-split-card hp-split-purple">
              <span className="hp-split-eyebrow">Bundle & save</span>
              <h3>Buy 2, get 15% off</h3>
              <p>Mix and match across any category. Discount auto-applied.</p>
              <Link href="/products" className="hp-split-link">
                Shop bundles <span aria-hidden="true">→</span>
              </Link>
              <span className="hp-split-orb" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      {/* ================= PRODUCTS ================= */}
      <section id="products" className="hp-sec">
        <div className="hp-wrap">
          <div className="hp-head">
            <div className="hp-head-copy">
              <span className="hp-kicker">Featured</span>
              <h2>
                {selectedCategory === "All"
                  ? "Latest products"
                  : selectedCategory}
              </h2>
              <p>
                {loading
                  ? "Loading products…"
                  : `Showing ${shown.length} of ${filtered.length} product${filtered.length === 1 ? "" : "s"}`}
              </p>
            </div>

            <div className="hp-tools">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products"
                aria-label="Filter products"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  type="button"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {!loading && categories.length > 0 && (
            <div className="hp-chips">
              <button
                type="button"
                className={`hp-chip ${selectedCategory === "All" ? "on" : ""}`}
                onClick={() => setSelectedCategory("All")}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`hp-chip ${selectedCategory === c ? "on" : ""}`}
                  onClick={() => setSelectedCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="hp-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="hp-sk" />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <div className="hp-empty">
              <span className="hp-empty-ic" aria-hidden="true">
                🔎
              </span>
              <h3>No products found</h3>
              <p>Try a different search term or browse another category.</p>
              <button
                className="hp-btn"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("All");
                }}
                type="button"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="hp-grid">
                {shown.map((p) => {
                  const sp = sellPrice(p);
                  const off = discountOf(p);
                  const stock = Number(p.stock) || 0;
                  const out = stock <= 0;
                  const rating = Math.min(
                    5,
                    Math.max(0, Number(p.rating) || 0),
                  );

                  return (
                    <article key={p._id} className="hp-card">
                      <Link
                        href={`/products/${p._id}`}
                        className="hp-img"
                        aria-label={`View ${p.name}`}
                      >
                        {p.image ? (
                          <img src={p.image} alt={p.name} />
                        ) : (
                          <div className="hp-noimg">📦</div>
                        )}

                        {off > 0 && <span className="hp-off">-{off}%</span>}

                        <span className="hp-quick-view" aria-hidden="true">
                          Quick view
                        </span>

                        {out && <span className="hp-sold">Sold out</span>}
                      </Link>

                      <div className="hp-body">
                        <span className="hp-cn">
                          {p.category || "Product"}
                          {p.brand ? ` · ${p.brand}` : ""}
                        </span>

                        <Link href={`/products/${p._id}`} className="hp-name">
                          {p.name}
                        </Link>

                        <div className="hp-rate">
                          <span
                            className="hp-stars"
                            style={{ "--r": `${(rating / 5) * 100}%` }}
                            aria-label={`${rating.toFixed(1)} out of 5`}
                          >
                            ★★★★★
                          </span>
                          <small>
                            {rating.toFixed(1)}
                            {Number(p.reviews) > 0 ? ` (${p.reviews})` : ""}
                          </small>
                        </div>

                        <div className="hp-price">
                          <b>{money(sp)}</b>
                          {sp < Number(p.price) && <s>{money(p.price)}</s>}
                        </div>

                        {!out && stock <= 5 && (
                          <span className="hp-low">Only {stock} left</span>
                        )}

                        <div className="hp-acts">
                          <button
                            className="hp-add"
                            onClick={() => addToCart(p)}
                            disabled={out}
                            type="button"
                          >
                            Add to cart
                          </button>
                          <button
                            className="hp-buy"
                            onClick={() => orderNow(p)}
                            disabled={out || actionLoading === p._id}
                            type="button"
                          >
                            {actionLoading === p._id ? "Placing…" : "Buy now"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="hp-more">
                <Link href="/products">
                  View all {products.length} products
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ================= PROMISES ================= */}
      <section className="hp-sec">
        <div className="hp-wrap">
          <div className="hp-head hp-head-center">
            <div className="hp-head-copy">
              <span className="hp-kicker">Why MyShop</span>
              <h2>Four promises we keep</h2>
              <p>A short list of the things we refuse to compromise on.</p>
            </div>
          </div>

          <div className="hp-promises">
            {PROMISES.map((p) => (
              <div className="hp-promise" key={p.num}>
                <span className="hp-promise-num">{p.num}</span>
                <h4>{p.title}</h4>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="hp-sec hp-sec-tight">
        <div className="hp-wrap">
          <div className="hp-stats">
            {STATS.map((s) => (
              <div className="hp-stat" key={s.label}>
                <b>{s.value}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="hp-sec">
        <div className="hp-wrap">
          <div className="hp-head hp-head-center">
            <div className="hp-head-copy">
              <span className="hp-kicker">Loved by</span>
              <h2>What our customers say</h2>
              <p>Real reviews from real shoppers across India.</p>
            </div>
          </div>

          <div className="hp-tests">
            {TESTIMONIALS.map((t) => (
              <figure className="hp-test" key={t.name}>
                <span className="hp-test-quote" aria-hidden="true">
                  “
                </span>
                <blockquote>{t.quote}</blockquote>
                <figcaption>
                  <span className="hp-test-av" aria-hidden="true">
                    {t.initials}
                  </span>
                  <span>
                    <b>{t.name}</b>
                    <small>{t.role}</small>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="hp-sec">
        <div className="hp-wrap">
          <div className="hp-faq-wrap">
            <div className="hp-faq-left">
              <span className="hp-kicker">Questions</span>
              <h2>Everything you need to know</h2>
              <p>
                Can't find your answer? Our support team replies within a few
                minutes, every day from 9am to 9pm.
              </p>
              <Link href="/contact" className="hp-faq-cta">
                Contact support <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="hp-faq">
              {FAQS.map((f, i) => (
                <details className="hp-faq-item" key={f.q} open={i === 0}>
                  <summary>
                    <span>{f.q}</span>
                    <i aria-hidden="true" />
                  </summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="hp-foot">
        <div className="hp-wrap">
          <div className="hp-news">
            <div className="hp-news-copy">
              <span className="hp-news-eyebrow">Join the list</span>
              <h3>Get 10% off your first order</h3>
              <p>Join our list for new arrivals and member-only offers.</p>
            </div>
            <form onSubmit={subscribe} className="hp-news-form">
              <input
                type="email"
                required
                placeholder="Your email address"
                aria-label="Email address"
              />
              <button type="submit" className="hp-btn">
                Subscribe
              </button>
            </form>
          </div>

          <div className="hp-fgrid">
            <div className="hp-fcol-brand">
              <div className="hp-logo">{BRAND}</div>
              <p>
                Quality products, honest prices and a checkout you can trust.
                Questions? Write to support@myshop.com.
              </p>

              <div className="hp-soc">
                {SOCIAL.map((s) => (
                  <a key={s} href="#" aria-label={s}>
                    {s}
                  </a>
                ))}
              </div>

              <div className="hp-pay" aria-label="Payment methods">
                <span>UPI</span>
                <span>VISA</span>
                <span>MC</span>
                <span>RuPay</span>
                <span>COD</span>
              </div>
            </div>

            {FOOT.map(([title, links]) => (
              <div key={title}>
                <h4>{title}</h4>
                <ul>
                  {links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href}>{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="hp-fbot">
            <span>
              © {new Date().getFullYear()} {BRAND}. All rights reserved.
            </span>
            <span>We accept UPI, cards, net banking and cash on delivery.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ---------- Styles ----------
const css = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');

/* ============ ROOT ============ */
.hp{
  --ink:#181233;
  --ink-2:#2a2350;
  --mut:#6b668a;
  --mut-2:#9a94b8;
  --paper:#fdfcff;
  --card:#ffffff;
  --line:#edeaf9;
  --line-2:#f6f3fd;
  --pink:#ec4899;
  --purple:#8b5cf6;
  --blue:#3b82f6;
  --grad:linear-gradient(120deg,#ec4899 0%,#8b5cf6 52%,#3b82f6 100%);
  --grad-soft:linear-gradient(120deg,#fde7f3 0%,#ece5ff 50%,#e0edff 100%);
  --shadow-sm:0 10px 24px -20px rgba(27,20,54,.5);
  --shadow-md:0 26px 44px -32px rgba(139,92,246,.55);
  --shadow-lg:0 40px 70px -50px rgba(27,20,54,.55);
  background:var(--paper);
  color:var(--ink);
  font:400 15px/1.6 'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
  font-feature-settings:'ss01','cv11';
  overflow-x:hidden;
  width:100%;
  max-width:100%;
}
.hp *{box-sizing:border-box;min-width:0}
.hp a{color:inherit;text-decoration:none}
.hp button,.hp input{font:inherit;color:inherit}
.hp button{cursor:pointer}
.hp img{max-width:100%;display:block;height:auto}
.hp :focus-visible{outline:2px solid var(--purple);outline-offset:3px;border-radius:8px}
.hp h1,.hp h2,.hp h3,.hp h4{
  font-family:'Fraunces',Georgia,serif;
  font-weight:400;margin:0;letter-spacing:-.025em;color:var(--ink);
  word-break:break-word;
  font-variation-settings:'opsz' 96;
}
.hp-wrap{
  width:100%;
  max-width:1280px;
  margin:0 auto;
  padding:0 32px;
}

/* ============ ANNOUNCEMENT ============ */
.hp-ann{
  background:var(--grad);
  color:#fff;font-size:11px;font-weight:600;letter-spacing:.18em;
  text-transform:uppercase;
  overflow:hidden;height:36px;display:flex;align-items:center;
  position:relative;
}
.hp-ann-track{
  display:flex;gap:64px;white-space:nowrap;
  animation:hpMarquee 46s linear infinite;
  padding-left:32px;
}
.hp-ann-row{display:flex;gap:64px;align-items:center}
.hp-ann span{opacity:.94;display:inline-flex;align-items:center;gap:64px}
.hp-ann span::after{
  content:"·";opacity:.55;font-size:16px;line-height:1;
}

/* ============ HERO ============ */
.hp-hero{
  position:relative;padding-top:88px;overflow:hidden;
  background:
    radial-gradient(1000px 500px at 4% -14%, #fde7f3 0%, rgba(253,231,243,0) 62%),
    radial-gradient(920px 500px at 98% -16%, #e0edff 0%, rgba(224,237,255,0) 58%),
    radial-gradient(780px 460px at 52% -22%, #ece5ff 0%, rgba(236,229,255,0) 64%),
    linear-gradient(180deg,#fefdff 0%, var(--paper) 100%);
}
.hp-blob{position:absolute;border-radius:50%;filter:blur(80px);opacity:.5;pointer-events:none;z-index:0}
.hp-blob-1{width:380px;height:380px;left:-140px;top:60px;background:radial-gradient(circle,#f9c9e5,transparent 70%)}
.hp-blob-2{width:420px;height:420px;right:-160px;top:-60px;background:radial-gradient(circle,#cdb8fb,transparent 70%)}
.hp-blob-3{width:340px;height:340px;left:42%;top:200px;background:radial-gradient(circle,#bcd8fb,transparent 70%);opacity:.36}
.hp-grid-tex{
  position:absolute;inset:0;pointer-events:none;z-index:0;
  background-image:radial-gradient(rgba(27,20,54,.045) 1px, transparent 1px);
  background-size:26px 26px;
  -webkit-mask-image:linear-gradient(180deg,#000 0%, transparent 76%);
  mask-image:linear-gradient(180deg,#000 0%, transparent 76%);
}

.hp-hero-grid{
  position:relative;z-index:1;
  display:grid;
  grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);
  gap:56px;
  align-items:end;
  padding-bottom:88px;
}
.hp-copy{max-width:640px;min-width:0}
.hp-eyebrow{
  display:inline-flex;align-items:center;gap:9px;
  padding:8px 16px 8px 12px;border-radius:999px;
  background:rgba(255,255,255,.78);
  border:1px solid rgba(139,92,246,.18);
  -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);
  color:var(--ink-2);font-size:11px;font-weight:600;
  letter-spacing:.18em;text-transform:uppercase;
  box-shadow:0 12px 26px -20px rgba(139,92,246,.7);
  max-width:100%;
}
.hp-dot{
  width:6px;height:6px;border-radius:50%;flex:none;
  background:var(--grad);
  box-shadow:0 0 0 3px rgba(236,72,153,.14);
}
.hp-copy h1{
  margin-top:26px;
  font-size:clamp(38px,6vw,80px);
  line-height:1.01;letter-spacing:-.04em;
  max-width:100%;
  font-weight:400;
}
.hp-copy h1 em{
  font-style:italic;font-weight:500;
  background:var(--grad);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  padding-right:4px;
}
.hp-copy p{
  color:var(--mut);font-size:17px;line-height:1.72;
  max-width:48ch;margin:24px 0 34px;
  letter-spacing:-.005em;
}

.hp-search{
  display:flex;align-items:center;gap:8px;
  background:var(--card);
  border:1px solid var(--line);
  border-radius:999px;
  padding:6px 6px 6px 20px;
  width:100%;
  max-width:540px;
  box-shadow:0 1px 2px rgba(27,20,54,.04),0 28px 48px -34px rgba(139,92,246,.55);
  transition:border-color .3s ease,box-shadow .3s ease,transform .3s ease;
}
.hp-search:hover{transform:translateY(-1px)}
.hp-search:focus-within{
  border-color:var(--purple);
  box-shadow:0 0 0 4px rgba(139,92,246,.12),0 28px 48px -34px rgba(139,92,246,.65);
}
.hp-search-ic{color:var(--mut);font-size:17px;line-height:1;flex:none}
.hp-search input{
  flex:1 1 0;min-width:0;width:100%;
  border:0;outline:0;background:none;
  font-size:15px;color:var(--ink);
  padding:11px 0;letter-spacing:-.005em;
}
.hp-search input::placeholder{color:#a9a4c0}
.hp-search input:focus-visible{outline:0}
.hp-search-btn{flex:0 0 auto;white-space:nowrap}

.hp-btn{
  position:relative;border:0;border-radius:999px;
  padding:13px 26px;font-weight:600;font-size:14px;letter-spacing:.005em;
  background:var(--grad);color:#fff;
  background-size:180% 180%;background-position:0% 50%;
  box-shadow:0 14px 28px -18px rgba(139,92,246,.95);
  transition:background-position .5s ease,transform .3s ease,box-shadow .3s ease;
  white-space:nowrap;
}
.hp-btn:hover{background-position:100% 50%;transform:translateY(-1px);box-shadow:0 20px 34px -18px rgba(139,92,246,1)}

.hp-quick{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:24px}
.hp-quick span{
  font-size:10.5px;font-weight:700;letter-spacing:.22em;
  text-transform:uppercase;color:#a9a4c0;margin-right:2px;
}
.hp-quick button{
  border:1px solid var(--line);background:rgba(255,255,255,.85);border-radius:999px;
  padding:8px 16px;font-weight:500;font-size:13px;color:var(--ink-2);
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
  transition:border-color .3s ease,color .3s ease,background .3s ease,transform .3s ease;
}
.hp-quick button:hover{
  border-color:transparent;color:#fff;background:var(--grad);transform:translateY(-1px);
}

.hp-hero-meta{display:flex;align-items:center;gap:14px;margin-top:36px;flex-wrap:wrap}
.hp-hero-avatars{display:flex;flex:none}
.hp-hero-avatars span{
  width:36px;height:36px;border-radius:50%;
  display:grid;place-items:center;
  font-size:11px;font-weight:700;color:#fff;
  background:var(--grad);border:2px solid #fff;
  margin-left:-10px;
  box-shadow:0 8px 16px -10px rgba(139,92,246,.8);
}
.hp-hero-avatars span:first-child{margin-left:0}
.hp-hero-avatars span:last-child{background:var(--ink)}
.hp-hero-note{display:flex;flex-direction:column;line-height:1.3;min-width:0}
.hp-hero-note b{font-size:13.5px;font-weight:700;color:var(--ink);letter-spacing:-.005em}
.hp-hero-note small{font-size:12.5px;color:var(--mut)}

.hp-arches{
  position:relative;height:480px;
  display:flex;gap:14px;align-items:flex-end;
  min-width:0;
}
.hp-arch{
  position:relative;display:block;flex:1 1 0;min-width:0;overflow:hidden;
  border-radius:260px 260px 22px 22px;
  border:1px solid rgba(255,255,255,.85);
  box-shadow:0 44px 74px -52px rgba(27,20,54,.6),inset 0 0 0 1px rgba(255,255,255,.5);
  animation:hpRise .9s cubic-bezier(.2,.8,.2,1) both;
  transition:transform .5s cubic-bezier(.2,.8,.2,1);
}
.hp-arch:hover{transform:translateY(-6px)}
.hp-arch-0{height:66%}
.hp-arch-1{height:94%;animation-delay:.12s}
.hp-arch-2{height:54%;animation-delay:.24s}
.hp-arch img{width:100%;height:100%;object-fit:cover;transition:transform .8s cubic-bezier(.2,.8,.2,1)}
.hp-arch:hover img{transform:scale(1.07)}
.hp-ph{position:absolute;inset:0;display:grid;place-items:center;font-size:44px;opacity:.75}
.hp-lbl{
  position:absolute;left:8px;right:8px;bottom:8px;
  background:rgba(255,255,255,.9);
  -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);
  border:1px solid rgba(255,255,255,.85);
  border-radius:14px;padding:9px 12px;
  display:flex;flex-direction:column;gap:2px;min-width:0;
  box-shadow:0 16px 28px -20px rgba(27,20,54,.55);
}
.hp-lbl b{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.005em}
.hp-lbl small{
  font-weight:700;font-size:12px;
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
}
.hp-stk{
  position:absolute;left:-8px;top:4%;
  width:108px;height:108px;padding:16px;border-radius:50%;
  background:var(--grad);color:#fff;
  display:grid;place-items:center;text-align:center;
  font:500 14px/1.15 'Fraunces',Georgia,serif;letter-spacing:-.015em;
  transform:rotate(-11deg);z-index:3;
  box-shadow:0 26px 46px -24px rgba(139,92,246,.9),inset 0 0 0 1px rgba(255,255,255,.35);
}

/* ============ BAND ============ */
.hp-band{
  position:relative;background:var(--card);
  border-top:1px solid var(--line);border-bottom:1px solid var(--line);
}
.hp-band-row{
  display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px 32px;
  padding-top:16px;padding-bottom:16px;
}
.hp-band span{
  display:flex;align-items:center;gap:10px;
  font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;
  color:var(--ink-2);
}
.hp-band span::before{
  content:"";width:6px;height:6px;border-radius:50%;background:var(--grad);flex:none;
}

/* ============ SECTION HEAD ============ */
.hp-sec{padding-top:96px}
.hp-sec-tight{padding-top:52px}
#products{scroll-margin-top:24px}
.hp-head{
  display:flex;justify-content:space-between;align-items:flex-end;
  gap:24px;flex-wrap:wrap;margin-bottom:36px;
}
.hp-head-copy{min-width:0;max-width:660px}
.hp-head-center{justify-content:center;text-align:center;flex-direction:column;align-items:center}
.hp-head-center .hp-head-copy{max-width:660px}
.hp-kicker{
  display:inline-block;margin-bottom:14px;
  font-size:11px;font-weight:700;letter-spacing:.26em;text-transform:uppercase;
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
}
.hp-head h2{font-size:clamp(28px,4vw,48px);line-height:1.05;letter-spacing:-.03em;font-weight:400}
.hp-head p{margin:12px 0 0;color:var(--mut);font-size:15.5px;max-width:56ch;line-height:1.7}
.hp-head-link{
  display:inline-flex;align-items:center;gap:8px;flex:none;
  font-size:14px;font-weight:600;color:var(--ink);
  padding:11px 20px;border-radius:999px;border:1px solid var(--line);
  background:var(--card);white-space:nowrap;
  transition:background .3s ease,color .3s ease,border-color .3s ease,transform .3s ease,box-shadow .3s ease;
}
.hp-head-link span{transition:transform .3s ease}
.hp-head-link:hover{
  background:var(--grad);color:#fff;border-color:transparent;transform:translateY(-2px);
  box-shadow:var(--shadow-md);
}
.hp-head-link:hover span{transform:translateX(3px)}

/* ============ PERK CARDS ============ */
.hp-perks{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}
.hp-perk{
  position:relative;background:var(--card);
  border:1px solid var(--line);border-radius:22px;
  padding:26px 22px 24px;
  display:flex;flex-direction:column;gap:6px;overflow:hidden;
  box-shadow:var(--shadow-sm);
  transition:transform .4s cubic-bezier(.2,.8,.2,1),box-shadow .4s ease,border-color .4s ease;
}
.hp-perk::after{
  content:"";position:absolute;right:-40px;top:-40px;width:140px;height:140px;border-radius:50%;
  background:var(--grad-soft);opacity:.5;z-index:0;pointer-events:none;
}
.hp-perk:hover{transform:translateY(-4px);box-shadow:var(--shadow-md);border-color:transparent}
.hp-perk-ic{
  font-size:22px;position:relative;z-index:1;
  width:48px;height:48px;border-radius:14px;
  display:grid;place-items:center;
  background:var(--grad-soft);
  margin-bottom:8px;flex:none;
}
.hp-perk b{position:relative;z-index:1;font:500 16px 'Fraunces',Georgia,serif;letter-spacing:-.015em}
.hp-perk small{position:relative;z-index:1;color:var(--mut);font-size:13px;line-height:1.6}

/* ============ PRESS ============ */
.hp-press{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--card);margin-top:52px}
.hp-press-wrap{
  display:flex;align-items:center;gap:36px;
  padding-top:22px;padding-bottom:22px;flex-wrap:wrap;
}
.hp-press-label{
  font-size:10.5px;font-weight:700;letter-spacing:.26em;text-transform:uppercase;
  color:var(--mut-2);flex:none;
}
.hp-press-row{display:flex;gap:42px;flex-wrap:wrap;align-items:center;min-width:0}
.hp-press-item{
  font:500 16px 'Fraunces',Georgia,serif;letter-spacing:.12em;
  color:var(--mut-2);opacity:.7;
  transition:opacity .3s ease,color .3s ease;
}
.hp-press-item:hover{opacity:1;color:var(--ink)}

/* ============ CATEGORIES ============ */
.hp-cats{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(184px,1fr));
  grid-auto-rows:122px;
  gap:16px;
}
.hp-cat{
  position:relative;overflow:hidden;
  border:1px solid rgba(255,255,255,.9);border-radius:22px;
  padding:18px;text-align:left;
  display:flex;flex-direction:column;justify-content:flex-end;gap:2px;
  color:var(--ink);background:var(--card);
  box-shadow:0 18px 34px -32px rgba(27,20,54,.5),inset 0 1px 0 rgba(255,255,255,.9);
  transition:transform .4s cubic-bezier(.2,.8,.2,1),box-shadow .4s ease;
  min-width:0;
}
.hp-cat::after{
  content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  background:radial-gradient(120% 90% at 100% 0%, rgba(255,255,255,.7), transparent 55%);
}
.hp-cat:hover{
  transform:translateY(-5px);
  box-shadow:0 34px 54px -34px rgba(139,92,246,.7),inset 0 1px 0 rgba(255,255,255,.9);
}
.hp-cat b{font:500 17px/1.2 'Fraunces',Georgia,serif;position:relative;z-index:1;word-break:break-word;letter-spacing:-.02em}
.hp-cat small{opacity:.72;font-size:12.5px;position:relative;z-index:1}
.hp-cat .ic{
  position:absolute;right:16px;top:14px;font-size:30px;line-height:1;
  transition:transform .5s cubic-bezier(.2,.8,.2,1);
}
.hp-cat:hover .ic{transform:scale(1.16) rotate(-6deg)}
.hp-cat.on{
  box-shadow:0 0 0 2px var(--purple),0 0 0 6px rgba(139,92,246,.14),0 30px 50px -34px rgba(139,92,246,.75);
}
.hp-cat.all{
  grid-row:span 2;
  background:var(--grad);color:#fff;border-color:transparent;
  border-radius:22px 22px 22px 80px;
  box-shadow:0 30px 54px -30px rgba(139,92,246,.85);
}
.hp-cat.all::after{
  background:radial-gradient(120% 100% at 100% 0%, rgba(255,255,255,.28), transparent 60%);
}
.hp-cat.all b{font-size:24px;color:#fff}
.hp-cat.all small{opacity:.85;color:#fff}
.hp-cat.all .ic{font-size:38px}
.hp-cat.all:hover{box-shadow:0 40px 64px -30px rgba(139,92,246,1)}
.hp-cat.all.on{box-shadow:inset 0 0 0 2px rgba(255,255,255,.6),0 34px 60px -30px rgba(139,92,246,1)}

/* ============ SPLIT BANNERS ============ */
.hp-split{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}
.hp-split-card{
  position:relative;overflow:hidden;
  border-radius:28px;
  padding:44px 40px;
  min-height:220px;
  display:flex;flex-direction:column;justify-content:center;gap:10px;
  box-shadow:var(--shadow-md);
  transition:transform .45s cubic-bezier(.2,.8,.2,1),box-shadow .45s ease;
}
.hp-split-card:hover{transform:translateY(-5px);box-shadow:0 46px 70px -42px rgba(139,92,246,.9)}
.hp-split-pink{background:linear-gradient(140deg,#fce7f3 0%,#fbcfe8 100%)}
.hp-split-purple{background:linear-gradient(140deg,#ede9fe 0%,#ddd6fe 100%)}
.hp-split-eyebrow{
  font-size:11px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;
  color:var(--ink-2);opacity:.7;
}
.hp-split-card h3{font-size:clamp(24px,3vw,34px);line-height:1.1;position:relative;z-index:1;letter-spacing:-.03em}
.hp-split-card p{color:var(--ink-2);opacity:.78;max-width:34ch;font-size:15px;position:relative;z-index:1;margin:0;line-height:1.65}
.hp-split-link{
  display:inline-flex;align-items:center;gap:8px;
  margin-top:10px;font-weight:600;font-size:14px;
  position:relative;z-index:1;color:var(--ink);
}
.hp-split-link span{transition:transform .3s ease}
.hp-split-link:hover span{transform:translateX(4px)}
.hp-split-orb{
  position:absolute;right:-80px;bottom:-80px;width:280px;height:280px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,255,255,.8),rgba(255,255,255,0) 70%);
}

/* ============ CHIPS ============ */
.hp-chips{display:flex;flex-wrap:wrap;gap:8px;margin:-4px 0 28px}
.hp-chip{
  border:1px solid var(--line);background:var(--card);
  border-radius:999px;padding:9px 18px;
  font-size:13px;font-weight:600;color:var(--ink-2);
  transition:background .3s ease,color .3s ease,border-color .3s ease,transform .3s ease,box-shadow .3s ease;
}
.hp-chip:hover{border-color:var(--purple);color:var(--purple);transform:translateY(-1px)}
.hp-chip.on{
  background:var(--grad);color:#fff;border-color:transparent;
  box-shadow:0 14px 26px -18px rgba(139,92,246,.95);
}

/* ============ TOOLS ============ */
.hp-tools{
  display:flex;align-items:center;gap:10px;
  background:var(--card);border:1px solid var(--line);border-radius:999px;
  padding:0 16px;width:100%;max-width:340px;color:var(--mut);
  box-shadow:0 16px 30px -28px rgba(27,20,54,.5);
  transition:border-color .3s ease,box-shadow .3s ease;
}
.hp-tools:focus-within{border-color:var(--purple);box-shadow:0 0 0 4px rgba(139,92,246,.12)}
.hp-tools input{flex:1 1 0;min-width:0;border:0;outline:0;background:none;padding:13px 0;color:var(--ink);font-size:14px}
.hp-tools input::placeholder{color:#a9a4c0}
.hp-tools input:focus-visible{outline:0}
.hp-tools button{
  border:0;background:var(--line-2);color:var(--ink-2);
  border-radius:50%;width:24px;height:24px;line-height:1;font-size:14px;flex:none;
  transition:background .25s ease,color .25s ease;
}
.hp-tools button:hover{background:var(--grad);color:#fff}

/* ============ PRODUCT GRID ============ */
.hp-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(232px,1fr));
  gap:24px;
}
.hp-card{
  position:relative;background:var(--card);
  border:1px solid var(--line);border-radius:22px;overflow:hidden;
  display:flex;flex-direction:column;min-width:0;
  box-shadow:0 18px 40px -36px rgba(27,20,54,.5);
  transition:transform .45s cubic-bezier(.2,.8,.2,1),box-shadow .45s ease,border-color .45s ease;
}
.hp-card::before{
  content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:2;
  padding:1px;opacity:0;
  background:var(--grad);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;
  transition:opacity .45s ease;
}
.hp-card:hover{
  transform:translateY(-5px);
  box-shadow:0 40px 60px -40px rgba(139,92,246,.65);
  border-color:transparent;
}
.hp-card:hover::before{opacity:1}

.hp-img{
  position:relative;display:block;aspect-ratio:1;overflow:hidden;
  background:linear-gradient(160deg,#faf7ff 0%,#f3effc 100%);
}
.hp-img img{width:100%;height:100%;object-fit:cover;transition:transform .8s cubic-bezier(.2,.8,.2,1)}
.hp-card:hover .hp-img img{transform:scale(1.07)}
.hp-noimg{height:100%;display:grid;place-items:center;font-size:44px;opacity:.55}

.hp-off{
  position:absolute;left:12px;top:12px;z-index:1;
  color:#fff;font-weight:700;font-size:11px;letter-spacing:.06em;
  padding:6px 12px;border-radius:999px;background:var(--grad);
  box-shadow:0 12px 22px -14px rgba(139,92,246,.95);
}
.hp-quick-view{
  position:absolute;left:12px;right:12px;bottom:12px;z-index:1;
  padding:11px 14px;border-radius:12px;
  background:rgba(24,18,51,.92);color:#fff;
  font-size:12.5px;font-weight:600;text-align:center;letter-spacing:.02em;
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
  opacity:0;transform:translateY(8px);
  transition:opacity .35s ease,transform .35s ease;
}
.hp-card:hover .hp-quick-view{opacity:1;transform:translateY(0)}
.hp-sold{
  position:absolute;inset:0;display:grid;place-items:center;
  background:rgba(253,252,255,.85);
  -webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);
  font:500 16px 'Fraunces',Georgia,serif;letter-spacing:.06em;color:var(--ink-2);
}

.hp-body{padding:18px 18px 16px;display:flex;flex-direction:column;gap:8px;flex:1;min-width:0}
.hp-cn{
  color:var(--mut);font-size:10.5px;font-weight:700;
  letter-spacing:.18em;text-transform:uppercase;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.hp-name{
  font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:17px;line-height:1.32;
  color:var(--ink);word-break:break-word;letter-spacing:-.02em;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  transition:color .3s ease;
}
.hp-name:hover{
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
}
.hp-rate{display:flex;align-items:center;gap:8px;color:var(--mut);font-size:12.5px;flex-wrap:wrap}
.hp-stars{
  background:linear-gradient(90deg,#8b5cf6 var(--r),#e8e4f5 var(--r));
  -webkit-background-clip:text;background-clip:text;color:transparent;
  letter-spacing:2px;font-size:13px;
}
.hp-price{display:flex;align-items:baseline;gap:10px;margin-top:2px;flex-wrap:wrap}
.hp-price b{
  font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:23px;letter-spacing:-.025em;
  color:var(--ink);
}
.hp-price s{color:#b3aecb;font-size:13px;font-weight:500}
.hp-low{
  display:inline-flex;align-items:center;gap:6px;
  font-size:11.5px;font-weight:700;letter-spacing:.04em;
  color:#b45309;
}
.hp-low::before{content:"";width:5px;height:5px;border-radius:50%;background:#f59e0b;flex:none}

.hp-acts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:auto;padding-top:14px}
.hp-acts button{
  border-radius:999px;padding:11px 8px;
  font-weight:600;font-size:12.5px;letter-spacing:.02em;
  border:1px solid transparent;white-space:nowrap;
  transition:background .3s ease,color .3s ease,border-color .3s ease,transform .3s ease,box-shadow .3s ease;
}
.hp-acts .hp-add{
  background:var(--grad);color:#fff;background-size:180% 180%;background-position:0% 50%;
  box-shadow:0 14px 26px -18px rgba(139,92,246,.95);
}
.hp-acts .hp-add:hover:not(:disabled){
  background-position:100% 50%;transform:translateY(-1px);
  box-shadow:0 20px 34px -18px rgba(139,92,246,1);
}
.hp-acts .hp-buy{
  background:transparent;color:var(--ink);border-color:var(--line);
}
.hp-acts .hp-buy:hover:not(:disabled){
  background:var(--ink);color:#fff;border-color:var(--ink);transform:translateY(-1px);
}
.hp-acts button:disabled{opacity:.35;cursor:not-allowed;filter:saturate(.6)}

.hp-more{display:flex;justify-content:center;margin-top:48px}
.hp-more a{
  position:relative;background:var(--card);border:1px solid var(--line);
  border-radius:999px;padding:15px 34px;font-weight:600;font-size:14px;color:var(--ink);
  box-shadow:0 20px 36px -32px rgba(27,20,54,.7);
  transition:background .35s ease,color .35s ease,border-color .35s ease,transform .35s ease,box-shadow .35s ease;
  text-align:center;
}
.hp-more a:hover{
  background:var(--grad);color:#fff;border-color:transparent;transform:translateY(-2px);
  box-shadow:0 26px 44px -26px rgba(139,92,246,.95);
}

/* ============ EMPTY / SKELETON ============ */
.hp-empty{
  text-align:center;padding:76px 24px;background:var(--card);
  border:1px dashed var(--line);border-radius:24px;
}
.hp-empty-ic{font-size:44px;display:block;margin-bottom:16px}
.hp-empty h3{font-size:28px;margin-bottom:10px;letter-spacing:-.03em}
.hp-empty p{color:var(--mut);margin:0 0 24px}
.hp-sk{
  height:380px;border-radius:22px;
  background:linear-gradient(100deg,#f3eefc 25%,#faf7ff 50%,#f3eefc 75%);
  background-size:200% 100%;animation:hpSh 1.4s linear infinite;
}

/* ============ PROMISES ============ */
.hp-promises{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}
.hp-promise{
  position:relative;background:var(--card);
  border:1px solid var(--line);border-radius:22px;
  padding:32px 26px 28px;
  display:flex;flex-direction:column;gap:10px;
  overflow:hidden;min-width:0;
  transition:transform .4s cubic-bezier(.2,.8,.2,1),box-shadow .4s ease,border-color .4s ease;
}
.hp-promise::before{
  content:"";position:absolute;left:0;right:0;top:0;height:3px;background:var(--grad);
  transform:scaleX(0);transform-origin:left;transition:transform .45s ease;
}
.hp-promise:hover{transform:translateY(-4px);box-shadow:var(--shadow-md);border-color:transparent}
.hp-promise:hover::before{transform:scaleX(1)}
.hp-promise-num{
  font:700 12px 'Inter',sans-serif;
  letter-spacing:.24em;
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
}
.hp-promise h4{font-size:22px;letter-spacing:-.025em}
.hp-promise p{color:var(--mut);font-size:14px;line-height:1.65;margin:0}

/* ============ STATS ============ */
.hp-stats{
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;
  padding:40px 32px;border-radius:28px;
  background:var(--grad-soft);
  border:1px solid rgba(139,92,246,.14);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.9);
}
.hp-stat{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;min-width:0}
.hp-stat b{
  font:500 clamp(28px,4.2vw,42px) 'Fraunces',Georgia,serif;letter-spacing:-.035em;
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
}
.hp-stat span{
  font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;
  color:var(--ink-2);opacity:.75;
}

/* ============ TESTIMONIALS ============ */
.hp-tests{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
.hp-test{
  position:relative;margin:0;background:var(--card);
  border:1px solid var(--line);border-radius:22px;
  padding:34px 30px 28px;
  display:flex;flex-direction:column;gap:18px;min-width:0;
  box-shadow:var(--shadow-sm);
  transition:transform .4s cubic-bezier(.2,.8,.2,1),box-shadow .4s ease,border-color .4s ease;
}
.hp-test:hover{transform:translateY(-4px);box-shadow:var(--shadow-md);border-color:transparent}
.hp-test-quote{
  position:absolute;right:22px;top:14px;
  font:500 76px/1 'Fraunces',Georgia,serif;
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
  opacity:.24;pointer-events:none;
}
.hp-test blockquote{
  margin:0;font-family:'Fraunces',Georgia,serif;
  font-size:17px;line-height:1.6;color:var(--ink-2);font-weight:400;letter-spacing:-.01em;
}
.hp-test figcaption{
  display:flex;align-items:center;gap:12px;margin-top:auto;
  padding-top:16px;border-top:1px solid var(--line-2);min-width:0;
}
.hp-test-av{
  width:44px;height:44px;border-radius:50%;
  background:var(--grad);color:#fff;
  display:grid;place-items:center;font-size:13px;font-weight:700;flex:none;
  box-shadow:0 12px 22px -14px rgba(139,92,246,.9);
}
.hp-test figcaption b{display:block;font-size:14px;color:var(--ink);font-weight:700;letter-spacing:-.005em}
.hp-test figcaption small{display:block;color:var(--mut);font-size:12.5px}

/* ============ FAQ ============ */
.hp-faq-wrap{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:56px;align-items:start}
.hp-faq-left h2{font-size:clamp(28px,3.6vw,42px);line-height:1.08;margin-bottom:14px;letter-spacing:-.03em}
.hp-faq-left p{color:var(--mut);font-size:15px;max-width:42ch;line-height:1.7;margin:0 0 24px}
.hp-faq-cta{
  display:inline-flex;align-items:center;gap:8px;
  font-weight:600;font-size:14px;
  padding:13px 24px;border-radius:999px;
  background:var(--ink);color:#fff;
  transition:background .3s ease,transform .3s ease,box-shadow .3s ease;
}
.hp-faq-cta:hover{background:var(--grad);transform:translateY(-1px);box-shadow:var(--shadow-md)}
.hp-faq-cta span{transition:transform .3s ease}
.hp-faq-cta:hover span{transform:translateX(3px)}

.hp-faq{display:flex;flex-direction:column;gap:10px}
.hp-faq-item{
  background:var(--card);border:1px solid var(--line);
  border-radius:18px;overflow:hidden;
  transition:border-color .3s ease,box-shadow .3s ease;
}
.hp-faq-item[open]{
  border-color:transparent;box-shadow:0 0 0 1.5px rgba(139,92,246,.4),var(--shadow-sm);
}
.hp-faq-item summary{
  list-style:none;cursor:pointer;
  padding:20px 22px;
  display:flex;align-items:center;justify-content:space-between;gap:16px;
  font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:17px;color:var(--ink);
  letter-spacing:-.015em;
  transition:color .3s ease;
}
.hp-faq-item summary::-webkit-details-marker{display:none}
.hp-faq-item summary:hover{color:var(--purple)}
.hp-faq-item summary i{
  position:relative;flex:none;
  width:24px;height:24px;border-radius:50%;
  background:var(--line-2);
  transition:background .3s ease,transform .3s ease;
}
.hp-faq-item summary i::before,
.hp-faq-item summary i::after{
  content:"";position:absolute;left:7px;top:11px;width:10px;height:2px;border-radius:2px;
  background:var(--ink-2);transition:transform .3s ease,background .3s ease;
}
.hp-faq-item summary i::after{transform:rotate(90deg)}
.hp-faq-item[open] summary i{background:var(--grad);transform:rotate(180deg)}
.hp-faq-item[open] summary i::before,
.hp-faq-item[open] summary i::after{background:#fff}
.hp-faq-item[open] summary i::after{transform:rotate(0)}
.hp-faq-item p{
  margin:0;padding:0 22px 22px;color:var(--mut);
  font-size:14.5px;line-height:1.72;max-width:62ch;
}

/* ============ TOAST ============ */
.hp-toast{
  position:fixed;top:22px;right:22px;z-index:99;
  display:flex;gap:12px;align-items:center;
  padding:14px 20px;border-radius:16px;
  font-weight:500;font-size:14px;max-width:340px;
  background:rgba(255,255,255,.94);
  -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
  border:1px solid var(--line);
  box-shadow:0 34px 60px -36px rgba(27,20,54,.75);
  animation:hpIn .32s cubic-bezier(.2,.8,.2,1);
}
.hp-toast i{
  font-style:normal;flex:none;width:24px;height:24px;border-radius:50%;
  display:grid;place-items:center;font-size:12px;color:#fff;
}
.hp-toast.ok i{background:var(--grad)}
.hp-toast.ok{box-shadow:0 34px 60px -36px rgba(139,92,246,.85),0 0 0 1px rgba(139,92,246,.14)}
.hp-toast.err i{background:#e11d48}
.hp-toast.err{box-shadow:0 34px 60px -36px rgba(225,29,72,.6),0 0 0 1px rgba(225,29,72,.14)}

/* ============ FOOTER ============ */
.hp-foot{position:relative;margin-top:120px;background:var(--card);border-top:1px solid var(--line);overflow:hidden}
.hp-foot::before{
  content:"";position:absolute;inset:0 0 auto 0;height:360px;pointer-events:none;
  background:
    radial-gradient(660px 320px at 12% 0%, #fde7f3 0%, rgba(253,231,243,0) 65%),
    radial-gradient(660px 320px at 88% 0%, #e0edff 0%, rgba(224,237,255,0) 65%),
    radial-gradient(560px 280px at 50% 0%, #ece5ff 0%, rgba(236,229,255,0) 68%);
  opacity:.75;
}
.hp-foot .hp-wrap{position:relative;z-index:1}

.hp-news{
  position:relative;overflow:hidden;margin-top:-64px;
  background:var(--grad);color:#fff;
  border-radius:32px 32px 32px 104px;
  padding:52px 56px;
  display:flex;justify-content:space-between;align-items:center;gap:32px;flex-wrap:wrap;
  box-shadow:0 46px 80px -50px rgba(139,92,246,1);
}
.hp-news::after{
  content:"";position:absolute;right:-80px;top:-100px;width:340px;height:340px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,255,255,.22),rgba(255,255,255,0) 70%);
}
.hp-news::before{
  content:"";position:absolute;left:-60px;bottom:-120px;width:280px;height:280px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,255,255,.14),rgba(255,255,255,0) 70%);
}
.hp-news-copy{position:relative;z-index:1;min-width:0}
.hp-news-eyebrow{
  display:inline-block;margin-bottom:10px;
  font-size:11px;font-weight:700;letter-spacing:.26em;text-transform:uppercase;
  color:rgba(255,255,255,.78);
}
.hp-news h3{font-size:clamp(24px,3.2vw,36px);color:#fff;letter-spacing:-.03em}
.hp-news p{margin:10px 0 0;color:rgba(255,255,255,.85);font-size:15px}
.hp-news-form{
  position:relative;z-index:1;
  display:flex;gap:6px;width:100%;max-width:460px;
  background:rgba(255,255,255,.14);
  border:1px solid rgba(255,255,255,.26);
  border-radius:999px;padding:6px;
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
}
.hp-news input{
  flex:1 1 0;min-width:0;border:0;outline:0;background:none;
  padding:8px 18px;color:#fff;font-size:14px;
}
.hp-news input::placeholder{color:rgba(255,255,255,.7)}
.hp-news .hp-btn{background:#fff;color:var(--ink);box-shadow:none;flex:none;padding:11px 22px}
.hp-news .hp-btn:hover{background:var(--ink);color:#fff;transform:translateY(-1px)}

.hp-fgrid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:48px;padding:72px 0 48px}
.hp-fgrid h4{
  margin:0 0 18px;font-family:'Inter',sans-serif;
  font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;
  color:var(--ink-2);
}
.hp-fgrid ul{list-style:none;margin:0;padding:0;display:grid;gap:11px;color:var(--mut);font-size:14px}
.hp-fgrid a{transition:color .25s ease}
.hp-fgrid a:hover{
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
}
.hp-fgrid p{color:var(--mut);max-width:36ch;margin:16px 0 0;font-size:14px;line-height:1.72}
.hp-logo{
  font:500 32px 'Fraunces',Georgia,serif;letter-spacing:-.035em;
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
}
.hp-soc{display:flex;gap:10px;margin-top:24px;flex-wrap:wrap}
.hp-soc a{
  width:42px;height:42px;border-radius:50%;
  border:1px solid var(--line);background:var(--card);
  display:grid;place-items:center;
  font-size:11px;font-weight:700;letter-spacing:.04em;color:var(--ink-2);
  transition:background .3s ease,color .3s ease,border-color .3s ease,transform .3s ease,box-shadow .3s ease;
}
.hp-soc a:hover{
  background:var(--grad);color:#fff;border-color:transparent;transform:translateY(-3px);
  box-shadow:0 18px 30px -18px rgba(139,92,246,.95);
}
.hp-pay{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}
.hp-pay span{
  padding:7px 14px;border-radius:10px;
  border:1px solid var(--line);background:var(--card);
  font-size:10.5px;font-weight:800;letter-spacing:.09em;color:var(--ink-2);
}

.hp-fbot{
  display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;
  border-top:1px solid var(--line);padding:24px 0 32px;
  color:var(--mut);font-size:12.5px;
}

/* ============ KEYFRAMES ============ */
@keyframes hpRise{from{opacity:0;transform:translateY(44px)}to{opacity:1;transform:none}}
@keyframes hpSh{to{background-position:-200% 0}}
@keyframes hpIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
@keyframes hpMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}

/* ========================================================
   RESPONSIVE
   ======================================================== */
@media (max-width:1080px){
  .hp-perks{grid-template-columns:repeat(2,minmax(0,1fr))}
  .hp-promises{grid-template-columns:repeat(2,minmax(0,1fr))}
  .hp-tests{grid-template-columns:repeat(2,minmax(0,1fr))}
  .hp-tests > .hp-test:nth-child(3){grid-column:1 / -1}
  .hp-fgrid{grid-template-columns:1.6fr 1fr 1fr 1fr;gap:36px}
}

@media (max-width:980px){
  .hp-hero{padding-top:56px}
  .hp-hero-grid{
    grid-template-columns:minmax(0,1fr);
    gap:40px;
    padding-bottom:56px;
  }
  .hp-copy{max-width:100%}
  .hp-arches{height:360px;max-width:100%}
  .hp-stk{width:96px;height:96px;font-size:13px;padding:14px;left:-6px}
  .hp-faq-wrap{grid-template-columns:minmax(0,1fr);gap:36px}
  .hp-split{grid-template-columns:minmax(0,1fr)}
  .hp-split-card{padding:36px 30px;min-height:190px}
  .hp-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;padding:30px 24px}
  .hp-fgrid{grid-template-columns:1fr 1fr;gap:36px;padding:52px 0 36px}
  .hp-news{padding:36px 32px;border-radius:26px 26px 26px 76px;margin-top:-52px}
  .hp-sec{padding-top:72px}
  .hp-sec-tight{padding-top:44px}
}

@media (max-width:768px){
  .hp-wrap{padding:0 22px}
  .hp-cats{grid-template-columns:repeat(auto-fill,minmax(154px,1fr));grid-auto-rows:114px}
  .hp-grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:18px}
  .hp-arches{height:320px;gap:12px}
  .hp-copy h1{font-size:clamp(34px,7.4vw,54px)}
}

@media (max-width:640px){
  .hp-wrap{padding:0 18px}
  .hp-sec{padding-top:60px}
  .hp-sec-tight{padding-top:40px}

  /* announcement */
  .hp-ann{font-size:10.5px;letter-spacing:.14em;height:34px}
  .hp-ann-track{gap:40px;padding-left:20px}
  .hp-ann-row{gap:40px}
  .hp-ann span{gap:40px}

  /* hero */
  .hp-hero{padding-top:44px}
  .hp-hero-grid{padding-bottom:44px;gap:32px}
  .hp-copy h1{margin-top:20px;font-size:clamp(30px,8.6vw,44px);line-height:1.08;letter-spacing:-.035em}
  .hp-copy p{font-size:15.5px;margin:20px 0 26px;line-height:1.68}
  .hp-eyebrow{font-size:10.5px;padding:7px 14px 7px 11px;letter-spacing:.14em}

  .hp-search{padding:5px 5px 5px 16px;gap:6px;max-width:100%}
  .hp-search-ic{font-size:16px}
  .hp-search input{font-size:14px;padding:10px 0}
  .hp-search .hp-btn{padding:11px 18px;font-size:13px}

  .hp-quick{margin-top:20px;gap:6px}
  .hp-quick button{padding:7px 14px;font-size:12.5px}
  .hp-quick span{font-size:10px;letter-spacing:.18em}

  .hp-hero-meta{margin-top:28px;gap:12px}
  .hp-hero-avatars span{width:32px;height:32px;font-size:10px;border-width:2px}
  .hp-hero-note b{font-size:13px}
  .hp-hero-note small{font-size:12px}

  /* arches */
  .hp-arches{height:270px;gap:10px}
  .hp-stk{width:82px;height:82px;font-size:11.5px;padding:12px;left:-4px;top:6%}
  .hp-lbl{padding:7px 10px;border-radius:12px;left:6px;right:6px;bottom:6px}
  .hp-lbl b{font-size:11px}
  .hp-lbl small{font-size:11px}
  .hp-ph{font-size:36px}

  /* band */
  .hp-band-row{justify-content:flex-start;gap:8px 18px;padding-top:14px;padding-bottom:14px}
  .hp-band span{font-size:10.5px;letter-spacing:.1em}

  /* perks */
  .hp-perks{grid-template-columns:1fr 1fr;gap:12px}
  .hp-perk{padding:18px 16px;border-radius:18px;gap:5px}
  .hp-perk-ic{width:40px;height:40px;font-size:19px;border-radius:12px;margin-bottom:5px}
  .hp-perk b{font-size:14px}
  .hp-perk small{font-size:12px;line-height:1.5}

  /* press */
  .hp-press{margin-top:40px}
  .hp-press-wrap{gap:14px;padding-top:18px;padding-bottom:18px}
  .hp-press-label{font-size:10px}
  .hp-press-row{gap:22px;flex:1 1 100%}
  .hp-press-item{font-size:13.5px}

  /* head */
  .hp-head{gap:16px;margin-bottom:24px}
  .hp-head h2{font-size:clamp(24px,7vw,32px);letter-spacing:-.03em}
  .hp-head p{font-size:14.5px}
  .hp-head-link{padding:9px 16px;font-size:13px}

  /* categories */
  .hp-cats{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:108px;gap:12px}
  .hp-cat{padding:14px;border-radius:18px}
  .hp-cat b{font-size:15px}
  .hp-cat small{font-size:11.5px}
  .hp-cat .ic{font-size:26px;right:12px;top:10px}
  .hp-cat.all{border-radius:18px 18px 18px 60px}
  .hp-cat.all b{font-size:20px}
  .hp-cat.all .ic{font-size:32px}

  /* split */
  .hp-split-card{padding:28px 24px;border-radius:24px;min-height:auto;gap:8px}
  .hp-split-card h3{font-size:24px}
  .hp-split-card p{font-size:14px}
  .hp-split-eyebrow{font-size:10px}

  /* chips */
  .hp-chips{margin:-2px 0 20px;gap:6px}
  .hp-chip{padding:8px 15px;font-size:12.5px}

  /* tools */
  .hp-tools{max-width:100%;padding:0 14px}
  .hp-tools input{padding:12px 0;font-size:14px}

  /* product grid */
  .hp-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
  .hp-card{border-radius:18px}
  .hp-body{padding:13px 13px 13px;gap:6px}
  .hp-cn{font-size:10px;letter-spacing:.14em}
  .hp-name{font-size:14.5px;line-height:1.3}
  .hp-price b{font-size:19px}
  .hp-price s{font-size:12px}
  .hp-price{gap:7px}
  .hp-rate{font-size:11.5px;gap:6px}
  .hp-stars{font-size:12px;letter-spacing:1.5px}
  .hp-low{font-size:11px}
  .hp-off{padding:5px 10px;font-size:10px;left:10px;top:10px}
  .hp-quick-view{display:none}
  .hp-acts{grid-template-columns:1fr;gap:6px;padding-top:10px}
  .hp-acts button{padding:10px 6px;font-size:12px}

  .hp-more{margin-top:36px}
  .hp-more a{padding:13px 24px;font-size:13.5px}

  /* empty / skeleton */
  .hp-empty{padding:52px 20px;border-radius:20px}
  .hp-empty h3{font-size:22px}
  .hp-sk{height:280px;border-radius:18px}

  /* promises */
  .hp-promises{grid-template-columns:1fr;gap:12px}
  .hp-promise{padding:24px 22px;border-radius:18px}
  .hp-promise h4{font-size:19px}
  .hp-promise p{font-size:13.5px}

  /* stats */
  .hp-stats{grid-template-columns:1fr 1fr;gap:18px;padding:24px 20px;border-radius:24px}
  .hp-stat b{font-size:30px}
  .hp-stat span{font-size:10px;letter-spacing:.14em}

  /* tests */
  .hp-tests{grid-template-columns:1fr;gap:14px}
  .hp-tests > .hp-test:nth-child(3){grid-column:auto}
  .hp-test{padding:26px 22px;gap:14px;border-radius:20px}
  .hp-test blockquote{font-size:15.5px;line-height:1.55}
  .hp-test-quote{font-size:56px;right:16px;top:10px}
  .hp-test-av{width:40px;height:40px;font-size:12px}
  .hp-test figcaption b{font-size:13.5px}
  .hp-test figcaption small{font-size:12px}

  /* faq */
  .hp-faq-left h2{font-size:26px}
  .hp-faq-left p{font-size:14.5px}
  .hp-faq-cta{padding:12px 20px;font-size:13px}
  .hp-faq-item{border-radius:16px}
  .hp-faq-item summary{padding:18px 20px;font-size:15.5px;gap:14px}
  .hp-faq-item p{padding:0 20px 18px;font-size:14px;line-height:1.68}

  /* toast */
  .hp-toast{
    top:12px;right:12px;left:12px;max-width:none;
    padding:13px 16px;font-size:13px;border-radius:14px;
  }

  /* footer */
  .hp-foot{margin-top:80px}
  .hp-news{
    padding:30px 24px;margin-top:-44px;
    border-radius:24px 24px 24px 60px;
    gap:20px;
  }
  .hp-news h3{font-size:24px}
  .hp-news p{font-size:14px}
  .hp-news-form{
    width:100%;max-width:100%;
    flex-direction:column;gap:8px;
    border-radius:18px;padding:8px;
  }
  .hp-news input{padding:10px 14px;font-size:14px;text-align:center}
  .hp-news .hp-btn{width:100%;padding:12px 20px;font-size:13.5px}

  .hp-fgrid{grid-template-columns:1fr;gap:30px;padding:48px 0 30px}
  .hp-logo{font-size:28px}
  .hp-fgrid h4{font-size:10.5px;margin-bottom:12px}
  .hp-fgrid ul{font-size:13.5px;gap:9px}
  .hp-fgrid p{font-size:13.5px;line-height:1.68}

  .hp-fbot{
    flex-direction:column;gap:6px;
    padding:20px 0 24px;font-size:12px;
  }
}

@media (max-width:420px){
  .hp-wrap{padding:0 16px}
  .hp-copy h1{font-size:clamp(28px,9.2vw,40px)}
  .hp-copy p{font-size:15px}
  .hp-search{padding:5px 5px 5px 14px;gap:5px}
  .hp-search input{font-size:13.5px}
  .hp-search .hp-btn{padding:10px 15px;font-size:12.5px}
  .hp-quick button{padding:6px 12px;font-size:12px}
  .hp-arches{height:230px;gap:8px}
  .hp-stk{width:70px;height:70px;font-size:10.5px;padding:10px;top:8%}
  .hp-lbl{padding:6px 8px}
  .hp-lbl b,.hp-lbl small{font-size:10.5px}
  .hp-grid{gap:11px}
  .hp-body{padding:11px;gap:5px}
  .hp-name{font-size:13.5px}
  .hp-price b{font-size:17px}
  .hp-price s{font-size:11.5px}
  .hp-acts button{padding:9px 5px;font-size:11.5px}
  .hp-cats{grid-auto-rows:100px;gap:10px}
  .hp-cat{padding:12px;border-radius:16px}
  .hp-cat b{font-size:14px}
  .hp-cat small{font-size:11px}
  .hp-cat.all b{font-size:18px}
  .hp-cat.all .ic{font-size:28px}
  .hp-stat b{font-size:26px}
  .hp-stat span{font-size:9.5px}
  .hp-news{padding:24px 20px;border-radius:22px 22px 22px 48px}
  .hp-news h3{font-size:21px}
  .hp-perks{gap:10px}
  .hp-perk{padding:15px 14px}
  .hp-perk-ic{width:36px;height:36px;font-size:18px}
  .hp-perk b{font-size:13px}
  .hp-perk small{font-size:11.5px}
}

@media (prefers-reduced-motion:reduce){
  .hp *{animation:none!important;transition:none!important}
  .hp-ann-track{animation:none!important;transform:none!important}
}
`;

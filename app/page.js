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

const ANNOUNCEMENTS = [
  "✦ Free delivery on orders above ₹499",
  "✦ 7-day easy returns",
  "✦ New season edit — up to 40% off",
  "✦ Secure UPI, cards & COD",
  "✦ Support daily, 9am to 9pm",
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
  const [menuOpen, setMenuOpen] = useState(false);

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
  const saveCart = (cart) => {
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-change"));
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

  const orderNow = (product) => {
    const token = getToken();

    if (!token) {
      return requireLogin();
    }

    if (!product?._id) {
      return showToast("error", "Product ID is missing.");
    }

    if (Number(product.stock) <= 0) {
      return showToast("error", "This product is out of stock.");
    }

    const cart = getCart();

    const existingIndex = cart.findIndex(
      (item) => String(item?._id || item?.id) === String(product._id),
    );

    let updatedCart;

    if (existingIndex !== -1) {
      updatedCart = [...cart];

      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        ...product,
        quantity: 1,
      };
    } else {
      updatedCart = [
        ...cart,
        {
          ...product,
          quantity: 1,
        },
      ];
    }

    saveCart(updatedCart);

    router.push("/checkout");
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

      {/* ================= HERO ================= */}
      <section className="hp-hero">
        <span className="hp-blob hp-blob-1" aria-hidden="true" />
        <span className="hp-blob hp-blob-2" aria-hidden="true" />
        <span className="hp-blob hp-blob-3" aria-hidden="true" />
        <span className="hp-grid-tex" aria-hidden="true" />

        <div className="hp-wrap">
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
                placeholder="Search by product, brand or SKU"
                aria-label="Search products"
              />
              <button type="submit" className="hp-btn">
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
                  className="hp-arch"
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

      {/* ================= ANNOUNCEMENT ================= */}
      <div className="hp-ann">
        <div className="hp-ann-track">
          {[0, 1].map((k) => (
            <div className="hp-ann-row" key={k} aria-hidden={k === 1}>
              {ANNOUNCEMENTS.map((text, i) => (
                <span key={i}>{text}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ================= PERKS BAND ================= */}
      <div className="hp-band">
        <div className="hp-wrap">
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
        <div className="hp-wrap">
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
            <div>
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
            <div>
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

          {/* Filter chips */}
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
            <div>
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
            <div>
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
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* ============ ROOT ============ */
.hp{
  --ink:#1b1436;
  --ink-2:#2c2450;
  --mut:#6f6a8a;
  --mut-2:#9a94b8;
  --paper:#fdfcff;
  --card:#ffffff;
  --line:#eeeaf9;
  --line-2:#f5f2fc;
  --pink:#ec4899;
  --pink-2:#f472b6;
  --purple:#8b5cf6;
  --purple-2:#a78bfa;
  --blue:#3b82f6;
  --blue-2:#60a5fa;
  --pink-soft:#fdf2f8;
  --purple-soft:#f5f3ff;
  --blue-soft:#eff6ff;
  --grad:linear-gradient(120deg,#ec4899 0%,#8b5cf6 52%,#3b82f6 100%);
  --grad-soft:linear-gradient(120deg,#fde7f3 0%,#ece5ff 50%,#e0edff 100%);
  --shadow-sm:0 12px 26px -22px rgba(27,20,54,.55);
  --shadow-md:0 26px 44px -32px rgba(139,92,246,.6);
  --shadow-lg:0 40px 70px -50px rgba(27,20,54,.6);
  --r-sm:14px;
  --r-md:20px;
  --r-lg:26px;
  --r-xl:32px;
  background:var(--paper);
  color:var(--ink);
  font:400 15px/1.6 'Plus Jakarta Sans',system-ui,-apple-system,'Segoe UI',sans-serif;
  -webkit-font-smoothing:antialiased;
  overflow-x:hidden;
  width:100%;
  max-width:100vw;
}
.hp *{box-sizing:border-box;min-width:0}
.hp a{color:inherit;text-decoration:none}
.hp button,.hp input{font:inherit;color:inherit}
.hp button{cursor:pointer;touch-action:manipulation}
.hp img{max-width:100%;display:block;height:auto}
.hp :focus-visible{outline:2px solid var(--purple);outline-offset:3px;border-radius:8px}
.hp h1,.hp h2,.hp h3,.hp h4{
  font-family:'Fraunces',Georgia,serif;
  font-weight:500;margin:0;letter-spacing:-.02em;color:var(--ink);
  overflow-wrap:anywhere;
}
.hp-wrap{max-width:1240px;margin:0 auto;padding:0 28px;width:100%}

/* ============ ANNOUNCEMENT ============ */
.hp-ann{
  background:var(--grad);
  color:#fff;font-size:12px;font-weight:600;letter-spacing:.14em;
  text-transform:uppercase;
  overflow:hidden;height:38px;display:flex;align-items:center;
  position:relative;
  font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;
}
.hp-ann-track{
  display:flex;gap:56px;white-space:nowrap;
  animation:hpMarquee 40s linear infinite;
  padding-left:24px;
  width:max-content; /* FIX: Ensures the track expands to fit all text */
  will-change:transform;
}
.hp-ann-row{
  display:flex;gap:56px;
  flex-shrink:0; /* FIX: Prevents the row from shrinking */
  width:max-content; /* FIX: Expands to fit content */
}
.hp-ann span{
  opacity:.95;
  flex-shrink:0; /* FIX: Prevents individual spans from shrinking */
  white-space:nowrap; /* FIX: Prevents wrapping */
}

/* ============ HEADER ============ */
.hp-nav{
  position:sticky;top:0;z-index:50;
  background:rgba(253,252,255,.82);
  -webkit-backdrop-filter:blur(16px) saturate(180%);
  backdrop-filter:blur(16px) saturate(180%);
  border-bottom:1px solid var(--line);
}
.hp-nav-in{display:flex;align-items:center;gap:24px;height:72px}
.hp-brand{display:flex;align-items:center;gap:11px;flex:none}
.hp-brand-mark{
  width:36px;height:36px;border-radius:11px;
  background:var(--grad);color:#fff;
  display:grid;place-items:center;
  font:700 17px 'Fraunces',Georgia,serif;
  box-shadow:0 12px 22px -14px rgba(139,92,246,.9);
}
.hp-brand-name{
  font:600 21px 'Fraunces',Georgia,serif;letter-spacing:-.03em;
}
.hp-nav-links{display:flex;align-items:center;gap:30px;margin-left:auto}
.hp-nav-links a{
  font-size:14px;font-weight:500;color:var(--ink-2);
  position:relative;padding:4px 0;
  transition:color .25s ease;
}
.hp-nav-links a::after{
  content:"";position:absolute;left:0;right:0;bottom:-2px;height:2px;border-radius:2px;
  background:var(--grad);transform:scaleX(0);transform-origin:left;
  transition:transform .3s ease;
}
.hp-nav-links a:hover{color:var(--ink)}
.hp-nav-links a:hover::after{transform:scaleX(1)}

.hp-nav-acts{display:flex;align-items:center;gap:8px;margin-left:auto}
.hp-icon-btn{
  width:40px;height:40px;border-radius:50%;
  border:1px solid var(--line);background:var(--card);
  display:grid;place-items:center;color:var(--ink-2);
  transition:background .3s ease,color .3s ease,border-color .3s ease,transform .3s ease,box-shadow .3s ease;
}
.hp-icon-btn:hover{
  background:var(--grad);color:#fff;border-color:transparent;
  transform:translateY(-2px);box-shadow:var(--shadow-md);
}
.hp-menu-btn{
  display:none;width:40px;height:40px;border-radius:50%;
  border:1px solid var(--line);background:var(--card);
  place-items:center;position:relative;
}
.hp-burger{
  display:block;width:16px;height:2px;background:var(--ink);border-radius:2px;
  position:relative;
}
.hp-burger::before,.hp-burger::after{
  content:"";position:absolute;left:0;width:16px;height:2px;background:var(--ink);border-radius:2px;
  transition:transform .3s ease,top .3s ease;
}
.hp-burger::before{top:-5px}
.hp-burger::after{top:5px}
.hp-burger.x{background:transparent}
.hp-burger.x::before{top:0;transform:rotate(45deg)}
.hp-burger.x::after{top:0;transform:rotate(-45deg)}

.hp-drawer{
  border-top:1px solid var(--line);
  background:rgba(253,252,255,.96);
  -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
  animation:hpIn .28s ease;
}
.hp-drawer .hp-wrap{display:flex;flex-direction:column;gap:2px;padding-top:12px;padding-bottom:14px}
.hp-drawer a{
  padding:12px 4px;font-weight:600;font-size:15px;
  border-bottom:1px solid var(--line-2);color:var(--ink-2);
}
.hp-drawer a:last-child{border-bottom:0}

/* ============ HERO ============ */
.hp-hero{
  position:relative;padding-top:88px;overflow:hidden;
  background:
    radial-gradient(900px 460px at 6% -10%, #fde7f3 0%, rgba(253,231,243,0) 60%),
    radial-gradient(820px 460px at 96% -12%, #e0edff 0%, rgba(224,237,255,0) 58%),
    radial-gradient(700px 420px at 55% -20%, #ece5ff 0%, rgba(236,229,255,0) 62%),
    linear-gradient(180deg,#fefdff 0%, var(--paper) 100%);
}
.hp-blob{position:absolute;border-radius:50%;filter:blur(70px);opacity:.55;pointer-events:none;z-index:0}
.hp-blob-1{width:420px;height:420px;left:-120px;top:80px;background:radial-gradient(circle,#f9c9e5,transparent 70%)}
.hp-blob-2{width:460px;height:460px;right:-140px;top:-40px;background:radial-gradient(circle,#cdb8fb,transparent 70%)}
.hp-blob-3{width:360px;height:360px;left:38%;top:180px;background:radial-gradient(circle,#bcd8fb,transparent 70%);opacity:.4}
.hp-grid-tex{
  position:absolute;inset:0;pointer-events:none;z-index:0;
  background-image:radial-gradient(rgba(27,20,54,.05) 1px, transparent 1px);
  background-size:24px 24px;
  -webkit-mask-image:linear-gradient(180deg,#000 0%, transparent 78%);
  mask-image:linear-gradient(180deg,#000 0%, transparent 78%);
}

.hp-hero .hp-wrap{
  position:relative;z-index:1;
  display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:end;
  padding-bottom:80px;
}
.hp-copy{max-width:620px;min-width:0}
.hp-eyebrow{
  display:inline-flex;align-items:center;gap:9px;
  padding:7px 15px 7px 11px;border-radius:999px;
  background:rgba(255,255,255,.75);
  border:1px solid rgba(139,92,246,.2);
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
  color:var(--ink-2);font-size:11.5px;font-weight:600;
  letter-spacing:.14em;text-transform:uppercase;
  box-shadow:0 10px 24px -18px rgba(139,92,246,.7);
  max-width:100%;
}
.hp-dot{
  width:7px;height:7px;border-radius:50%;flex:none;
  background:var(--grad);
  box-shadow:0 0 0 3px rgba(236,72,153,.15);
}
.hp-copy h1{
  margin-top:24px;
  font-size:clamp(38px,5.6vw,78px);
  line-height:1.05;letter-spacing:-.03em;max-width:14ch;
}
.hp-copy h1 em{
  font-style:italic;font-weight:600;
  background:var(--grad);
  -webkit-background-clip:text;background-clip:text;color:transparent;
}
.hp-copy p{
  color:var(--mut);font-size:17px;line-height:1.7;
  max-width:46ch;margin:26px 0 36px;
}

.hp-search{
  display:flex;align-items:center;gap:10px;
  background:var(--card);
  border:1px solid var(--line);
  border-radius:999px;
  padding:7px 7px 7px 20px;
  max-width:530px;width:100%;
  box-shadow:0 1px 2px rgba(27,20,54,.04),0 26px 44px -32px rgba(139,92,246,.55);
  transition:border-color .3s ease,box-shadow .3s ease,transform .3s ease;
}
.hp-search:hover{transform:translateY(-1px)}
.hp-search:focus-within{
  border-color:var(--purple);
  box-shadow:0 0 0 4px rgba(139,92,246,.12),0 26px 44px -32px rgba(139,92,246,.6);
}
.hp-search-ic{color:var(--mut);font-size:17px;line-height:1;flex:none}
.hp-search input{flex:1;min-width:0;border:0;outline:0;background:none;font-size:15px;color:var(--ink);width:100%}
.hp-search input::placeholder{color:#a9a4c0}
.hp-search input:focus-visible{outline:0}

.hp-btn{
  position:relative;border:0;border-radius:999px;
  padding:13px 26px;font-weight:600;font-size:14px;letter-spacing:.01em;
  background:var(--grad);color:#fff;
  background-size:180% 180%;background-position:0% 50%;
  box-shadow:0 14px 28px -18px rgba(139,92,246,.95);
  transition:background-position .5s ease,transform .3s ease,box-shadow .3s ease;
  white-space:nowrap;
}
.hp-btn:hover{background-position:100% 50%;transform:translateY(-1px);box-shadow:0 20px 34px -18px rgba(139,92,246,1)}

.hp-quick{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:24px}
.hp-quick span{
  font-size:10.5px;font-weight:700;letter-spacing:.2em;
  text-transform:uppercase;color:#a9a4c0;margin-right:2px;
}
.hp-quick button{
  border:1px solid var(--line);background:rgba(255,255,255,.8);border-radius:999px;
  padding:7px 16px;font-weight:500;font-size:13px;color:var(--ink-2);
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
  transition:border-color .3s ease,color .3s ease,background .3s ease,transform .3s ease;
}
.hp-quick button:hover{
  border-color:transparent;color:#fff;background:var(--grad);transform:translateY(-1px);
}

.hp-hero-meta{display:flex;align-items:center;gap:16px;margin-top:38px;flex-wrap:wrap}
.hp-hero-avatars{display:flex}
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
.hp-hero-note b{font-size:13.5px;font-weight:700;color:var(--ink)}
.hp-hero-note small{font-size:12.5px;color:var(--mut)}

.hp-arches{position:relative;height:520px;display:flex;gap:16px;align-items:flex-end}
.hp-arch{
  position:relative;display:block;flex:1;overflow:hidden;min-width:0;
  border-radius:240px 240px 24px 24px;
  border:1px solid rgba(255,255,255,.85);
  box-shadow:0 40px 70px -50px rgba(27,20,54,.6),inset 0 0 0 1px rgba(255,255,255,.5);
  animation:hpRise .9s cubic-bezier(.2,.8,.2,1) both;
  transition:transform .5s cubic-bezier(.2,.8,.2,1);
}
.hp-arch:hover{transform:translateY(-6px)}
.hp-arch:nth-child(1){height:66%}
.hp-arch:nth-child(2){height:94%;animation-delay:.12s}
.hp-arch:nth-child(3){height:54%;animation-delay:.24s}
.hp-arch img{width:100%;height:100%;object-fit:cover;transition:transform .8s cubic-bezier(.2,.8,.2,1)}
.hp-arch:hover img{transform:scale(1.07)}
.hp-ph{position:absolute;inset:0;display:grid;place-items:center;font-size:44px;opacity:.75}
.hp-lbl{
  position:absolute;left:10px;right:10px;bottom:10px;
  background:rgba(255,255,255,.88);
  -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);
  border:1px solid rgba(255,255,255,.8);
  border-radius:16px;padding:10px 13px;
  display:flex;flex-direction:column;gap:2px;min-width:0;
  box-shadow:0 14px 26px -18px rgba(27,20,54,.55);
}
.hp-lbl b{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hp-lbl small{
  font-weight:700;font-size:12.5px;
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
}
.hp-stk{
  position:absolute;left:-14px;top:4%;
  width:118px;height:118px;padding:18px;border-radius:50%;
  background:var(--grad);color:#fff;
  display:grid;place-items:center;text-align:center;
  font:600 15px/1.15 'Fraunces',Georgia,serif;letter-spacing:-.01em;
  transform:rotate(-11deg);z-index:3;
  box-shadow:0 26px 46px -24px rgba(139,92,246,.9),inset 0 0 0 1px rgba(255,255,255,.35);
}

/* ============ BAND ============ */
.hp-band{
  position:relative;background:var(--card);
  border-top:1px solid var(--line);border-bottom:1px solid var(--line);
}
.hp-band .hp-wrap{
  display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px 32px;
  padding-top:18px;padding-bottom:18px;
}
.hp-band span{
  display:flex;align-items:center;gap:10px;
  font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;
  color:var(--ink-2);
}
.hp-band span::before{
  content:"";width:6px;height:6px;border-radius:50%;background:var(--grad);flex:none;
}

/* ============ PERK CARDS ============ */
.hp-sec-tight{padding-top:56px}
.hp-perks{
  display:grid;grid-template-columns:repeat(4,1fr);gap:18px;
}
.hp-perk{
  position:relative;background:var(--card);
  border:1px solid var(--line);border-radius:var(--r-md);
  padding:22px 22px 20px;
  display:flex;flex-direction:column;gap:6px;
  box-shadow:var(--shadow-sm);
  transition:transform .4s cubic-bezier(.2,.8,.2,1),box-shadow .4s ease,border-color .4s ease;
}
.hp-perk::after{
  content:"";position:absolute;right:-30px;top:-30px;width:120px;height:120px;border-radius:50%;
  background:var(--grad-soft);opacity:.5;z-index:0;pointer-events:none;
}
.hp-perk:hover{transform:translateY(-4px);box-shadow:var(--shadow-md);border-color:transparent}
.hp-perk-ic{
  font-size:22px;position:relative;z-index:1;
  width:44px;height:44px;border-radius:12px;
  display:grid;place-items:center;
  background:var(--grad-soft);
  margin-bottom:6px;
}
.hp-perk b{position:relative;z-index:1;font:600 15px 'Fraunces',Georgia,serif;letter-spacing:-.01em}
.hp-perk small{position:relative;z-index:1;color:var(--mut);font-size:13px;line-height:1.55}

/* ============ PRESS ============ */
.hp-press{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--card)}
.hp-press .hp-wrap{
  display:flex;align-items:center;gap:32px;
  padding-top:20px;padding-bottom:20px;flex-wrap:wrap;
}
.hp-press-label{
  font-size:10.5px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;
  color:var(--mut-2);flex:none;
}
.hp-press-row{display:flex;gap:38px;flex-wrap:wrap;align-items:center;flex:1;min-width:0}
.hp-press-item{
  font:600 15px 'Fraunces',Georgia,serif;letter-spacing:.06em;
  color:var(--mut-2);opacity:.75;
  transition:opacity .3s ease,color .3s ease;
}
.hp-press-item:hover{opacity:1;color:var(--ink)}

/* ============ SECTIONS ============ */
.hp-sec{padding-top:92px}
#products{scroll-margin-top:96px}
.hp-head{
  display:flex;justify-content:space-between;align-items:flex-end;
  gap:24px;flex-wrap:wrap;margin-bottom:34px;
}
.hp-head-center{justify-content:center;text-align:center;flex-direction:column;align-items:center}
.hp-kicker{
  display:inline-block;margin-bottom:14px;
  font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
}
.hp-head h2{font-size:clamp(28px,3.8vw,48px);line-height:1.05}
.hp-head p{margin:12px 0 0;color:var(--mut);font-size:15px;max-width:52ch}
.hp-head-link{
  display:inline-flex;align-items:center;gap:8px;
  font-size:14px;font-weight:600;color:var(--ink);
  padding:10px 20px;border-radius:999px;border:1px solid var(--line);
  background:var(--card);
  transition:background .3s ease,color .3s ease,border-color .3s ease,transform .3s ease,box-shadow .3s ease;
  white-space:nowrap;
}
.hp-head-link span{transition:transform .3s ease}
.hp-head-link:hover{
  background:var(--grad);color:#fff;border-color:transparent;transform:translateY(-2px);
  box-shadow:var(--shadow-md);
}
.hp-head-link:hover span{transform:translateX(3px)}

/* ============ CATEGORIES ============ */
.hp-cats{
  display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));
  grid-auto-rows:126px;gap:16px;
}
.hp-cat{
  position:relative;overflow:hidden;
  border:1px solid rgba(255,255,255,.9);border-radius:22px;
  padding:20px;text-align:left;
  display:flex;flex-direction:column;justify-content:flex-end;gap:2px;
  color:var(--ink);background:var(--card);
  box-shadow:0 18px 34px -30px rgba(27,20,54,.55),inset 0 1px 0 rgba(255,255,255,.9);
  transition:transform .4s cubic-bezier(.2,.8,.2,1),box-shadow .4s ease;
}
.hp-cat::after{
  content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  background:radial-gradient(120% 90% at 100% 0%, rgba(255,255,255,.65), transparent 55%);
}
.hp-cat:hover{
  transform:translateY(-5px);
  box-shadow:0 34px 54px -34px rgba(139,92,246,.7),inset 0 1px 0 rgba(255,255,255,.9);
}
.hp-cat b{font:600 17px/1.2 'Fraunces',Georgia,serif;position:relative;z-index:1;overflow-wrap:anywhere}
.hp-cat small{opacity:.72;font-size:12.5px;position:relative;z-index:1}
.hp-cat .ic{
  position:absolute;right:16px;top:14px;font-size:32px;line-height:1;
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
.hp-cat.all small{opacity:.82;color:#fff}
.hp-cat.all .ic{font-size:40px}
.hp-cat.all:hover{box-shadow:0 40px 64px -30px rgba(139,92,246,1)}
.hp-cat.all.on{box-shadow:inset 0 0 0 2px rgba(255,255,255,.6),0 34px 60px -30px rgba(139,92,246,1)}

/* ============ SPLIT BANNERS ============ */
.hp-split{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.hp-split-card{
  position:relative;overflow:hidden;
  border-radius:var(--r-lg);
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
  font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;
  color:var(--ink-2);opacity:.7;
}
.hp-split-card h3{font-size:clamp(22px,3vw,34px);line-height:1.1;position:relative;z-index:1}
.hp-split-card p{color:var(--ink-2);opacity:.75;max-width:34ch;font-size:15px;position:relative;z-index:1}
.hp-split-link{
  display:inline-flex;align-items:center;gap:8px;
  margin-top:12px;font-weight:600;font-size:14px;
  position:relative;z-index:1;color:var(--ink);
}
.hp-split-link span{transition:transform .3s ease}
.hp-split-link:hover span{transform:translateX(4px)}
.hp-split-orb{
  position:absolute;right:-80px;bottom:-80px;width:280px;height:280px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,255,255,.8),rgba(255,255,255,0) 70%);
}

/* ============ CHIPS ============ */
.hp-chips{
  display:flex;flex-wrap:wrap;gap:8px;margin:-8px 0 26px;
}
.hp-chip{
  border:1px solid var(--line);background:var(--card);
  border-radius:999px;padding:8px 18px;
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
  padding:0 16px;width:min(100%,340px);color:var(--mut);
  box-shadow:0 16px 30px -26px rgba(27,20,54,.5);
  transition:border-color .3s ease,box-shadow .3s ease;
}
.hp-tools:focus-within{border-color:var(--purple);box-shadow:0 0 0 4px rgba(139,92,246,.12)}
.hp-tools input{flex:1;min-width:0;border:0;outline:0;background:none;padding:13px 0;color:var(--ink);font-size:14px;width:100%}
.hp-tools input::placeholder{color:#a9a4c0}
.hp-tools input:focus-visible{outline:0}
.hp-tools button{
  border:0;background:var(--line-2);color:var(--ink-2);
  border-radius:50%;width:24px;height:24px;line-height:1;font-size:14px;flex:none;
  transition:background .25s ease,color .25s ease;
}
.hp-tools button:hover{background:var(--grad);color:#fff}

/* ============ PRODUCT GRID ============ */
.hp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px}
.hp-card{
  position:relative;background:var(--card);
  border:1px solid var(--line);border-radius:22px;overflow:hidden;
  display:flex;flex-direction:column;min-width:0;
  box-shadow:0 18px 40px -34px rgba(27,20,54,.55);
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
  transform:translateY(-6px);
  box-shadow:0 40px 60px -38px rgba(139,92,246,.7);
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
  padding:10px 14px;border-radius:12px;
  background:rgba(27,20,54,.9);color:#fff;
  font-size:12.5px;font-weight:600;text-align:center;
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
  opacity:0;transform:translateY(8px);
  transition:opacity .35s ease,transform .35s ease;
}
.hp-card:hover .hp-quick-view{opacity:1;transform:translateY(0)}
.hp-sold{
  position:absolute;inset:0;display:grid;place-items:center;
  background:rgba(253,252,255,.84);
  -webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);
  font:500 16px 'Fraunces',Georgia,serif;letter-spacing:.06em;color:var(--ink-2);
}

.hp-body{padding:18px 18px 16px;display:flex;flex-direction:column;gap:8px;flex:1;min-width:0}
.hp-cn{
  color:var(--mut);font-size:10.5px;font-weight:700;
  letter-spacing:.16em;text-transform:uppercase;
  overflow-wrap:anywhere;
}
.hp-name{
  font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:17px;line-height:1.32;
  color:var(--ink);
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  transition:color .3s ease;
  overflow-wrap:anywhere;
}
.hp-name:hover{
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
}
.hp-rate{display:flex;align-items:center;gap:8px;color:var(--mut);font-size:12.5px;flex-wrap:wrap}
.hp-stars{
  background:linear-gradient(90deg,#8b5cf6 var(--r),#e8e4f5 var(--r));
  -webkit-background-clip:text;background-clip:text;color:transparent;
  letter-spacing:2px;font-size:13px;flex:none;
}
.hp-price{display:flex;align-items:baseline;gap:10px;margin-top:2px;flex-wrap:wrap}
.hp-price b{
  font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:23px;letter-spacing:-.02em;
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
  border:1px solid transparent;
  transition:background .3s ease,color .3s ease,border-color .3s ease,transform .3s ease,box-shadow .3s ease;
  min-height:40px;
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

.hp-more{display:flex;justify-content:center;margin-top:52px;padding:0 8px}
.hp-more a{
  position:relative;background:var(--card);border:1px solid var(--line);
  border-radius:999px;padding:15px 34px;font-weight:600;font-size:14px;color:var(--ink);
  box-shadow:0 20px 36px -30px rgba(27,20,54,.7);
  transition:background .35s ease,color .35s ease,border-color .35s ease,transform .35s ease,box-shadow .35s ease;
  text-align:center;
}
.hp-more a:hover{
  background:var(--grad);color:#fff;border-color:transparent;transform:translateY(-2px);
  box-shadow:0 26px 44px -26px rgba(139,92,246,.95);
}

/* ============ EMPTY / SKELETON ============ */
.hp-empty{
  text-align:center;padding:76px 22px;background:var(--card);
  border:1px dashed var(--line);border-radius:24px;
}
.hp-empty-ic{font-size:40px;display:block;margin-bottom:14px}
.hp-empty h3{font-size:28px;margin-bottom:8px}
.hp-empty p{color:var(--mut);margin:0 0 24px}
.hp-sk{
  height:410px;border-radius:22px;
  background:linear-gradient(100deg,#f3eefc 25%,#faf7ff 50%,#f3eefc 75%);
  background-size:200% 100%;animation:hpSh 1.4s linear infinite;
}

/* ============ PROMISES ============ */
.hp-promises{
  display:grid;grid-template-columns:repeat(4,1fr);gap:20px;
}
.hp-promise{
  position:relative;background:var(--card);
  border:1px solid var(--line);border-radius:var(--r-md);
  padding:32px 26px 28px;
  display:flex;flex-direction:column;gap:10px;
  overflow:hidden;
  transition:transform .4s cubic-bezier(.2,.8,.2,1),box-shadow .4s ease,border-color .4s ease;
}
.hp-promise::before{
  content:"";position:absolute;left:0;right:0;top:0;height:3px;background:var(--grad);
  transform:scaleX(0);transform-origin:left;transition:transform .45s ease;
}
.hp-promise:hover{transform:translateY(-4px);box-shadow:var(--shadow-md);border-color:transparent}
.hp-promise:hover::before{transform:scaleX(1)}
.hp-promise-num{
  font:600 13px 'Plus Jakarta Sans',sans-serif;
  letter-spacing:.22em;color:var(--mut-2);
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
  font-weight:700;
}
.hp-promise h4{font-size:21px}
.hp-promise p{color:var(--mut);font-size:14px;line-height:1.65;margin:0}

/* ============ STATS ============ */
.hp-stats{
  display:grid;grid-template-columns:repeat(4,1fr);gap:20px;
  padding:40px 36px;border-radius:var(--r-lg);
  background:var(--grad-soft);
  border:1px solid rgba(139,92,246,.14);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.9);
}
.hp-stat{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;min-width:0}
.hp-stat b{
  font:600 clamp(26px,4vw,44px) 'Fraunces',Georgia,serif;letter-spacing:-.03em;
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
}
.hp-stat span{
  font-size:11.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;
  color:var(--ink-2);opacity:.75;
}

/* ============ TESTIMONIALS ============ */
.hp-tests{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.hp-test{
  position:relative;margin:0;background:var(--card);
  border:1px solid var(--line);border-radius:var(--r-md);
  padding:32px 28px 26px;
  display:flex;flex-direction:column;gap:18px;
  box-shadow:var(--shadow-sm);
  transition:transform .4s cubic-bezier(.2,.8,.2,1),box-shadow .4s ease,border-color .4s ease;
}
.hp-test:hover{transform:translateY(-4px);box-shadow:var(--shadow-md);border-color:transparent}
.hp-test-quote{
  position:absolute;right:22px;top:14px;
  font:600 74px/1 'Fraunces',Georgia,serif;
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
  opacity:.28;pointer-events:none;
}
.hp-test blockquote{
  margin:0;font-family:'Fraunces',Georgia,serif;
  font-size:17px;line-height:1.55;color:var(--ink-2);font-weight:400;
  overflow-wrap:anywhere;
}
.hp-test figcaption{display:flex;align-items:center;gap:12px;margin-top:auto;padding-top:14px;border-top:1px solid var(--line-2)}
.hp-test-av{
  width:42px;height:42px;border-radius:50%;
  background:var(--grad);color:#fff;
  display:grid;place-items:center;font-size:13px;font-weight:700;flex:none;
  box-shadow:0 12px 22px -14px rgba(139,92,246,.9);
}
.hp-test figcaption b{display:block;font-size:14px;color:var(--ink);font-weight:700}
.hp-test figcaption small{display:block;color:var(--mut);font-size:12.5px}

/* ============ FAQ ============ */
.hp-faq-wrap{
  display:grid;grid-template-columns:.9fr 1.1fr;gap:56px;align-items:start;
}
.hp-faq-left h2{font-size:clamp(26px,3.4vw,42px);line-height:1.1;margin-bottom:14px}
.hp-faq-left p{color:var(--mut);font-size:15px;max-width:40ch;line-height:1.7;margin:0 0 24px}
.hp-faq-cta{
  display:inline-flex;align-items:center;gap:8px;
  font-weight:600;font-size:14px;
  padding:12px 22px;border-radius:999px;
  background:var(--ink);color:#fff;
  transition:background .3s ease,transform .3s ease,box-shadow .3s ease;
}
.hp-faq-cta:hover{background:var(--grad);transform:translateY(-1px);box-shadow:var(--shadow-md)}
.hp-faq-cta span{transition:transform .3s ease}
.hp-faq-cta:hover span{transform:translateX(3px)}

.hp-faq{display:flex;flex-direction:column;gap:12px}
.hp-faq-item{
  background:var(--card);border:1px solid var(--line);
  border-radius:var(--r-md);overflow:hidden;
  transition:border-color .3s ease,box-shadow .3s ease;
}
.hp-faq-item[open]{
  border-color:transparent;box-shadow:0 0 0 1.5px rgba(139,92,246,.4),var(--shadow-sm);
}
.hp-faq-item summary{
  list-style:none;cursor:pointer;
  padding:20px 24px;
  display:flex;align-items:center;justify-content:space-between;gap:16px;
  font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:16.5px;color:var(--ink);
  transition:color .3s ease;
}
.hp-faq-item summary::-webkit-details-marker{display:none}
.hp-faq-item summary:hover{color:var(--purple)}
.hp-faq-item summary span{min-width:0;overflow-wrap:anywhere}
.hp-faq-item summary i{
  position:relative;flex:none;
  width:22px;height:22px;border-radius:50%;
  background:var(--line-2);
  transition:background .3s ease,transform .3s ease;
}
.hp-faq-item summary i::before,
.hp-faq-item summary i::after{
  content:"";position:absolute;left:6px;top:10px;width:10px;height:2px;border-radius:2px;
  background:var(--ink-2);transition:transform .3s ease,background .3s ease;
}
.hp-faq-item summary i::after{transform:rotate(90deg)}
.hp-faq-item[open] summary i{background:var(--grad);transform:rotate(180deg)}
.hp-faq-item[open] summary i::before,
.hp-faq-item[open] summary i::after{background:#fff}
.hp-faq-item[open] summary i::after{transform:rotate(0)}
.hp-faq-item p{
  margin:0;padding:0 24px 22px;color:var(--mut);
  font-size:14.5px;line-height:1.72;max-width:60ch;
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
.hp-foot{position:relative;margin-top:120px;background:var(--card);border-top:1px solid var(--line)}
.hp-foot::before{
  content:"";position:absolute;inset:0 0 auto 0;height:340px;pointer-events:none;
  background:
    radial-gradient(620px 300px at 12% 0%, #fde7f3 0%, rgba(253,231,243,0) 65%),
    radial-gradient(620px 300px at 88% 0%, #e0edff 0%, rgba(224,237,255,0) 65%),
    radial-gradient(520px 260px at 50% 0%, #ece5ff 0%, rgba(236,229,255,0) 68%);
  opacity:.75;
}
.hp-foot .hp-wrap{position:relative;z-index:1}

.hp-news{
  position:relative;overflow:hidden;margin-top:-62px;
  background:var(--grad);color:#fff;
  border-radius:28px 28px 28px 96px;
  padding:46px 50px;
  display:flex;justify-content:space-between;align-items:center;gap:30px;flex-wrap:wrap;
  box-shadow:0 46px 80px -50px rgba(139,92,246,1);
}
.hp-news::after{
  content:"";position:absolute;right:-80px;top:-100px;width:320px;height:320px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,255,255,.22),rgba(255,255,255,0) 70%);
}
.hp-news::before{
  content:"";position:absolute;left:-60px;bottom:-120px;width:260px;height:260px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,255,255,.14),rgba(255,255,255,0) 70%);
}
.hp-news-copy{position:relative;z-index:1;min-width:0}
.hp-news-eyebrow{
  display:inline-block;margin-bottom:10px;
  font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;
  color:rgba(255,255,255,.75);
}
.hp-news h3{font-size:clamp(22px,3vw,36px);color:#fff;letter-spacing:-.02em}
.hp-news p{margin:10px 0 0;color:rgba(255,255,255,.82);font-size:15px}
.hp-news-form{
  position:relative;z-index:1;
  display:flex;gap:6px;width:min(100%,460px);
  background:rgba(255,255,255,.14);
  border:1px solid rgba(255,255,255,.26);
  border-radius:999px;padding:6px;
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
}
.hp-news input{
  flex:1;min-width:0;border:0;outline:0;background:none;
  padding:0 18px;color:#fff;font-size:14px;width:100%;
}
.hp-news input::placeholder{color:rgba(255,255,255,.7)}
.hp-news .hp-btn{background:#fff;color:var(--ink);box-shadow:none}
.hp-news .hp-btn:hover{background:var(--ink);color:#fff;transform:translateY(-1px)}

.hp-fgrid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:48px;padding:68px 0 46px}
.hp-fgrid h4{
  margin:0 0 18px;font-family:'Plus Jakarta Sans',sans-serif;
  font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;
  color:var(--ink-2);
}
.hp-fgrid ul{list-style:none;margin:0;padding:0;display:grid;gap:11px;color:var(--mut);font-size:14px}
.hp-fgrid a{transition:color .25s ease}
.hp-fgrid a:hover{
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
}
.hp-fgrid p{color:var(--mut);max-width:36ch;margin:16px 0 0;font-size:14px;line-height:1.75}
.hp-logo{
  font:600 32px 'Fraunces',Georgia,serif;letter-spacing:-.03em;
  background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
}
.hp-soc{display:flex;gap:10px;margin-top:24px;flex-wrap:wrap}
.hp-soc a{
  width:40px;height:40px;border-radius:50%;
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
  padding:7px 13px;border-radius:10px;
  border:1px solid var(--line);background:var(--card);
  font-size:10.5px;font-weight:800;letter-spacing:.09em;color:var(--ink-2);
}

.hp-fbot{
  display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;
  border-top:1px solid var(--line);padding:24px 0 32px;
  color:var(--mut);font-size:12.5px;
}

/* ============ KEYFRAMES ============ */
@keyframes hpRise{from{opacity:0;transform:translateY(52px)}to{opacity:1;transform:none}}
@keyframes hpSh{to{background-position:-200% 0}}
@keyframes hpIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
@keyframes hpMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}

/* ============ RESPONSIVE ============ */

/* --- Large tablets / small laptops --- */
@media(max-width:1080px){
  .hp-nav-links{display:none}
  .hp-menu-btn{display:grid}
  .hp-perks{grid-template-columns:repeat(2,1fr)}
  .hp-promises{grid-template-columns:repeat(2,1fr)}
  .hp-tests{grid-template-columns:1fr 1fr}
  .hp-tests .hp-test:nth-child(3){grid-column:span 2}
  .hp-hero .hp-wrap{gap:40px}
  .hp-fgrid{grid-template-columns:1.4fr 1fr 1fr 1fr;gap:36px}
}

/* --- Tablets --- */
@media(max-width:980px){
  .hp-hero{padding-top:64px}
  .hp-hero .hp-wrap{
    grid-template-columns:1fr;gap:44px;padding-bottom:64px;
  }
  .hp-copy{max-width:100%}
  .hp-arches{height:380px;max-width:600px;width:100%;margin:0 auto}
  .hp-fgrid{grid-template-columns:1fr 1fr;gap:40px}
  .hp-news{padding:36px 30px;border-radius:26px 26px 26px 72px}
  .hp-faq-wrap{grid-template-columns:1fr;gap:36px}
  .hp-split{grid-template-columns:1fr}
  .hp-split-card{padding:36px 32px;min-height:200px}
  .hp-stats{grid-template-columns:repeat(2,1fr);gap:24px;padding:32px 28px}
}

/* --- Small tablets / large phones --- */
@media(max-width:720px){
  .hp-tests{grid-template-columns:1fr}
  .hp-tests .hp-test:nth-child(3){grid-column:auto}
  .hp-arches{height:340px;gap:12px;max-width:520px}
  .hp-stk{width:104px;height:104px;font-size:14px;padding:16px;left:-8px}
  .hp-cats{grid-auto-rows:118px}
  .hp-cat.all{border-radius:22px 22px 22px 64px}
  .hp-cat.all b{font-size:20px}
  .hp-cat.all .ic{font-size:34px}
  .hp-press .hp-wrap{gap:20px}
  .hp-press-row{gap:24px}
  .hp-copy h1{max-width:100%}
}

/* --- Phones --- */
@media(max-width:640px){
  .hp-wrap{padding:0 18px}
  .hp-nav-in{height:64px;gap:14px}
  .hp-brand-name{font-size:19px}
  .hp-icon-btn{width:36px;height:36px}
  .hp-menu-btn{width:36px;height:36px}

  /* Hero */
  .hp-hero{padding-top:44px}
  .hp-hero .hp-wrap{gap:34px;padding-bottom:48px}
  .hp-copy h1{margin-top:20px;font-size:clamp(34px,9vw,52px);line-height:1.06;max-width:100%}
  .hp-copy p{font-size:15.5px;margin:20px 0 28px;max-width:100%}
  .hp-eyebrow{font-size:10.5px;letter-spacing:.12em;padding:6px 13px 6px 10px}
  .hp-search{padding:6px 6px 6px 16px;gap:8px}
  .hp-search input{font-size:14px}
  .hp-search .hp-btn{padding:11px 18px;font-size:13px}
  .hp-quick{margin-top:20px;gap:7px}
  .hp-quick span{font-size:10px}
  .hp-quick button{padding:6px 13px;font-size:12.5px}
  .hp-hero-meta{margin-top:28px;gap:12px}
  .hp-hero-avatars span{width:34px;height:34px;font-size:10.5px}
  .hp-hero-note b{font-size:13px}
  .hp-hero-note small{font-size:12px}

  /* Arches — compact, keep 3 in a row */
  .hp-arches{height:290px;gap:8px;max-width:100%}
  .hp-arch{border-radius:150px 150px 16px 16px}
  .hp-lbl{left:6px;right:6px;bottom:6px;padding:7px 9px;border-radius:12px}
  .hp-lbl b{font-size:11px}
  .hp-lbl small{font-size:11px}
  .hp-ph{font-size:30px}
  .hp-stk{width:78px;height:78px;font-size:11px;padding:10px;left:0;top:-4px;transform:rotate(-9deg)}

  /* Band */
  .hp-band .hp-wrap{gap:8px 18px;padding-top:14px;padding-bottom:14px}
  .hp-band span{font-size:10.5px;letter-spacing:.1em}

  /* Sections */
  .hp-sec{padding-top:60px}
  .hp-sec-tight{padding-top:40px}
  .hp-head{gap:14px;margin-bottom:22px;align-items:flex-start}
  .hp-head h2{font-size:clamp(24px,7vw,32px)}
  .hp-head p{font-size:14px}
  .hp-head-link{padding:8px 14px;font-size:12.5px}

  /* Perks */
  .hp-perks{grid-template-columns:1fr 1fr;gap:12px}
  .hp-perk{padding:16px 14px 15px;border-radius:16px;gap:5px}
  .hp-perk::after{width:90px;height:90px;right:-24px;top:-24px}
  .hp-perk-ic{width:36px;height:36px;font-size:18px;border-radius:10px;margin-bottom:4px}
  .hp-perk b{font-size:13.5px}
  .hp-perk small{font-size:12px}

  /* Press */
  .hp-press .hp-wrap{flex-direction:column;align-items:flex-start;gap:14px;padding-top:18px;padding-bottom:18px}
  .hp-press-row{gap:20px;width:100%}
  .hp-press-item{font-size:13.5px}

  /* Categories */
  .hp-cats{grid-template-columns:1fr 1fr;grid-auto-rows:112px;gap:12px}
  .hp-cat{padding:14px;border-radius:18px}
  .hp-cat b{font-size:14.5px}
  .hp-cat small{font-size:11.5px}
  .hp-cat .ic{font-size:24px;right:10px;top:10px}
  .hp-cat.all{
    grid-row:auto;grid-column:span 2;
    border-radius:18px 18px 18px 48px;
    padding:16px;
  }
  .hp-cat.all b{font-size:19px}
  .hp-cat.all .ic{font-size:26px;top:12px;right:14px}

  /* Split */
  .hp-split{gap:16px}
  .hp-split-card{padding:28px 22px;border-radius:22px;min-height:180px}
  .hp-split-card h3{font-size:22px}
  .hp-split-card p{font-size:14px}
  .hp-split-eyebrow{font-size:10px}
  .hp-split-link{font-size:13.5px}

  /* Chips & tools */
  .hp-chips{margin:-4px 0 18px;gap:6px}
  .hp-chip{padding:7px 13px;font-size:12px}
  .hp-tools{width:100%;padding:0 14px}
  .hp-tools input{padding:12px 0;font-size:13.5px}

  /* Product grid */
  .hp-grid{grid-template-columns:1fr 1fr;gap:12px}
  .hp-body{padding:12px 12px 11px;gap:6px}
  .hp-cn{font-size:9.5px;letter-spacing:.13em}
  .hp-name{font-size:14px}
  .hp-rate{font-size:11.5px;gap:6px}
  .hp-stars{font-size:11px;letter-spacing:1px}
  .hp-price b{font-size:17px}
  .hp-price s{font-size:11.5px}
  .hp-low{font-size:10.5px}
  .hp-acts{grid-template-columns:1fr;gap:6px;padding-top:10px}
  .hp-acts button{padding:9px 6px;font-size:12px;min-height:36px}
  .hp-off{padding:4px 9px;font-size:10px;left:8px;top:8px}
  .hp-quick-view{display:none}
  .hp-sold{font-size:14px}
  .hp-sk{height:300px}

  /* More link */
  .hp-more{margin-top:36px}
  .hp-more a{padding:13px 24px;font-size:13.5px}

  /* Empty */
  .hp-empty{padding:56px 18px}
  .hp-empty h3{font-size:22px}
  .hp-empty p{font-size:14px}

  /* Promises */
  .hp-promises{grid-template-columns:1fr;gap:12px}
  .hp-promise{padding:24px 20px 22px;gap:8px}
  .hp-promise h4{font-size:18px}
  .hp-promise p{font-size:13.5px}

  /* Stats */
  .hp-stats{grid-template-columns:1fr 1fr;gap:18px 14px;padding:24px 18px;border-radius:22px}
  .hp-stat b{font-size:26px}
  .hp-stat span{font-size:10px;letter-spacing:.12em}

  /* Testimonials */
  .hp-tests{gap:14px}
  .hp-test{padding:24px 20px 20px;gap:14px}
  .hp-test blockquote{font-size:15px;line-height:1.55}
  .hp-test-quote{font-size:52px;right:14px;top:8px}
  .hp-test-av{width:38px;height:38px;font-size:12px}

  /* FAQ */
  .hp-faq-wrap{gap:28px}
  .hp-faq-left h2{font-size:clamp(22px,6.5vw,30px)}
  .hp-faq-left p{font-size:14px;margin-bottom:20px}
  .hp-faq-cta{padding:11px 18px;font-size:13px}
  .hp-faq-item summary{padding:15px 16px;font-size:14.5px;gap:12px}
  .hp-faq-item summary i{width:20px;height:20px}
  .hp-faq-item summary i::before,
  .hp-faq-item summary i::after{left:5px;top:9px;width:10px}
  .hp-faq-item p{padding:0 16px 16px;font-size:13.5px;line-height:1.65}

  /* Footer */
  .hp-foot{margin-top:80px}
  .hp-news{
    border-radius:22px 22px 22px 48px;
    padding:28px 22px;
    margin-top:-42px;
    gap:20px;
  }
  .hp-news h3{font-size:22px}
  .hp-news p{font-size:14px}
  .hp-news-form{
    width:100%;flex-direction:column;gap:8px;
    border-radius:18px;padding:8px;
  }
  .hp-news input{padding:10px 12px;font-size:14px;text-align:center}
  .hp-news .hp-btn{padding:12px 20px;width:100%;font-size:13.5px}
  .hp-fgrid{grid-template-columns:1fr;gap:28px;padding:44px 0 30px}
  .hp-logo{font-size:26px}
  .hp-fgrid p{font-size:13.5px}
  .hp-soc{margin-top:20px}
  .hp-pay{margin-top:18px}
  .hp-fbot{flex-direction:column;gap:6px;font-size:11.5px;padding:18px 0 24px;text-align:center;align-items:center}

  /* Toast */
  .hp-toast{
    top:14px;left:14px;right:14px;max-width:none;
    padding:12px 14px;font-size:13px;gap:10px;
  }
}

/* --- Small phones --- */
@media(max-width:420px){
  .hp-wrap{padding:0 14px}
  .hp-copy h1{font-size:clamp(30px,9vw,42px)}
  .hp-copy p{font-size:14.5px}
  .hp-search{padding:5px 5px 5px 14px}
  .hp-search .hp-btn{padding:10px 14px;font-size:12.5px}

  .hp-arches{height:250px;gap:6px}
  .hp-arch{border-radius:120px 120px 14px 14px}
  .hp-lbl{padding:6px 8px}
  .hp-lbl b{font-size:10px}
  .hp-lbl small{font-size:10px}
  .hp-stk{width:66px;height:66px;font-size:10px;padding:8px;top:-6px;left:-2px}

  .hp-cats{grid-template-columns:1fr 1fr;grid-auto-rows:104px;gap:10px}
  .hp-cat{padding:12px;border-radius:16px}
  .hp-cat b{font-size:13.5px}
  .hp-cat small{font-size:11px}
  .hp-cat .ic{font-size:22px;right:9px;top:9px}
  .hp-cat.all b{font-size:17px}
  .hp-cat.all .ic{font-size:22px}

  .hp-grid{gap:10px}
  .hp-body{padding:10px}
  .hp-name{font-size:13px}
  .hp-price b{font-size:16px}
  .hp-acts button{font-size:11.5px;padding:8px 4px}
  .hp-sk{height:260px}

  .hp-perks{gap:10px}
  .hp-perk{padding:14px 12px}
  .hp-perk b{font-size:13px}
  .hp-perk small{font-size:11.5px}

  .hp-stats{padding:20px 14px;gap:14px 10px}
  .hp-stat b{font-size:22px}
  .hp-stat span{font-size:9.5px;letter-spacing:.1em}

  .hp-test{padding:20px 16px}
  .hp-test blockquote{font-size:14.5px}
  .hp-test-quote{font-size:44px}

  .hp-faq-item summary{font-size:14px;padding:14px}
  .hp-faq-item p{font-size:13px;padding:0 14px 14px}

  .hp-news{padding:24px 18px}
  .hp-news h3{font-size:20px}

  .hp-hero-avatars span{width:30px;height:30px;font-size:9.5px}
  .hp-hero-meta{gap:10px}
  .hp-hero-note b{font-size:12.5px}
  .hp-hero-note small{font-size:11.5px}
}

/* --- Extra narrow (foldables / tiny phones) --- */
@media(max-width:360px){
  .hp-copy h1{font-size:28px}
  .hp-search{flex-wrap:wrap;border-radius:18px;padding:8px}
  .hp-search-ic{display:none}
  .hp-search input{padding:8px 4px}
  .hp-search .hp-btn{width:100%;padding:11px 12px}
  .hp-cats{grid-template-columns:1fr;grid-auto-rows:88px}
  .hp-cat.all{grid-column:span 1}
  .hp-grid{grid-template-columns:1fr}
  .hp-stats{grid-template-columns:1fr 1fr;gap:12px}
  .hp-arches{height:220px}
}

/* --- Landscape small phones --- */
@media(max-width:900px) and (max-height:500px) and (orientation:landscape){
  .hp-hero{padding-top:24px}
  .hp-arches{height:220px}
  .hp-sec{padding-top:44px}
}

/* --- Reduced motion --- */
@media(prefers-reduced-motion:reduce){
  .hp *{animation:none!important;transition:none!important}
}
`;

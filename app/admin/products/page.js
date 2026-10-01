"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";

export default function AdminProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [deletingId, setDeletingId] = useState(null);

  // Edit modal
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    description: "",
    image: "",
    category: "",
    stock: "",
  });
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState("");

  // Details modal
  const [detailsModal, setDetailsModal] = useState(null);

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

      fetchProducts(token);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const fetchProducts = async (token) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products");

      const productData =
        response.data.products ||
        response.data.data ||
        (Array.isArray(response.data) ? response.data : []);

      setProducts(productData);
    } catch (error) {
      console.error(error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }

      if (error.response?.status === 403) {
        router.push("/dashboard");
        return;
      }

      setError(error.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    const token = localStorage.getItem("token");

    if (token) {
      fetchProducts(token);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);

    setEditForm({
      name: product.name || "",
      price: product.price ?? "",
      description: product.description || "",
      image: product.image || "",
      category: product.category || "",
      stock: product.stock ?? "",
    });

    setEditError("");
  };

  const closeEdit = () => {
    if (updating) return;

    setEditingProduct(null);
    setEditError("");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!editingProduct) return;

    if (!editForm.name.trim()) {
      setEditError("Product name is required");
      return;
    }

    if (editForm.price === "" || Number(editForm.price) < 0) {
      setEditError("Enter a valid price");
      return;
    }

    if (editForm.stock === "" || Number(editForm.stock) < 0) {
      setEditError("Enter a valid stock");
      return;
    }

    if (!editForm.category.trim()) {
      setEditError("Category is required");
      return;
    }

    try {
      setUpdating(true);
      setEditError("");

      const productId = getProductId(editingProduct);

      const response = await api.put(
        `/products/${productId}`,
        {
          name: editForm.name.trim(),
          price: Number(editForm.price),
          description: editForm.description.trim(),
          image: editForm.image.trim(),
          category: editForm.category.trim(),
          stock: Number(editForm.stock),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const returnedProduct = response.data?.product || response.data?.data;

      setProducts((current) =>
        current.map((product) =>
          getProductId(product) === productId
            ? {
                ...product,
                ...(returnedProduct || {}),
                name: editForm.name.trim(),
                price: Number(editForm.price),
                description: editForm.description.trim(),
                image: editForm.image.trim(),
                category: editForm.category.trim(),
                stock: Number(editForm.stock),
              }
            : product,
        ),
      );

      setEditingProduct(null);
    } catch (error) {
      console.error("Update product error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }

      setEditError(error.response?.data?.message || "Failed to update product");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (productId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this product?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(productId);

      await api.delete(`/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProducts((currentProducts) =>
        currentProducts.filter(
          (product) => getProductId(product) !== productId,
        ),
      );
    } catch (error) {
      console.error(error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }

      setError(error.response?.data?.message || "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const categories = useMemo(() => {
    return [
      ...new Set(
        products
          .map((product) => String(product.category || "").trim())
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const categoryCounts = useMemo(() => {
    return categories.map((category) => ({
      name: category,
      count: products.filter(
        (product) => String(product.category || "").trim() === category,
      ).length,
    }));
  }, [categories, products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const searchValue = search.trim().toLowerCase();

      result = result.filter((product) =>
        String(product.name || "")
          .toLowerCase()
          .includes(searchValue),
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter(
        (product) => String(product.category || "").trim() === categoryFilter,
      );
    }

    if (stockFilter !== "all") {
      result = result.filter((product) => {
        const stock = Number(product.stock || 0);

        if (stockFilter === "in-stock") {
          return stock > 5;
        }

        if (stockFilter === "low-stock") {
          return stock > 0 && stock <= 5;
        }

        if (stockFilter === "out-of-stock") {
          return stock === 0;
        }

        return true;
      });
    }

    if (sortBy === "name") {
      result.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || "")),
      );
    }

    if (sortBy === "price-low") {
      result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }

    if (sortBy === "price-high") {
      result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    if (sortBy === "stock-low") {
      result.sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));
    }

    if (sortBy === "stock-high") {
      result.sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0));
    }

    if (sortBy === "newest") {
      result.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();

        const dateB = new Date(b.createdAt || 0).getTime();

        return dateB - dateA;
      });
    }

    return result;
  }, [products, search, categoryFilter, stockFilter, sortBy]);

  const totalProducts = products.length;

  const totalCategories = categories.length;

  const totalStock = products.reduce(
    (total, product) => total + Number(product.stock || 0),
    0,
  );

  const lowStockProducts = products.filter((product) => {
    const stock = Number(product.stock || 0);

    return stock > 0 && stock <= 5;
  });

  const outOfStockProducts = products.filter(
    (product) => Number(product.stock || 0) === 0,
  );

  const inventoryValue = products.reduce(
    (total, product) =>
      total + Number(product.price || 0) * Number(product.stock || 0),
    0,
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const getProductId = (product) => {
    return product?._id || product?.id || product?.productId;
  };

  const getStockStatus = (stock) => {
    const value = Number(stock || 0);

    if (value === 0) {
      return {
        label: "Out of Stock",
        type: "danger",
      };
    }

    if (value <= 5) {
      return {
        label: "Low Stock",
        type: "warning",
      };
    }

    return {
      label: "In Stock",
      type: "success",
    };
  };

  const openDetails = (type, data = {}) => {
    setDetailsModal({
      type,
      ...data,
    });
  };

  const closeDetails = () => {
    setDetailsModal(null);
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStockFilter("all");
    setSortBy("newest");
  };

  if (loading) {
    return (
      <div className="admin-products-loading">
        <div className="loading-spinner" />
        <p>Loading products...</p>

        <style jsx>{`
          .admin-products-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 18px;
            background:
              radial-gradient(
                circle at 100% 0%,
                rgba(37, 99, 235, 0.08),
                transparent 40%
              ),
              #f6f8fc;
            color: #475569;
          }

          .loading-spinner {
            width: 46px;
            height: 46px;
            border: 4px solid #e2e8f0;
            border-top-color: #2563eb;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          p {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.2px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <main className="admin-products-page">
        <div className="page-header">
          <div className="page-header-text">
            <div className="breadcrumb">
              <span>Admin</span>
              <span className="breadcrumb-sep">/</span>
              <strong>Products</strong>
            </div>

            <h1>Product Management</h1>

            <p>Manage your products, inventory, categories and stock levels.</p>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={handleRefresh}
            >
              <RefreshIcon />
              Refresh
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={() => router.push("/admin/products/create")}
            >
              <PlusIcon />
              Add Product
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <div className="error-content">
              <div className="error-icon">!</div>

              <div>
                <strong>Something went wrong</strong>

                <p>{error}</p>
              </div>
            </div>

            <button type="button" onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}

        <section className="stats-grid">
          <StatCard
            title="Total Products"
            value={totalProducts}
            description="All products"
            icon={<PackageIcon />}
            type="blue"
            onClick={() =>
              openDetails("products", {
                products,
              })
            }
          />

          <StatCard
            title="Categories"
            value={totalCategories}
            description="Product categories"
            icon={<CategoryIcon />}
            type="purple"
            onClick={() =>
              openDetails("categories", {
                categories,
                categoryCounts,
              })
            }
          />

          <StatCard
            title="Total Stock"
            value={totalStock}
            description="Units available"
            icon={<BoxIcon />}
            type="green"
            onClick={() =>
              openDetails("stock", {
                products,
              })
            }
          />

          <StatCard
            title="Low Stock"
            value={lowStockProducts.length}
            description="1–5 units"
            icon={<WarningIcon />}
            type="orange"
            onClick={() =>
              openDetails("lowStock", {
                products: lowStockProducts,
              })
            }
          />

          <StatCard
            title="Out of Stock"
            value={outOfStockProducts.length}
            description="Needs restocking"
            icon={<AlertIcon />}
            type="red"
            onClick={() =>
              openDetails("outOfStock", {
                products: outOfStockProducts,
              })
            }
          />

          <StatCard
            title="Inventory Value"
            value={formatCurrency(inventoryValue)}
            description="Current stock value"
            icon={<CurrencyIcon />}
            type="indigo"
            onClick={() =>
              openDetails("value", {
                products,
              })
            }
          />
        </section>

        <section className="category-section">
          <div className="section-heading">
            <div>
              <h2>Categories</h2>
              <p>Click a category to see its products.</p>
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="empty-category">
              <CategoryIcon />
              <p>No categories found</p>
            </div>
          ) : (
            <div className="category-grid">
              {categoryCounts.map(({ name, count }) => (
                <button
                  type="button"
                  className="category-card"
                  key={name}
                  onClick={() =>
                    openDetails("category", {
                      category: name,
                      products: products.filter(
                        (product) =>
                          String(product.category || "").trim() === name,
                      ),
                    })
                  }
                >
                  <div className="category-card-icon">
                    <CategoryIcon />
                  </div>

                  <div className="category-card-info">
                    <strong>{name}</strong>
                    <span>
                      {count} {count === 1 ? "product" : "products"}
                    </span>
                  </div>

                  <ArrowIcon />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="products-section">
          <div className="section-heading">
            <div>
              <h2>All Products</h2>
              <p>
                {filteredProducts.length} of {products.length} products shown
              </p>
            </div>
          </div>

          <div className="filters-card">
            <div className="search-wrapper">
              <SearchIcon />

              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {search && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>

              {categories.map((category) => (
                <option value={category} key={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <option value="all">All Stock</option>

              <option value="in-stock">In Stock</option>

              <option value="low-stock">Low Stock</option>

              <option value="out-of-stock">Out of Stock</option>
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest</option>

              <option value="name">Name A–Z</option>

              <option value="price-low">Price Low → High</option>

              <option value="price-high">Price High → Low</option>

              <option value="stock-low">Stock Low → High</option>

              <option value="stock-high">Stock High → Low</option>
            </select>

            {(search || categoryFilter !== "all" || stockFilter !== "all") && (
              <button
                type="button"
                className="clear-filters"
                onClick={clearFilters}
              >
                Clear
              </button>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="empty-products">
              <div className="empty-icon">
                <PackageIcon />
              </div>

              <h3>No products found</h3>

              <p>Try changing your search or filters.</p>

              <button type="button" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Value</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => {
                    const productId = getProductId(product);

                    const stock = Number(product.stock || 0);

                    const price = Number(product.price || 0);

                    return (
                      <tr key={productId}>
                        <td data-label="Product">
                          <div className="product-cell">
                            <div className="product-image">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name || "Product"}
                                />
                              ) : (
                                <PackageIcon />
                              )}
                            </div>

                            <div className="product-info">
                              <strong>
                                {product.name || "Unnamed Product"}
                              </strong>

                              <span>ID: {String(productId).slice(-8)}</span>
                            </div>
                          </div>
                        </td>

                        <td data-label="Category">
                          <span className="category-pill">
                            {product.category || "Uncategorized"}
                          </span>
                        </td>

                        <td data-label="Price">
                          <strong className="price">
                            {formatCurrency(price)}
                          </strong>
                        </td>

                        <td data-label="Stock">
                          <strong>{stock}</strong>
                        </td>

                        <td data-label="Status">
                          <StockBadge stock={stock} />
                        </td>

                        <td data-label="Value">
                          <strong>{formatCurrency(price * stock)}</strong>
                        </td>

                        <td data-label="Actions">
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="edit-button"
                              onClick={() => handleEdit(product)}
                            >
                              <EditIcon />
                              Edit
                            </button>

                            <button
                              type="button"
                              className="delete-button"
                              disabled={deletingId === productId}
                              onClick={() => handleDelete(productId)}
                            >
                              <TrashIcon />

                              {deletingId === productId
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {editingProduct && (
        <EditProductModal
          form={editForm}
          error={editError}
          updating={updating}
          onChange={handleEditChange}
          onSubmit={handleUpdateProduct}
          onClose={closeEdit}
        />
      )}

      {detailsModal && (
        <DetailsModal
          modal={detailsModal}
          formatCurrency={formatCurrency}
          onClose={closeDetails}
          onEdit={handleEdit}
        />
      )}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
        }

        body {
          background: #f6f8fc;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        button,
        input,
        select,
        textarea {
          font: inherit;
        }

        button {
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        button:focus-visible,
        input:focus-visible,
        select:focus-visible,
        textarea:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }

        /* ---------- Page shell ---------- */

        .admin-products-page {
          min-height: 100vh;
          padding: 34px clamp(16px, 3vw, 40px) 70px;
          background:
            radial-gradient(
              circle at 100% 0%,
              rgba(37, 99, 235, 0.09),
              transparent 42%
            ),
            radial-gradient(
              circle at 0% 12%,
              rgba(124, 58, 237, 0.06),
              transparent 38%
            ),
            #f6f8fc;
          color: #0f172a;
        }

        /* ---------- Header ---------- */

        .page-header {
          max-width: 1520px;
          margin: 0 auto 26px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 22px;
        }

        .page-header-text {
          min-width: 0;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          color: #94a3b8;
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: 0.2px;
        }

        .breadcrumb-sep {
          color: #cbd5e1;
        }

        .breadcrumb strong {
          color: #475569;
        }

        .page-header h1 {
          margin: 0;
          font-size: clamp(24px, 2.6vw, 34px);
          line-height: 1.15;
          font-weight: 800;
          letter-spacing: -1px;
          background: linear-gradient(
            120deg,
            #0f172a 0%,
            #1e293b 60%,
            #2563eb 130%
          );
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .page-header p {
          margin: 9px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
        }

        .header-actions {
          display: flex;
          gap: 10px;
          flex-shrink: 0;
        }

        .primary-button,
        .secondary-button {
          min-height: 46px;
          padding: 0 18px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease,
            border-color 0.18s ease;
        }

        .primary-button {
          border: 1px solid #2563eb;
          background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
          color: #fff;
          box-shadow:
            0 10px 22px -8px rgba(37, 99, 235, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.18);
        }

        .primary-button:hover {
          background: linear-gradient(180deg, #2f74e8 0%, #1d4ed8 100%);
          transform: translateY(-1px);
          box-shadow:
            0 14px 26px -8px rgba(37, 99, 235, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.18);
        }

        .primary-button:active {
          transform: translateY(0);
        }

        .secondary-button {
          border: 1px solid #dde5ef;
          background: #fff;
          color: #334155;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
        }

        .secondary-button:hover {
          border-color: #c8d4e3;
          background: #f8fafc;
          transform: translateY(-1px);
          box-shadow: 0 8px 18px -6px rgba(15, 23, 42, 0.12);
        }

        /* ---------- Error banner ---------- */

        .error-banner {
          max-width: 1520px;
          margin: 0 auto 22px;
          padding: 14px 16px;
          border: 1px solid #fecaca;
          border-radius: 14px;
          background: linear-gradient(180deg, #fff8f8 0%, #fff2f2 100%);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          color: #991b1b;
          box-shadow: 0 8px 22px -14px rgba(220, 38, 38, 0.5);
          animation: fadeSlide 0.28s ease;
        }

        @keyframes fadeSlide {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .error-content {
          display: flex;
          gap: 12px;
          min-width: 0;
        }

        .error-icon {
          width: 28px;
          height: 28px;
          flex: 0 0 28px;
          border-radius: 50%;
          background: #fee2e2;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
        }

        .error-banner strong {
          display: block;
          font-size: 14px;
        }

        .error-banner p {
          margin: 4px 0 0;
          font-size: 13px;
          line-height: 1.45;
          word-break: break-word;
        }

        .error-banner > button {
          flex: 0 0 auto;
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #991b1b;
          font-size: 22px;
          line-height: 1;
          transition: background 0.15s ease;
        }

        .error-banner > button:hover {
          background: #fee2e2;
        }

        /* ---------- Stat cards ---------- */

        .stats-grid {
          max-width: 1520px;
          margin: 0 auto 30px;
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 14px;
        }

        .stat-card {
          position: relative;
          overflow: hidden;
          min-height: 148px;
          padding: 18px;
          border: 1px solid #e6ecf4;
          border-radius: 18px;
          background: #fff;
          box-shadow:
            0 1px 2px rgba(15, 23, 42, 0.03),
            0 10px 26px -18px rgba(15, 23, 42, 0.28);
          text-align: left;
          transition:
            transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.22s ease,
            border-color 0.22s ease;
        }

        .stat-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0) 40%,
            rgba(37, 99, 235, 0.05) 100%
          );
          opacity: 0;
          transition: opacity 0.22s ease;
          pointer-events: none;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          border-color: #cfdcf0;
          box-shadow:
            0 2px 4px rgba(15, 23, 42, 0.04),
            0 20px 38px -20px rgba(15, 23, 42, 0.35);
        }

        .stat-card:hover::after {
          opacity: 1;
        }

        .stat-card:active {
          transform: translateY(-1px);
        }

        .stat-card.clickable {
          cursor: pointer;
        }

        .stat-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.22s ease;
        }

        .stat-card:hover .stat-icon {
          transform: scale(1.06) rotate(-3deg);
        }

        .stat-icon svg {
          width: 21px;
          height: 21px;
        }

        .stat-icon.blue {
          background: linear-gradient(150deg, #dbeafe 0%, #eff6ff 100%);
          color: #2563eb;
        }

        .stat-icon.purple {
          background: linear-gradient(150deg, #ede9fe 0%, #f5f3ff 100%);
          color: #7c3aed;
        }

        .stat-icon.green {
          background: linear-gradient(150deg, #dcfce7 0%, #f0fdf4 100%);
          color: #16a34a;
        }

        .stat-icon.orange {
          background: linear-gradient(150deg, #ffedd5 0%, #fff7ed 100%);
          color: #ea580c;
        }

        .stat-icon.red {
          background: linear-gradient(150deg, #fee2e2 0%, #fef2f2 100%);
          color: #dc2626;
        }

        .stat-icon.indigo {
          background: linear-gradient(150deg, #e0e7ff 0%, #eef2ff 100%);
          color: #4f46e5;
        }

        .stat-arrow {
          color: #cbd5e1;
          transition:
            transform 0.22s ease,
            color 0.22s ease;
        }

        .stat-card:hover .stat-arrow {
          color: #2563eb;
          transform: translate(2px, -2px);
        }

        .stat-title {
          margin-top: 18px;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.7px;
        }

        .stat-value {
          margin-top: 6px;
          color: #0f172a;
          font-size: clamp(20px, 1.7vw, 24px);
          font-weight: 800;
          letter-spacing: -0.6px;
          line-height: 1.15;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stat-description {
          margin-top: 5px;
          color: #94a3b8;
          font-size: 11.5px;
        }

        /* ---------- Sections ---------- */

        .category-section,
        .products-section {
          max-width: 1520px;
          margin: 0 auto 30px;
        }

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 15px;
        }

        .section-heading h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.4px;
        }

        .section-heading p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        /* ---------- Categories ---------- */

        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(215px, 1fr));
          gap: 12px;
        }

        .category-card {
          min-height: 84px;
          padding: 14px;
          border: 1px solid #e6ecf4;
          border-radius: 16px;
          background: #fff;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
          transition:
            transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .category-card:hover {
          transform: translateY(-3px);
          border-color: #bfdbfe;
          box-shadow: 0 16px 30px -18px rgba(37, 99, 235, 0.6);
        }

        .category-card-icon {
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          border-radius: 12px;
          background: linear-gradient(150deg, #eff6ff 0%, #dbeafe 100%);
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        }

        .category-card:hover .category-card-icon {
          transform: scale(1.06);
        }

        .category-card-info {
          min-width: 0;
          flex: 1;
        }

        .category-card-info strong {
          display: block;
          overflow: hidden;
          color: #1e293b;
          font-size: 14px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .category-card-info span {
          display: block;
          margin-top: 4px;
          color: #94a3b8;
          font-size: 11.5px;
          font-weight: 600;
        }

        .category-card > svg {
          flex: 0 0 auto;
          color: #cbd5e1;
          transition:
            transform 0.2s ease,
            color 0.2s ease;
        }

        .category-card:hover > svg {
          color: #2563eb;
          transform: translateX(2px);
        }

        .empty-category {
          padding: 40px 20px;
          border: 1px dashed #cfd9e6;
          border-radius: 16px;
          background: #fff;
          color: #94a3b8;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .empty-category p {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        /* ---------- Filters ---------- */

        .filters-card {
          padding: 14px;
          margin-bottom: 16px;
          border: 1px solid #e6ecf4;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
          display: grid;
          grid-template-columns:
            minmax(240px, 1fr)
            180px
            160px
            190px
            auto;
          gap: 10px;
          align-items: center;
        }

        .search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          min-width: 0;
        }

        .search-wrapper > svg {
          position: absolute;
          left: 13px;
          color: #94a3b8;
          pointer-events: none;
        }

        .search-wrapper input,
        .filters-card select {
          width: 100%;
          height: 46px;
          padding: 0 13px;
          border: 1px solid #dde5ef;
          border-radius: 11px;
          outline: none;
          background: #fff;
          color: #334155;
          font-size: 13.5px;
          font-weight: 500;
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease;
        }

        .filters-card select {
          padding-right: 34px;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          cursor: pointer;
        }

        .search-wrapper input {
          padding-left: 40px;
          padding-right: 40px;
        }

        .search-wrapper input::placeholder {
          color: #a3b0c2;
        }

        .search-wrapper input:hover,
        .filters-card select:hover {
          border-color: #c8d4e3;
        }

        .search-wrapper input:focus,
        .filters-card select:focus {
          border-color: #93c5fd;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
        }

        .clear-search {
          position: absolute;
          right: 8px;
          width: 28px;
          height: 28px;
          border: 0;
          border-radius: 8px;
          background: #f1f5f9;
          color: #64748b;
          font-size: 18px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition:
            background 0.15s ease,
            color 0.15s ease;
        }

        .clear-search:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .clear-filters {
          height: 46px;
          padding: 0 16px;
          border: 1px solid #dde5ef;
          border-radius: 11px;
          background: #f8fafc;
          color: #475569;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          transition:
            background 0.15s ease,
            border-color 0.15s ease,
            color 0.15s ease;
        }

        .clear-filters:hover {
          background: #eef2f7;
          border-color: #c8d4e3;
          color: #0f172a;
        }

        /* ---------- Table ---------- */

        .table-wrapper {
          overflow-x: auto;
          border: 1px solid #e6ecf4;
          border-radius: 18px;
          background: #fff;
          box-shadow:
            0 1px 2px rgba(15, 23, 42, 0.03),
            0 16px 40px -28px rgba(15, 23, 42, 0.4);
          -webkit-overflow-scrolling: touch;
        }

        .products-table {
          width: 100%;
          min-width: 1060px;
          border-collapse: collapse;
        }

        .products-table th {
          position: sticky;
          top: 0;
          z-index: 1;
          padding: 15px 16px;
          border-bottom: 1px solid #e6ecf4;
          background: #f8fafc;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.7px;
          text-align: left;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .products-table th:first-child {
          border-top-left-radius: 18px;
        }

        .products-table th:last-child {
          border-top-right-radius: 18px;
        }

        .products-table td {
          padding: 15px 16px;
          border-bottom: 1px solid #f0f4f9;
          color: #334155;
          font-size: 13.5px;
          vertical-align: middle;
        }

        .products-table tbody tr {
          transition: background 0.16s ease;
        }

        .products-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .products-table tbody tr:hover {
          background: #fafcff;
        }

        .product-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 230px;
        }

        .product-image {
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          overflow: hidden;
          border: 1px solid #e6ecf4;
          border-radius: 12px;
          background: linear-gradient(150deg, #f8fafc 0%, #f1f5f9 100%);
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .product-info {
          min-width: 0;
        }

        .product-info strong {
          display: block;
          max-width: 230px;
          overflow: hidden;
          color: #0f172a;
          font-size: 14px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .product-info span {
          display: block;
          margin-top: 4px;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }

        .category-pill {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          background: #f1f5f9;
          color: #475569;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .price {
          color: #0f172a;
          font-weight: 700;
        }

        .stock-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .stock-badge.success {
          background: #dcfce7;
          color: #15803d;
        }

        .stock-badge.warning {
          background: #ffedd5;
          color: #c2410c;
        }

        .stock-badge.danger {
          background: #fee2e2;
          color: #b91c1c;
        }

        .stock-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.65);
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .edit-button,
        .delete-button {
          min-height: 36px;
          padding: 0 12px;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 700;
          white-space: nowrap;
          transition:
            background 0.16s ease,
            border-color 0.16s ease,
            transform 0.16s ease,
            box-shadow 0.16s ease;
        }

        .edit-button {
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          color: #2563eb;
        }

        .edit-button:hover {
          background: #dbeafe;
          border-color: #93c5fd;
          transform: translateY(-1px);
          box-shadow: 0 8px 16px -10px rgba(37, 99, 235, 0.8);
        }

        .delete-button {
          border: 1px solid #fecaca;
          background: #fff7f7;
          color: #dc2626;
        }

        .delete-button:hover {
          background: #fee2e2;
          border-color: #fca5a5;
          transform: translateY(-1px);
          box-shadow: 0 8px 16px -10px rgba(220, 38, 38, 0.8);
        }

        .delete-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* ---------- Empty products ---------- */

        .empty-products {
          min-height: 320px;
          padding: 40px 20px;
          border: 1px dashed #cfd9e6;
          border-radius: 18px;
          background: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          margin-bottom: 14px;
          border-radius: 20px;
          background: linear-gradient(150deg, #f1f5f9 0%, #e2e8f0 100%);
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-products h3 {
          margin: 0;
          color: #334155;
          font-size: 16px;
          font-weight: 800;
        }

        .empty-products p {
          margin: 7px 0 16px;
          color: #94a3b8;
          font-size: 13px;
        }

        .empty-products button {
          min-height: 40px;
          padding: 0 16px;
          border: 1px solid #2563eb;
          border-radius: 10px;
          background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
          color: #fff;
          font-size: 12.5px;
          font-weight: 700;
          transition:
            transform 0.16s ease,
            box-shadow 0.16s ease;
        }

        .empty-products button:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 20px -10px rgba(37, 99, 235, 0.9);
        }

        /* ---------- Scrollbars ---------- */

        .table-wrapper::-webkit-scrollbar,
        .details-body::-webkit-scrollbar,
        .edit-modal::-webkit-scrollbar {
          width: 9px;
          height: 9px;
        }

        .table-wrapper::-webkit-scrollbar-track,
        .details-body::-webkit-scrollbar-track,
        .edit-modal::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        .table-wrapper::-webkit-scrollbar-thumb,
        .details-body::-webkit-scrollbar-thumb,
        .edit-modal::-webkit-scrollbar-thumb {
          border: 2px solid #f1f5f9;
          border-radius: 999px;
          background: #cbd5e1;
        }

        .table-wrapper::-webkit-scrollbar-thumb:hover,
        .details-body::-webkit-scrollbar-thumb:hover,
        .edit-modal::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* ---------- Responsive ---------- */

        @media (max-width: 1400px) {
          .stats-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 1250px) {
          .filters-card {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .search-wrapper {
            grid-column: 1 / -1;
          }

          .clear-filters {
            grid-column: 1 / -1;
            width: 100%;
          }
        }

        @media (max-width: 900px) {
          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
        }

        @media (max-width: 860px) {
          .table-wrapper {
            border: 0;
            border-radius: 0;
            background: transparent;
            box-shadow: none;
            overflow: visible;
          }

          .products-table {
            min-width: 0;
            display: block;
          }

          .products-table thead {
            display: none;
          }

          .products-table tbody {
            display: block;
          }

          .products-table tbody tr {
            display: block;
            margin-bottom: 12px;
            padding: 14px 15px;
            border: 1px solid #e6ecf4;
            border-radius: 16px;
            background: #fff;
            box-shadow:
              0 1px 2px rgba(15, 23, 42, 0.03),
              0 12px 28px -22px rgba(15, 23, 42, 0.4);
          }

          .products-table tbody tr:hover {
            background: #fff;
          }

          .products-table td {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            padding: 9px 0;
            border-bottom: 1px dashed #eef2f7;
            font-size: 13px;
          }

          .products-table td::before {
            content: attr(data-label);
            flex: 0 0 auto;
            color: #94a3b8;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.7px;
            text-transform: uppercase;
          }

          .products-table td:first-child {
            display: block;
            padding-top: 0;
            padding-bottom: 12px;
            border-bottom: 1px solid #eef2f7;
          }

          .products-table td:first-child::before {
            display: none;
          }

          .products-table td:last-child {
            padding-bottom: 0;
            border-bottom: 0;
          }

          .product-cell {
            min-width: 0;
            gap: 12px;
          }

          .product-image {
            width: 54px;
            height: 54px;
            flex: 0 0 54px;
          }

          .product-info strong {
            max-width: none;
            font-size: 14.5px;
          }

          .action-buttons {
            flex: 1;
            justify-content: flex-end;
          }
        }

        @media (max-width: 760px) {
          .admin-products-page {
            padding: 20px 16px 60px;
          }

          .page-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 18px;
          }

          .header-actions {
            width: 100%;
          }

          .primary-button,
          .secondary-button {
            flex: 1;
          }

          .category-grid {
            grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          }

          .filters-card {
            grid-template-columns: 1fr 1fr;
          }

          .search-wrapper {
            grid-column: 1 / -1;
          }

          .clear-filters {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 560px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-card {
            min-height: 0;
            display: grid;
            grid-template-columns: auto 1fr auto;
            grid-template-areas:
              "icon title arrow"
              "icon value arrow"
              "icon desc arrow";
            align-items: center;
            column-gap: 14px;
            row-gap: 2px;
            padding: 16px;
          }

          .stat-card-top {
            display: contents;
          }

          .stat-icon {
            grid-area: icon;
            width: 46px;
            height: 46px;
          }

          .stat-arrow {
            grid-area: arrow;
            align-self: center;
          }

          .stat-title {
            grid-area: title;
            margin-top: 0;
          }

          .stat-value {
            grid-area: value;
            margin-top: 0;
            white-space: normal;
          }

          .stat-description {
            grid-area: desc;
            margin-top: 0;
          }

          .filters-card {
            grid-template-columns: 1fr;
          }

          .search-wrapper,
          .clear-filters {
            grid-column: auto;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
            gap: 4px;
          }

          .category-grid {
            grid-template-columns: 1fr;
          }

          .error-banner {
            flex-direction: row;
          }
        }

        @media (max-width: 420px) {
          .header-actions {
            flex-direction: column;
          }

          .primary-button,
          .secondary-button {
            width: 100%;
          }

          .action-buttons {
            flex-direction: column;
            width: 100%;
          }

          .edit-button,
          .delete-button {
            width: 100%;
          }

          .products-table td:last-child {
            display: block;
          }

          .products-table td:last-child::before {
            display: block;
            margin-bottom: 8px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>
    </>
  );
}

function StatCard({ title, value, description, icon, type, onClick }) {
  return (
    <button type="button" className="stat-card clickable" onClick={onClick}>
      <div className="stat-card-top">
        <div className={`stat-icon ${type}`}>{icon}</div>

        <div className="stat-arrow">
          <ArrowUpRightIcon />
        </div>
      </div>

      <div className="stat-title">{title}</div>

      <div className="stat-value">{value}</div>

      <div className="stat-description">{description}</div>
    </button>
  );
}

function StockBadge({ stock }) {
  const status = getStockStatusForComponent(stock);

  return (
    <span className={`stock-badge ${status.type}`}>
      <span className="stock-dot" />
      {status.label}
    </span>
  );
}

function getStockStatusForComponent(stock) {
  const value = Number(stock || 0);

  if (value === 0) {
    return {
      label: "Out of Stock",
      type: "danger",
    };
  }

  if (value <= 5) {
    return {
      label: "Low Stock",
      type: "warning",
    };
  }

  return {
    label: "In Stock",
    type: "success",
  };
}

function EditProductModal({
  form,
  error,
  updating,
  onChange,
  onSubmit,
  onClose,
}) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="edit-modal">
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">PRODUCT MANAGEMENT</span>

            <h2>Edit Product</h2>

            <p>Update product information and inventory.</p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={updating}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="modal-error">
            <AlertIcon />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="edit-form">
          <div className="form-grid">
            <FormField
              label="Product Name"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Enter product name"
              required
            />

            <FormField
              label="Category"
              name="category"
              value={form.category}
              onChange={onChange}
              placeholder="Enter category"
              required
            />

            <FormField
              label="Price"
              name="price"
              type="number"
              value={form.price}
              onChange={onChange}
              placeholder="Enter price"
              min="0"
              step="0.01"
              required
            />

            <FormField
              label="Stock"
              name="stock"
              type="number"
              value={form.stock}
              onChange={onChange}
              placeholder="Enter stock"
              min="0"
              step="1"
              required
            />

            <div className="form-field full-width">
              <label htmlFor="image">Image URL</label>

              <input
                id="image"
                name="image"
                type="url"
                value={form.image}
                onChange={onChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="form-field full-width">
              <label htmlFor="description">Description</label>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={onChange}
                placeholder="Enter product description"
                rows={5}
              />
            </div>
          </div>

          {form.image && (
            <div className="image-preview">
              <span>Image Preview</span>

              <div className="preview-box">
                <img
                  src={form.image}
                  alt="Product preview"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={updating}
            >
              Cancel
            </button>

            <button type="submit" className="save-button" disabled={updating}>
              {updating ? (
                <>
                  <SmallSpinner />
                  Updating...
                </>
              ) : (
                <>
                  <CheckIcon />
                  Update Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          padding: 24px;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(7px);
          -webkit-backdrop-filter: blur(7px);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
          animation: overlayIn 0.2s ease;
        }

        @keyframes overlayIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .edit-modal {
          width: min(720px, 100%);
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          border: 1px solid #e6ecf4;
          border-radius: 22px;
          background: #fff;
          box-shadow: 0 40px 90px -30px rgba(15, 23, 42, 0.55);
          animation: modalIn 0.24s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          padding: 24px 24px 18px;
          border-bottom: 1px solid #eef2f7;
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }

        .modal-eyebrow {
          color: #2563eb;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.1px;
        }

        .modal-header h2 {
          margin: 6px 0 4px;
          color: #0f172a;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .modal-header p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
        }

        .modal-close {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          border: 0;
          border-radius: 11px;
          background: #f1f5f9;
          color: #64748b;
          font-size: 24px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition:
            background 0.15s ease,
            color 0.15s ease,
            transform 0.15s ease;
        }

        .modal-close:hover:not(:disabled) {
          background: #e2e8f0;
          color: #0f172a;
          transform: rotate(90deg);
        }

        .modal-close:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-error {
          margin: 18px 24px 0;
          padding: 12px 14px;
          border: 1px solid #fecaca;
          border-radius: 11px;
          background: #fff7f7;
          color: #b91c1c;
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.4;
        }

        .edit-form {
          padding: 22px 24px 24px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 17px;
        }

        .form-field {
          min-width: 0;
        }

        .form-field.full-width {
          grid-column: 1 / -1;
        }

        .form-field label {
          display: block;
          margin-bottom: 8px;
          color: #334155;
          font-size: 12.5px;
          font-weight: 700;
        }

        .form-field input,
        .form-field textarea {
          width: 100%;
          border: 1px solid #dde5ef;
          border-radius: 11px;
          outline: none;
          background: #fff;
          color: #0f172a;
          font-size: 13.5px;
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .form-field input {
          height: 46px;
          padding: 0 13px;
        }

        .form-field textarea {
          padding: 12px 13px;
          resize: vertical;
          min-height: 110px;
          line-height: 1.55;
        }

        .form-field input::placeholder,
        .form-field textarea::placeholder {
          color: #a3b0c2;
        }

        .form-field input:hover,
        .form-field textarea:hover {
          border-color: #c8d4e3;
        }

        .form-field input:focus,
        .form-field textarea:focus {
          border-color: #93c5fd;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
        }

        .image-preview {
          margin-top: 20px;
        }

        .image-preview > span {
          display: block;
          margin-bottom: 9px;
          color: #475569;
          font-size: 12.5px;
          font-weight: 700;
        }

        .preview-box {
          width: 100%;
          height: 160px;
          overflow: hidden;
          border: 1px dashed #cfd9e6;
          border-radius: 14px;
          background: linear-gradient(150deg, #f8fafc 0%, #f1f5f9 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-box img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        .modal-actions {
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid #eef2f7;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .cancel-button,
        .save-button {
          min-height: 44px;
          padding: 0 18px;
          border-radius: 11px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13.5px;
          font-weight: 700;
          transition:
            background 0.16s ease,
            border-color 0.16s ease,
            transform 0.16s ease,
            box-shadow 0.16s ease;
        }

        .cancel-button {
          border: 1px solid #dde5ef;
          background: #fff;
          color: #475569;
        }

        .cancel-button:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #c8d4e3;
        }

        .save-button {
          border: 1px solid #2563eb;
          background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
          color: #fff;
          box-shadow: 0 10px 22px -12px rgba(37, 99, 235, 0.95);
        }

        .save-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 14px 26px -12px rgba(37, 99, 235, 1);
        }

        .save-button:disabled,
        .cancel-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 650px) {
          .modal-overlay {
            padding: 12px;
            align-items: flex-start;
          }

          .edit-modal {
            max-height: calc(100vh - 24px);
            border-radius: 18px;
            margin: auto 0;
          }

          .modal-header {
            padding: 20px 18px 16px;
          }

          .modal-header h2 {
            font-size: 21px;
          }

          .modal-error {
            margin: 16px 18px 0;
          }

          .edit-form {
            padding: 18px;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .form-field.full-width {
            grid-column: auto;
          }

          .modal-actions {
            flex-direction: column-reverse;
            margin-top: 20px;
            padding-top: 16px;
          }

          .cancel-button,
          .save-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  min,
  step,
}) {
  return (
    <div className="form-field">
      <label htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        step={step}
      />

      <style jsx>{`
        .form-field {
          min-width: 0;
        }

        .form-field label {
          display: block;
          margin-bottom: 8px;
          color: #334155;
          font-size: 12.5px;
          font-weight: 700;
        }

        .form-field input {
          width: 100%;
          height: 46px;
          padding: 0 13px;
          border: 1px solid #dde5ef;
          border-radius: 11px;
          outline: none;
          background: #fff;
          color: #0f172a;
          font-size: 13.5px;
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .form-field input::placeholder {
          color: #a3b0c2;
        }

        .form-field input:hover {
          border-color: #c8d4e3;
        }

        .form-field input:focus {
          border-color: #93c5fd;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
        }

        .required {
          margin-left: 4px;
          color: #dc2626;
        }
      `}</style>
    </div>
  );
}

function DetailsModal({ modal, formatCurrency, onClose, onEdit }) {
  const {
    type,
    products = [],
    categories = [],
    categoryCounts = [],
    category,
  } = modal;

  let title = "Details";
  let subtitle = "";
  let currentProducts = products;

  if (type === "products") {
    title = "All Products";
    subtitle = `${products.length} products`;
  }

  if (type === "categories") {
    title = "Product Categories";
    subtitle = `${categories.length} categories`;
  }

  if (type === "stock") {
    title = "Total Stock";
    subtitle = `${products.reduce(
      (sum, product) => sum + Number(product.stock || 0),
      0,
    )} total units`;
  }

  if (type === "lowStock") {
    title = "Low Stock Products";
    subtitle = "Products with 1–5 units remaining";
  }

  if (type === "outOfStock") {
    title = "Out of Stock Products";
    subtitle = "Products that need restocking";
  }

  if (type === "value") {
    title = "Inventory Value";
    subtitle = "Current value of available stock";
  }

  if (type === "category") {
    title = category || "Category";
    subtitle = `${products.length} products in this category`;
  }

  return (
    <div
      className="details-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="details-modal">
        <div className="details-header">
          <div>
            <span className="details-eyebrow">INVENTORY DETAILS</span>

            <h2>{title}</h2>

            <p>{subtitle}</p>
          </div>

          <button
            type="button"
            className="details-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="details-body">
          {type === "categories" ? (
            <CategoryDetails
              categories={categories}
              categoryCounts={categoryCounts}
              products={products}
              onCategoryClick={(name) => {
                currentProducts = products.filter(
                  (product) => String(product.category || "").trim() === name,
                );
              }}
            />
          ) : (
            <ProductDetailsList
              products={currentProducts}
              formatCurrency={formatCurrency}
              onEdit={onEdit}
              type={type}
            />
          )}
        </div>
      </div>

      <style jsx>{`
        .details-overlay {
          position: fixed;
          inset: 0;
          z-index: 1100;
          padding: 24px;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(7px);
          -webkit-backdrop-filter: blur(7px);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: overlayIn 0.2s ease;
        }

        @keyframes overlayIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .details-modal {
          width: min(920px, 100%);
          max-height: calc(100vh - 48px);
          overflow: hidden;
          border: 1px solid #e6ecf4;
          border-radius: 22px;
          background: #fff;
          box-shadow: 0 40px 90px -30px rgba(15, 23, 42, 0.55);
          display: flex;
          flex-direction: column;
          animation: modalIn 0.24s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .details-header {
          flex: 0 0 auto;
          padding: 22px 24px;
          border-bottom: 1px solid #eef2f7;
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }

        .details-eyebrow {
          color: #2563eb;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.1px;
        }

        .details-header h2 {
          margin: 6px 0 4px;
          color: #0f172a;
          font-size: 23px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .details-header p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
        }

        .details-close {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          border: 0;
          border-radius: 11px;
          background: #f1f5f9;
          color: #64748b;
          font-size: 24px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition:
            background 0.15s ease,
            color 0.15s ease,
            transform 0.15s ease;
        }

        .details-close:hover {
          background: #e2e8f0;
          color: #0f172a;
          transform: rotate(90deg);
        }

        .details-body {
          padding: 20px 24px 24px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        @media (max-width: 650px) {
          .details-overlay {
            padding: 12px;
            align-items: flex-start;
          }

          .details-modal {
            max-height: calc(100vh - 24px);
            border-radius: 18px;
            margin: auto 0;
          }

          .details-header {
            padding: 18px;
          }

          .details-header h2 {
            font-size: 20px;
          }

          .details-body {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}

function CategoryDetails({ categories, categoryCounts, products }) {
  return (
    <div className="category-details">
      {categories.length === 0 ? (
        <EmptyDetails message="No categories found." />
      ) : (
        categoryCounts.map((item) => {
          const categoryProducts = products.filter(
            (product) => String(product.category || "").trim() === item.name,
          );

          return (
            <div className="category-detail-card" key={item.name}>
              <div className="category-detail-heading">
                <div className="category-detail-icon">
                  <CategoryIcon />
                </div>

                <div>
                  <h3>{item.name}</h3>

                  <p>
                    {item.count} {item.count === 1 ? "product" : "products"}
                  </p>
                </div>
              </div>

              <div className="category-product-list">
                {categoryProducts.map((product) => (
                  <div
                    className="category-product-row"
                    key={getProductIdForComponent(product)}
                  >
                    <div>
                      <strong>{product.name || "Unnamed Product"}</strong>

                      <span>Stock: {Number(product.stock || 0)}</span>
                    </div>

                    <strong>{formatCurrencyForComponent(product.price)}</strong>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      <style jsx>{`
        .category-details {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .category-detail-card {
          padding: 16px;
          border: 1px solid #e6ecf4;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease;
        }

        .category-detail-card:hover {
          border-color: #cfdcf0;
          box-shadow: 0 14px 30px -22px rgba(15, 23, 42, 0.5);
        }

        .category-detail-heading {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .category-detail-icon {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          border-radius: 12px;
          background: linear-gradient(150deg, #eff6ff 0%, #dbeafe 100%);
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .category-detail-heading h3 {
          margin: 0;
          color: #1e293b;
          font-size: 14px;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .category-detail-heading p {
          margin: 4px 0 0;
          color: #94a3b8;
          font-size: 11.5px;
          font-weight: 600;
        }

        .category-product-list {
          margin-top: 14px;
          border-top: 1px solid #eef2f7;
        }

        .category-product-row {
          padding: 11px 0;
          border-bottom: 1px solid #f4f7fb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .category-product-row:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }

        .category-product-row div {
          min-width: 0;
        }

        .category-product-row strong {
          display: block;
          overflow: hidden;
          color: #334155;
          font-size: 12.5px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .category-product-row > strong {
          flex: 0 0 auto;
          color: #0f172a;
        }

        .category-product-row span {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 10.5px;
          font-weight: 600;
        }

        @media (max-width: 650px) {
          .category-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

function ProductDetailsList({ products, formatCurrency, onEdit, type }) {
  if (!products || products.length === 0) {
    return (
      <EmptyDetails
        message={
          type === "outOfStock"
            ? "No out-of-stock products."
            : type === "lowStock"
              ? "No low-stock products."
              : "No products found."
        }
      />
    );
  }

  return (
    <div className="product-details-list">
      {products.map((product) => {
        const productId = getProductIdForComponent(product);

        const stock = Number(product.stock || 0);

        const price = Number(product.price || 0);

        const status = getStockStatusForComponent(stock);

        return (
          <div className="detail-product-card" key={productId}>
            <div className="detail-product-main">
              <div className="detail-product-image">
                {product.image ? (
                  <img src={product.image} alt={product.name || "Product"} />
                ) : (
                  <PackageIcon />
                )}
              </div>

              <div className="detail-product-info">
                <strong>{product.name || "Unnamed Product"}</strong>

                <span>{product.category || "Uncategorized"}</span>

                <div className="detail-product-meta">
                  <span>
                    Price: <b>{formatCurrency(price)}</b>
                  </span>

                  <span>
                    Stock: <b>{stock}</b>
                  </span>

                  <span className={`detail-status ${status.type}`}>
                    {status.label}
                  </span>
                </div>
              </div>
            </div>

            {type === "value" ? (
              <div className="detail-value">
                <span>Stock Value</span>

                <strong>{formatCurrency(price * stock)}</strong>
              </div>
            ) : (
              <button
                type="button"
                className="detail-edit-button"
                onClick={() => onEdit(product)}
              >
                <EditIcon />
                Edit
              </button>
            )}
          </div>
        );
      })}

      <style jsx>{`
        .product-details-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .detail-product-card {
          min-height: 78px;
          padding: 12px;
          border: 1px solid #e6ecf4;
          border-radius: 15px;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          transition:
            border-color 0.18s ease,
            background 0.18s ease,
            box-shadow 0.18s ease;
        }

        .detail-product-card:hover {
          border-color: #cfdcf0;
          background: #fbfdff;
          box-shadow: 0 14px 30px -24px rgba(15, 23, 42, 0.5);
        }

        .detail-product-main {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .detail-product-image {
          width: 56px;
          height: 56px;
          flex: 0 0 56px;
          overflow: hidden;
          border: 1px solid #e6ecf4;
          border-radius: 13px;
          background: linear-gradient(150deg, #f8fafc 0%, #f1f5f9 100%);
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .detail-product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .detail-product-info {
          min-width: 0;
        }

        .detail-product-info > strong {
          display: block;
          overflow: hidden;
          color: #0f172a;
          font-size: 13.5px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .detail-product-info > span {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 600;
        }

        .detail-product-meta {
          margin-top: 8px;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
          color: #64748b;
          font-size: 10.5px;
          font-weight: 600;
        }

        .detail-product-meta b {
          color: #334155;
        }

        .detail-status {
          padding: 4px 8px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 10px;
        }

        .detail-status.success {
          background: #dcfce7;
          color: #15803d;
        }

        .detail-status.warning {
          background: #ffedd5;
          color: #c2410c;
        }

        .detail-status.danger {
          background: #fee2e2;
          color: #b91c1c;
        }

        .detail-edit-button {
          min-height: 36px;
          flex: 0 0 auto;
          padding: 0 12px;
          border: 1px solid #bfdbfe;
          border-radius: 9px;
          background: #eff6ff;
          color: #2563eb;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 700;
          transition:
            background 0.16s ease,
            border-color 0.16s ease,
            transform 0.16s ease;
        }

        .detail-edit-button:hover {
          background: #dbeafe;
          border-color: #93c5fd;
          transform: translateY(-1px);
        }

        .detail-value {
          flex: 0 0 auto;
          text-align: right;
        }

        .detail-value span {
          display: block;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-value strong {
          display: block;
          margin-top: 4px;
          color: #0f172a;
          font-size: 14.5px;
          font-weight: 800;
        }

        @media (max-width: 600px) {
          .detail-product-card {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .detail-product-main {
            width: 100%;
          }

          .detail-edit-button {
            width: 100%;
          }

          .detail-value {
            width: 100%;
            text-align: left;
            padding-top: 4px;
            border-top: 1px dashed #eef2f7;
          }

          .detail-product-meta {
            flex-direction: row;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}

function EmptyDetails({ message }) {
  return (
    <div className="empty-details">
      <div className="empty-details-icon">
        <PackageIcon />
      </div>

      <strong>{message}</strong>

      <style jsx>{`
        .empty-details {
          min-height: 230px;
          border: 1px dashed #cfd9e6;
          border-radius: 16px;
          background: linear-gradient(150deg, #f8fafc 0%, #f1f5f9 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #64748b;
          text-align: center;
          gap: 12px;
          padding: 24px;
        }

        .empty-details-icon {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          background: #e2e8f0;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-details strong {
          font-size: 13px;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}

function getProductIdForComponent(product) {
  return product?._id || product?.id || product?.productId;
}

function formatCurrencyForComponent(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function SmallSpinner() {
  return (
    <span className="small-spinner">
      <style jsx>{`
        .small-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.45);
          border-top-color: #fff;
          border-radius: 50%;
          animation: smallSpin 0.7s linear infinite;
        }

        @keyframes smallSpin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </span>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2" />
      <path d="M4 5v4h4" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2" />
      <path d="M20 19v-4h-4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16.5 9.4-9-5.19" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.27 6.96 8.73 5.05 8.73-5.05" />
      <path d="M12 22.08V12" />
    </svg>
  );
}

function CategoryIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7" />
      <path d="M4 7h16" />
      <path d="M6 3h12l2 4H4l2-4Z" />
      <path d="M9 11v3" />
      <path d="M15 11v3" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m10.3 3.8-8.1 14A2 2 0 0 0 3.9 21h16.2a2 2 0 0 0 1.7-3.2l-8.1-14a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function CurrencyIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M16 8.5c-.8-.7-1.8-1-3-1-1.7 0-3 .9-3 2s1.1 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.2 0-2.2-.3-3-1" />
      <path d="M12 5.5v13" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

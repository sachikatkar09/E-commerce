import React, { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { useSearch } from '../context/SearchContext';
import '../styles/product.css';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { query, setQuery, search } = useSearch();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!search) {
      return products;
    }

    const term = search.toLowerCase();
    return products.filter((product) =>
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );
  }, [products, search]);

  return (
    <div className="shop-container">
      <h2>All Products</h2>
      <input
        type="text"
        placeholder="Search products..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-bar"
      />
      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="no-results">No products found.</div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Shop;

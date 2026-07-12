import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import '../styles/product.css';

const getCategoryIcon = (name = '') => {
  const value = name.toLowerCase();
  if (value.includes('elect')) return '📱';
  if (value.includes('cloth')) return '👕';
  if (value.includes('furn')) return '🛋️';
  if (value.includes('home') || value.includes('kitchen')) return '🏠';
  if (value.includes('sport')) return '🏀';
  if (value.includes('beaut')) return '💄';
  if (value.includes('book')) return '📚';
  if (value.includes('access')) return '👜';
  return '✨';
};

const Categories = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!category) {
      setProducts([]);
      return;
    }

    const fetchCategoryProducts = async () => {
      setProductsLoading(true);
      try {
        const res = await fetch(`/api/products/category/${encodeURIComponent(category)}`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [category]);

  const selectedCategory = useMemo(() => (category ? decodeURIComponent(category) : ''), [category]);

  return (
    <div className="shop-container">
      <div className="page-breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/categories">Categories</Link>
        {selectedCategory ? <><span>/</span><span>{selectedCategory}</span></> : null}
      </div>

      <div className="page-hero-card">
        <div>
          <span className="hero-pill">Curated Collections</span>
          <h2>{selectedCategory ? selectedCategory : 'Explore Categories'}</h2>
          <p>{selectedCategory ? `Browse premium ${selectedCategory.toLowerCase()} products curated for you.` : 'Discover curated product collections from our premium catalog.'}</p>
        </div>
      </div>

      {!selectedCategory ? (
        <>
          {categoriesLoading ? (
            <div className="loading-state">Loading categories...</div>
          ) : (
            <div className="categories-grid">
              {categories.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className="category-card"
                  onClick={() => navigate(`/categories/${encodeURIComponent(item.name)}`)}
                >
                  <div className="category-card-icon">{getCategoryIcon(item.name)}</div>
                  <div className="category-card-content">
                    <h3>{item.name}</h3>
                    <p>{item.count} products available</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="category-toolbar">
            <div>
              <h3>{selectedCategory}</h3>
              <p>{products.length} products found</p>
            </div>
            <button type="button" className="btn-secondary" onClick={() => navigate('/categories')}>
              Back to Categories
            </button>
          </div>

          {productsLoading ? (
            <div className="loading-state">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="no-results">No products available in this category.</div>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Categories;

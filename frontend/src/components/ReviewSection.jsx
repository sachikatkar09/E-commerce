import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import '../styles/product.css';

const stars = [1, 2, 3, 4, 5];
const sortOptions = [
  { value: 'MostRecent', label: 'Most Recent' },
  { value: 'HighestRating', label: 'Highest Rating' },
  { value: 'LowestRating', label: 'Lowest Rating' },
  { value: 'MostHelpful', label: 'Most Helpful' }
];

const ReviewSection = ({ productId, product }) => {
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [sortBy, setSortBy] = useState('MostRecent');
  const [filterRating, setFilterRating] = useState('');
  const [filterPhotos, setFilterPhotos] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ rating: 0, title: '', description: '' });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [userHasPurchased, setUserHasPurchased] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const authHeaders = user ? { Authorization: `Bearer ${user.token}` } : undefined;

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/reviews/product/${productId}`, {
          headers: authHeaders,
          params: {
            page,
            size: 6,
            sort: sortBy,
            rating: filterRating || undefined,
            photos: filterPhotos || undefined,
            verified: filterVerified || undefined
          }
        });

        setReviews(response.data.reviews || []);
        setStats(response.data.stats || null);
        setPages(response.data.pages || 1);
        setUserReview(response.data.userReview || null);
        setUserHasPurchased(response.data.userHasPurchased || false);
        if (response.data.userReview) {
          setForm({
            rating: response.data.userReview.rating,
            title: response.data.userReview.title,
            description: response.data.userReview.description
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId, page, sortBy, filterRating, filterPhotos, filterVerified, user?.token]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  const reviewLabel = userReview ? 'Update Review' : 'Submit Review';

  const handleStarHover = (rating) => {
    setForm((prev) => ({ ...prev, hoverRating: rating }));
  };

  const handleStarClick = (rating) => {
    setForm((prev) => ({ ...prev, rating }));
  };

  const displayStarClass = (star) => {
    const current = form.hoverRating || form.rating;
    return star <= current ? 'star-filled' : 'star-empty';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImageFiles((prev) => [...prev, ...files].slice(0, 5));
    setImagePreviews((prev) => [...prev, ...previews].slice(0, 5));
  };

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== index));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!user) {
      setMessage('Please log in to submit a review.');
      return;
    }
    if (!form.rating || !form.title.trim() || !form.description.trim()) {
      setMessage('Rating, title, and review text are required.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('rating', form.rating);
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      imageFiles.forEach((file) => formData.append('images', file));

      const endpoint = userReview ? `/api/reviews/${userReview._id}` : `/api/reviews/${productId}`;
      const method = userReview ? 'put' : 'post';
      await axios[method](endpoint, formData, { headers: { ...authHeaders, 'Content-Type': 'multipart/form-data' } });

      setMessage(userReview ? 'Review updated successfully.' : 'Review submitted successfully.');
      setImageFiles([]);
      setImagePreviews([]);
      setPage(1);
      const refresh = await axios.get(`/api/reviews/product/${productId}`, {
        headers: authHeaders,
        params: {
          page: 1,
          size: 6,
          sort: sortBy,
          rating: filterRating || undefined,
          photos: filterPhotos || undefined,
          verified: filterVerified || undefined
        }
      });
      setReviews(refresh.data.reviews || []);
      setStats(refresh.data.stats || null);
      setPages(refresh.data.pages || 1);
      setUserReview(refresh.data.userReview || null);
      setUserHasPurchased(refresh.data.userHasPurchased || false);
    } catch (error) {
      const err = error?.response?.data?.message || 'Could not submit review at this time.';
      setMessage(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await axios.delete(`/api/reviews/${reviewId}`, { headers: authHeaders });
      setMessage('Review deleted successfully.');
      setForm({ rating: 0, title: '', description: '' });
      setImageFiles([]);
      setImagePreviews([]);
      setPage(1);
      const refresh = await axios.get(`/api/reviews/product/${productId}`, {
        headers: authHeaders,
        params: {
          page: 1,
          size: 6,
          sort: sortBy,
          rating: filterRating || undefined,
          photos: filterPhotos || undefined,
          verified: filterVerified || undefined
        }
      });
      setReviews(refresh.data.reviews || []);
      setStats(refresh.data.stats || null);
      setPages(refresh.data.pages || 1);
      setUserReview(refresh.data.userReview || null);
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to delete review.');
    }
  };

  const startEdit = (review) => {
    setForm({ rating: review.rating, title: review.title, description: review.description });
    setMessage('Editing your review. Add photos to append to the existing images.');
  };

  const handleHelpful = async (reviewId) => {
    if (!user) {
      setMessage('Please log in to mark reviews as helpful.');
      return;
    }
    try {
      const response = await axios.post(`/api/reviews/${reviewId}/helpful`, null, { headers: authHeaders });
      setReviews((prev) => prev.map((item) => (item._id === reviewId ? { ...item, helpfulCount: response.data.helpfulCount, hasVoted: true } : item)));
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to mark helpful.');
    }
  };

  const resetFilters = () => {
    setFilterRating('');
    setFilterPhotos(false);
    setFilterVerified(false);
  };

  const userOwnReviewId = reviews.find((review) => user && review.user._id === user._id)?._id;

  return (
    <section className="review-section">
      <div className="review-header">
        <div>
          <h3>Customer Reviews</h3>
          <p className="review-subtitle">Read verified opinions and rating details for this product.</p>
        </div>
        {stats && (
          <div className="review-summary-card">
            <div className="rating-summary">
              <span className="rating-score">{stats.averageRating.toFixed(1)}</span>
              <span className="rating-stars">{Array.from({ length: 5 }, (_, idx) => idx + 1).map((value) => (
                <span key={value} className={value <= Math.round(stats.averageRating) ? 'star-filled' : 'star-empty'}>★</span>
              ))}</span>
            </div>
            <p>{stats.totalReviews} review{stats.totalReviews === 1 ? '' : 's'}</p>
          </div>
        )}
      </div>

      {stats && (
        <div className="review-distribution-grid">
          {stats.distribution.map((bucket) => (
            <div key={bucket.rating} className="distribution-row">
              <span className="distribution-label">{bucket.rating}★</span>
              <div className="distribution-bar">
                <div className="distribution-fill" style={{ width: `${stats.totalReviews ? (bucket.count / stats.totalReviews) * 100 : 0}%` }} />
              </div>
              <span className="distribution-count">{bucket.count}</span>
            </div>
          ))}
        </div>
      )}

      <div className="review-controls">
        <div className="review-filters">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="review-select">
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)} className="review-select">
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          <button type="button" className="btn-secondary btn-sm" onClick={() => setFilterPhotos((prev) => !prev)}>
            {filterPhotos ? 'With Photos ✓' : 'With Photos'}
          </button>
          <button type="button" className="btn-secondary btn-sm" onClick={() => setFilterVerified((prev) => !prev)}>
            {filterVerified ? 'Verified ✓' : 'Verified Purchase'}
          </button>
          <button type="button" className="btn-secondary btn-sm" onClick={resetFilters}>Reset</button>
        </div>
      </div>

      <div className="review-form-card">
        <div className="review-form-heading">
          <h4>{userReview ? 'Update Your Review' : 'Write a Review'}</h4>
          {userHasPurchased && <span className="verified-badge">Verified Purchase</span>}
        </div>

        {!user && (
          <div className="review-login-note">
            <p>Please <a href="/login">log in</a> to submit a review.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="review-form">
          <div className="star-input-row">
            {stars.map((star) => (
              <button
                key={star}
                type="button"
                className={`star-button ${displayStarClass(star)}`}
                onMouseEnter={() => handleStarHover(star)}
                onMouseLeave={() => setForm((prev) => ({ ...prev, hoverRating: 0 }))}
                onClick={() => handleStarClick(star)}
              >
                ★
              </button>
            ))}
          </div>

          <input
            type="text"
            name="title"
            placeholder="Review title"
            value={form.title}
            onChange={handleInputChange}
            className="review-input"
            disabled={!user}
          />
          <textarea
            name="description"
            placeholder="Write your review"
            value={form.description}
            onChange={handleInputChange}
            className="review-textarea"
            rows="5"
            disabled={!user}
          />

          <div className="review-upload-row">
            <label className="review-upload-label">
              Add photos
              <input type="file" accept="image/*" multiple onChange={handleFileChange} disabled={!user} className="hidden-file-input" />
            </label>
            <span className="review-upload-hint">Up to 5 images</span>
          </div>

          {imagePreviews.length > 0 && (
            <div className="review-preview-grid">
              {imagePreviews.map((preview, index) => (
                <div key={preview} className="review-preview-item">
                  <img src={preview} alt="Preview" loading="lazy" />
                  <button type="button" className="remove-preview" onClick={() => removeImage(index)}>Remove</button>
                </div>
              ))}
            </div>
          )}

          {message && <div className="review-message">{message}</div>}

          <button type="submit" className="btn-primary" disabled={!user || submitting} style={{ width: 'fit-content' }}>
            {submitting ? 'Saving...' : reviewLabel}
          </button>
        </form>
      </div>

      <div className="review-list">
        {loading ? (
          <div className="loading-state">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="review-empty">No reviews match your filters yet.</div>
        ) : (
          reviews.map((review) => (
            <article key={review._id} className="review-card">
              <div className="review-card-header">
                <div className="review-author">
                  <span className="avatar">{review.user.name.charAt(0).toUpperCase()}</span>
                  <div>
                    <p className="review-author-name">{review.user.name}</p>
                    <div className="review-meta-row">
                      {review.verifiedPurchase && <span className="verified-badge small">Verified Purchase</span>}
                      <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="review-actions">
                  {user && review.user._id === user._id && (
                    <>
                      <button type="button" className="btn-sm btn-secondary" onClick={() => startEdit(review)}>Edit</button>
                      <button type="button" className="btn-sm btn-secondary" onClick={() => handleDelete(review._id)}>Delete</button>
                    </>
                  )}
                </div>
              </div>

              <div className="review-stars-row">
                {Array.from({ length: 5 }, (_, idx) => idx + 1).map((value) => (
                  <span key={value} className={value <= review.rating ? 'star-filled' : 'star-empty'}>★</span>
                ))}
              </div>
              <h4 className="review-title">{review.title}</h4>
              <p className="review-text">{review.description}</p>

              {review.images && review.images.length > 0 && (
                <div className="review-image-grid">
                  {review.images.map((src) => (
                    <img key={src} src={src} alt="Review" loading="lazy" className="review-image" />
                  ))}
                </div>
              )}

              <div className="review-footer-row">
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => handleHelpful(review._id)}
                  disabled={review.hasVoted || !user}
                >
                  👍 Helpful{review.helpfulCount ? ` (${review.helpfulCount})` : ''}
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {pages > 1 && (
        <div className="pagination-row">
          <button type="button" className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>
            Previous
          </button>
          <span>Page {page} of {pages}</span>
          <button type="button" className="btn-secondary btn-sm" disabled={page >= pages} onClick={() => setPage((prev) => Math.min(prev + 1, pages))}>
            Next
          </button>
        </div>
      )}
    </section>
  );
};

export default ReviewSection;

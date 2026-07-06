import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const WishlistContext = createContext(null);
const WISHLIST_STORAGE_KEY = "shopnestWishlist";

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState(() => {
    if (typeof window === "undefined") {
      return [];
    }
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Unable to load wishlist from localStorage", error);
      return [];
    }
  });

  const [toast, setToast] = useState({ message: "", visible: false });

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
    } catch (error) {
      console.error("Unable to save wishlist to localStorage", error);
    }
  }, [wishlistItems]);

  useEffect(() => {
    if (!toast.visible) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToast((current) => ({ ...current, visible: false }));
    }, 1800);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast.visible]);

  const showToast = useCallback((message) => {
    setToast({ message, visible: true });
  }, []);

  const toggleWishlist = useCallback(
    (product) => {
      setWishlistItems((currentItems) => {
        const exists = currentItems.some((item) => item._id === product._id);

        if (exists) {
          showToast("Removed from Wishlist");
          return currentItems.filter((item) => item._id !== product._id);
        }

        showToast("Added to Wishlist");
        return [...currentItems, product];
      });
    },
    [showToast],
  );

  const removeFromWishlist = useCallback((productId) => {
    setWishlistItems((currentItems) =>
      currentItems.filter((item) => item._id !== productId),
    );
  }, []);

  const isWishlisted = useCallback(
    (productId) => wishlistItems.some((item) => item._id === productId),
    [wishlistItems],
  );

  const wishlistCount = useMemo(() => wishlistItems.length, [wishlistItems]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount,
        toggleWishlist,
        removeFromWishlist,
        isWishlisted,
      }}
    >
      {children}
      {toast.visible && (
        <div className="toast-container">
          <div className="toast-message">{toast.message}</div>
        </div>
      )}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
};

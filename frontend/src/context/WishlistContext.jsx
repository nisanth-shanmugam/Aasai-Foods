import { createContext, useContext } from "react";
import { useLiveStorage } from "../hooks/useLiveStorage";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [items, setItems] = useLiveStorage("aasai_wishlist", []);

  const toggle = (product) =>
    setItems((prev) =>
      prev.find((i) => i.id === product.id)
        ? prev.filter((i) => i.id !== product.id)
        : [...prev, product]
    );

  const remove    = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const isWished  = (id) => items.some((i) => i.id === id);

  return (
    <WishlistContext.Provider value={{ items, toggle, remove, isWished }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);

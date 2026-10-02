import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";
import {
  initSocket,
  onProductCreated,
  onProductUpdated,
  onProductDeleted,
  onProductStockChanged,
  offProductCreated,
  offProductUpdated,
  offProductDeleted,
  offProductStockChanged,
} from "../services/socket";

const ProductContext = createContext(null);

const PRODUCT_ENHANCEMENTS = {
  "Kambu Flour": {
    image: "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=600&auto=format&fit=crop&q=80",
    rating: 4.7,
    reviews: 42,
    originalPrice: 150,
  },
  "Ragi Health Mix": {
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviews: 124,
    originalPrice: 300,
  },
  "Millet Cookies": {
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&auto=format&fit=crop&q=80",
    rating: 4.8,
    reviews: 86,
    originalPrice: 220,
  },
  "Thinai (Foxtail Millet)": {
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&auto=format&fit=crop&q=80",
    rating: 4.6,
    reviews: 58,
    originalPrice: 180,
  },
  "Mapillai Samba Rice": {
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
    rating: 4.8,
    reviews: 92,
    originalPrice: 200,
  },
  "Groundnut Chikki": {
    image: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviews: 150,
    originalPrice: 120,
  },
  "Paniyaram Mix": {
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&auto=format&fit=crop&q=80",
    rating: 4.5,
    reviews: 37,
    originalPrice: 175,
  },
  "Organic Turmeric": {
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviews: 210,
    originalPrice: 110,
  }
};

function normalizeProduct(p) {
  const enh = PRODUCT_ENHANCEMENTS[p.name] || {};
  const priceNum = parseFloat(p.price) || 0;
  const originalPrice = enh.originalPrice || Math.round(priceNum * 1.25);
  
  let defaultImg = `https://placehold.co/200x200/e8f5e9/2e7d32?text=${encodeURIComponent(p.name)}`;
  const cat = p.category_name || (p.category && String(p.category)) || "";
  
  if (cat.toLowerCase().includes("fruit")) {
    defaultImg = "https://images.unsplash.com/photo-1610832958506-ee5633613044?w=600&auto=format&fit=crop&q=80";
  } else if (cat.toLowerCase().includes("veg")) {
    defaultImg = "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=600&auto=format&fit=crop&q=80";
  } else if (cat.toLowerCase().includes("snack")) {
    defaultImg = "https://images.unsplash.com/photo-1606755962778-8a8cd673d429?w=600&auto=format&fit=crop&q=80";
  } else if (cat.toLowerCase().includes("millet") || cat.toLowerCase().includes("grain") || cat.toLowerCase().includes("flour")) {
    defaultImg = "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&auto=format&fit=crop&q=80";
  } else if (cat.toLowerCase().includes("combo")) {
    defaultImg = "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&auto=format&fit=crop&q=80";
  }

  return {
    id:            p.id,
    name:          p.name,
    description:   p.description,
    price:         priceNum,
    originalPrice: originalPrice,
    stock:         p.stock,
    image:         p.image_url || p.image || enh.image || defaultImg,
    category:      cat,
    status:        p.is_active ? "Active" : "Inactive",
    rating:        enh.rating || (4.0 + (p.id % 5) * 0.2),
    reviews:       enh.reviews || (15 + (p.id % 15) * 8),
  };
}

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);     // string[] for dropdowns
  const [categoryObjects, setCategoryObjects] = useState([]); // {id, name}[] for management
  const [catMap, setCatMap] = useState({}); // name -> id
  const { user } = useAuth();

  // Load products initially
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const productEndpoint = user?.role === "admin"
          ? "/store/admin/products/"
          : "/store/products/";
        const [cRes, pRes] = await Promise.all([
          api.get("/store/categories/"),
          api.get(productEndpoint),
        ]);
        if (!mounted) return;
        const cats = cRes.data || [];
        const mapping = {};
        cats.forEach((c) => (mapping[c.name] = c.id));
        setCategories(cats.map((c) => c.name));
        setCategoryObjects(cats);
        setCatMap(mapping);

        const prods = (pRes.data || []).map(normalizeProduct);
        setProducts(prods);
      } catch (err) {
        console.error("Failed to load products/categories", err);
      }
    }
    if (user) load();
    return () => (mounted = false);
  }, [user]);

  // Set up real-time listeners
  useEffect(() => {
    initSocket();

    const onCreate = (p) => {
      setProducts((prev) => {
        if (prev.find((x) => x.id === p.id)) return prev;
        return [...prev, normalizeProduct(p)];
      });
    };
    const onUpdate = (p) => setProducts((prev) => prev.map((x) => x.id === p.id ? normalizeProduct(p) : x));
    const onDelete = (d) => setProducts((prev) => prev.filter((x) => x.id !== d.id));
    const onStock  = (d) => setProducts((prev) => prev.map((x) => x.id === d.id ? { ...x, stock: d.stock } : x));

    onProductCreated(onCreate);
    onProductUpdated(onUpdate);
    onProductDeleted(onDelete);
    onProductStockChanged(onStock);

    return () => {
      offProductCreated(onCreate);
      offProductUpdated(onUpdate);
      offProductDeleted(onDelete);
      offProductStockChanged(onStock);
    };
  }, []);

  // helper to convert dataURL to Blob
  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }

  const addProduct = async (product) => {
    try {
      const fd = new FormData();
      fd.append("name", product.name);
      if (product.description) fd.append("description", product.description);
      fd.append("price", product.price);
      fd.append("stock", product.stock ?? 0);
      fd.append("is_active", product.status === "Active");
      // resolve category id from name if available
      if (product.category && catMap[product.category]) fd.append("category", catMap[product.category]);

      if (product.image && typeof product.image === "string" && product.image.startsWith("data:")) {
        const blob = dataURLtoBlob(product.image);
        fd.append("image", blob, `${product.name.replace(/\s+/g, "_")}.png`);
      }

      const { data: p } = await api.post("/store/admin/products/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProducts((prev) => [...prev, normalizeProduct(p)]);
      // Backend broadcasts product:created via WebSocket — no manual emit needed
    } catch (err) {
      console.error("Add product failed", err);
      throw err;
    }
  };

  const updateProduct = async (updated) => {
    try {
      const fd = new FormData();
      if (updated.name !== undefined) fd.append("name", updated.name);
      if (updated.description !== undefined) fd.append("description", updated.description);
      if (updated.price !== undefined) fd.append("price", updated.price);
      if (updated.stock !== undefined) fd.append("stock", updated.stock);
      if (updated.status !== undefined) fd.append("is_active", updated.status === "Active");
      if (updated.category && catMap[updated.category]) fd.append("category", catMap[updated.category]);

      if (updated.image && typeof updated.image === "string" && updated.image.startsWith("data:")) {
        const blob = dataURLtoBlob(updated.image);
        fd.append("image", blob, `${updated.name.replace(/\s+/g, "_")}.png`);
      }

      await api.put(`/store/admin/products/${updated.id}/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // optimistic local update
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
      // Backend broadcasts product:updated via WebSocket — no manual emit needed
    } catch (err) {
      console.error("Update product failed", err);
      throw err;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await api.delete(`/store/admin/products/${id}/`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      // Backend broadcasts product:deleted via WebSocket — no manual emit needed
    } catch (err) {
      console.error("Delete product failed", err);
      throw err;
    }
  };

  const addCategory = async (name) => {
    const { data } = await api.post("/store/admin/categories/", { name });
    setCategories((prev) => [...prev, data.name]);
    setCategoryObjects((prev) => [...prev, data]);
    setCatMap((prev) => ({ ...prev, [data.name]: data.id }));
    return data;
  };

  const updateCategory = async (id, name) => {
    const { data } = await api.put(`/store/admin/categories/${id}/`, { name });
    setCategoryObjects((prev) => prev.map((c) => (c.id === id ? data : c)));
    setCategories((prev) => prev.map((c) => (catMap[c] === id ? data.name : c)));
    setCatMap((prev) => {
      const next = { ...prev };
      const oldName = Object.keys(next).find((k) => next[k] === id);
      if (oldName) delete next[oldName];
      next[data.name] = id;
      return next;
    });
    return data;
  };

  const deleteCategory = async (id) => {
    await api.delete(`/store/admin/categories/${id}/`);
    setCategoryObjects((prev) => prev.filter((c) => c.id !== id));
    setCategories((prev) => prev.filter((name) => catMap[name] !== id));
    setCatMap((prev) => {
      const next = { ...prev };
      const oldName = Object.keys(next).find((k) => next[k] === id);
      if (oldName) delete next[oldName];
      return next;
    });
  };

  return (
    <ProductContext.Provider value={{ products, categories, categoryObjects, addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory }}>
      {children}
    </ProductContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useProducts = () => useContext(ProductContext);

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import {
  initSocket,
  onOrderCreated,
  onOrderUpdated,
  onOrderStatusChanged,
  offOrderCreated,
  offOrderUpdated,
  offOrderStatusChanged,
} from "../services/socket";

const OrderContext = createContext(null);

function normalizeOrder(o) {
  return {
    id:       o.order_id,
    pk:       o.id,
    customer: o.customer_name,
    email:    o.customer_email || "",
    phone:    o.phone,
    address:  o.address,
    date:     o.created_at
      ? new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "",
    amount:   parseFloat(o.total_amount || 0),
    status:   o.status
      ? o.status.charAt(0).toUpperCase() + o.status.slice(1)
      : "Pending",
    items: (o.items || []).map((i) => ({
      name:     i.name,
      price:    parseFloat(i.price),
      qty:      i.quantity,
      quantity: i.quantity,
    })),
  };
}

export function OrderProvider({ children }) {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAllOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/store/admin/orders/");
      setOrders(data.map(normalizeOrder));
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/store/my-orders/");
      setOrders(data.map(normalizeOrder));
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addOrder = async (payload) => {
    const { data } = await api.post("/store/orders/", payload);
    const normalized = normalizeOrder(data);
    setOrders((prev) => [normalized, ...prev]);
    // Backend broadcasts order:created — other tabs/users get it via WS
    return normalized;
  };

  const updateOrderStatus = async (pk, status) => {
    await api.patch(`/store/admin/orders/${pk}/`, { status: status.toLowerCase() });
    setOrders((prev) => prev.map((o) => (o.pk === pk ? { ...o, status } : o)));
    // Backend broadcasts order:status_changed — customer gets it via WS
  };

  useEffect(() => {
    initSocket();

    // New order placed by any customer → admin sees it immediately
    const onCreated = (o) => {
      const normalized = normalizeOrder(o);
      setOrders((prev) => {
        if (prev.find((x) => x.pk === normalized.pk)) return prev;
        return [normalized, ...prev];
      });
    };

    // Order fields updated
    const onUpdated = (o) => {
      const normalized = normalizeOrder(o);
      setOrders((prev) => prev.map((x) => x.pk === normalized.pk ? normalized : x));
    };

    // Status changed by admin → customer order tracking updates
    const onStatusChanged = (d) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.pk === d.id
            ? { ...o, status: d.status.charAt(0).toUpperCase() + d.status.slice(1) }
            : o
        )
      );
    };

    onOrderCreated(onCreated);
    onOrderUpdated(onUpdated);
    onOrderStatusChanged(onStatusChanged);

    return () => {
      offOrderCreated(onCreated);
      offOrderUpdated(onUpdated);
      offOrderStatusChanged(onStatusChanged);
    };
  }, []);

  return (
    <OrderContext.Provider value={{ orders, loading, addOrder, updateOrderStatus, fetchAllOrders, fetchMyOrders }}>
      {children}
    </OrderContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useOrders = () => useContext(OrderContext);

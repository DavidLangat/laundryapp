import axios from "axios";

// Base URL for API requests
const BASE_URL = "http://localhost/laundryapp";

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Authentication APIs
export const authAPI = {
  // Register a new user
  register: async (userData) => {
    try {
      const response = await api.post("/auth/register.php", userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post("/auth/login.php", credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reset password
  resetPassword: async (email) => {
    try {
      const response = await api.post("/auth/reset-password.php", { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Check authentication status
  checkAuthStatus: async (token) => {
    try {
      const response = await api.get("/auth/status.php", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// User APIs
export const userAPI = {
  // Get user profile
  getProfile: async (token) => {
    try {
      const response = await api.get("/user/profile.php", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get loyalty points
  getLoyaltyPoints: async (token) => {
    try {
      const response = await api.get("/user/loyalty-points.php", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (token, userData) => {
    try {
      const response = await api.put("/user/profile.php", userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Services APIs
export const servicesAPI = {
  // Get all services
  getServices: async () => {
    try {
      const response = await api.get("/services/index.php");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get service details
  getServiceDetails: async (serviceId) => {
    try {
      const response = await api.get(`/services/${serviceId}.php`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Offers APIs
export const offersAPI = {
  // Get all offers
  getOffers: async () => {
    try {
      const response = await api.get("/offers/index.php");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Apply offer
  applyOffer: async (token, offerCode, orderId) => {
    try {
      const response = await api.post(
        "/offers/apply.php",
        { offer_code: offerCode, order_id: orderId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Orders APIs
export const ordersAPI = {
  // Get user orders
  getOrders: async (token) => {
    try {
      const response = await api.get("/orders/index.php", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get order details
  getOrderDetails: async (token, orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}.php`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new order
  createOrder: async (token, orderData) => {
    try {
      const response = await api.post("/orders/create.php", orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Cancel order
  cancelOrder: async (token, orderId) => {
    try {
      const response = await api.post(
        "/orders/cancel.php",
        { order_id: orderId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api;

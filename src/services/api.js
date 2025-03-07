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
    console.log("token", token);
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
    console.log("orderData", JSON.stringify(orderData, null, 2));
    try {
      // Check if we're using the correct endpoint
      // The error suggests we might need to use /orders/create.php instead of /order/create.php
      const endpoint = "/orders/create.php"; // Changed from /order/create.php
      console.log("Using endpoint:", endpoint);

      const response = await api.post(endpoint, orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("response", response);
      return response.data;
    } catch (error) {
      console.error("API Error:", error.message);
      if (error.response) {
        console.error(
          "Error Response Data:",
          JSON.stringify(error.response.data, null, 2)
        );
        console.error("Error Response Status:", error.response.status);
        console.error("Error Response Headers:", error.response.headers);
      } else if (error.request) {
        console.error("Error Request:", error.request);
      }
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

  // Estimate order cost
  estimateOrder: async (token, orderItems) => {
    try {
      // Use consistent endpoint path
      const endpoint = "/orders/estimate.php"; // Changed from /order/estimate.php
      console.log("Using estimate endpoint:", endpoint);

      const response = await api.post(endpoint, orderItems, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("API Error in estimateOrder:", error.message);
      if (error.response) {
        console.error(
          "Error Response Data:",
          JSON.stringify(error.response.data, null, 2)
        );
        console.error("Error Response Status:", error.response.status);
        console.error("Error Response Headers:", error.response.headers);
      } else if (error.request) {
        console.error("Error Request:", error.request);
      }
      throw error;
    }
  },

  // Confirm order and process payment
  confirmOrder: async (token, orderData) => {
    console.log("Confirming order:", JSON.stringify(orderData, null, 2));
    try {
      // Use consistent endpoint path
      const endpoint = "/orders/confirm.php"; // Changed from /order/confirm.php
      console.log("Using confirm endpoint:", endpoint);

      const response = await api.post(endpoint, orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Confirmation response:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Error in confirmOrder:", error.message);
      if (error.response) {
        console.error(
          "Error Response Data:",
          JSON.stringify(error.response.data, null, 2)
        );
        console.error("Error Response Status:", error.response.status);
        console.error("Error Response Headers:", error.response.headers);
      } else if (error.request) {
        console.error("Error Request:", error.request);
      }
      throw error;
    }
  },
};

// Loyalty APIs
export const loyaltyAPI = {
  // Redeem loyalty points
  redeemPoints: async (token, redemptionData) => {
    console.log("Redeeming points:", JSON.stringify(redemptionData, null, 2));
    try {
      // Use consistent endpoint path
      const endpoint = "/loyalty/redeem.php"; // Keeping this the same as it seems correct
      console.log("Using loyalty endpoint:", endpoint);

      const response = await api.post(endpoint, redemptionData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Redemption response:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Error in redeemPoints:", error.message);
      if (error.response) {
        console.error(
          "Error Response Data:",
          JSON.stringify(error.response.data, null, 2)
        );
        console.error("Error Response Status:", error.response.status);
        console.error("Error Response Headers:", error.response.headers);
      } else if (error.request) {
        console.error("Error Request:", error.request);
      }
      throw error;
    }
  },
};

// Discount APIs
export const discountAPI = {
  // Apply discount code
  applyDiscount: async (token, discountData) => {
    console.log("Applying discount:", JSON.stringify(discountData, null, 2));
    try {
      // Use consistent endpoint path
      const endpoint = "/discounts/apply.php"; // Changed from /discount/apply.php
      console.log("Using discount endpoint:", endpoint);

      const response = await api.post(endpoint, discountData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Discount response:", response.data);
      return response.data;
    } catch (error) {
      console.error("API Error in applyDiscount:", error.message);
      if (error.response) {
        console.error(
          "Error Response Data:",
          JSON.stringify(error.response.data, null, 2)
        );
        console.error("Error Response Status:", error.response.status);
        console.error("Error Response Headers:", error.response.headers);
      } else if (error.request) {
        console.error("Error Request:", error.request);
      }
      throw error;
    }
  },
};

export default api;

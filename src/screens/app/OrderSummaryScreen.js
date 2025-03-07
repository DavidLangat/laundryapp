import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { FontAwesome5, MaterialIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import { COLORS, SIZES, FONTS } from "../../constants";
import images from "../../constants/images";
import Button from "../../components/Button";
import { BASE_URL } from "../../constants/config";

const OrderSummaryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderData } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [estimateLoading, setEstimateLoading] = useState(true);
  const [orderSummary, setOrderSummary] = useState(null);
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(false);
  const [availableLoyaltyPoints, setAvailableLoyaltyPoints] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("mpesa");
  const [authToken, setAuthToken] = useState("");

  useEffect(() => {
    const getAuthToken = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        setAuthToken(token);
        // Also fetch available loyalty points
        fetchLoyaltyPoints(token);
        // Get order estimate
        if (orderData && token) {
          getOrderEstimate(orderData, token);
        }
      } catch (error) {
        console.error("Error getting auth token:", error);
      }
    };

    getAuthToken();
  }, [orderData]);

  const fetchLoyaltyPoints = async (token) => {
    try {
      const response = await axios.get(`${BASE_URL}/loyalty/points.php`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setAvailableLoyaltyPoints(response.data.points);
      }
    } catch (error) {
      console.error("Error fetching loyalty points:", error);
    }
  };

  const getOrderEstimate = async (orderItems, token) => {
    setEstimateLoading(true);
    try {
      const data = {
        items: orderItems.items,
        discount_code: discountCode || null,
        use_loyalty_points: loyaltyPointsUsed,
      };

      const response = await axios.post(
        `${BASE_URL}/order/estimate.php`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setOrderSummary(response.data);
      } else {
        Alert.alert(
          "Error",
          response.data.message || "Failed to get order estimate"
        );
      }
    } catch (error) {
      console.error("Error getting order estimate:", error);
      Alert.alert("Error", "Failed to get order estimate. Please try again.");
    } finally {
      setEstimateLoading(false);
    }
  };

  const applyDiscountCode = async () => {
    if (!discountCode.trim()) {
      Alert.alert("Error", "Please enter a discount code");
      return;
    }

    setLoading(true);
    try {
      const data = {
        code: discountCode,
        order_total: orderSummary?.subtotal || 0,
      };

      const response = await axios.post(
        `${BASE_URL}/discount/apply.php`,
        data,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setDiscountApplied(true);
        // Refresh order estimate with discount
        getOrderEstimate(orderData, authToken);
        Alert.alert("Success", "Discount code applied successfully!");
      } else {
        Alert.alert("Error", response.data.message || "Invalid discount code");
      }
    } catch (error) {
      console.error("Error applying discount code:", error);
      Alert.alert("Error", "Failed to apply discount code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleLoyaltyPoints = () => {
    const newValue = !loyaltyPointsUsed;
    setLoyaltyPointsUsed(newValue);

    // Refresh order estimate with updated loyalty points usage
    getOrderEstimate(
      {
        ...orderData,
        use_loyalty_points: newValue,
      },
      authToken
    );
  };

  const confirmOrder = async () => {
    setLoading(true);
    try {
      // First create the order
      const orderResponse = await axios.post(
        `${BASE_URL}/order/create.php`,
        orderData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || "Failed to create order");
      }

      const orderId = orderResponse.data.order_id;

      // Then confirm payment
      const paymentData = {
        order_id: orderId,
        payment_method: selectedPaymentMethod,
      };

      const paymentResponse = await axios.post(
        `${BASE_URL}/order/confirm.php`,
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (paymentResponse.data.success) {
        Alert.alert(
          "Order Confirmed",
          "Your order has been placed successfully!",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Home"),
            },
          ]
        );
      } else {
        throw new Error(
          paymentResponse.data.message || "Payment confirmation failed"
        );
      }
    } catch (error) {
      console.error("Error confirming order:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to confirm order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderServiceItem = (item) => {
    return (
      <View key={item.service_id} style={styles.serviceItem}>
        <View style={styles.serviceIconContainer}>
          <FontAwesome5
            name={getServiceIcon(item.service_name)}
            size={20}
            color={COLORS.primary}
          />
        </View>
        <View style={styles.serviceDetails}>
          <Text style={styles.serviceName}>{item.service_name}</Text>
          <Text style={styles.serviceDescription}>{item.description}</Text>
        </View>
        <View style={styles.serviceQuantity}>
          <Text style={styles.quantityText}>x{item.quantity}</Text>
        </View>
        <View style={styles.servicePrice}>
          <Text style={styles.priceText}>Ksh {item.price * item.quantity}</Text>
        </View>
      </View>
    );
  };

  const getServiceIcon = (serviceName) => {
    const name = serviceName?.toLowerCase() || "";
    if (name.includes("wash")) return "tshirt";
    if (name.includes("dry")) return "wind";
    if (name.includes("iron")) return "iron";
    if (name.includes("fold")) return "layer-group";
    if (name.includes("press")) return "compress";
    return "soap";
  };

  const renderPaymentMethod = (method, title, icon) => {
    return (
      <TouchableOpacity
        style={[
          styles.paymentMethodItem,
          selectedPaymentMethod === method && styles.selectedPaymentMethod,
        ]}
        onPress={() => setSelectedPaymentMethod(method)}
      >
        <FontAwesome5
          name={icon}
          size={20}
          color={
            selectedPaymentMethod === method ? COLORS.white : COLORS.primary
          }
        />
        <Text
          style={[
            styles.paymentMethodText,
            selectedPaymentMethod === method &&
              styles.selectedPaymentMethodText,
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  if (estimateLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Calculating order summary...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Summary</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Order Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, styles.completedStep]}>
            <FontAwesome5 name="check" size={12} color={COLORS.white} />
          </View>
          <Text style={styles.progressText}>Services</Text>
        </View>
        <View style={[styles.progressLine, styles.completedLine]} />
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, styles.completedStep]}>
            <FontAwesome5 name="check" size={12} color={COLORS.white} />
          </View>
          <Text style={styles.progressText}>Address</Text>
        </View>
        <View style={[styles.progressLine, styles.completedLine]} />
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, styles.activeStep]}>
            <Text style={styles.stepNumber}>3</Text>
          </View>
          <Text style={[styles.progressText, styles.activeText]}>Summary</Text>
        </View>
      </View>

      {/* Selected Services */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FontAwesome5 name="list-ul" size={18} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Selected Services</Text>
        </View>
        <View style={styles.sectionContent}>
          {orderSummary?.items?.map((item) => renderServiceItem(item))}
        </View>
      </View>

      {/* Pickup & Delivery */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FontAwesome5 name="calendar-alt" size={18} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Pickup & Delivery</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.scheduleItem}>
            <View style={styles.scheduleIconContainer}>
              <FontAwesome5
                name="truck-pickup"
                size={16}
                color={COLORS.primary}
              />
            </View>
            <View style={styles.scheduleDetails}>
              <Text style={styles.scheduleLabel}>Pickup</Text>
              <Text style={styles.scheduleValue}>
                {orderData?.pickup_date}, {orderData?.pickup_time}
              </Text>
            </View>
          </View>
          <View style={styles.scheduleItem}>
            <View style={styles.scheduleIconContainer}>
              <FontAwesome5
                name="truck-loading"
                size={16}
                color={COLORS.primary}
              />
            </View>
            <View style={styles.scheduleDetails}>
              <Text style={styles.scheduleLabel}>Delivery</Text>
              <Text style={styles.scheduleValue}>
                {orderData?.delivery_date}, {orderData?.delivery_time}
              </Text>
            </View>
          </View>
          {orderData?.special_instructions ? (
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsLabel}>
                Special Instructions:
              </Text>
              <Text style={styles.instructionsText}>
                {orderData.special_instructions}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Delivery Address */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FontAwesome5
            name="map-marker-alt"
            size={18}
            color={COLORS.primary}
          />
          <Text style={styles.sectionTitle}>Delivery Address</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.addressContainer}>
            <Text style={styles.addressText}>{orderData?.address}</Text>
          </View>
        </View>
      </View>

      {/* Discount Code */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FontAwesome5 name="tag" size={18} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Discount Code</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.discountContainer}>
            <View style={styles.discountInputContainer}>
              <TextInput
                style={styles.discountInput}
                placeholder="Enter discount code"
                value={discountCode}
                onChangeText={setDiscountCode}
                editable={!discountApplied}
              />
              <TouchableOpacity
                style={[
                  styles.discountButton,
                  discountApplied && styles.discountAppliedButton,
                ]}
                onPress={applyDiscountCode}
                disabled={discountApplied || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.discountButtonText}>
                    {discountApplied ? "Applied" : "Apply"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            {discountApplied && orderSummary?.discount_amount > 0 && (
              <Text style={styles.discountAppliedText}>
                Discount of Ksh {orderSummary.discount_amount} applied!
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Loyalty Points */}
      {availableLoyaltyPoints > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="crown" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Loyalty Points</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.loyaltyContainer}>
              <View style={styles.loyaltyInfo}>
                <Text style={styles.loyaltyText}>
                  You have {availableLoyaltyPoints} points available
                </Text>
                <Text style={styles.loyaltySubtext}>
                  Use your points to get a discount on this order
                </Text>
              </View>
              <TouchableOpacity
                style={styles.loyaltyToggle}
                onPress={toggleLoyaltyPoints}
              >
                <View
                  style={[
                    styles.toggleTrack,
                    loyaltyPointsUsed && styles.toggleTrackActive,
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      loyaltyPointsUsed && styles.toggleThumbActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </View>
            {loyaltyPointsUsed && orderSummary?.loyalty_discount > 0 && (
              <Text style={styles.loyaltyAppliedText}>
                Loyalty discount of Ksh {orderSummary.loyalty_discount} applied!
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Payment Method */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FontAwesome5 name="credit-card" size={18} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Payment Method</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.paymentMethodsContainer}>
            {renderPaymentMethod("mpesa", "M-Pesa", "money-bill-wave")}
            {renderPaymentMethod("card", "Card Payment", "credit-card")}
            {renderPaymentMethod("cash", "Cash on Delivery", "money-bill")}
          </View>
        </View>
      </View>

      {/* Order Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FontAwesome5 name="receipt" size={18} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
        </View>
        <View style={[styles.sectionContent, styles.summaryContent]}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              Ksh {orderSummary?.subtotal || 0}
            </Text>
          </View>

          {orderSummary?.delivery_fee > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>
                Ksh {orderSummary.delivery_fee}
              </Text>
            </View>
          )}

          {orderSummary?.discount_amount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={[styles.summaryValue, styles.discountValue]}>
                - Ksh {orderSummary.discount_amount}
              </Text>
            </View>
          )}

          {orderSummary?.loyalty_discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Loyalty Discount</Text>
              <Text style={[styles.summaryValue, styles.discountValue]}>
                - Ksh {orderSummary.loyalty_discount}
              </Text>
            </View>
          )}

          {orderSummary?.tax > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>Ksh {orderSummary.tax}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              Ksh {orderSummary?.total || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Confirm Button */}
      <View style={styles.buttonContainer}>
        <Button
          title={loading ? "Processing..." : "Confirm Order"}
          onPress={confirmOrder}
          disabled={loading}
          isLoading={loading}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 10,
    ...FONTS.body3,
    color: COLORS.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.black,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: COLORS.white,
    marginBottom: 10,
  },
  progressStep: {
    alignItems: "center",
  },
  progressCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.lightGray2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  completedStep: {
    backgroundColor: COLORS.primary,
  },
  activeStep: {
    backgroundColor: COLORS.secondary,
  },
  stepNumber: {
    color: COLORS.white,
    ...FONTS.body3,
    fontWeight: "bold",
  },
  progressText: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  activeText: {
    color: COLORS.black,
    fontWeight: "bold",
  },
  progressLine: {
    width: 50,
    height: 3,
    backgroundColor: COLORS.lightGray2,
    marginHorizontal: 5,
  },
  completedLine: {
    backgroundColor: COLORS.primary,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray2,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.black,
    marginLeft: 10,
  },
  sectionContent: {
    padding: 15,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray2,
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightPrimary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    ...FONTS.body3,
    color: COLORS.black,
    fontWeight: "bold",
  },
  serviceDescription: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  serviceQuantity: {
    marginRight: 10,
  },
  quantityText: {
    ...FONTS.body3,
    color: COLORS.black,
  },
  servicePrice: {
    minWidth: 80,
    alignItems: "flex-end",
  },
  priceText: {
    ...FONTS.body3,
    color: COLORS.black,
    fontWeight: "bold",
  },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  scheduleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.lightPrimary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleLabel: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  scheduleValue: {
    ...FONTS.body3,
    color: COLORS.black,
    fontWeight: "bold",
  },
  instructionsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: COLORS.lightGray2,
    borderRadius: 5,
  },
  instructionsLabel: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginBottom: 5,
  },
  instructionsText: {
    ...FONTS.body3,
    color: COLORS.black,
  },
  addressContainer: {
    padding: 10,
    backgroundColor: COLORS.lightGray2,
    borderRadius: 5,
  },
  addressText: {
    ...FONTS.body3,
    color: COLORS.black,
  },
  discountContainer: {
    marginBottom: 5,
  },
  discountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  discountInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: COLORS.lightGray2,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    ...FONTS.body3,
  },
  discountButton: {
    height: 45,
    paddingHorizontal: 15,
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  discountAppliedButton: {
    backgroundColor: COLORS.green,
  },
  discountButtonText: {
    ...FONTS.body3,
    color: COLORS.white,
    fontWeight: "bold",
  },
  discountAppliedText: {
    ...FONTS.body4,
    color: COLORS.green,
    marginTop: 5,
  },
  loyaltyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: COLORS.lightPrimary,
    borderRadius: 10,
  },
  loyaltyInfo: {
    flex: 1,
  },
  loyaltyText: {
    ...FONTS.body3,
    color: COLORS.black,
    fontWeight: "bold",
  },
  loyaltySubtext: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  loyaltyToggle: {
    marginLeft: 10,
  },
  toggleTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.lightGray2,
    padding: 2,
  },
  toggleTrackActive: {
    backgroundColor: COLORS.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  loyaltyAppliedText: {
    ...FONTS.body4,
    color: COLORS.primary,
    marginTop: 10,
  },
  paymentMethodsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  paymentMethodItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.lightGray2,
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedPaymentMethod: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  paymentMethodText: {
    ...FONTS.body3,
    color: COLORS.black,
    marginLeft: 10,
  },
  selectedPaymentMethodText: {
    color: COLORS.white,
  },
  summaryContent: {
    paddingHorizontal: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  summaryValue: {
    ...FONTS.body3,
    color: COLORS.black,
  },
  discountValue: {
    color: COLORS.green,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray2,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  totalLabel: {
    ...FONTS.h3,
    color: COLORS.black,
  },
  totalValue: {
    ...FONTS.h3,
    color: COLORS.primary,
  },
  buttonContainer: {
    padding: 20,
  },
});

export default OrderSummaryScreen;

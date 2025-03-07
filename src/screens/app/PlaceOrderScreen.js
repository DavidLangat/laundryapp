import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONTS, SIZES } from "../../constants";
import { Button, Input } from "../../components";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  servicesAPI,
  ordersAPI,
  userAPI,
  loyaltyAPI,
  discountAPI,
} from "../../services/api";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Ionicons,
  MaterialIcons,
  AntDesign,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { format } from "date-fns";

const ServiceItem = ({ service, onSelect, onRemove, quantity = 0 }) => {
  return (
    <View style={styles.serviceItem}>
      <View style={styles.serviceInfo}>
        <View style={styles.serviceIconContainer}>
          <FontAwesome5
            name={getServiceIcon(service.name)}
            size={18}
            color={COLORS.primary}
          />
        </View>
        <View style={styles.serviceTextContainer}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.servicePrice}>
            KES {service.price_per_item} per item
          </Text>
        </View>
      </View>
      <View style={styles.quantityControl}>
        <TouchableOpacity
          style={[
            styles.quantityButton,
            {
              opacity: quantity === 0 ? 0.5 : 1,
              backgroundColor:
                quantity === 0 ? COLORS.lightGray : COLORS.primary,
            },
          ]}
          onPress={() => quantity > 0 && onRemove(service)}
          disabled={quantity === 0}
        >
          <AntDesign name="minus" size={16} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => onSelect(service)}
        >
          <AntDesign name="plus" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Helper function to get icon based on service name
const getServiceIcon = (serviceName) => {
  const name = serviceName.toLowerCase();
  if (name.includes("wash")) return "tshirt";
  if (name.includes("dry")) return "wind";
  if (name.includes("iron")) return "iron";
  if (name.includes("fold")) return "layer-group";
  if (name.includes("press")) return "compress";
  return "soap"; // default
};

const PlaceOrderScreen = () => {
  const navigation = useNavigation();
  const [services, setServices] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [sameAddress, setSameAddress] = useState(true);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [pickupDate, setPickupDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickupTime, setPickupTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeSection, setActiveSection] = useState("services");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [estimatedTotal, setEstimatedTotal] = useState(null);
  const [estimating, setEstimating] = useState(false);

  // Fetch services and loyalty points
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch services
        const servicesResponse = await servicesAPI.getServices();
        if (servicesResponse.status === "success") {
          setServices(servicesResponse.data.services);
        } else {
          Alert.alert("Error", "Failed to load services");
        }

        // Fetch loyalty points
        const token = await AsyncStorage.getItem("userToken");
        if (token) {
          const loyaltyResponse = await userAPI.getLoyaltyPoints(token);
          if (loyaltyResponse.status === "success") {
            setLoyaltyPoints(loyaltyResponse.data);
          }
        }

        // Fetch user profile to get address
        if (token) {
          const profileResponse = await userAPI.getProfile(token);
          if (
            profileResponse.status === "success" &&
            profileResponse.data.user.address
          ) {
            setPickupAddress(profileResponse.data.user.address);
            setDeliveryAddress(profileResponse.data.user.address);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        Alert.alert("Error", "Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle service selection
  const handleSelectService = (service) => {
    setSelectedItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.service_id === service.id
      );

      if (existingItemIndex >= 0) {
        // Item already exists, increment quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1,
        };
        return updatedItems;
      } else {
        // Add new item
        return [
          ...prevItems,
          {
            service_id: service.id,
            item_name: service.name,
            quantity: 1,
            price_per_item: service.price_per_item,
          },
        ];
      }
    });
  };

  // Handle service removal
  const handleRemoveService = (service) => {
    setSelectedItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.service_id === service.id
      );

      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems];
        if (updatedItems[existingItemIndex].quantity > 1) {
          // Decrement quantity
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity - 1,
          };
          return updatedItems;
        } else {
          // Remove item if quantity becomes 0
          return prevItems.filter((item) => item.service_id !== service.id);
        }
      }
      return prevItems;
    });
  };

  // Handle date change
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setPickupDate(selectedDate);
    }
  };

  // Handle time change
  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setPickupTime(selectedTime);
    }
  };

  // Toggle same address switch
  const toggleSameAddress = () => {
    setSameAddress(!sameAddress);
    if (!sameAddress) {
      setDeliveryAddress(pickupAddress);
    } else {
      setDeliveryAddress("");
    }
  };

  // Calculate total price
  const calculateTotal = () => {
    return selectedItems.reduce(
      (total, item) => total + item.quantity * item.price_per_item,
      0
    );
  };

  // Calculate loyalty discount
  const calculateDiscount = () => {
    if (!useLoyaltyPoints || !loyaltyPoints) return 0;
    // Assuming 1 point = 1 KES discount
    const maxDiscount = calculateTotal() * 0.1; // Max 10% discount
    const pointsValue = loyaltyPoints.points;
    return Math.min(pointsValue, maxDiscount);
  };

  // Calculate final total after discounts
  const calculateFinalTotal = () => {
    const total = calculateTotal();
    const loyaltyDiscount = calculateDiscount();
    const discountAmount = appliedDiscount ? appliedDiscount.amount : 0;
    return total - loyaltyDiscount - discountAmount;
  };

  // Estimate order cost
  const estimateOrderCost = async () => {
    if (selectedItems.length === 0) {
      Alert.alert("Error", "Please select at least one service");
      return;
    }

    setEstimating(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "Please login to continue");
        navigation.navigate("Login");
        return;
      }

      const orderItems = {
        items: selectedItems.map((item) => ({
          service_id: item.service_id,
          quantity: item.quantity,
        })),
        discount_code: discountCode || undefined,
        use_loyalty_points: useLoyaltyPoints,
      };

      const response = await ordersAPI.estimateOrder(token, orderItems);

      if (response.status === "success") {
        setEstimatedTotal(response.data);
        if (response.data.discount) {
          setAppliedDiscount(response.data.discount);
        }
        Alert.alert("Success", "Order cost estimated successfully");
      } else {
        Alert.alert(
          "Error",
          response.message || "Failed to estimate order cost"
        );
      }
    } catch (error) {
      console.error("Order estimation error:", error);
      Alert.alert("Error", "Failed to estimate order cost. Please try again.");
    } finally {
      setEstimating(false);
    }
  };

  // Apply discount code
  const applyDiscountCode = async () => {
    if (!discountCode) {
      Alert.alert("Error", "Please enter a discount code");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "Please login to continue");
        navigation.navigate("Login");
        return;
      }

      const discountData = {
        code: discountCode,
        order_total: calculateTotal(),
      };

      const response = await discountAPI.applyDiscount(token, discountData);

      if (response.status === "success") {
        setAppliedDiscount(response.data.discount);
        Alert.alert("Success", "Discount applied successfully");
      } else {
        Alert.alert("Error", response.message || "Invalid discount code");
      }
    } catch (error) {
      console.error("Discount application error:", error);
      Alert.alert("Error", "Failed to apply discount. Please try again.");
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (selectedItems.length === 0) {
      newErrors.items = "Please select at least one service";
    }

    if (!pickupAddress.trim()) {
      newErrors.pickupAddress = "Pickup address is required";
    }

    if (!sameAddress && !deliveryAddress.trim()) {
      newErrors.deliveryAddress = "Delivery address is required";
    }

    // Ensure pickup date is not in the past
    const now = new Date();
    const pickupDateTime = new Date(
      pickupDate.getFullYear(),
      pickupDate.getMonth(),
      pickupDate.getDate(),
      pickupTime.getHours(),
      pickupTime.getMinutes()
    );

    if (pickupDateTime < now) {
      newErrors.pickupTime = "Pickup time cannot be in the past";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle order submission
  const handleSubmitOrder = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "You must be logged in to place an order");
        navigation.navigate("Login");
        return;
      }

      // Format pickup date and time
      const formattedDateTime = format(
        new Date(
          pickupDate.getFullYear(),
          pickupDate.getMonth(),
          pickupDate.getDate(),
          pickupTime.getHours(),
          pickupTime.getMinutes()
        ),
        "yyyy-MM-dd HH:mm:ss"
      );

      // Prepare order data
      const orderData = {
        pickup_address: pickupAddress,
        delivery_address: sameAddress ? pickupAddress : deliveryAddress,
        pickup_time: formattedDateTime,
        special_instructions: specialInstructions,
        use_loyalty_points: useLoyaltyPoints,
        discount_code: discountCode || undefined,
        items: selectedItems.map((item) => ({
          service_id: item.service_id,
          item_name: item.item_name,
          quantity: item.quantity,
        })),
      };

      // Submit order
      const response = await ordersAPI.createOrder(token, orderData);

      if (response.status === "success") {
        // If order created successfully, confirm payment
        const confirmResponse = await ordersAPI.confirmOrder(token, {
          order_id: response.data.order_id,
          payment_method: "mpesa", // Default to mpesa, can be made selectable
        });

        if (confirmResponse.status === "success") {
          // If loyalty points were used, redeem them
          if (useLoyaltyPoints && loyaltyPoints) {
            await loyaltyAPI.redeemPoints(token, {
              points: Math.min(loyaltyPoints.points, calculateTotal() * 0.1),
              order_total: calculateTotal(),
            });
          }

          Alert.alert(
            "Order Placed",
            "Your order has been placed and payment initiated successfully!",
            [
              {
                text: "OK",
                onPress: () => navigation.navigate("Home"),
              },
            ]
          );
        } else {
          Alert.alert(
            "Payment Error",
            confirmResponse.message || "Failed to process payment"
          );
        }
      } else {
        Alert.alert("Error", response.message || "Failed to place order");
      }
    } catch (error) {
      console.error("Order submission error:", error);
      Alert.alert("Error", "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Get quantity for a service
  const getQuantityForService = (serviceId) => {
    const item = selectedItems.find((item) => item.service_id === serviceId);
    return item ? item.quantity : 0;
  };

  // Progress indicator
  const renderProgressIndicator = () => {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View
            style={[
              styles.progressDot,
              activeSection === "services"
                ? styles.activeProgressDot
                : selectedItems.length > 0
                ? styles.completedProgressDot
                : {},
            ]}
          ></View>
          <Text
            style={[
              styles.progressText,
              activeSection === "services" ? styles.activeProgressText : {},
            ]}
          >
            Services
          </Text>
        </View>
        <View style={styles.progressLine}></View>
        <View style={styles.progressStep}>
          <View
            style={[
              styles.progressDot,
              activeSection === "address"
                ? styles.activeProgressDot
                : pickupAddress
                ? styles.completedProgressDot
                : {},
            ]}
          ></View>
          <Text
            style={[
              styles.progressText,
              activeSection === "address" ? styles.activeProgressText : {},
            ]}
          >
            Address
          </Text>
        </View>
        <View style={styles.progressLine}></View>
        <View style={styles.progressStep}>
          <View
            style={[
              styles.progressDot,
              activeSection === "schedule" ? styles.activeProgressDot : {},
            ]}
          ></View>
          <Text
            style={[
              styles.progressText,
              activeSection === "schedule" ? styles.activeProgressText : {},
            ]}
          >
            Schedule
          </Text>
        </View>
      </View>
    );
  };

  // Render order summary section with discount code input
  const renderOrderSummary = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="receipt" size={22} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Order Summary</Text>
        </View>

        <View style={styles.summaryContainer}>
          {selectedItems.map((item, index) => (
            <View key={index} style={styles.summaryItem}>
              <Text style={styles.summaryItemName}>
                {item.item_name} x {item.quantity}
              </Text>
              <Text style={styles.summaryItemPrice}>
                KES {item.price_per_item * item.quantity}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          {/* Discount Code Section */}
          <View style={styles.discountSection}>
            <Input
              placeholder="Enter discount code"
              value={discountCode}
              onChangeText={setDiscountCode}
              containerStyle={styles.discountInput}
              leftIcon={
                <MaterialIcons
                  name="local-offer"
                  size={20}
                  color={COLORS.primary}
                />
              }
            />
            <TouchableOpacity
              style={styles.applyButton}
              onPress={applyDiscountCode}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>

          {appliedDiscount && (
            <View style={styles.summaryItem}>
              <Text style={styles.discountText}>
                Discount ({appliedDiscount.code})
              </Text>
              <Text style={styles.discountPrice}>
                - KES {appliedDiscount.amount}
              </Text>
            </View>
          )}

          {useLoyaltyPoints && loyaltyPoints && (
            <View style={styles.summaryItem}>
              <Text style={styles.discountText}>Loyalty Discount</Text>
              <Text style={styles.discountPrice}>
                - KES {calculateDiscount()}
              </Text>
            </View>
          )}

          <View style={styles.summaryItem}>
            <Text style={styles.totalText}>Total</Text>
            <Text style={styles.totalPrice}>KES {calculateFinalTotal()}</Text>
          </View>

          <TouchableOpacity
            style={styles.estimateButton}
            onPress={estimateOrderCost}
            disabled={estimating}
          >
            {estimating ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.estimateButtonText}>Estimate Cost</Text>
            )}
          </TouchableOpacity>

          {estimatedTotal && (
            <View style={styles.estimatedContainer}>
              <Text style={styles.estimatedTitle}>Estimated Cost:</Text>
              <Text style={styles.estimatedAmount}>
                KES {estimatedTotal.total}
              </Text>
              {estimatedTotal.breakdown && (
                <View style={styles.estimatedBreakdown}>
                  <Text style={styles.breakdownTitle}>Breakdown:</Text>
                  {estimatedTotal.breakdown.map((item, index) => (
                    <Text key={index} style={styles.breakdownItem}>
                      {item.description}: KES {item.amount}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Place Order</Text>
          <View style={{ width: 24 }} />
        </View>

        {renderProgressIndicator()}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Services Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="washing-machine"
                size={22}
                color={COLORS.primary}
              />
              <Text style={styles.sectionTitle}>Select Services</Text>
            </View>

            {errors.items && (
              <Text style={styles.errorText}>{errors.items}</Text>
            )}

            <View style={styles.servicesContainer}>
              {services.map((service) => (
                <ServiceItem
                  key={service.id}
                  service={service}
                  onSelect={handleSelectService}
                  onRemove={handleRemoveService}
                  quantity={getQuantityForService(service.id)}
                />
              ))}
            </View>
          </View>

          {/* Order Summary */}
          {selectedItems.length > 0 && renderOrderSummary()}

          {/* Pickup & Delivery Address */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons
                name="location-on"
                size={22}
                color={COLORS.primary}
              />
              <Text style={styles.sectionTitle}>Pickup Address</Text>
            </View>

            <Input
              placeholder="Enter pickup address"
              value={pickupAddress}
              onChangeText={setPickupAddress}
              error={errors.pickupAddress}
              leftIcon={
                <MaterialIcons name="home" size={20} color={COLORS.primary} />
              }
            />

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Same delivery address</Text>
              <Switch
                value={sameAddress}
                onValueChange={toggleSameAddress}
                trackColor={{
                  false: COLORS.lightGray,
                  true: COLORS.primary + "80",
                }}
                thumbColor={sameAddress ? COLORS.primary : COLORS.darkGray}
              />
            </View>

            {!sameAddress && (
              <>
                <View style={styles.sectionHeader}>
                  <MaterialIcons
                    name="local-shipping"
                    size={22}
                    color={COLORS.primary}
                  />
                  <Text style={[styles.sectionTitle, { marginTop: 15 }]}>
                    Delivery Address
                  </Text>
                </View>

                <Input
                  placeholder="Enter delivery address"
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  error={errors.deliveryAddress}
                  leftIcon={
                    <MaterialIcons
                      name="location-city"
                      size={20}
                      color={COLORS.primary}
                    />
                  }
                />
              </>
            )}
          </View>

          {/* Pickup Date & Time */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="schedule" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Pickup Date & Time</Text>
            </View>

            {errors.pickupTime && (
              <Text style={styles.errorText}>{errors.pickupTime}</Text>
            )}

            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons
                name="calendar-today"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.dateTimeText}>
                {format(pickupDate, "EEEE, MMMM d, yyyy")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <MaterialIcons
                name="access-time"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.dateTimeText}>
                {format(pickupTime, "h:mm a")}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={pickupDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={pickupTime}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}
          </View>

          {/* Special Instructions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="note-add" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Special Instructions</Text>
            </View>

            <Input
              placeholder="Any special instructions for your order"
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              containerStyle={styles.specialInstructionsInput}
            />
          </View>

          {/* Loyalty Points */}
          {loyaltyPoints && loyaltyPoints.current_points > 0 && (
            <View style={styles.section}>
              <View style={styles.loyaltyContainer}>
                <View style={styles.loyaltyIconContainer}>
                  <MaterialIcons name="stars" size={28} color={COLORS.white} />
                </View>
                <View style={styles.loyaltyInfo}>
                  <View style={styles.switchContainer}>
                    <View>
                      <Text style={styles.sectionTitle}>
                        Use Loyalty Points
                      </Text>
                      <Text style={styles.pointsText}>
                        You have {loyaltyPoints.current_points} points (KES{" "}
                        {loyaltyPoints.points_value})
                      </Text>
                    </View>
                    <Switch
                      value={useLoyaltyPoints}
                      onValueChange={setUseLoyaltyPoints}
                      trackColor={{
                        false: COLORS.lightGray,
                        true: COLORS.primary + "80",
                      }}
                      thumbColor={
                        useLoyaltyPoints ? COLORS.primary : COLORS.darkGray
                      }
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Submit Button */}
          <Button
            title={submitting ? "Placing Order..." : "Place Order"}
            onPress={handleSubmitOrder}
            loading={submitting}
            disabled={submitting || selectedItems.length === 0}
            containerStyle={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...FONTS.h4,
    color: COLORS.text,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
  },
  progressStep: {
    alignItems: "center",
  },
  progressDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.lightGray,
    marginBottom: 5,
  },
  activeProgressDot: {
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.primary + "30",
  },
  completedProgressDot: {
    backgroundColor: COLORS.success,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 5,
  },
  progressText: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
  },
  activeProgressText: {
    ...FONTS.body4,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.text,
    marginLeft: 8,
  },
  servicesContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  serviceInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  serviceTextContainer: {
    flex: 1,
  },
  serviceName: {
    ...FONTS.body2,
    color: COLORS.text,
    marginBottom: 4,
  },
  servicePrice: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray + "30",
    borderRadius: 20,
    padding: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    ...FONTS.body2,
    color: COLORS.text,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: "center",
  },
  summaryContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  summaryItemName: {
    ...FONTS.body3,
    color: COLORS.text,
  },
  summaryItemPrice: {
    ...FONTS.body3,
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  discountText: {
    ...FONTS.body3,
    color: COLORS.success,
  },
  discountPrice: {
    ...FONTS.body3,
    color: COLORS.success,
  },
  totalText: {
    ...FONTS.h4,
    color: COLORS.text,
  },
  totalPrice: {
    ...FONTS.h4,
    color: COLORS.primary,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  switchLabel: {
    ...FONTS.body3,
    color: COLORS.text,
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray + "20",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateTimeText: {
    ...FONTS.body2,
    color: COLORS.text,
    marginLeft: 10,
  },
  pointsText: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
    marginTop: -10,
    marginBottom: 10,
  },
  submitButton: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  errorText: {
    ...FONTS.body3,
    color: COLORS.error,
    marginBottom: 10,
  },
  specialInstructionsInput: {
    height: 100,
  },
  loyaltyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "10",
    borderRadius: 12,
    padding: 15,
  },
  loyaltyIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  loyaltyInfo: {
    flex: 1,
  },
  discountSection: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  discountInput: {
    flex: 1,
    marginRight: 10,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  applyButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
  },
  estimateButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 15,
    alignItems: "center",
  },
  estimateButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
  },
  estimatedContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 5,
  },
  estimatedTitle: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.darkGray,
  },
  estimatedAmount: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.medium,
    color: COLORS.primary,
    marginTop: 5,
  },
  estimatedBreakdown: {
    marginTop: 10,
  },
  breakdownTitle: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.darkGray,
  },
  breakdownItem: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.darkGray,
    marginTop: 3,
  },
});

export default PlaceOrderScreen;

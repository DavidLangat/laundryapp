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
import { servicesAPI, ordersAPI, userAPI } from "../../services/api";
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

  // Calculate discount from loyalty points
  const calculateDiscount = () => {
    if (useLoyaltyPoints && loyaltyPoints) {
      return loyaltyPoints.points_value;
    }
    return 0;
  };

  // Calculate final total
  const calculateFinalTotal = () => {
    const total = calculateTotal();
    const discount = calculateDiscount();
    return Math.max(0, total - discount);
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
        items: selectedItems.map((item) => ({
          service_id: item.service_id,
          item_name: item.item_name,
          quantity: item.quantity,
        })),
      };

      // Submit order
      const response = await ordersAPI.createOrder(token, orderData);

      if (response.status === "success") {
        Alert.alert(
          "Order Placed",
          "Your order has been placed successfully!",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Home"),
            },
          ]
        );
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
          {selectedItems.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons
                  name="receipt"
                  size={22}
                  color={COLORS.primary}
                />
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
                  <Text style={styles.totalPrice}>
                    KES {calculateFinalTotal()}
                  </Text>
                </View>
              </View>
            </View>
          )}

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
});

export default PlaceOrderScreen;

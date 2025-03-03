import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONTS, SIZES } from "../../constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { userAPI, servicesAPI, offersAPI } from "../../services/api";
import {
  MaterialIcons,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  Feather,
  AntDesign,
} from "@expo/vector-icons";

const QuickActionCard = ({ iconComponent, title, onPress, color, bgColor }) => {
  return (
    <TouchableOpacity
      style={[
        styles.quickActionCard,
        { backgroundColor: bgColor || COLORS.white },
      ]}
      onPress={onPress}
    >
      <View
        style={[styles.quickActionIconContainer, { backgroundColor: color }]}
      >
        {iconComponent}
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );
};

const ServiceCard = ({ service, onPress }) => {
  const getServiceIcon = () => {
    if (service.name.includes("Wash")) {
      return (
        <MaterialIcons
          name="local-laundry-service"
          size={30}
          color={COLORS.white}
        />
      );
    } else if (service.name.includes("Dry")) {
      return (
        <MaterialCommunityIcons
          name="tumble-dryer"
          size={30}
          color={COLORS.white}
        />
      );
    } else if (service.name.includes("Iron")) {
      return (
        <MaterialCommunityIcons name="iron" size={30} color={COLORS.white} />
      );
    } else if (service.name.includes("Bedding")) {
      return <FontAwesome5 name="bed" size={28} color={COLORS.white} />;
    } else if (service.name.includes("Shoe")) {
      return (
        <MaterialCommunityIcons
          name="shoe-formal"
          size={30}
          color={COLORS.white}
        />
      );
    } else if (service.name.includes("Express")) {
      return (
        <MaterialIcons name="delivery-dining" size={30} color={COLORS.white} />
      );
    } else {
      return <Ionicons name="shirt" size={30} color={COLORS.white} />;
    }
  };

  // Generate a color based on the service name
  const getServiceColor = () => {
    const colors = [
      COLORS.primary,
      "#6C63FF",
      COLORS.secondary,
      COLORS.tertiary,
      "#FF6B6B",
      "#4ECDC4",
    ];
    const hash = service.name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <TouchableOpacity style={styles.serviceCard} onPress={onPress}>
      <LinearGradient
        colors={[getServiceColor(), getServiceColor() + "99"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.serviceIconContainer}
      >
        {getServiceIcon()}
      </LinearGradient>
      <Text style={styles.serviceName}>{service.name}</Text>
      <Text style={styles.servicePrice}>KES {service.price_per_item}</Text>
    </TouchableOpacity>
  );
};

const OfferCard = ({ offer, onPress }) => {
  return (
    <TouchableOpacity style={styles.offerCard} onPress={onPress}>
      <LinearGradient
        colors={[COLORS.primary, "#6C63FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.offerGradient}
      >
        <View style={styles.offerContent}>
          <View>
            <Text style={styles.offerCode}>{offer.code}</Text>
            <Text style={styles.offerValue}>{offer.formatted_value}</Text>
            {offer.days_remaining && (
              <Text style={styles.offerExpiry}>
                Expires in {offer.days_remaining} days
              </Text>
            )}
          </View>
          <View style={styles.offerButton}>
            <Text style={styles.offerButtonText}>Use Now</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [services, setServices] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        // Handle no token case
        return;
      }

      const response = await userAPI.getProfile(token);
      if (response.status === "success") {
        setUserData(response.data.user);
      } else {
        Alert.alert("Error", "Failed to load profile data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to load profile data");
    }
  };

  const fetchServices = async () => {
    try {
      const response = await servicesAPI.getServices();
      if (response.status === "success") {
        setServices(response.data.services);
      } else {
        Alert.alert("Error", "Failed to load services");
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      Alert.alert("Error", "Failed to load services");
    }
  };

  const fetchOffers = async () => {
    try {
      const response = await offersAPI.getOffers();
      if (response.status === "success") {
        setOffers(response.data);
      } else {
        Alert.alert("Error", "Failed to load offers");
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
      Alert.alert("Error", "Failed to load offers");
    }
  };

  const fetchLoyaltyPoints = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        // Handle no token case
        return;
      }

      const response = await userAPI.getLoyaltyPoints(token);
      if (response.status === "success") {
        setLoyaltyPoints(response.data);
      } else {
        Alert.alert("Error", "Failed to load loyalty points");
      }
    } catch (error) {
      console.error("Error fetching loyalty points:", error);
      Alert.alert("Error", "Failed to load loyalty points");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserData(),
        fetchServices(),
        fetchOffers(),
        fetchLoyaltyPoints(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePlaceOrder = () => {
    // Navigate to place order screen
    navigation.navigate("PlaceOrder");
  };

  const handleTrackOrder = () => {
    // Navigate to track order screen
    // navigation.navigate('TrackOrder');
    Alert.alert("Coming Soon", "Track Order feature is coming soon!");
  };

  const handleViewOffers = () => {
    // Navigate to offers screen
    // navigation.navigate('Offers');
    Alert.alert("Coming Soon", "View Offers feature is coming soon!");
  };

  const handleServicePress = (service) => {
    // Navigate to service details screen
    // navigation.navigate('ServiceDetails', { service });
    Alert.alert("Service Selected", `You selected ${service.name}`);
  };

  const handleOfferPress = (offer) => {
    // Navigate to offer details screen
    // navigation.navigate('OfferDetails', { offer });
    Alert.alert("Offer Selected", `You selected ${offer.code}`);
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hello, {userData?.name || "User"}
            </Text>
            <Text style={styles.subGreeting}>Welcome to QuickWash</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle" size={40} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Loyalty Points Card - Inspired by Hobby app */}
        <View style={styles.loyaltyCardContainer}>
          <LinearGradient
            colors={[COLORS.primary, "#6C63FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loyaltyGradient}
          >
            <View style={styles.loyaltyContent}>
              <View>
                <Text style={styles.loyaltyTitle}>Your Points</Text>
                <Text style={styles.loyaltyPoints}>
                  {loyaltyPoints?.current_points || 0}
                </Text>
                <Text style={styles.loyaltyValue}>
                  Value: KES {loyaltyPoints?.points_value || 0}
                </Text>
              </View>
              <TouchableOpacity style={styles.loyaltyButton}>
                <Text style={styles.loyaltyButtonText}>Redeem</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <QuickActionCard
              iconComponent={
                <MaterialIcons
                  name="local-laundry-service"
                  size={24}
                  color="white"
                />
              }
              title="Place Order"
              onPress={handlePlaceOrder}
              color={COLORS.primary}
            />
            <QuickActionCard
              iconComponent={
                <MaterialIcons name="delivery-dining" size={24} color="white" />
              }
              title="Track Order"
              onPress={handleTrackOrder}
              color={COLORS.secondary}
            />
            <QuickActionCard
              iconComponent={
                <MaterialIcons name="local-offer" size={24} color="white" />
              }
              title="View Offers"
              onPress={handleViewOffers}
              color={COLORS.tertiary}
            />
          </View>
        </View>

        {/* Featured Offer */}
        {offers?.featured_offer && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Offer</Text>
              <TouchableOpacity onPress={handleViewOffers}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <OfferCard
              offer={offers.featured_offer}
              onPress={() => handleOfferPress(offers.featured_offer)}
            />
          </View>
        )}

        {/* Services */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Our Services</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={services}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <ServiceCard
                service={item}
                onPress={() => handleServicePress(item)}
              />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.servicesContainer}
          />
        </View>

        {/* Special Offers */}
        {offers?.special_offers && offers.special_offers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Special Offers</Text>
              <TouchableOpacity onPress={handleViewOffers}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {offers.special_offers.map((offer, index) => (
              <View key={index} style={styles.specialOfferCard}>
                <View
                  style={[
                    styles.specialOfferIconContainer,
                    {
                      backgroundColor:
                        index % 2 === 0
                          ? COLORS.primary + "20"
                          : COLORS.secondary + "20",
                    },
                  ]}
                >
                  {offer.type === "loyalty_multiplier" ? (
                    <MaterialCommunityIcons
                      name="star-circle"
                      size={30}
                      color={
                        index % 2 === 0 ? COLORS.primary : COLORS.secondary
                      }
                    />
                  ) : (
                    <Feather
                      name="gift"
                      size={30}
                      color={
                        index % 2 === 0 ? COLORS.primary : COLORS.secondary
                      }
                    />
                  )}
                </View>
                <View style={styles.specialOfferContent}>
                  <Text style={styles.specialOfferTitle}>{offer.title}</Text>
                  <Text style={styles.specialOfferDescription}>
                    {offer.description}
                  </Text>
                  {offer.valid_until && (
                    <Text style={styles.specialOfferExpiry}>
                      Valid until: {offer.valid_until}
                    </Text>
                  )}
                </View>
                <TouchableOpacity style={styles.arrowButton}>
                  <AntDesign
                    name="arrowright"
                    size={20}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  greeting: {
    ...FONTS.h3,
    color: COLORS.text,
    fontWeight: "700",
  },
  subGreeting: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.text,
    fontWeight: "700",
  },
  seeAllText: {
    ...FONTS.body3,
    color: COLORS.primary,
    fontWeight: "600",
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionCard: {
    width: "30%",
    height: 110,
    borderRadius: 16,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    // Shadow for Android
    elevation: 4,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  quickActionTitle: {
    ...FONTS.body3,
    color: COLORS.text,
    fontWeight: "600",
    textAlign: "center",
  },
  loyaltyCardContainer: {
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 16,
    overflow: "hidden",
    // Shadow for Android
    elevation: 5,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  loyaltyGradient: {
    padding: 20,
  },
  loyaltyContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loyaltyTitle: {
    ...FONTS.body3,
    color: COLORS.white,
    opacity: 0.8,
  },
  loyaltyPoints: {
    ...FONTS.h1,
    color: COLORS.white,
    fontWeight: "bold",
    marginVertical: 5,
  },
  loyaltyValue: {
    ...FONTS.body3,
    color: COLORS.white,
    opacity: 0.8,
  },
  loyaltyButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  loyaltyButtonText: {
    ...FONTS.body3,
    color: COLORS.white,
    fontWeight: "600",
  },
  servicesContainer: {
    paddingRight: 20,
    paddingBottom: 10,
  },
  serviceCard: {
    width: 130,
    height: 160,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 15,
    marginRight: 15,
    alignItems: "center",
    // Shadow for Android
    elevation: 3,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  serviceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  serviceName: {
    ...FONTS.body3,
    color: COLORS.text,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 5,
  },
  servicePrice: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
  },
  offerCard: {
    borderRadius: 16,
    overflow: "hidden",
    // Shadow for Android
    elevation: 4,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 10,
  },
  offerGradient: {
    padding: 20,
  },
  offerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  offerCode: {
    ...FONTS.body3,
    color: COLORS.white,
    fontWeight: "600",
  },
  offerValue: {
    ...FONTS.h3,
    color: COLORS.white,
    fontWeight: "bold",
    marginVertical: 5,
  },
  offerExpiry: {
    ...FONTS.body4,
    color: COLORS.white,
    opacity: 0.8,
  },
  offerButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
  },
  offerButtonText: {
    ...FONTS.body3,
    color: COLORS.white,
    fontWeight: "600",
  },
  specialOfferCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    // Shadow for Android
    elevation: 3,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  specialOfferIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  specialOfferContent: {
    flex: 1,
  },
  specialOfferTitle: {
    ...FONTS.body2,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: 5,
  },
  specialOfferDescription: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  specialOfferExpiry: {
    ...FONTS.body4,
    color: COLORS.textTertiary,
  },
  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default HomeScreen;

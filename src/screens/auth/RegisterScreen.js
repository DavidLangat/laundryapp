import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONTS, SIZES } from "../../constants";
import { Button, Input } from "../../components";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../../services/api";

const RegisterScreen = () => {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    let isValid = true;
    let errors = {};

    if (!name) {
      errors.name = "Name is required";
      isValid = false;
    }

    if (!email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid";
      isValid = false;
    }

    if (!phone) {
      errors.phone = "Phone number is required";
      isValid = false;
    } else if (!/^\d{10}$/.test(phone.replace(/[^0-9]/g, ""))) {
      errors.phone = "Phone number is invalid";
      isValid = false;
    }

    if (!password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(errors);
    return isValid;
  };

  const handleRegister = async () => {
    if (validate()) {
      setLoading(true);

      try {
        // Prepare user data for API
        const userData = {
          name,
          email,
          phone,
          password,
          confirm_password: confirmPassword,
        };

        // Call register API
        const response = await authAPI.register(userData);

        // Check if registration was successful based on the expected response format
        if (response.status === "success") {
          // Store user token if provided in the data object
          if (response.data && response.data.token) {
            await AsyncStorage.setItem("userToken", response.data.token);

            // Store user data
            await AsyncStorage.setItem(
              "userData",
              JSON.stringify(response.data)
            );
          }

          // Show success message
          Alert.alert(
            "Registration Successful",
            response.message || "Your account has been created successfully!",
            [
              {
                text: "OK",
                onPress: () => {
                  // Navigate to Login screen or Home screen based on API response
                  if (response.data && response.data.token) {
                    // If token is provided, user is automatically logged in
                    // Navigation will handle redirection to Home
                  } else {
                    // Otherwise navigate to Login
                    navigation.navigate("Login");
                  }
                },
              },
            ]
          );
        } else {
          // Show error message from API
          Alert.alert(
            "Registration Failed",
            response.message || "Something went wrong"
          );
        }
      } catch (error) {
        console.error("Registration error:", error);

        // Handle different types of errors
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          Alert.alert(
            "Registration Failed",
            error.response.data.message ||
              error.response.data.error ||
              "Server error"
          );
        } else if (error.request) {
          // The request was made but no response was received
          Alert.alert("Network Error", "Please check your internet connection");
        } else {
          // Something happened in setting up the request that triggered an Error
          Alert.alert("Error", "An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          <View style={styles.formContainer}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              error={errors.name}
            />

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Phone Number"
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              error={errors.phone}
            />

            <Input
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              error={errors.confirmPassword}
            />

            <Button
              title="Sign Up"
              onPress={handleRegister}
              loading={loading}
              containerStyle={styles.button}
            />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  formContainer: {
    width: "100%",
  },
  button: {
    marginTop: 10,
    marginBottom: 20,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  loginText: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
  },
  loginLink: {
    ...FONTS.body3,
    color: COLORS.primary,
    fontWeight: "600",
  },
});

export default RegisterScreen;

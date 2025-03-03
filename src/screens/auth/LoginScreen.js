import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONTS, SIZES } from "../../constants";
import images from "../../constants/images";
import { Button, Input } from "../../components";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../../services/api";

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    let isValid = true;
    let errors = {};

    if (!email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid";
      isValid = false;
    }

    if (!password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(errors);
    return isValid;
  };

  const handleLogin = async () => {
    if (validate()) {
      setLoading(true);

      try {
        // Prepare login credentials
        const credentials = {
          email,
          password,
        };

        // Call login API
        const response = await authAPI.login(credentials);

        // Check if login was successful based on the exact response format
        if (response.status === "success") {
          // Store user token from the data object
          if (response.data && response.data.token) {
            await AsyncStorage.setItem("userToken", response.data.token);

            // Store user data
            await AsyncStorage.setItem(
              "userData",
              JSON.stringify(response.data)
            );

            // Show success message
            Alert.alert("Success", response.message || "Login successful");

            // Navigation will handle redirection to Home
          } else {
            // If no token is provided but success is true (unusual case)
            Alert.alert(
              "Login Successful",
              response.message || "Welcome back!"
            );
          }
        } else {
          // Show error message from API
          Alert.alert(
            "Login Failed",
            response.message || "Invalid credentials"
          );
        }
      } catch (error) {
        console.error("Login error:", error);

        // Handle different types of errors
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          Alert.alert(
            "Login Failed",
            error.response.data.message || "Invalid credentials"
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
            <Image
              source={images.logo}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          <View style={styles.formContainer}>
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
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              containerStyle={styles.button}
            />

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.registerLink}>Sign Up</Text>
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
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    ...FONTS.body3,
    color: COLORS.primary,
  },
  button: {
    marginTop: 10,
    marginBottom: 20,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
  },
  registerLink: {
    ...FONTS.body3,
    color: COLORS.primary,
    fontWeight: "600",
  },
});

export default LoginScreen;

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
import { authAPI } from "../../services/api";

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = () => {
    if (!email) {
      setError("Email is required");
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Email is invalid");
      return false;
    }
    setError("");
    return true;
  };

  const handleResetPassword = async () => {
    if (validate()) {
      setLoading(true);

      try {
        // Call reset password API
        const response = await authAPI.resetPassword(email);

        // Check if request was successful based on the expected response format
        if (response.status === "success") {
          setIsSubmitted(true);

          // Show success message
          Alert.alert(
            "Reset Link Sent",
            response.message ||
              `We've sent a password reset link to ${email}. Please check your email.`,
            [{ text: "OK" }]
          );
        } else {
          // Show error message from API
          Alert.alert(
            "Reset Failed",
            response.message || "Something went wrong"
          );
        }
      } catch (error) {
        console.error("Reset password error:", error);

        // Handle different types of errors
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          Alert.alert(
            "Reset Failed",
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

  const handleBackToLogin = () => {
    navigation.navigate("Login");
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToLogin}
          >
            <Text style={styles.backButtonText}>← Back to Login</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your
              password
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={error}
              editable={!isSubmitted}
            />

            {isSubmitted ? (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>
                  Reset link sent! Check your email.
                </Text>
                <Button
                  title="Back to Login"
                  onPress={handleBackToLogin}
                  containerStyle={styles.button}
                />
                <TouchableOpacity
                  style={styles.resendContainer}
                  onPress={handleResetPassword}
                >
                  <Text style={styles.resendText}>
                    Didn't receive the email? Resend
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Button
                title="Reset Password"
                onPress={handleResetPassword}
                loading={loading}
                containerStyle={styles.button}
              />
            )}
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
  backButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  backButtonText: {
    ...FONTS.body3,
    color: COLORS.primary,
  },
  header: {
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
    marginTop: 20,
  },
  successContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  successText: {
    ...FONTS.body2,
    color: COLORS.success,
    marginBottom: 20,
  },
  resendContainer: {
    marginTop: 20,
  },
  resendText: {
    ...FONTS.body3,
    color: COLORS.primary,
    textAlign: "center",
  },
});

export default ForgotPasswordScreen;

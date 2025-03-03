import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import { COLORS, SIZES, FONTS } from "../constants";

const Button = ({
  title,
  onPress,
  containerStyle,
  textStyle,
  disabled = false,
  loading = false,
  variant = "filled", // filled, outlined, text
  leftIcon,
  rightIcon,
}) => {
  const getButtonStyles = () => {
    if (variant === "filled") {
      return {
        backgroundColor: disabled ? COLORS.darkGray : COLORS.primary,
        borderWidth: 0,
      };
    } else if (variant === "outlined") {
      return {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: disabled ? COLORS.darkGray : COLORS.primary,
      };
    } else if (variant === "text") {
      return {
        backgroundColor: "transparent",
        borderWidth: 0,
        paddingHorizontal: 0,
        height: "auto",
        paddingVertical: 4,
      };
    }
  };

  const getTextStyles = () => {
    if (variant === "filled") {
      return {
        color: COLORS.white,
      };
    } else if (variant === "outlined" || variant === "text") {
      return {
        color: disabled ? COLORS.darkGray : COLORS.primary,
      };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        getButtonStyles(),
        containerStyle,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "filled" ? COLORS.white : COLORS.primary}
        />
      ) : (
        <View style={styles.contentContainer}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text style={[styles.text, getTextStyles(), textStyle]}>{title}</Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SIZES.xlarge,
  },
  text: {
    ...FONTS.body1,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.7,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconLeft: {
    marginRight: SIZES.base,
  },
  iconRight: {
    marginLeft: SIZES.base,
  },
});

export default Button;

export const COLORS = {
  primary: "#4A43EC", // Main brand color
  secondary: "#FF9500", // Secondary color for accents
  tertiary: "#0DCDAA", // Tertiary color for highlights

  // Neutrals
  white: "#FFFFFF",
  black: "#000000",
  gray: "#F2F2F2",
  darkGray: "#9E9E9E",
  lightGray: "#F8F8F8",

  // Status colors
  success: "#4CD964",
  error: "#FF3B30",
  warning: "#FF9500",
  info: "#007AFF",

  // Background colors
  background: "#FFFFFF",
  card: "#F9F9F9",

  // Text colors
  text: "#1A1D1E",
  textSecondary: "#6A6A6A",
  textTertiary: "#A4A4A4",

  // Border colors
  border: "#E8E8E8",
};

export const SIZES = {
  // Global sizes
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  xlarge: 24,
  xxlarge: 32,

  // Font sizes
  h1: 30,
  h2: 24,
  h3: 20,
  h4: 18,
  h5: 16,
  body1: 16,
  body2: 14,
  body3: 12,
  body4: 10,

  // App dimensions
  width: "100%",
  height: "100%",
};

export const FONTS = {
  h1: { fontFamily: "System", fontSize: SIZES.h1, fontWeight: "700" },
  h2: { fontFamily: "System", fontSize: SIZES.h2, fontWeight: "700" },
  h3: { fontFamily: "System", fontSize: SIZES.h3, fontWeight: "700" },
  h4: { fontFamily: "System", fontSize: SIZES.h4, fontWeight: "600" },
  h5: { fontFamily: "System", fontSize: SIZES.h5, fontWeight: "600" },
  body1: { fontFamily: "System", fontSize: SIZES.body1, fontWeight: "400" },
  body2: { fontFamily: "System", fontSize: SIZES.body2, fontWeight: "400" },
  body3: { fontFamily: "System", fontSize: SIZES.body3, fontWeight: "400" },
  body4: { fontFamily: "System", fontSize: SIZES.body4, fontWeight: "400" },
};

const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;

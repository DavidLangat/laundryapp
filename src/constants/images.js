// We'll need to add actual image assets to the assets folder
// For now, we'll use placeholder images

// Define placeholder image
const placeholder = require("../../assets/icon.png");

// Define image exports with fallback to placeholder
const images = {
  onboarding1: placeholder,
  onboarding2: placeholder,
  onboarding3: placeholder,
  logo: placeholder,
  splashLogo: placeholder,
};

// Try to load actual images if they exist
try {
  // Try to load from assets/images folder first
  images.logo = require("../../assets/images/logo.png");

  // Try to load from assets folder
  images.splashLogo = require("../../assets/splash-icon.png");

  // For onboarding images, use placeholder if not found
  try {
    images.onboarding1 = require("../../assets/onboarding1.png");
  } catch (e) {
    console.log("onboarding1.png not found, using placeholder");
  }

  try {
    images.onboarding2 = require("../../assets/onboarding2.png");
  } catch (e) {
    console.log("onboarding2.png not found, using placeholder");
  }

  try {
    images.onboarding3 = require("../../assets/onboarding3.png");
  } catch (e) {
    console.log("onboarding3.png not found, using placeholder");
  }
} catch (error) {
  console.log(
    "Some image assets could not be loaded, using placeholders instead:",
    error.message
  );
}

export default images;

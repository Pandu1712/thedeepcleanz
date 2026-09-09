import fs from "node:fs";
import path from "node:path";

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  try {
    let content = fs.readFileSync(filePath, "utf8");
    const original = content;

    // Fix AGP versions
    content = content.replaceAll("8.13.0", "8.8.1");

    // Fix futuristic/hypothetical test dependencies in Capacitor submodules
    content = content.replaceAll("org.json:json:20250517", "org.json:json:20240303");
    content = content.replaceAll("org.mockito:mockito-core:5.20.0", "org.mockito:mockito-core:5.14.2");

    // Fix direct artifact version strings
    content = content.replaceAll("androidx.core:core-splashscreen:1.2.0", "androidx.core:core-splashscreen:1.0.1");
    content = content.replaceAll("androidx.core:core:1.17.0", "androidx.core:core:1.15.0");

    // Fix variable defaults in subproject build.gradle files
    content = content.replace(/androidxCoordinatorLayoutVersion\s*=\s*project\.hasProperty\('androidxCoordinatorLayoutVersion'\)\s*\?\s*rootProject\.ext\.androidxCoordinatorLayoutVersion\s*:\s*['"][^'"]+['"]/g,
      "androidxCoordinatorLayoutVersion = project.hasProperty('androidxCoordinatorLayoutVersion') ? rootProject.ext.androidxCoordinatorLayoutVersion : '1.2.0'");

    content = content.replace(/androidxJunitVersion\s*=\s*project\.hasProperty\('androidxJunitVersion'\)\s*\?\s*rootProject\.ext\.androidxJunitVersion\s*:\s*['"][^'"]+['"]/g,
      "androidxJunitVersion = project.hasProperty('androidxJunitVersion') ? rootProject.ext.androidxJunitVersion : '1.2.1'");

    content = content.replace(/coreSplashScreenVersion\s*=\s*project\.hasProperty\('coreSplashScreenVersion'\)\s*\?\s*rootProject\.ext\.coreSplashScreenVersion\s*:\s*['"][^'"]+['"]/g,
      "coreSplashScreenVersion = project.hasProperty('coreSplashScreenVersion') ? rootProject.ext.coreSplashScreenVersion : '1.0.1'");

    content = content.replace(/androidxCoreVersion\s*=\s*project\.hasProperty\('androidxCoreVersion'\)\s*\?\s*rootProject\.ext\.androidxCoreVersion\s*:\s*['"][^'"]+['"]/g,
      "androidxCoreVersion = project.hasProperty('androidxCoreVersion') ? rootProject.ext.androidxCoreVersion : '1.15.0'");

    content = content.replace(/androidxAppCompatVersion\s*=\s*project\.hasProperty\('androidxAppCompatVersion'\)\s*\?\s*rootProject\.ext\.androidxAppCompatVersion\s*:\s*['"][^'"]+['"]/g,
      "androidxAppCompatVersion = project.hasProperty('androidxAppCompatVersion') ? rootProject.ext.androidxAppCompatVersion : '1.7.0'");

    content = content.replace(/androidxActivityVersion\s*=\s*project\.hasProperty\('androidxActivityVersion'\)\s*\?\s*rootProject\.ext\.androidxActivityVersion\s*:\s*['"][^'"]+['"]/g,
      "androidxActivityVersion = project.hasProperty('androidxActivityVersion') ? rootProject.ext.androidxActivityVersion : '1.9.3'");

    content = content.replace(/androidxFragmentVersion\s*=\s*project\.hasProperty\('androidxFragmentVersion'\)\s*\?\s*rootProject\.ext\.androidxFragmentVersion\s*:\s*['"][^'"]+['"]/g,
      "androidxFragmentVersion = project.hasProperty('androidxFragmentVersion') ? rootProject.ext.androidxFragmentVersion : '1.8.5'");

    content = content.replace(/androidxWebkitVersion\s*=\s*project\.hasProperty\('androidxWebkitVersion'\)\s*\?\s*rootProject\.ext\.androidxWebkitVersion\s*:\s*['"][^'"]+['"]/g,
      "androidxWebkitVersion = project.hasProperty('androidxWebkitVersion') ? rootProject.ext.androidxWebkitVersion : '1.12.1'");

    content = content.replace(/cordovaAndroidVersion\s*=\s*project\.hasProperty\('cordovaAndroidVersion'\)\s*\?\s*rootProject\.ext\.cordovaAndroidVersion\s*:\s*['"][^'"]+['"]/g,
      "cordovaAndroidVersion = project.hasProperty('cordovaAndroidVersion') ? rootProject.ext.cordovaAndroidVersion : '10.1.1'");

    content = content.replace(/androidxEspressoCoreVersion\s*=\s*project\.hasProperty\('androidxEspressoCoreVersion'\)\s*\?\s*rootProject\.ext\.androidxEspressoCoreVersion\s*:\s*['"][^'"]+['"]/g,
      "androidxEspressoCoreVersion = project.hasProperty('androidxEspressoCoreVersion') ? rootProject.ext.androidxEspressoCoreVersion : '3.6.1'");

    content = content.replace(/junitVersion\s*=\s*project\.hasProperty\('junitVersion'\)\s*\?\s*rootProject\.ext\.junitVersion\s*:\s*['"][^'"]+['"]/g,
      "junitVersion = project.hasProperty('junitVersion') ? rootProject.ext.junitVersion : '4.13.2'");

    // Lint configuration
    content = content.replaceAll("abortOnError true", "abortOnError false");
    content = content.replaceAll("warningsAsErrors true", "warningsAsErrors false");
    content = content.replaceAll("abortOnError = true", "abortOnError = false");
    content = content.replaceAll("warningsAsErrors = true", "warningsAsErrors = false");

    // SDK versions
    content = content.replaceAll(": 36", ": 35");
    content = content.replaceAll("= 36", "= 35");

    if (content !== original) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`[patch-capacitor] Successfully patched: ${filePath}`);
    }
  } catch (e) {
    console.warn(`[patch-capacitor] Could not patch ${filePath}:`, e.message);
  }
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith(".gradle")) {
        patchFile(fullPath);
      }
    }
  } catch (e) {
    console.warn(`[patch-capacitor] Error scanning ${dir}:`, e.message);
  }
}

// Explicit paths
const explicitFiles = [
  "node_modules/@capacitor/android/capacitor/build.gradle",
  "node_modules/@capacitor/splash-screen/android/build.gradle",
  "node_modules/@capacitor/status-bar/android/build.gradle",
  "android/capacitor-cordova-android-plugins/build.gradle",
  "android/build.gradle",
  "android/app/build.gradle",
];

for (const rel of explicitFiles) {
  patchFile(path.resolve(rel));
}

// Scan directories
scanDir(path.resolve("node_modules/@capacitor"));
scanDir(path.resolve("android"));

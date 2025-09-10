#!/bin/bash

# Script to fix AdMob issues in Android app

echo "Fixing AdMob configuration..."

# Navigate to the project root
cd "$(dirname "$0")"/..

# Update capacitor
echo "Updating capacitor..."
npx cap update

# Sync with Android
echo "Syncing with Android..."
npx cap sync android

# Ensure proper permissions in AndroidManifest.xml
echo "Checking AndroidManifest.xml..."
if ! grep -q "com.google.android.gms.ads.APPLICATION_ID" android/app/src/main/AndroidManifest.xml; then
  echo "Adding AdMob Application ID to AndroidManifest.xml..."
  sed -i '/<application/ a \
        <meta-data\
            android:name="com.google.android.gms.ads.APPLICATION_ID"\
            android:value="ca-app-pub-2130614856218928~1343119067" />' android/app/src/main/AndroidManifest.xml
fi

# Ensure Google Services plugin is applied
echo "Checking build.gradle..."
if ! grep -q "com.google.gms.google-services" android/app/build.gradle; then
  echo "Adding Google Services plugin to build.gradle..."
  echo "" >> android/app/build.gradle
  echo "apply plugin: 'com.google.gms.google-services'" >> android/app/build.gradle
fi

echo "AdMob configuration fixed!"
echo "Please rebuild the Android app."
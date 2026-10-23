#!/bin/bash

# iOS Ringtone Setup Script
# Run this on a Mac to complete the iOS setup

echo "🎵 iOS Ringtone Setup for RentOnGo Vehicle App"
echo "=============================================="
echo ""

# Check if running on Mac
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script must be run on macOS"
    echo "💡 Please transfer this project to a Mac and run this script"
    exit 1
fi

echo "✅ Running on macOS"
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "💡 Please run this script from the project root directory"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo ""

# Step 1: Install CocoaPods dependencies
echo "Step 1: Installing CocoaPods dependencies..."
cd ios

if command -v pod &> /dev/null; then
    echo "✅ CocoaPods found"
    echo "📦 Running pod install..."
    pod install

    if [ $? -eq 0 ]; then
        echo "✅ Pod install completed successfully"
    else
        echo "❌ Pod install failed"
        exit 1
    fi
else
    echo "❌ CocoaPods not found"
    echo "💡 Install CocoaPods by running: sudo gem install cocoapods"
    exit 1
fi

cd ..
echo ""

# Step 2: Check if sound files exist
echo "Step 2: Checking sound files..."

if [ -f "ios/rentongovehicle/ringtone.mp3" ]; then
    echo "✅ Ringtone file found: ios/rentongovehicle/ringtone.mp3"
    FILE_SIZE=$(du -h "ios/rentongovehicle/ringtone.mp3" | cut -f1)
    echo "   File size: $FILE_SIZE"
else
    echo "❌ Ringtone file not found at ios/rentongovehicle/ringtone.mp3"
    exit 1
fi

if [ -f "ios/rentongovehicle/booking_notification.mp3" ]; then
    echo "✅ Booking notification found: ios/rentongovehicle/booking_notification.mp3"
    FILE_SIZE=$(du -h "ios/rentongovehicle/booking_notification.mp3" | cut -f1)
    echo "   File size: $FILE_SIZE"
else
    echo "❌ Booking notification not found at ios/rentongovehicle/booking_notification.mp3"
    exit 1
fi

if [ -f "ios/rentongovehicle/autocancel_notification.mp3" ]; then
    echo "✅ AutoCancel notification found: ios/rentongovehicle/autocancel_notification.mp3"
    FILE_SIZE=$(du -h "ios/rentongovehicle/autocancel_notification.mp3" | cut -f1)
    echo "   File size: $FILE_SIZE"
else
    echo "❌ AutoCancel notification not found at ios/rentongovehicle/autocancel_notification.mp3"
    exit 1
fi

if [ -f "ios/rentongovehicle/reject_notification.mp3" ]; then
    echo "✅ Reject notification found: ios/rentongovehicle/reject_notification.mp3"
    FILE_SIZE=$(du -h "ios/rentongovehicle/reject_notification.mp3" | cut -f1)
    echo "   File size: $FILE_SIZE"
else
    echo "❌ Reject notification not found at ios/rentongovehicle/reject_notification.mp3"
    exit 1
fi

echo ""

# Step 3: Open Xcode workspace
echo "Step 3: Opening Xcode workspace..."
if [ -f "ios/rentongovehicle.xcworkspace" ]; then
    echo "✅ Xcode workspace found"
    echo "🚀 Opening Xcode..."
    open ios/rentongovehicle.xcworkspace

    echo ""
    echo "================================================"
    echo "📋 NEXT STEPS IN XCODE:"
    echo "================================================"
    echo ""
    echo "1. In Xcode, find 'rentongovehicle' folder in left sidebar"
    echo "2. Right-click on 'rentongovehicle' folder"
    echo "3. Select 'Add Files to rentongovehicle...'"
    echo ""
    echo "4. Add ALL 4 sound files:"
    echo "   - Select: ios/rentongovehicle/ringtone.mp3"
    echo "   - Also select: ios/rentongovehicle/booking_notification.mp3"
    echo "   - Also select: ios/rentongovehicle/autocancel_notification.mp3"
    echo "   - Also select: ios/rentongovehicle/reject_notification.mp3"
    echo "   (Cmd+Click to select multiple files)"
    echo ""
    echo "5. Check ✅ 'Copy items if needed'"
    echo "6. Check ✅ 'Create groups'"
    echo "7. Select target: rentongovehicle"
    echo "8. Click 'Add'"
    echo ""
    echo "9. Verify in Build Phases:"
    echo "   - Click project name → Target → Build Phases"
    echo "   - Expand 'Copy Bundle Resources'"
    echo "   - Verify all 4 files are listed:"
    echo "     ✅ ringtone.mp3"
    echo "     ✅ booking_notification.mp3"
    echo "     ✅ autocancel_notification.mp3"
    echo "     ✅ reject_notification.mp3"
    echo ""
    echo "10. Build and run (⌘+R)"
    echo ""
    echo "================================================"

else
    echo "❌ Xcode workspace not found"
    echo "💡 Make sure pod install completed successfully"
    exit 1
fi

echo ""
echo "✅ Setup script completed!"
echo ""
echo "📝 For detailed instructions, see: IOS_RINGTONE_SETUP.md"
echo ""

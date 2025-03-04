# Mobile Application Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Dependencies](#dependencies)
4. [Module Modifications](#module-modifications)
5. [Configuration Files](#configuration-files)
6. [Key Features](#key-features)
7. [Build and Development](#build-and-development)

## Project Overview
A React Native mobile application with features including authentication, notifications, camera integration, and real-time chat functionality.

## Project Structure
```
- android/               # Android native code
- components/            # Reusable UI components
  - ui/                  # Base UI components
- config/                # Configuration files
- context/               # React Context providers
- docs/                  # Project documentation
- lib/                   # Library code and utilities
- screens/               # Application screens
- LoveConnectApp/        # Core application code
  - assets/              # Images and static assets
```

## Dependencies

### Core Dependencies
```json
- react: 18.3.1                      # React core library
- react-native: 0.76.7               # React Native framework
```

### Navigation
```json
- @react-navigation/bottom-tabs: ^6.6.1    # Bottom tab navigation
- @react-navigation/drawer: ^6.6.9         # Drawer navigation
- @react-navigation/native: ^6.1.18        # Navigation core
```

### UI and Components
```json
- react-native-calendars: ^1.1309.1        # Calendar component
- react-native-linear-gradient: ^2.8.3     # Gradient effects
- react-native-vector-icons: ^10.0.3       # Icon library
```

### Device Features
```json
- react-native-camera: ^4.2.1              # Camera functionality
- react-native-image-picker: ^7.1.0        # Image selection
```

### State Management and Storage
```json
- @react-native-async-storage/async-storage: 1.23.1  # Local storage
- @supabase/supabase-js: ^2.48.1                    # Backend integration
```

### Animation and Gestures
```json
- react-native-gesture-handler: ^2.24.0    # Gesture handling
- react-native-reanimated: ^3.16.7         # Advanced animations
```

### Development Dependencies
```json
- typescript: ^5.3.0                       # TypeScript support
- @babel/core: ^7.20.0                     # Babel compiler
- @react-native-community/cli: ^12.3.5     # React Native CLI
```

## Module Modifications

### react-native-notifications
Location: `node_modules/react-native-notifications/`

Custom TypeScript configuration changes were made to ensure compatibility:
```json
{
  "compilerOptions": {
    "module": "esnext",
    "target": "esnext",
    "lib": ["es2017", "dom"],
    "jsx": "react-native",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true
  }
}
```

## Configuration Files

### TypeScript Configuration (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "lib": ["es2017", "dom"],
    "jsx": "react-native",
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "*": ["*", "src/*", "LoveConnectApp/*"]
    }
  }
}
```

### Notification Configuration (config/notifications.ts)
- Implements platform-specific notification settings
- Configures notification channels for Android
- Sets up notification categories for iOS
- Handles foreground and background notification events

## Key Features

### Authentication (context/AuthContext.tsx)
- Implements user authentication flow
- Manages user session state
- Handles login, registration, and logout

### Screens
1. **HomeScreen**
   - Main dashboard interface
   - Displays user-specific content

2. **AuthScreen**
   - Handles user authentication
   - Login and registration forms

3. **CalendarScreen**
   - Calendar view and event management
   - Date selection and event tracking

4. **CameraScreen**
   - Camera integration
   - Photo capture and processing

5. **ChatScreen**
   - Real-time messaging interface
   - Message history and user interactions

6. **AmourScreen**
   - Custom feature implementation
   - Relationship-focused functionality

## Build and Development

### Scripts
```json
- start: "react-native start"     # Start Metro bundler
- android: "react-native run-android"  # Run on Android
- ios: "react-native run-ios"      # Run on iOS
```

### Development Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Apply module modifications:
   ```bash
   cd node_modules/react-native-notifications/
   # Apply tsconfig.json modifications
   ```

3. Start the Metro bundler:
   ```bash
   npm start
   ```

4. Run on desired platform:
   ```bash
   npm run android  # For Android
   npm run ios      # For iOS
   ```

### Important Notes
- Ensure all module modifications are reapplied after package installations
- Verify TypeScript configurations are correct before building
- Keep dependencies up to date for security and compatibility
- Follow the proper build process for each platform

Last Updated: 2024-03-21
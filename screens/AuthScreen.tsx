import { useState, useCallback } from "react"
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Text,
  ImageBackground,
  Image,
  Dimensions,
  ActivityIndicator,
  PermissionsAndroid,
} from "react-native"
import { supabase } from "../supabase"
import { theme } from "../theme"
import LinearGradient from 'react-native-linear-gradient'
import { launchCamera } from 'react-native-image-picker'
import { useAuth } from '../context/AuthContext';

type AuthScreenProps = {}

interface AuthError {
  message: string;
}

interface PermissionStatus {
  status: 'granted' | 'denied' | 'undetermined';
}

const { width, height } = Dimensions.get('window')

export function AuthScreen({}: AuthScreenProps): JSX.Element {
  const { setIsGuest, setIsAuthenticated } = useAuth();
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState<string>('')
  const [passwordError, setPasswordError] = useState<string>('')

  const validateForm = useCallback(() => {
    let isValid = true
    setEmailError('')
    setPasswordError('')

    if (!email) {
      setEmailError('Email is required')
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address')
      isValid = false
    }

    if (!password) {
      setPasswordError('Password is required')
      isValid = false
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      isValid = false
    }

    return isValid
  }, [email, password])
  const handleGuestLogin = () => {
    setIsGuest(true);
    setIsAuthenticated(true);
  };
  const requestPermissions = async (): Promise<void> => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'Camera access is required to take photos',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        }
      );
      
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permission needed', 'Camera access is required to take photos');
      }
    } catch (err) {
      console.warn('Error requesting camera permission:', err);
    }
  };

  const handleSignIn = async (): Promise<void> => {
    try {
      if (!validateForm()) return

      setIsLoading(true)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) {
        Alert.alert("Authentication Error", error.message)
        return
      }
      
      await requestPermissions()
    } catch (err) {
      const error = err as AuthError
      Alert.alert("Unexpected Error", error.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <ImageBackground
      source={require('../assets/love-background.jpg')}
      style={styles.container}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.9)', 'rgba(255,192,203,0.8)']}
        style={styles.overlay}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appTitle}>Love Connect</Text>
          <Text style={styles.tagline}>Stay connected with your loved one</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={[styles.input, emailError ? { borderColor: 'red' } : null]}
            placeholder="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text)
              setEmailError('')
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholderTextColor={theme.colors.text}
          />
          {emailError ? <Text style={{ color: 'red', marginBottom: theme.spacing.sm }}>{emailError}</Text> : null}
          
          <TextInput
            style={[styles.input, passwordError ? { borderColor: 'red' } : null]}
            placeholder="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text)
              setPasswordError('')
            }}
            secureTextEntry
            autoComplete="password"
            placeholderTextColor={theme.colors.text}
          />
          {passwordError ? <Text style={{ color: 'red', marginBottom: theme.spacing.sm }}>{passwordError}</Text> : null}

          <TouchableOpacity
            style={[styles.mainButton, isLoading ? { opacity: 0.5 } : null]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuestLogin}
          >
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.md,
  },
  appTitle: {
    fontSize: 32,
    fontFamily: theme.fonts.heading,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  tagline: {
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.fonts.regular,
    marginBottom: theme.spacing.xl,
  },
  formContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.large,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    height: 50,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
  },
  mainButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginVertical: theme.spacing.sm,
  },
  buttonText: {
    color: theme.colors.white,
    textAlign: "center",
    fontSize: 18,
    fontFamily: theme.fonts.bold,
  },
  guestButton: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
  },
  guestButtonText: {
    color: theme.colors.primary,
    textAlign: "center",
    fontSize: 16,
    fontFamily: theme.fonts.regular,
  }
})

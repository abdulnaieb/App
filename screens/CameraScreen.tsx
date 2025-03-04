import * as React from 'react';
import { useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Image, Alert, ScrollView } from 'react-native';
import { supabase } from "../supabase";
import { RNCamera } from 'react-native-camera';
import * as ImagePicker from 'react-native-image-picker';
// @ts-ignore
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';
import { PermissionsAndroid, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

const FILTERS = [
  { name: 'Normal', style: {} },
  { name: 'Grayscale', style: { filter: 'grayscale(1)' } },
  { name: 'Sepia', style: { filter: 'sepia(1)' } },
  { name: 'Warm', style: { filter: 'brightness(1.1) saturate(1.5)' } },
  { name: 'Cool', style: { filter: 'brightness(1.1) saturate(0.8)' } },
];

export function CameraScreen() {
  const { isGuest } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(RNCamera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(RNCamera.Constants.FlashMode.off);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<RNCamera | null>(null);
  React.useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Camera Permission',
              message: 'This app needs access to your camera',
              buttonPositive: 'OK',
              buttonNegative: 'Cancel',
            }
          );
          setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
        } catch (err) {
          console.warn('Error requesting camera permission:', err);
          setHasPermission(false);
        }
      } else {
        setHasPermission(true); // iOS handles permissions differently
      }
    })();
  }, []);
  const takePicture = async () => {
    if (isGuest) {
      Alert.alert('Guest Mode', 'Please sign in to take pictures.');
      return;
    }
    if (!cameraRef.current || isProcessing) return;
    setIsProcessing(true);
    try {
      const options = { quality: 1, base64: true };
      const data = await cameraRef.current.takePictureAsync(options);
      setCapturedImage(data.uri);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    } finally {
      setIsProcessing(false);
    }
  };
  const pickImage = async () => {
    if (isGuest) {
      Alert.alert('Guest Mode', 'Please sign in to upload images.');
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await ImagePicker.launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
        includeBase64: true,
      });
      if (!result.didCancel && result.assets?.[0]?.uri) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    } finally {
      setIsProcessing(false);
    }
  };
  const uploadImage = async (uri: string) => {
    if (isGuest) {
      Alert.alert('Guest Mode', 'Please sign in to upload images.');
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `${new Date().getTime()}.jpg`;
      const { data, error } = await supabase.storage
        .from("photos")
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600'
        });
      if (error) throw error;
      
      const { data: publicData } = await supabase.storage
        .from("photos")
        .getPublicUrl(data.path);
      const publicUrl = publicData.publicUrl;
      
      await supabase.from("photos").insert({ url: publicUrl });
      Alert.alert("Success", "Photo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert(
        'Upload Error',
        'Unable to upload photo. Please check your internet connection and try again.',
        [{ text: 'Retry', onPress: () => uploadImage(uri) }, { text: 'Cancel', style: 'cancel' }],
        { cancelable: true }
      );
    } finally {
      setIsProcessing(false);
    }
  };
  const toggleFlash = () => {
    setFlashMode(
      flashMode === RNCamera.Constants.FlashMode.off
        ? RNCamera.Constants.FlashMode.on
        : RNCamera.Constants.FlashMode.off
    );
  };
  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }
  return (
    <View style={styles.container}>
      {!capturedImage ? (
        <View style={[styles.container, isGuest && { opacity: 0.7 }]}>
          <RNCamera
            style={styles.camera}
            type={type}
            ref={cameraRef}
            flashMode={flashMode}
            androidCameraPermissionOptions={{
              title: 'Permission to use camera',
              message: 'We need your permission to use your camera',
              buttonPositive: 'Ok',
              buttonNegative: 'Cancel',
            }}
          >
            <View style={styles.topControls}>
              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={toggleFlash}
                disabled={isGuest}
              >
                <Ionicons
                  name={flashMode === RNCamera.Constants.FlashMode.on ? "flash" : "flash-off"}
                  size={25}
                  color="white"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.circleButton, isGuest && { opacity: 0.5 }]}
                onPress={pickImage}
                disabled={isGuest}
              >
                <Ionicons name="images-outline" size={30} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.captureButton, isGuest && { opacity: 0.5 }]}
                onPress={takePicture}
                disabled={isGuest}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.circleButton, isGuest && { opacity: 0.5 }]}
                onPress={() => setType(
                  type === RNCamera.Constants.Type.back
                    ? RNCamera.Constants.Type.front
                    : RNCamera.Constants.Type.back
                )}
                disabled={isGuest}
              >
                <Ionicons name="camera-reverse-outline" size={30} color="white" />
              </TouchableOpacity>
            </View>
          </RNCamera>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: capturedImage }}
            style={[styles.preview]}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.circleButton]}
              onPress={() => setCapturedImage(null)}
              disabled={isProcessing}
            >
              <Ionicons
                name="close-circle"
                size={30}
                color="white"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.circleButton, isGuest && { opacity: 0.5 }]}
              onPress={() => capturedImage && uploadImage(capturedImage)}
              disabled={isGuest || isProcessing}
            >
              <Ionicons
                name="send"
                size={30}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
  },
  controlButton: {
    padding: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
  },
  disabled: {
    opacity: 0.5,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  preview: {
    flex: 1,
  },
  filtersContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
  },
  filterButton: {
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  selectedFilter: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    color: 'white',
    fontSize: 14,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 18,
  },
  text: {
    color: 'white',
    fontSize: 16,
  },
});

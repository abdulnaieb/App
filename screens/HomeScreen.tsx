"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, Image, ActivityIndicator, RefreshControl, ScrollView } from "react-native"
import { supabase } from "../supabase"
import { useAuth } from '../context/AuthContext';

interface Photo {
  url: string;
  created_at: string;
}

export function HomeScreen() {
  const { isGuest } = useAuth();
  const [latestPhoto, setLatestPhoto] = useState(null)

  useEffect(() => {
    if (!isGuest) {
      fetchLatestPhoto()
    }
  }, [isGuest])

  const fetchLatestPhoto = async () => {
    try {
      const { data, error } = await supabase
        .from("photos")
        .select("url")
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) {
        throw error
      }

      if (data && data.length > 0) {
        setLatestPhoto(data[0].url)
      } else {
        setLatestPhoto(null)
      }
    } catch (error) {
      console.error("Error fetching latest photo:", error)
      setLatestPhoto(null)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello Lovely 🖤</Text>
      {!isGuest && latestPhoto && <Image source={{ uri: latestPhoto }} style={styles.photo} />}
      {isGuest && (
        <Text style={styles.guestMessage}>Sign in to view shared photos</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFF0F5", // Light pink background
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#FF69B4",
    fontFamily: "serif",
    letterSpacing: 2,
    textShadowColor: "rgba(255, 105, 180, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    textTransform: "capitalize",
  },
  photo: {
    width: 300,
    height: 300,
    borderRadius: 15,
    marginTop: 20,
  },
  guestMessage: {
    fontSize: 16,
    color: "#666",
    marginTop: 20,
    fontStyle: "italic"
  }
})


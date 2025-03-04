"use client"

import { Alert, Image, ActivityIndicator } from "react-native"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { supabase } from "../supabase"
// @ts-ignore
import Ionicons from "react-native-vector-icons/Ionicons"
import { launchImageLibrary } from "react-native-image-picker"
import { Notifications } from 'react-native-notifications'

const notificationService = Notifications.registerRemoteNotifications()

import { useAuth } from '../context/AuthContext';

export function ChatScreen() {
  const { isGuest } = useAuth();
  const [messages, setMessages] = useState<Array<{
    id: number;
    text: string;
    sender: string;
    created_at: string;
    is_image?: boolean;
  }>>([]);
  const [inputText, setInputText] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const flatListRef = useRef<FlatList | null>(null);

  useEffect(() => {
    async function initializeChat() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!session) {
          console.error("No active session")
          return
        }
        setUserId(session.user.id)
        // Request notification permissions using the Notifications API directly
        await Notifications.registerRemoteNotifications()
        await fetchMessages()
      } catch (error) {
        console.error("Error initializing chat:", error)
        Alert.alert("Error", "Failed to initialize chat. Please try again.")
      }
    }

    initializeChat()
    const subscription = supabase
      .channel("messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
        setMessages((currentMessages) => [...currentMessages, payload.new as { id: number; text: string; sender: string; created_at: string; is_image?: boolean }])
        if (userId && payload.new.sender !== userId) {
          Notifications.postLocalNotification({
            title: "New Message",
            body: payload.new.is_image ? "Sent you an image" : payload.new.text,
            sound: "default",
            identifier: "",
            payload: undefined,
            badge: 0,
            type: "",
            thread: ""
          });
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: true })

      if (error) throw error
      setMessages(data)
    } catch (error) {
      console.error("Error fetching messages:", error)
      Alert.alert("Error", "Failed to load messages. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (isGuest) {
      Alert.alert('Guest Mode', 'Please sign in to send messages.');
      return;
    }
    if (inputText.trim() === "" || !userId) return;

    const messageText = inputText.trim()
    setInputText("")

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("messages")
        .insert({ text: messageText, sender: userId })
        .select()

      if (error) throw error

      setMessages((currentMessages) => [...currentMessages, data[0]])
      Notifications.postLocalNotification({
        title: "Message Sent",
        body: messageText,
        sound: "default",
        identifier: "",
        payload: undefined,
        badge: 0,
        type: "",
        thread: ""
      })
    } catch (error) {
      console.error("Error sending message:", error)
      Alert.alert("Error", "Failed to send message")
      setInputText(messageText) // Restore the message text if sending failed
    } finally {
      setIsLoading(false)
    }
  }

  const uploadImage = async (uri: string) => {
    if (isGuest) {
      Alert.alert('Guest Mode', 'Please sign in to share images.');
      return;
    }
    if (!userId) return;

    try {
      setIsLoading(true)
      const response = await fetch(uri)
      const blob = await response.blob()
      const fileName = `${new Date().getTime()}_${userId}.jpg`
      const { data, error } = await supabase.storage.from("photos").upload(fileName, blob)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(data.path)
      if (error) throw error

      await supabase.from("messages").insert({ text: publicUrl, sender: userId, is_image: true })
    } catch (error) {
      console.error("Error uploading image:", error)
      Alert.alert("Error", "Failed to upload photo", [
        { text: "Retry", onPress: () => uploadImage(uri) },
        { text: "Cancel", style: "cancel" }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const pickImage = async () => {
    if (isLoading) return;
    
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
      });

      if (!result.didCancel && result.assets?.[0]?.uri) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  }

  const renderMessage = ({ item }: { item: { id: number; text: string; sender: string; created_at: string; is_image?: boolean } }) => (
    <View style={[styles.messageBubble, item.sender === userId ? styles.myMessage : styles.partnerMessage]}>
      {item.is_image ? (
        <Image source={{ uri: item.text }} style={styles.messageImage} />
      ) : (
        <Text style={styles.messageText}>{item.text}</Text>
      )}
      <Text style={styles.messageTime}>
        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  )

  if (isLoading && messages.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FF69B4" />
      </View>
    )
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={[styles.inputContainer, isGuest && { opacity: 0.5 }]}>
        <TouchableOpacity 
          style={styles.uploadButton} 
          onPress={pickImage}
          disabled={isGuest}
        >
          <Ionicons name="add" size={24} color="#FF69B4" />
        </TouchableOpacity>
        <TextInput 
          style={styles.input} 
          value={inputText} 
          onChangeText={setInputText} 
          placeholder={isGuest ? "Sign in to send messages" : "Type a message..."}
          editable={!isGuest}
        />
        <TouchableOpacity 
          style={[styles.sendButton, isGuest && { opacity: 0.5 }]} 
          onPress={sendMessage}
          disabled={isGuest}
        >
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF0F5",
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    flex: 1,
    padding: 10,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 20,
    marginBottom: 10,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
  },
  partnerMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
  },
  messageText: {
    fontSize: 16,
    color: "#000",
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#FF69B4",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  uploadButton: {
    padding: 10,
  },
  sendButton: {
    backgroundColor: "#FF69B4",
    padding: 10,
    borderRadius: 20,
  },
  messageTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
})


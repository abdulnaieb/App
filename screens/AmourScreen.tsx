"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal, TextInput, Animated } from "react-native"
import { supabase } from "../supabase"
import { Calendar } from "react-native-calendars"
import { schedulePushNotification } from "../notificationHelper"
import { theme } from "../theme"
import AntDesign from 'react-native-vector-icons/AntDesign';
// Add type declaration for react-native-vector-icons
declare module 'react-native-vector-icons/AntDesign' {
  export type IconProps = import('react-native-vector-icons/Icon').IconProps;
  export interface AntDesignProps extends IconProps {}
  const AntDesign: React.ComponentType<AntDesignProps>;
  // Remove duplicate export since AntDesign is already imported above
}
import { useAuth } from '../context/AuthContext';

export function AmourScreen() {
  const { isGuest } = useAuth();
  const [myMissYouCount, setMyMissYouCount] = useState(0)
  const [partnerMissYouCount, setPartnerMissYouCount] = useState(0)
  const [myMood, setMyMood] = useState("🖤")
  const [partnerMood, setPartnerMood] = useState("🖤")
  interface CalendarEvent {
    id: number;
    title: string;
    description: string;
    start_date: string;
    user_id: string;
  }

  interface EventsByDate {
    [date: string]: CalendarEvent[];
  }

  const [events, setEvents] = useState<EventsByDate>({})
  const [selectedDate, setSelectedDate] = useState("")
  const [modalVisible, setModalVisible] = useState(false)
  const [eventTitle, setEventTitle] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [myHeartScale] = useState(new Animated.Value(1))
  const [partnerHeartScale] = useState(new Animated.Value(1))

  useEffect(() => {
    fetchMissYouCounts()
    fetchMoods()
    fetchEvents()
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0)
    const timeUntilMidnight = midnight.getTime() - Date.now()
    const timer = setTimeout(() => resetMissYouCount(), timeUntilMidnight)
    return () => clearTimeout(timer)
  }, [])

  const fetchMissYouCounts = async () => {
    if (isGuest) return;
    const { data: myData, error: myError } = await supabase
      .from("miss_you_counts")
      .select("count")
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id || '')
      .single()

    if (myError) {
      console.error("Error fetching my miss you count:", myError)
    } else if (myData) {
      setMyMissYouCount(myData.count)
    }

    const { data: partnerData, error: partnerError } = await supabase
      .from("miss_you_counts")
      .select("count")
      .neq("user_id", (await supabase.auth.getUser()).data.user?.id || '')
      .single()

    if (partnerError) {
      console.error("Error fetching partner miss you count:", partnerError)
    } else if (partnerData) {
      setPartnerMissYouCount(partnerData.count)
    }
  }

  const resetMissYouCount = async () => {
    const { error } = await supabase.from("miss_you_counts").update({ count: 0 }).eq("id", 1)

    if (error) {
      console.error("Error resetting miss you count:", error)
    } else {
      setMyMissYouCount(0)
    }
  }

  const fetchMoods = async () => {
    if (isGuest) return;
    const { data: myMoodData, error: myMoodError } = await supabase
      .from("moods")
      .select("mood")
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id || '')
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (myMoodError) {
      console.error("Error fetching my mood:", myMoodError)
    } else if (myMoodData) {
      setMyMood(myMoodData.mood)
    }

    const { data: partnerMoodData, error: partnerMoodError } = await supabase
      .from("moods")
      .select("mood")
      .neq("user_id", (await supabase.auth.getUser()).data.user?.id || '')
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (partnerMoodError) {
      console.error("Error fetching partner mood:", partnerMoodError)
    } else if (partnerMoodData) {
      setPartnerMood(partnerMoodData.mood)
    }
  }

  const fetchEvents = async () => {
    if (isGuest) return;
    const { data, error } = await supabase.from("calendar_events").select("*")

    if (error) {
      console.error("Error fetching events:", error)
    } else {
      const formattedEvents: EventsByDate = {}
      data.forEach((event: CalendarEvent) => {
        const date = event.start_date.split("T")[0]
        if (!formattedEvents[date]) {
          formattedEvents[date] = []
        }
        formattedEvents[date].push(event)
      })
      setEvents(formattedEvents)
    }
  }

  const animateHeart = (scale: Animated.Value) => {
    'worklet';
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.3,
        friction: 3,
        useNativeDriver: true
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true
      })
    ]).start();
  };
  const handleMyMissYouPress = async () => {
    if (isGuest) {
      Alert.alert('Guest Mode', 'Please sign in to use the Miss You feature.');
      return;
    }
    const newCount = myMissYouCount + 1
    setMyMissYouCount(newCount)
    animateHeart(myHeartScale)

    const { error } = await supabase
      .from("miss_you_counts")
      .upsert({ count: newCount, user_id: (await supabase.auth.getUser()).data.user?.id || '' })

    if (error) {
      console.error("Error updating miss you count:", error)
      Alert.alert("Error", "Failed to update miss you count")
    } else {
      await schedulePushNotification("Miss You", "Your partner is missing you!")
    }
  }

  const updateMood = async (mood: string) => {
    if (isGuest) {
      Alert.alert('Guest Mode', 'Please sign in to update your mood.');
      return;
    }
    const user = await supabase.auth.getUser();
    if (!user.data.user?.id) {
      Alert.alert("Error", "User not found");
      return;
    }

    const { error } = await supabase.from("moods").insert({
      mood: mood,
      user_id: user.data.user.id
    });

    if (error) {
      console.error("Error updating mood:", error);
      Alert.alert("Error", "Failed to update mood");
    } else {
      setMyMood(mood);
      Alert.alert("Success", "Mood updated successfully");
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Miss You Timer</Text>
        <View style={styles.heartsContainer}>
          <TouchableOpacity 
            onPress={handleMyMissYouPress}
            disabled={isGuest}
            style={[styles.heartContainer, isGuest && { opacity: 0.5 }]}
          >
            <Animated.View style={[styles.heartContainer, { transform: [{ scale: myHeartScale }] }]}>
              <AntDesign name="heart" size={60} color={theme.colors.primary} />
              <Text style={styles.heartCount}>{myMissYouCount}</Text>
            </Animated.View>
            <Text style={styles.heartLabel}>Mine</Text>
          </TouchableOpacity>
          
          <View style={styles.heartDivider} />
          
          <View>
            <Animated.View style={[styles.heartContainer, { transform: [{ scale: partnerHeartScale }] }]}>
              <AntDesign name="heart" size={60} color={theme.colors.secondary} />
              <Text style={styles.heartCount}>{partnerMissYouCount}</Text>
            </Animated.View>
            <Text style={styles.heartLabel}>Partner's</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mood</Text>
        <View style={styles.moodContainer}>
          <TouchableOpacity 
            style={[styles.moodSide, isGuest && { opacity: 0.5 }]} 
            onPress={() => {
              if (isGuest) {
                Alert.alert('Guest Mode', 'Please sign in to update your mood.');
                return;
              }
              Alert.prompt(
                "Update Mood",
                "Enter an emoji to update your mood",
                [{
                  text: "Cancel",
                  style: "cancel"
                },
                {
                  text: "OK",
                  onPress: async (emoji) => {
                    if (emoji && emoji.trim()) {
                      const trimmedEmoji = emoji.trim();
                      setMyMood(trimmedEmoji);
                      await updateMood(trimmedEmoji);
                    }
                  }
                }],
                "plain-text",
                "",
                "emoji"
              );
            }}
            disabled={isGuest}
          >
            <Text style={styles.currentEmoji}>{myMood || "❤️"}</Text>
            <Text style={styles.moodLabel}>My Mood</Text>
          </TouchableOpacity>
          
          <View style={styles.moodSide}>
            <Text style={styles.currentEmoji}>{partnerMood || "❤️"}</Text>
            <Text style={styles.moodLabel}>Partner's Mood</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Calendar</Text>
        <Calendar
          onDayPress={(day: { dateString: string }) => {
            if (isGuest) {
              Alert.alert('Guest Mode', 'Please sign in to add events.');
              return;
            }
            setSelectedDate(day.dateString);
            setModalVisible(true);
          }}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: theme.colors.primary },
            ...Object.keys(events).reduce((acc: EventsByDate, date) => {
              acc[date] = { marked: true, dotColor: theme.colors.primary } as any;
              return acc
            }, {} as EventsByDate),
          }}
        />
        {!isGuest && selectedDate && events[selectedDate] && (
          <View style={styles.eventList}>
            <Text style={styles.eventListTitle}>Events for {selectedDate}:</Text>
            {events[selectedDate].map((event: CalendarEvent, index: number) => (
              <View key={index} style={styles.eventItem}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDescription}>{event.description}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Add Event for {selectedDate}</Text>
          <TextInput
            style={styles.input}
            placeholder="Event Title"
            value={eventTitle}
            onChangeText={setEventTitle}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Event Description"
            value={eventDescription}
            onChangeText={setEventDescription}
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity
            style={[styles.button, styles.addButton]}
            onPress={async () => {
              if (eventTitle.trim()) {
                const { error } = await supabase.from("calendar_events").insert({
                  title: eventTitle,
                  description: eventDescription,
                  start_date: selectedDate,
                  user_id: (await supabase.auth.getUser()).data.user?.id || ''
                });

                if (error) {
                  Alert.alert("Error", "Failed to add event");
                } else {
                  fetchEvents();
                  setModalVisible(false);
                  setEventTitle("");
                  setEventDescription("");
                }
              } else {
                Alert.alert("Error", "Please enter an event title");
              }
            }}
          >
            <Text style={styles.buttonText}>Add Event</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              setModalVisible(false);
              setEventTitle("");
              setEventDescription("");
            }}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  modalView: {
    margin: 20,
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginTop: 100
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: theme.colors.primary
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15
  },
  textArea: {
    height: 100,
    textAlignVertical: "top"
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    marginBottom: 10
  },
  cancelButton: {
    backgroundColor: theme.colors.secondary
  },
  heartsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
  },
  heartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 35,
    padding: 15,
    // Note: backdropFilter is not supported in React Native
    // Consider using a blur view component instead
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    transform: [
      { perspective: 1000 },
      { rotateX: '25deg' },
    ],
  },
  heartCount: {
    position: 'absolute',
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  heartLabel: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  heartDivider: {
    width: 2,
    height: 100,
    backgroundColor: theme.colors.secondary,
    marginHorizontal: 20,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 10,
  },
  count: {
    fontSize: 72,
    fontWeight: "bold",
    color: theme.colors.primary,
    textAlign: "center",
  },
  label: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: "center",
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: '120%',
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  moodSide: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderRadius: 35,
    padding: 20,
    paddingLeft: 20,
    width: 200,
    height: 150,
    marginHorizontal: 10,
  },
  moodLabel: {
    marginTop: 15,
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'left',
    width: '100%',
    paddingLeft: -26,
  },
  currentEmoji: {
    fontSize: 64,
    textAlign: 'left',
    marginBottom: 5,
    paddingLeft: 9
  },
  moodDivider: {
    width: 2,
    height: 100,
    backgroundColor: theme.colors.secondary,
    marginHorizontal: 10,
  },
  eventList: {
    marginTop: 20,
  },
  eventListTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  eventItem: {
    backgroundColor: theme.colors.white,
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  eventDescription: {
    fontSize: 14,
  },
})


"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Modal, TextInput, Alert } from "react-native"
import { Calendar } from "react-native-calendars"
import { supabase } from "../supabase"
import { useAuth } from '../context/AuthContext';

export function CalendarScreen() {
  const { isGuest } = useAuth();
  const [events, setEvents] = useState({})
  const [selectedDate, setSelectedDate] = useState("")
  const [modalVisible, setModalVisible] = useState(false)
  const [eventTitle, setEventTitle] = useState("")
  const [eventDescription, setEventDescription] = useState("")

  useEffect(() => {
    if (!isGuest) {
      fetchEvents()
    }
  }, [isGuest])

  const fetchEvents = async () => {
    const { data, error } = await supabase.from("calendar_events").select("*")

    if (error) {
      console.error("Error fetching events:", error)
    } else {
      const formattedEvents: { [key: string]: any[] } = {}
      data.forEach((event) => {
        const date = event.start_date.split("T")[0]
        if (!formattedEvents[date]) {
          formattedEvents[date] = []
        }
        formattedEvents[date].push(event)
      })
      setEvents(formattedEvents)
    }
  }

  const addEvent = async () => {
    if (isGuest) {
      Alert.alert('Guest Mode', 'Please sign in to add events.');
      return;
    }

    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date first')
      return
    }

    if (!eventTitle.trim()) {
      Alert.alert('Error', 'Please enter an event title')
      return
    }

    try {
      const { error } = await supabase.from("calendar_events").insert({
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        start_date: selectedDate,
        end_date: selectedDate,
        user_id: (await supabase.auth.getUser()).data.user?.id ?? ''
      })

      if (error) throw error

      await fetchEvents()
      setModalVisible(false)
      setEventTitle("")
      setEventDescription("")
      Alert.alert('Success', 'Event added successfully')
    } catch (error) {
      console.error("Error adding event:", error)
      Alert.alert('Error', 'Failed to add event. Please try again.')
    }
  }

  const renderEvent = ({ item }: { item: { title: string; description: string; id: number } }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDescription}>{item.description}</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: "#FF69B4" },
          ...(!isGuest ? Object.keys(events).reduce((acc, date) => {
            (acc as any)[date] = { marked: true, dotColor: "#FF69B4" }
            return acc
          }, {}) : {}),
        }}
      />
      {!isGuest && (
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>Add Event</Text>
        </TouchableOpacity>
      )}
      {isGuest && (
        <Text style={styles.guestMessage}>Sign in to view and add events</Text>
      )}
      {!isGuest && selectedDate && (events as { [key: string]: any[] })[selectedDate] && (
        <FlatList
          data={(events as { [key: string]: any[] })[selectedDate] || []}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id.toString()}
          style={styles.eventList}
        />
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <TextInput style={styles.input} placeholder="Event Title" value={eventTitle} onChangeText={setEventTitle} />
          <TextInput
            style={styles.input}
            placeholder="Event Description"
            value={eventDescription}
            onChangeText={setEventDescription}
            multiline
          />
          <TouchableOpacity style={styles.addButton} onPress={addEvent}>
            <Text style={styles.addButtonText}>Add Event</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF0F5",
  },
  addButton: {
    backgroundColor: "#FF69B4",
    padding: 10,
    margin: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  eventList: {
    marginTop: 10,
  },
  eventItem: {
    backgroundColor: "white",
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 5,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  eventDescription: {
    fontSize: 14,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  input: {
    height: 40,
    width: "100%",
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  cancelButton: {
    backgroundColor: "#ccc",
    padding: 10,
    margin: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "black",
    fontSize: 16,
  },
  guestMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic"
  }
})


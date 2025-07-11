import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Button, SafeAreaView, Alert, ActivityIndicator, Platform } from 'react-native';
// Note: startOfDay and endOfDay are removed from this import
import { getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useTheme } from './global.js';
import { firebaseApp } from './global.js';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function MedicationsScreen() {
  const { colors } = useTheme();
  const [medications, setMedications] = useState([]);
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const [takenToday, setTakenToday] = useState([]);
  
  const auth = getAuth(firebaseApp);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const db = getFirestore(firebaseApp);
    
    // Listener for medications
    const medsQuery = query(collection(db, "medications"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsubscribeMeds = onSnapshot(medsQuery, (snapshot) => {
        const medsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMedications(medsData);
        setIsLoading(false);
    });

    // --- THIS IS THE CORRECTED LOGIC ---
    // Listener for today's medication log
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // Set to the beginning of the day

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999); // Set to the end of the day

    const logQuery = query(
        collection(db, "medication_log"), 
        where("userId", "==", user.uid),
        where("takenAt", ">=", todayStart),
        where("takenAt", "<=", todayEnd)
    );
    const unsubscribeLogs = onSnapshot(logQuery, (snapshot) => {
        const takenMeds = snapshot.docs.map(doc => doc.data().medicationId);
        setTakenToday(takenMeds);
    });

    return () => {
        unsubscribeMeds();
        unsubscribeLogs();
    };
  }, [user]);

  const handleAddMedication = async () => {
    if (medName.trim() === '' || dosage.trim() === '') {
      Alert.alert('Error', 'Please fill out both fields.');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'You must be logged in.');
      return;
    }
    try {
      const db = getFirestore(firebaseApp);
      await addDoc(collection(db, "medications"), {
        userId: user.uid,
        name: medName,
        dosage: dosage,
        createdAt: serverTimestamp(),
      });
      setMedName('');
      setDosage('');
    } catch (e) {
      console.error("Error adding medication: ", e);
      Alert.alert('Error', 'Could not save medication.');
    }
  };
  
  const handleSetReminderPress = (medication) => {
    if (Platform.OS === 'web') {
      alert('Reminders can only be set on the mobile app.');
      return;
    }
    setSelectedMed(medication);
    setShowTimePicker(true);
  };

   const onTimeChange = async (event, selectedDate) => {
    setShowTimePicker(false);
    if (event.type === 'set' && selectedDate && selectedMed) {
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Medication Reminder! 💊",
          body: `It's time to take your ${selectedMed.name}.`,
          sound: 'alarm.wav', // --- ADD THIS LINE ---
        },
        trigger: {
          hour: hour,
          minute: minute,
          repeats: true,
        },
      });
      Alert.alert('Reminder Set', `You will be reminded daily at ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}.`);
    }
  };

  const handleMarkAsTaken = async (medication) => {
    if (!user) return;
    try {
        const db = getFirestore(firebaseApp);
        await addDoc(collection(db, "medication_log"), {
            userId: user.uid,
            medicationId: medication.id,
            medicationName: medication.name,
            takenAt: serverTimestamp(),
        });
        Alert.alert('Logged!', `${medication.name} has been logged as taken.`);
    } catch (error) {
        console.error("Error logging medication: ", error);
        Alert.alert('Error', 'Could not log medication.');
    }
  };
  
  const renderItem = ({ item }) => {
    const isTaken = takenToday.includes(item.id);
    return (
        <View style={[styles.itemContainer, { backgroundColor: colors.card }]}>
        <View style={styles.medInfo}>
            <Text style={[styles.itemTitle, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.itemSubtitle, { color: colors.text }]}>{item.dosage}</Text>
        </View>
        <View style={styles.buttonGroup}>
            <Button title={isTaken ? "Logged ✔" : "Taken"} onPress={() => handleMarkAsTaken(item)} color={isTaken ? "gray" : "#5cb85c"} disabled={isTaken} />
            <View style={{height: 5}} />
            <Button title="Set Reminder" onPress={() => handleSetReminderPress(item)} color={colors.primary} />
        </View>
        </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>My Medications</Text>
      
      <View style={styles.inputContainer}>
        <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} placeholder="Medication Name (e.g., Lisinopril)" placeholderTextColor="gray" value={medName} onChangeText={setMedName}/>
        <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} placeholder="Dosage (e.g., 10mg, once daily)" placeholderTextColor="gray" value={dosage} onChangeText={setDosage} />
        <Button title="Add Medication" onPress={handleAddMedication} color={colors.primary} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={medications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={<Text style={{ color: colors.text, textAlign: 'center' }}>No medications added yet.</Text>}
          style={{marginTop: 20}}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
            value={new Date()}
            mode={'time'}
            is24Hour={true}
            display="default"
            onChange={onTimeChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    inputContainer: {
        backgroundColor: '#2D3748',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    itemContainer: {
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    medInfo: {
        flex: 1,
        marginRight: 10,
    },
    itemTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    itemSubtitle: {
        fontSize: 14,
        marginTop: 5,
    },
    buttonGroup: {
    },
});
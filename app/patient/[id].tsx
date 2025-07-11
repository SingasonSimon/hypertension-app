import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../global.js';
import { firebaseApp } from '../global.js';
import { FontAwesome5 } from '@expo/vector-icons';

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [readings, setReadings] = useState([]);
  const [recommendation, setRecommendation] = useState('');
  const [isListLoading, setIsListLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (id) {
      const db = getFirestore(firebaseApp);
      
      const patientDocRef = doc(db, "users", id);
      getDoc(patientDocRef).then(docSnap => {
        if (docSnap.exists()) {
          navigation.setOptions({ title: docSnap.data().email });
        }
      });
      
      const readingsQuery = query(
        collection(db, "readings"),
        where("userId", "==", id),
        orderBy("createdAt", "desc")
      );
      const unsubscribe = onSnapshot(readingsQuery, (querySnapshot) => {
        const readingsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setReadings(readingsData);
        setIsListLoading(false);
      });

      return () => unsubscribe();
    }
  }, [id]);

  const handleSendRecommendation = async () => {
    if (recommendation.trim() === '' || isSending) return;
    setIsSending(true);
    try {
      const db = getFirestore(firebaseApp);
      await addDoc(collection(db, "recommendations"), {
        patientId: id,
        text: recommendation,
        createdAt: serverTimestamp(),
        doctorName: "Dr. Name"
      });
      setRecommendation(''); // Clear the input box
      Alert.alert('Success', 'Recommendation sent!'); // --- THIS IS THE FIX ---
    } catch (error) {
      console.error("Error sending recommendation: ", error);
      Alert.alert('Error', 'Failed to send recommendation.');
    } finally {
      setIsSending(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.itemContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.itemText, { color: colors.text }]}>
        Systolic: {item.systolic}, Diastolic: {item.diastolic}
      </Text>
      <Text style={styles.dateText}>
        {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleString() : 'No date'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={100}
      >
        {isListLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={readings}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            ListEmptyComponent={<View style={styles.centered}><Text style={{ color: colors.text }}>No readings found.</Text></View>}
            contentContainerStyle={{padding: 10}}
          />
        )}
        
        <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="Write a recommendation..."
            placeholderTextColor="gray"
            multiline
            value={recommendation}
            onChangeText={setRecommendation}
          />
          <Pressable onPress={handleSendRecommendation} style={[styles.sendButton, {backgroundColor: colors.primary}]}>
            {isSending ? (
              <ActivityIndicator size="small" color={colors.primaryText} />
            ) : (
              <FontAwesome5 name="paper-plane" size={20} color={colors.primaryText} solid />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardAvoidingContainer: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContainer: {
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        marginHorizontal: 10,
    },
    itemText: {
        fontSize: 16,
        fontWeight: '500',
    },
    dateText: {
        fontSize: 12,
        color: 'gray',
        marginTop: 5,
    },
    inputContainer: {
        padding: 10,
        borderTopWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A202C' // To match dark theme
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 14,
        marginRight: 10,
        fontSize: 16,
    },
    sendButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
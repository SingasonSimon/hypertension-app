import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router'; // Import Stack
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useTheme } from './global.js';
import { firebaseApp } from './global.js';
import StyledButton from './components/StyledButton';

export default function HealthGoalsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const auth = getAuth(firebaseApp);
  const user = auth.currentUser;

  const [targetSystolic, setTargetSystolic] = useState('');
  const [targetDiastolic, setTargetDiastolic] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing goals when the screen loads
  useEffect(() => {
    if (!user) return;
    const db = getFirestore(firebaseApp);
    const goalsDocRef = doc(db, "health_goals", user.uid);

    getDoc(goalsDocRef).then((docSnap) => {
      if (docSnap.exists()) {
        const goalsData = docSnap.data();
        // Ensure we're setting strings back to the input fields
        setTargetSystolic(goalsData.systolic?.toString() || '');
        setTargetDiastolic(goalsData.diastolic?.toString() || '');
        setTargetWeight(goalsData.weight?.toString() || '');
      }
      setIsLoading(false);
    });
  }, [user]);

  const handleSaveGoals = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const db = getFirestore(firebaseApp);
      const goalsDocRef = doc(db, "health_goals", user.uid);
      // --- THE FIX: Convert inputs to numbers before saving ---
      await setDoc(goalsDocRef, {
        systolic: parseInt(targetSystolic) || null,
        diastolic: parseInt(targetDiastolic) || null,
        weight: parseFloat(targetWeight) || null,
      }, { merge: true });
      
      Alert.alert("Success", "Your health goals have been saved!");
      router.back();
    } catch (error) {
      console.error("Error saving goals: ", error);
      Alert.alert("Error", "Could not save your goals.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
      return <ActivityIndicator size="large" color={colors.primary} style={{flex: 1, backgroundColor: colors.background}}/>
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'My Health Goals' }} />
      <Text style={[styles.title, { color: colors.text }]}>Set Your Health Goals</Text>
      <Text style={[styles.subtitle, { color: 'gray' }]}>Set targets to work towards with your doctor's guidance.</Text>
      
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="Target Systolic (e.g., 120)"
        placeholderTextColor="gray"
        keyboardType="number-pad"
        value={targetSystolic}
        onChangeText={setTargetSystolic}
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="Target Diastolic (e.g., 80)"
        placeholderTextColor="gray"
        keyboardType="number-pad"
        value={targetDiastolic}
        onChangeText={setTargetDiastolic}
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="Target Weight in kg"
        placeholderTextColor="gray"
        keyboardType="numeric"
        value={targetWeight}
        onChangeText={setTargetWeight}
      />

      <StyledButton title="Save Goals" onPress={handleSaveGoals} color={colors.primary} textColor={colors.primaryText} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
      textAlign: 'center',
      marginBottom: 30,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
});
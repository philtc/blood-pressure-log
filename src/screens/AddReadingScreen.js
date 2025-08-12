import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Button, TextInput, Text, useTheme, Portal, Modal, ActivityIndicator } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDatabase } from '../context/DatabaseContext';
import { format } from 'date-fns';

const AddReadingScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { addReading } = useDatabase();
  
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('general');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // If we're editing an existing reading, load its data
  useEffect(() => {
    if (route.params?.reading) {
      const reading = route.params.reading;
      setSystolic(reading.systolic.toString());
      setDiastolic(reading.diastolic.toString());
      setPulse(reading.pulse ? reading.pulse.toString() : '');
      setNotes(reading.notes || '');
      setCategory(reading.category || 'general');
      
      // Parse the stored date and time
      const readingDate = new Date(`${reading.date}T${reading.time}`);
      setDate(readingDate);
      setTime(readingDate);
    }
  }, [route.params?.reading]);

  const validate = () => {
    const newErrors = {};
    
    if (!systolic || isNaN(systolic) || systolic < 50 || systolic > 250) {
      newErrors.systolic = 'Please enter a valid systolic value (50-250)';
    }
    
    if (!diastolic || isNaN(diastolic) || diastolic < 30 || diastolic > 150) {
      newErrors.diastolic = 'Please enter a valid diastolic value (30-150)';
    }
    
    if (pulse && (isNaN(pulse) || pulse < 30 || pulse > 200)) {
      newErrors.pulse = 'Please enter a valid pulse value (30-200)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      const readingData = {
        systolic: parseInt(systolic, 10),
        diastolic: parseInt(diastolic, 10),
        pulse: pulse ? parseInt(pulse, 10) : null,
        notes: notes.trim() || null,
        category: category === 'general' ? null : category,
        date: format(date, 'yyyy-MM-dd'),
        time: format(time, 'HH:mm'),
      };
      
      const success = await addReading(readingData);
      
      if (success) {
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to save reading. Please try again.');
      }
    } catch (error) {
      console.error('Error saving reading:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = () => {
    if (!systolic || !diastolic) return theme.colors.primary;
    
    const sys = parseInt(systolic, 10);
    const dia = parseInt(diastolic, 10);
    
    if (sys >= 140 || dia >= 90) return '#f44336'; // Red
    if (sys >= 130 || dia >= 80) return '#ff9800'; // Orange
    if (sys >= 120) return '#4caf50'; // Green
    return '#2196f3'; // Blue
  };

  const statusColor = getStatusColor();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.readingContainer}>
          <View style={styles.readingInputs}>
            <View style={styles.readingInputContainer}>
              <Text style={styles.inputLabel}>Systolic (Top #)</Text>
              <TextInput
                mode="outlined"
                style={[styles.readingInput, errors.systolic && styles.inputError]}
                keyboardType="numeric"
                value={systolic}
                onChangeText={setSystolic}
                maxLength={3}
                placeholder="120"
              />
              {errors.systolic && (
                <Text style={styles.errorText}>{errors.systolic}</Text>
              )}
            </View>
            
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: statusColor }]} />
            </View>
            
            <View style={styles.readingInputContainer}>
              <Text style={styles.inputLabel}>Diastolic (Bottom #)</Text>
              <TextInput
                mode="outlined"
                style={[styles.readingInput, errors.diastolic && styles.inputError]}
                keyboardType="numeric"
                value={diastolic}
                onChangeText={setDiastolic}
                maxLength={3}
                placeholder="80"
              />
              {errors.diastolic && (
                <Text style={styles.errorText}>{errors.diastolic}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.pulseContainer}>
            <Text style={styles.inputLabel}>Pulse (Optional)</Text>
            <TextInput
              mode="outlined"
              style={[styles.pulseInput, errors.pulse && styles.inputError]}
              keyboardType="numeric"
              value={pulse}
              onChangeText={setPulse}
              maxLength={3}
              placeholder="70"
            />
            {errors.pulse && (
              <Text style={styles.errorText}>{errors.pulse}</Text>
            )}
          </View>
          
          <View style={styles.datetimeContainer}>
            <View style={styles.datetimeInput}>
              <Text style={styles.inputLabel}>Date</Text>
              <Button 
                mode="outlined" 
                onPress={() => setShowDatePicker(true)}
                style={styles.datetimeButton}
              >
                {format(date, 'MMM d, yyyy')}
              </Button>
            </View>
            
            <View style={styles.datetimeInput}>
              <Text style={styles.inputLabel}>Time</Text>
              <Button 
                mode="outlined" 
                onPress={() => setShowTimePicker(true)}
                style={styles.datetimeButton}
              >
                {format(time, 'h:mm a')}
              </Button>
            </View>
          </View>
          
          <View style={styles.categoryContainer}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={[styles.pickerContainer, { borderColor: theme.colors.outline }]}>
              <Picker
                selectedValue={category}
                onValueChange={(itemValue) => setCategory(itemValue)}
                mode="dropdown"
                dropdownIconColor={theme.colors.onSurface}
              >
                <Picker.Item label="General" value="general" />
                <Picker.Item label="Morning" value="morning" />
                <Picker.Item label="Evening" value="evening" />
                <Picker.Item label="Before Medication" value="before_meds" />
                <Picker.Item label="After Medication" value="after_meds" />
                <Picker.Item label="After Exercise" value="after_exercise" />
                <Picker.Item label="Before Sleep" value="before_sleep" />
              </Picker>
            </View>
          </View>
          
          <View style={styles.notesContainer}>
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              mode="outlined"
              style={styles.notesInput}
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about this reading..."
            />
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          onPress={handleSubmit}
          style={styles.saveButton}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Reading'}
        </Button>
      </View>
      
      {/* Date Picker Modal */}
      <Portal>
        <Modal
          visible={showDatePicker}
          onDismiss={() => setShowDatePicker(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <DateTimePicker
              value={date}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
            <Button onPress={() => setShowDatePicker(false)}>Done</Button>
          </View>
        </Modal>
        
        {/* Time Picker Modal */}
        <Modal
          visible={showTimePicker}
          onDismiss={() => setShowTimePicker(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <DateTimePicker
              value={time}
              mode="time"
              display="spinner"
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) {
                  setTime(selectedTime);
                }
              }}
            />
            <Button onPress={() => setShowTimePicker(false)}>Done</Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100, // Space for the button
  },
  readingContainer: {
    marginBottom: 20,
  },
  readingInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  readingInputContainer: {
    flex: 1,
  },
  readingInput: {
    textAlign: 'center',
    fontSize: 24,
    height: 70,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  dividerContainer: {
    justifyContent: 'center',
    paddingHorizontal: 10,
    height: 70,
  },
  divider: {
    width: 30,
    height: 4,
    borderRadius: 2,
  },
  pulseContainer: {
    marginBottom: 20,
  },
  pulseInput: {
    textAlign: 'center',
  },
  datetimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  datetimeInput: {
    flex: 1,
    marginRight: 10,
  },
  datetimeButton: {
    marginTop: 8,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 4,
    marginTop: 8,
  },
  notesContainer: {
    marginBottom: 20,
  },
  notesInput: {
    minHeight: 100,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  saveButton: {
    borderRadius: 8,
  },
  modalContainer: {
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: 'rgba(0, 0, 0, 0.6)',
  },
});

export default AddReadingScreen;

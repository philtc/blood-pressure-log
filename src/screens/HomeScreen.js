import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Animated } from 'react-native';
import { Text, Card, Button, useTheme, FAB, ActivityIndicator, Badge } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { useDatabase } from '../context/DatabaseContext';

const AnimatedFAB = Animated.createAnimatedComponent(FAB);

const HomeScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { readings, isLoading, error, deleteReading, refreshReadings } = useDatabase();
  const [refreshing, setRefreshing] = useState(false);
  const [fabVisible, setFabVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshReadings();
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refreshReadings]);
  
  // Handle scroll events for FAB visibility
  const handleScroll = (event) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const isScrollingDown = currentOffset > 0;
    
    if (isScrollingDown && fabVisible) {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setFabVisible(false));
    } else if (!isScrollingDown && !fabVisible) {
      // Fade in
      setFabVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };
  
  const formatDate = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };
  
  const formatTime = (dateString) => {
    return format(parseISO(dateString), 'h:mm a');
  };
  
  const getStatusText = (systolic, diastolic) => {
    if (systolic >= 140 || diastolic >= 90) return 'High';
    if (systolic <= 90 || diastolic <= 60) return 'Low';
    return 'Normal';
  };
  
  const getStatusColor = (systolic, diastolic) => {
    if (systolic >= 140 || diastolic >= 90) return theme.colors.error;
    if (systolic <= 90 || diastolic <= 60) return theme.colors.info;
    return theme.colors.success;
  };

  const getReadingStatus = (systolic, diastolic) => {
    if (systolic >= 140 || diastolic >= 90) return { status: 'High', color: '#f44336' };
    if (systolic >= 130 || diastolic >= 80) return { status: 'Elevated', color: '#ff9800' };
    if (systolic >= 120) return { status: 'Normal', color: '#4caf50' };
    return { status: 'Optimal', color: '#2196f3' };
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Reading',
      'Are you sure you want to delete this reading?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReading(id);
            } catch (error) {
              console.error('Error deleting reading:', error);
              Alert.alert('Error', 'Failed to delete reading. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }) => {
    const statusColor = getStatusColor(item.systolic, item.diastolic);
    const statusBgColor = `${statusColor}20`;
    
    return (
      <Card 
        style={[
          styles.card, 
          { 
            backgroundColor: theme.colors.surface,
            elevation: 2,
            borderRadius: theme.roundness,
            marginBottom: 12,
            overflow: 'hidden',
          }
        ]}
      >
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.dateTimeContainer}>
              <Text style={[styles.date, { color: theme.colors.text }]}>{formatDate(item.date)}</Text>
              <Text style={[styles.time, { color: theme.colors.textSecondary }]}>{formatTime(item.date)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusText(item.systolic, item.diastolic)}
              </Text>
            </View>
          </View>
          
          <View style={styles.readingContainer}>
            <View style={styles.readingColumn}>
              <Text style={[styles.readingLabel, { color: theme.colors.textSecondary }]}>SYS</Text>
              <Text style={[styles.readingValue, { color: theme.colors.text }]}>{item.systolic}</Text>
              <Text style={[styles.readingUnit, { color: theme.colors.textSecondary }]}>mmHg</Text>
            </View>
            
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            
            <View style={styles.readingColumn}>
              <Text style={[styles.readingLabel, { color: theme.colors.textSecondary }]}>DIA</Text>
              <Text style={[styles.readingValue, { color: theme.colors.text }]}>{item.diastolic}</Text>
              <Text style={[styles.readingUnit, { color: theme.colors.textSecondary }]}>mmHg</Text>
            </View>
            
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            
            <View style={styles.readingColumn}>
              <Text style={[styles.readingLabel, { color: theme.colors.textSecondary }]}>PULSE</Text>
              <Text style={[
                styles.readingValue, 
                { 
                  color: item.pulse ? theme.colors.text : theme.colors.disabled,
                  opacity: item.pulse ? 1 : 0.7
                }
              ]}>
                {item.pulse || '--'}
              </Text>
              <Text style={[styles.readingUnit, { color: theme.colors.textSecondary }]}>bpm</Text>
            </View>
          </View>
          
          {item.notes && (
            <View style={styles.notesContainer}>
              <Text 
                style={[styles.notesText, { color: theme.colors.textSecondary }]} 
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.notes}
              </Text>
            </View>
          )}
          
          {item.category && item.category !== 'general' && (
            <View style={styles.categoryContainer}>
              <Badge style={[styles.categoryBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text style={[styles.categoryText, { color: theme.colors.primary }]}>
                  {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </Text>
              </Badge>
            </View>
          )}
        </Card.Content>
        
        <Card.Actions style={[styles.cardActions, { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
          <Button 
            mode="text" 
            onPress={() => navigation.navigate('AddReading', { reading: item })}
            labelStyle={{ color: theme.colors.primary, marginRight: 8 }}
            icon="pencil"
            compact
          >
            Edit
          </Button>
          <Button 
            mode="text" 
            onPress={() => handleDelete(item.id)}
            labelStyle={{ color: theme.colors.error }}
            icon="delete"
            compact
          >
            Delete
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  // Main render
  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          <Button
            mode="contained"
            onPress={refreshReadings}
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            labelStyle={{ color: 'white' }}
          >
            Retry
          </Button>
        </View>
      ) : readings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: theme.colors.text, marginBottom: 8 }]}>
            Welcome to Blood Pressure Log
          </Text>
          <Text
            style={[
              styles.emptyText,
              { color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 24 },
            ]}
          >
            Track your blood pressure readings over time to monitor your health.
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('AddReading')}
            style={[styles.addFirstButton, { backgroundColor: theme.colors.primary }]}
            labelStyle={{ color: 'white' }}
            icon="plus"
          >
            Add Your First Reading
          </Button>
        </View>
      ) : (
        <FlatList
          data={readings}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
              progressBackgroundColor={theme.colors.surface}
            />
          }
        />
      )}
      
      {readings.length > 0 && (
        <AnimatedFAB
          style={[
            styles.fab,
            {
              backgroundColor: theme.colors.primary,
              opacity: fadeAnim,
              transform: [{ scale: fadeAnim }],
            },
          ]}
          icon="plus"
          color="white"
          onPress={() => navigation.navigate('AddReading')}
          visible={fabVisible}
          animateFrom="right"
          iconMode="static"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 12,
    borderRadius: 8,
    paddingHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.8,
  },
  addFirstButton: {
    marginTop: 8,
    borderRadius: 8,
    paddingHorizontal: 24,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  statusIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardContent: {
    padding: 16,
    paddingBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    alignItems: 'center',
  },
  dateTimeContainer: {
    flex: 1,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  time: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  readingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  readingColumn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  readingLabel: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '500',
    opacity: 0.8,
    letterSpacing: 0.5,
  },
  readingValue: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 2,
    fontVariant: ['tabular-nums'],
  },
  readingUnit: {
    fontSize: 11,
    opacity: 0.7,
    letterSpacing: 0.3,
  },
  divider: {
    width: 1,
    height: '60%',
    opacity: 0.2,
    alignSelf: 'center',
  },
  notesContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  categoryContainer: {
    marginTop: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 4,
    minHeight: 52,
  },
  fab: {
    position: 'absolute',
    margin: 24,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default HomeScreen;

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, useTheme, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { format, subDays, startOfDay, isAfter, isBefore, isSameDay } from 'date-fns';
import { useDatabase } from '../context/DatabaseContext';

const screenWidth = Dimensions.get('window').width;

const timeRanges = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: '3months', label: '3 Months' },
  { value: 'year', label: 'Year' },
];

const TrendsScreen = () => {
  const theme = useTheme();
  const { readings, isLoading } = useDatabase();
  const [timeRange, setTimeRange] = useState('week');
  const [filteredReadings, setFilteredReadings] = useState([]);
  const [averages, setAverages] = useState({ systolic: 0, diastolic: 0, pulse: 0 });

  // Filter readings based on selected time range
  useEffect(() => {
    if (!readings || readings.length === 0) return;

    const now = new Date();
    let startDate;

    switch (timeRange) {
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subDays(now, 30);
        break;
      case '3months':
        startDate = subDays(now, 90);
        break;
      case 'year':
        startDate = subDays(now, 365);
        break;
      default:
        startDate = subDays(now, 7);
    }

    // Filter readings within the selected time range
    const filtered = readings.filter(reading => {
      const readingDate = new Date(`${reading.date}T${reading.time}`);
      return isAfter(readingDate, startDate) && isBefore(readingDate, now);
    });

    setFilteredReadings(filtered);

    // Calculate averages
    if (filtered.length > 0) {
      const sum = filtered.reduce(
        (acc, curr) => ({
          systolic: acc.systolic + (parseInt(curr.systolic, 10) || 0),
          diastolic: acc.diastolic + (parseInt(curr.diastolic, 10) || 0),
          pulse: acc.pulse + (parseInt(curr.pulse, 10) || 0),
          count: acc.count + 1,
        }),
        { systolic: 0, diastolic: 0, pulse: 0, count: 0 }
      );

      setAverages({
        systolic: Math.round(sum.systolic / sum.count),
        diastolic: Math.round(sum.diastolic / sum.count),
        pulse: Math.round(sum.pulse / sum.count),
      });
    } else {
      setAverages({ systolic: 0, diastolic: 0, pulse: 0 });
    }
  }, [readings, timeRange]);

  // Prepare data for the chart
  const prepareChartData = () => {
    if (filteredReadings.length === 0) {
      return {
        labels: [],
        datasets: [
          { data: [], color: () => theme.colors.primary },
          { data: [], color: () => theme.colors.secondary },
          { data: [], color: () => theme.colors.tertiary },
        ],
      };
    }

    // Sort readings by date
    const sortedReadings = [...filteredReadings].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA - dateB;
    });

    // Group readings by day for better visualization
    const groupedByDay = {};
    sortedReadings.forEach(reading => {
      const date = reading.date; // YYYY-MM-DD
      if (!groupedByDay[date]) {
        groupedByDay[date] = [];
      }
      groupedByDay[date].push(reading);
    });

    // Calculate daily averages
    const dates = Object.keys(groupedByDay).sort();
    const systolicData = [];
    const diastolicData = [];
    const pulseData = [];

    dates.forEach(date => {
      const dayReadings = groupedByDay[date];
      const sum = dayReadings.reduce(
        (acc, curr) => ({
          systolic: acc.systolic + (parseInt(curr.systolic, 10) || 0),
          diastolic: acc.diastolic + (parseInt(curr.diastolic, 10) || 0),
          pulse: acc.pulse + (parseInt(curr.pulse, 10) || 0),
          count: acc.count + 1,
        }),
        { systolic: 0, diastolic: 0, pulse: 0, count: 0 }
      );

      systolicData.push(Math.round(sum.systolic / sum.count));
      diastolicData.push(Math.round(sum.diastolic / sum.count));
      pulseData.push(Math.round(sum.pulse / sum.count));
    });

    // Format dates for display
    const formattedDates = dates.map(date => {
      const [year, month, day] = date.split('-');
      return format(new Date(year, month - 1, day), 'MMM d');
    });

    return {
      labels: formattedDates,
      datasets: [
        {
          data: systolicData,
          color: () => '#f44336', // Red for systolic
          strokeWidth: 2,
        },
        {
          data: diastolicData,
          color: () => '#2196f3', // Blue for diastolic
          strokeWidth: 2,
        },
        {
          data: pulseData,
          color: () => '#4caf50', // Green for pulse
          strokeWidth: 2,
        },
      ],
    };
  };

  const chartData = prepareChartData();

  const getStatusColor = (value, type) => {
    if (type === 'systolic') {
      if (value >= 140) return '#f44336'; // Red
      if (value >= 130) return '#ff9800'; // Orange
      if (value >= 120) return '#4caf50'; // Green
      return '#2196f3'; // Blue
    } else if (type === 'diastolic') {
      if (value >= 90) return '#f44336'; // Red
      if (value >= 80) return '#ff9800'; // Orange
      if (value >= 80) return '#4caf50'; // Green
      return '#2196f3'; // Blue
    }
    return theme.colors.primary;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.timeRangeContainer}>
          <SegmentedButtons
            value={timeRange}
            onValueChange={setTimeRange}
            buttons={timeRanges.map(range => ({
              value: range.value,
              label: range.label,
            }))}
            style={styles.segmentedButtons}
          />
        </View>

        <View style={styles.averagesContainer}>
          <View style={styles.averageItem}>
            <Text style={styles.averageLabel}>Avg. Systolic</Text>
            <Text 
              style={[
                styles.averageValue, 
                { color: getStatusColor(averages.systolic, 'systolic') }
              ]}
            >
              {averages.systolic || '--'}
            </Text>
            <Text style={styles.averageUnit}>mmHg</Text>
          </View>
          
          <View style={styles.averageItem}>
            <Text style={styles.averageLabel}>Avg. Diastolic</Text>
            <Text 
              style={[
                styles.averageValue, 
                { color: getStatusColor(averages.diastolic, 'diastolic') }
              ]}
            >
              {averages.diastolic || '--'}
            </Text>
            <Text style={styles.averageUnit}>mmHg</Text>
          </View>
          
          <View style={styles.averageItem}>
            <Text style={styles.averageLabel}>Avg. Pulse</Text>
            <Text style={styles.averageValue}>
              {averages.pulse || '--'}
            </Text>
            <Text style={styles.averageUnit}>bpm</Text>
          </View>
        </View>

        {filteredReadings.length > 0 ? (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Blood Pressure Trends</Text>
            <LineChart
              data={{
                labels: chartData.labels,
                datasets: [
                  {
                    data: chartData.datasets[0].data,
                    color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`, // Red for systolic
                    strokeWidth: 2,
                  },
                  {
                    data: chartData.datasets[1].data,
                    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Blue for diastolic
                    strokeWidth: 2,
                  },
                ],
              }}
              width={screenWidth - 40}
              height={250}
              yAxisSuffix=""
              yAxisInterval={1}
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: theme.colors.primary,
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
            
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#f44336' }]} />
                <Text style={styles.legendText}>Systolic</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#2196f3' }]} />
                <Text style={styles.legendText}>Diastolic</Text>
              </View>
            </View>

            {timeRange === '3months' || timeRange === 'year' ? (
              <Text style={styles.noteText}>
                Note: Data is aggregated by day for better visualization.
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No data available for the selected time range.</Text>
            <Text style={styles.emptySubtext}>Add a reading to see trends.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeRangeContainer: {
    marginBottom: 20,
  },
  segmentedButtons: {
    paddingHorizontal: 8,
  },
  averagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    padding: 16,
  },
  averageItem: {
    alignItems: 'center',
    flex: 1,
  },
  averageLabel: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 4,
  },
  averageValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  averageUnit: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  noteText: {
    fontSize: 10,
    color: 'rgba(0, 0, 0, 0.5)',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
  },
});

export default TrendsScreen;

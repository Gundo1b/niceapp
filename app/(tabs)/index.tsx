import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle,
  Circle,
  Clock,
} from 'lucide-react-native';

interface TimeBlock {
  time_slot: string;
  title: string;
  description?: string;
  completed: boolean;
  duration_minutes?: number;
}

const DEFAULT_TIME_BLOCKS: TimeBlock[] = [
  { time_slot: '06:00', title: 'Wake up & Hydrate', completed: false, duration_minutes: 15 },
  { time_slot: '06:15', title: 'Exercise/Movement', completed: false, duration_minutes: 60 },
  { time_slot: '07:15', title: 'Learning', completed: false, duration_minutes: 45 },
  { time_slot: '09:00', title: 'Work Focus - Priority 1', completed: false, duration_minutes: 120 },
  { time_slot: '11:00', title: 'Work Focus - Priority 2', completed: false, duration_minutes: 120 },
  { time_slot: '13:00', title: 'Lunch Break', completed: false, duration_minutes: 60 },
  { time_slot: '14:00', title: 'Work Focus - Priority 3', completed: false, duration_minutes: 120 },
  { time_slot: '16:00', title: 'Administrative Tasks', completed: false, duration_minutes: 60 },
  { time_slot: '17:00', title: 'Wrap up & Planning', completed: false, duration_minutes: 30 },
  { time_slot: '18:30', title: 'Personal Projects', completed: false, duration_minutes: 90 },
  { time_slot: '20:00', title: 'Reading/Growth', completed: false, duration_minutes: 60 },
  { time_slot: '21:30', title: 'Tomorrow\'s Planning', completed: false, duration_minutes: 30 },
];

export default function TodayScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);

  const dateString = currentDate.toISOString().split('T')[0];

  const loadTasks = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('task_date', dateString)
        .order('sort_order');

      if (error) throw error;

      if (!data || data.length === 0) {
        const newTasks = DEFAULT_TIME_BLOCKS.map((block, index) => ({
          user_id: user.id,
          task_date: dateString,
          time_slot: block.time_slot,
          title: block.title,
          description: block.description || '',
          completed: false,
          duration_minutes: block.duration_minutes,
          sort_order: index,
        }));

        const { data: insertedData, error: insertError } = await supabase
          .from('daily_tasks')
          .insert(newTasks)
          .select();

        if (insertError) throw insertError;
        setTasks(insertedData || []);
      } else {
        setTasks(data);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, dateString]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('daily_tasks')
        .update({
          completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                completed: !currentStatus,
                completed_at: !currentStatus ? new Date().toISOString() : null,
              }
            : task
        )
      );
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const updateTaskTitle = async (taskId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('daily_tasks')
        .update({ title: newTitle })
        .eq('id', taskId);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, title: newTitle } : task
        )
      );
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
    setLoading(true);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
    setLoading(true);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setLoading(true);
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.dateNavigation}>
          <TouchableOpacity onPress={goToPreviousDay} style={styles.navButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>
              {currentDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            {dateString !== new Date().toISOString().split('T')[0] && (
              <TouchableOpacity onPress={goToToday}>
                <Text style={styles.todayButton}>Today</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity onPress={goToNextDay} style={styles.navButton}>
            <ChevronRight size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              {completedCount} of {totalCount} completed
            </Text>
            <Text style={styles.progressPercentage}>
              {progressPercentage.toFixed(0)}%
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercentage}%`, backgroundColor: colors.success },
              ]}
            />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {tasks.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <View style={styles.timeContainer}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={styles.timeText}>{task.time_slot}</Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleTaskCompletion(task.id, task.completed)}
                style={styles.checkbox}
              >
                {task.completed ? (
                  <CheckCircle size={28} color={colors.success} />
                ) : (
                  <Circle size={28} color={colors.border} />
                )}
              </TouchableOpacity>
            </View>

            {editingTask === task.id ? (
              <TextInput
                style={styles.taskTitleInput}
                value={task.title}
                onChangeText={(text) =>
                  setTasks((prev) =>
                    prev.map((t) =>
                      t.id === task.id ? { ...t, title: text } : t
                    )
                  )
                }
                onBlur={() => updateTaskTitle(task.id, task.title)}
                autoFocus
              />
            ) : (
              <TouchableOpacity
                onLongPress={() => setEditingTask(task.id)}
                style={styles.taskTitleContainer}
              >
                <Text
                  style={[
                    styles.taskTitle,
                    task.completed && styles.taskTitleCompleted,
                  ]}
                >
                  {task.title}
                </Text>
              </TouchableOpacity>
            )}

            {task.duration_minutes && (
              <Text style={styles.durationText}>
                {task.duration_minutes} minutes
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surface,
      paddingTop: 60,
      paddingBottom: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dateNavigation: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    navButton: {
      padding: 8,
    },
    dateInfo: {
      alignItems: 'center',
    },
    dateText: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    todayButton: {
      fontSize: 14,
      color: colors.primary,
      marginTop: 4,
    },
    progressSection: {
      marginTop: 8,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    progressText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    progressPercentage: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.success,
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    taskCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    taskHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    timeText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    checkbox: {
      padding: 4,
    },
    taskTitleContainer: {
      marginBottom: 8,
    },
    taskTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    taskTitleCompleted: {
      textDecorationLine: 'line-through',
      color: colors.textSecondary,
    },
    taskTitleInput: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      padding: 8,
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: 8,
    },
    durationText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });

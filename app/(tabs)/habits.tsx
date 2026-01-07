import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Flame,
  CheckCircle,
  Circle,
  X,
  Trophy,
  TrendingUp,
} from 'lucide-react-native';

export default function HabitsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [habits, setHabits] = useState<any[]>([]);
  const [completions, setCompletions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('');

  const todayString = new Date().toISOString().split('T')[0];

  const loadHabits = useCallback(async () => {
    if (!user) return;

    try {
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (habitsError) throw habitsError;

      const { data: completionsData, error: completionsError } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('completion_date', todayString);

      if (completionsError) throw completionsError;

      const completionsMap: Record<string, any> = {};
      completionsData?.forEach((completion) => {
        completionsMap[completion.habit_id] = completion;
      });

      setHabits(habitsData || []);
      setCompletions(completionsMap);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  }, [user, todayString]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const createHabit = async () => {
    if (!user || !newHabitName) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name: newHabitName,
          category: newHabitCategory || 'general',
          frequency: 'daily',
        })
        .select()
        .single();

      if (error) throw error;

      setHabits((prev) => [data, ...prev]);
      setShowModal(false);
      setNewHabitName('');
      setNewHabitCategory('');
    } catch (error) {
      console.error('Error creating habit:', error);
    }
  };

  const toggleHabitCompletion = async (habitId: string) => {
    if (!user) return;

    try {
      const existingCompletion = completions[habitId];

      if (existingCompletion) {
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existingCompletion.id);

        if (error) throw error;

        const newCompletions = { ...completions };
        delete newCompletions[habitId];
        setCompletions(newCompletions);

        setHabits((prev) =>
          prev.map((habit) =>
            habit.id === habitId && habit.current_streak > 0
              ? { ...habit, current_streak: habit.current_streak - 1 }
              : habit
          )
        );
      } else {
        const { data, error } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: habitId,
            user_id: user.id,
            completion_date: todayString,
          })
          .select()
          .single();

        if (error) throw error;

        setCompletions((prev) => ({ ...prev, [habitId]: data }));

        const habit = habits.find((h) => h.id === habitId);
        if (habit) {
          const newStreak = habit.current_streak + 1;
          const newBestStreak = Math.max(newStreak, habit.best_streak || 0);

          const { error: updateError } = await supabase
            .from('habits')
            .update({
              current_streak: newStreak,
              best_streak: newBestStreak,
            })
            .eq('id', habitId);

          if (!updateError) {
            setHabits((prev) =>
              prev.map((h) =>
                h.id === habitId
                  ? {
                      ...h,
                      current_streak: newStreak,
                      best_streak: newBestStreak,
                    }
                  : h
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  const totalCompleted = Object.keys(completions).length;
  const completionRate =
    habits.length > 0 ? (totalCompleted / habits.length) * 100 : 0;

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
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Habits & Streaks</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Flame size={24} color={colors.warning} />
              <Text style={styles.statValue}>
                {habits.reduce((max, h) => Math.max(max, h.current_streak || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Longest</Text>
            </View>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>Today's Progress</Text>
            <Text style={styles.progressPercentage}>
              {totalCompleted} / {habits.length}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${completionRate}%`,
                  backgroundColor: colors.success,
                },
              ]}
            />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Flame size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No habits yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start building positive habits today
            </Text>
          </View>
        ) : (
          habits.map((habit) => {
            const isCompleted = !!completions[habit.id];
            const currentStreak = habit.current_streak || 0;
            const bestStreak = habit.best_streak || 0;

            return (
              <View key={habit.id} style={styles.habitCard}>
                <TouchableOpacity
                  onPress={() => toggleHabitCompletion(habit.id)}
                  style={styles.habitContent}
                >
                  <View style={styles.checkbox}>
                    {isCompleted ? (
                      <CheckCircle size={32} color={colors.success} />
                    ) : (
                      <Circle size={32} color={colors.border} />
                    )}
                  </View>

                  <View style={styles.habitInfo}>
                    <Text
                      style={[
                        styles.habitName,
                        isCompleted && styles.habitNameCompleted,
                      ]}
                    >
                      {habit.name}
                    </Text>
                    {habit.category && (
                      <Text style={styles.habitCategory}>{habit.category}</Text>
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.streakSection}>
                  <View style={styles.streakItem}>
                    <Flame size={16} color={colors.warning} />
                    <Text style={styles.streakValue}>{currentStreak}</Text>
                    <Text style={styles.streakLabel}>Current</Text>
                  </View>
                  {bestStreak > 0 && (
                    <View style={styles.streakItem}>
                      <Trophy size={16} color={colors.accent} />
                      <Text style={styles.streakValue}>{bestStreak}</Text>
                      <Text style={styles.streakLabel}>Best</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Habit</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Habit Name</Text>
            <TextInput
              style={styles.input}
              placeholder="What habit do you want to build?"
              placeholderTextColor={colors.textSecondary}
              value={newHabitName}
              onChangeText={setNewHabitName}
            />

            <Text style={styles.inputLabel}>Category (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Health, Productivity, Learning"
              placeholderTextColor={colors.textSecondary}
              value={newHabitCategory}
              onChangeText={setNewHabitCategory}
            />

            <TouchableOpacity
              style={[
                styles.createButton,
                !newHabitName && styles.createButtonDisabled,
              ]}
              onPress={createHabit}
              disabled={!newHabitName}
            >
              <Text style={styles.createButtonText}>Create Habit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
      paddingBottom: 20,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginTop: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
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
      paddingBottom: 80,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 16,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
    },
    habitCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    habitContent: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    checkbox: {
      marginRight: 16,
    },
    habitInfo: {
      flex: 1,
    },
    habitName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    habitNameCompleted: {
      textDecorationLine: 'line-through',
      color: colors.textSecondary,
    },
    habitCategory: {
      fontSize: 12,
      color: colors.textSecondary,
      textTransform: 'capitalize',
    },
    streakSection: {
      flexDirection: 'row',
      gap: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    streakItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    streakValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    streakLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
      marginTop: 12,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    createButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 12,
    },
    createButtonDisabled: {
      opacity: 0.5,
    },
    createButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

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
  Target,
  TrendingUp,
  Award,
  DollarSign,
  Heart,
  X,
  Check,
} from 'lucide-react-native';

const GOAL_CATEGORIES = [
  { id: 'primary', label: 'Primary Goal', icon: Target, color: '#007AFF' },
  { id: 'skill', label: 'Skill Development', icon: TrendingUp, color: '#5856D6' },
  { id: 'health', label: 'Health & Fitness', icon: Award, color: '#34C759' },
  { id: 'financial', label: 'Financial', icon: DollarSign, color: '#FF9500' },
  { id: 'personal', label: 'Relationship/Personal', icon: Heart, color: '#FF3B30' },
];

export default function GoalsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');

  const loadGoals = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const createGoal = async () => {
    if (!user || !newGoalTitle || !selectedCategory) return;

    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 90);

      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: newGoalTitle,
          description: newGoalDescription,
          category: selectedCategory,
          is_primary: selectedCategory === 'primary',
          target_date: targetDate.toISOString().split('T')[0],
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      setGoals((prev) => [data, ...prev]);
      setShowModal(false);
      setNewGoalTitle('');
      setNewGoalDescription('');
      setSelectedCategory('');
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const updateGoalProgress = async (goalId: string, newProgress: number) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ progress_percentage: newProgress })
        .eq('id', goalId);

      if (error) throw error;

      setGoals((prev) =>
        prev.map((goal) =>
          goal.id === goalId
            ? { ...goal, progress_percentage: newProgress }
            : goal
        )
      );
    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ status: 'archived' })
        .eq('id', goalId);

      if (error) throw error;

      setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

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
        <Text style={styles.headerTitle}>90-Day Goals</Text>
        <Text style={styles.headerSubtitle}>
          Transform your life in the next 90 days
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Target size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No goals yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start by setting your first 90-day goal
            </Text>
          </View>
        ) : (
          goals.map((goal) => {
            const category = GOAL_CATEGORIES.find((c) => c.id === goal.category);
            const Icon = category?.icon || Target;
            const daysRemaining = Math.ceil(
              (new Date(goal.target_date).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            );

            return (
              <View
                key={goal.id}
                style={[
                  styles.goalCard,
                  goal.is_primary && styles.primaryGoalCard,
                ]}
              >
                <View style={styles.goalHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: category?.color + '20' },
                    ]}
                  >
                    <Icon size={24} color={category?.color || colors.primary} />
                  </View>
                  <View style={styles.goalInfo}>
                    <Text style={styles.categoryLabel}>{category?.label}</Text>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                  </View>
                  {goal.is_primary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  )}
                </View>

                {goal.description && (
                  <Text style={styles.goalDescription}>{goal.description}</Text>
                )}

                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={styles.progressValue}>
                      {goal.progress_percentage || 0}%
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${goal.progress_percentage || 0}%`,
                          backgroundColor: category?.color || colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.goalFooter}>
                  <Text style={styles.daysRemaining}>
                    {daysRemaining > 0
                      ? `${daysRemaining} days left`
                      : 'Goal period ended'}
                  </Text>
                  <View style={styles.progressButtons}>
                    <TouchableOpacity
                      style={styles.progressButton}
                      onPress={() =>
                        updateGoalProgress(
                          goal.id,
                          Math.max(0, (goal.progress_percentage || 0) - 10)
                        )
                      }
                    >
                      <Text style={styles.progressButtonText}>-10%</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.progressButton}
                      onPress={() =>
                        updateGoalProgress(
                          goal.id,
                          Math.min(100, (goal.progress_percentage || 0) + 10)
                        )
                      }
                    >
                      <Text style={styles.progressButtonText}>+10%</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowModal(true)}
      >
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
              <Text style={styles.modalTitle}>New Goal</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {GOAL_CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      selectedCategory === category.id &&
                        styles.categoryOptionSelected,
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Icon size={20} color={category.color} />
                    <Text style={styles.categoryOptionText}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Goal Title</Text>
            <TextInput
              style={styles.input}
              placeholder="What do you want to achieve?"
              placeholderTextColor={colors.textSecondary}
              value={newGoalTitle}
              onChangeText={setNewGoalTitle}
            />

            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add more details about your goal..."
              placeholderTextColor={colors.textSecondary}
              value={newGoalDescription}
              onChangeText={setNewGoalDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.createButton,
                (!newGoalTitle || !selectedCategory) &&
                  styles.createButtonDisabled,
              ]}
              onPress={createGoal}
              disabled={!newGoalTitle || !selectedCategory}
            >
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Create Goal</Text>
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
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
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
      textAlign: 'center',
    },
    goalCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    primaryGoalCard: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    goalHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    goalInfo: {
      flex: 1,
    },
    categoryLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    goalTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    primaryBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    primaryBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.primary,
      textTransform: 'uppercase',
    },
    goalDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    progressSection: {
      marginBottom: 12,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    progressLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    progressValue: {
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
    goalFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    daysRemaining: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    progressButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    progressButton: {
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    progressButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
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
      maxHeight: '80%',
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
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    categoryOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryOptionSelected: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    categoryOptionText: {
      fontSize: 12,
      color: colors.text,
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
    textArea: {
      minHeight: 80,
    },
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
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

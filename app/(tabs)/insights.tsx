import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { generateDailyMotivation } from '@/lib/openrouter';
import {
  Sparkles,
  TrendingUp,
  Target,
  Zap,
  Calendar,
  Award,
  RefreshCw,
} from 'lucide-react-native';

export default function InsightsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [dailyMotivation, setDailyMotivation] = useState('');
  const [stats, setStats] = useState({
    todayCompleted: 0,
    todayTotal: 0,
    weekCompleted: 0,
    activeGoals: 0,
    longestStreak: 0,
    habitsToday: 0,
    totalHabits: 0,
  });

  const loadStats = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const weekStart = getMonday(new Date()).toISOString().split('T')[0];

      const [tasksToday, tasksWeek, goals, habits, habitCompletions] = await Promise.all([
        supabase
          .from('daily_tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('task_date', today),
        supabase
          .from('daily_tasks')
          .select('*')
          .eq('user_id', user.id)
          .gte('task_date', weekStart),
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active'),
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true),
        supabase
          .from('habit_completions')
          .select('*')
          .eq('user_id', user.id)
          .eq('completion_date', today),
      ]);

      const todayTasks = tasksToday.data || [];
      const weekTasks = tasksWeek.data || [];
      const activeGoals = goals.data || [];
      const activeHabits = habits.data || [];
      const todayHabits = habitCompletions.data || [];

      const longestStreak = activeHabits.reduce(
        (max, h) => Math.max(max, h.current_streak || 0),
        0
      );

      const newStats = {
        todayCompleted: todayTasks.filter((t) => t.completed).length,
        todayTotal: todayTasks.length,
        weekCompleted: weekTasks.filter((t) => t.completed).length,
        activeGoals: activeGoals.length,
        longestStreak,
        habitsToday: todayHabits.length,
        totalHabits: activeHabits.length,
      };

      setStats(newStats);

      const { data: existingInsight } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('insight_type', 'daily_motivation')
        .gte('generated_at', today)
        .maybeSingle();

      if (existingInsight) {
        setDailyMotivation(existingInsight.content);
      } else {
        setGeneratingAI(true);
        const motivation = await generateDailyMotivation({
          completedTasks: newStats.todayCompleted,
          totalTasks: newStats.todayTotal,
          activeGoals: newStats.activeGoals,
          longestStreak: newStats.longestStreak,
        });
        setDailyMotivation(motivation);

        await supabase.from('ai_insights').insert({
          user_id: user.id,
          insight_type: 'daily_motivation',
          content: motivation,
          context: { stats: newStats },
        });
        setGeneratingAI(false);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setGeneratingAI(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const regenerateMotivation = async () => {
    if (!user) return;

    setGeneratingAI(true);
    try {
      const motivation = await generateDailyMotivation({
        completedTasks: stats.todayCompleted,
        totalTasks: stats.todayTotal,
        activeGoals: stats.activeGoals,
        longestStreak: stats.longestStreak,
      });
      setDailyMotivation(motivation);

      await supabase.from('ai_insights').insert({
        user_id: user.id,
        insight_type: 'daily_motivation',
        content: motivation,
        context: { stats },
      });
    } catch (error) {
      console.error('Error regenerating motivation:', error);
    } finally {
      setGeneratingAI(false);
    }
  };

  const completionRate =
    stats.todayTotal > 0
      ? (stats.todayCompleted / stats.todayTotal) * 100
      : 0;
  const habitRate =
    stats.totalHabits > 0
      ? (stats.habitsToday / stats.totalHabits) * 100
      : 0;

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
        <Text style={styles.headerTitle}>AI Insights</Text>
        <Text style={styles.headerSubtitle}>
          Personalized guidance powered by AI
        </Text>
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
        <View style={styles.motivationCard}>
          <View style={styles.motivationHeader}>
            <View style={styles.motivationTitleRow}>
              <Sparkles size={24} color={colors.accent} />
              <Text style={styles.motivationTitle}>Daily Motivation</Text>
            </View>
            <TouchableOpacity
              onPress={regenerateMotivation}
              disabled={generatingAI}
              style={styles.refreshButton}
            >
              {generatingAI ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <RefreshCw size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.motivationText}>
            {generatingAI ? 'Generating personalized insight...' : dailyMotivation}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Your Progress Today</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Calendar size={24} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>
              {stats.todayCompleted}/{stats.todayTotal}
            </Text>
            <Text style={styles.statLabel}>Tasks Completed</Text>
            <View style={styles.miniProgressBar}>
              <View
                style={[
                  styles.miniProgressFill,
                  {
                    width: `${completionRate}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: colors.successLight },
              ]}
            >
              <Zap size={24} color={colors.success} />
            </View>
            <Text style={styles.statValue}>
              {stats.habitsToday}/{stats.totalHabits}
            </Text>
            <Text style={styles.statLabel}>Habits Done</Text>
            <View style={styles.miniProgressBar}>
              <View
                style={[
                  styles.miniProgressFill,
                  {
                    width: `${habitRate}%`,
                    backgroundColor: colors.success,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: colors.warningLight },
              ]}
            >
              <Award size={24} color={colors.warning} />
            </View>
            <Text style={styles.statValue}>{stats.longestStreak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: colors.accentLight },
              ]}
            >
              <Target size={24} color={colors.accent} />
            </View>
            <Text style={styles.statValue}>{stats.activeGoals}</Text>
            <Text style={styles.statLabel}>Active Goals</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Weekly Overview</Text>

        <View style={styles.overviewCard}>
          <View style={styles.overviewRow}>
            <TrendingUp size={20} color={colors.success} />
            <Text style={styles.overviewLabel}>Tasks This Week</Text>
            <Text style={styles.overviewValue}>{stats.weekCompleted}</Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Pro Tip</Text>
          <Text style={styles.tipText}>
            {completionRate > 75
              ? 'You\'re crushing it today! Keep this momentum going into tomorrow by planning your next day\'s priorities right now.'
              : 'Focus on completing just 3 high-impact tasks today. Quality over quantity leads to sustainable progress.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
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
    },
    motivationCard: {
      backgroundColor: colors.accentLight,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.accent + '30',
    },
    motivationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    motivationTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    motivationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    refreshButton: {
      padding: 8,
    },
    motivationText: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
      marginTop: 8,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      minWidth: '47%',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    miniProgressBar: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    miniProgressFill: {
      height: '100%',
      borderRadius: 2,
    },
    overviewCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    overviewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    overviewLabel: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    overviewValue: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    tipCard: {
      backgroundColor: colors.primaryLight,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    tipTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    tipText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.text,
    },
  });

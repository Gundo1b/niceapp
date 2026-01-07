import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react-native';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function WeekScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [weekTheme, setWeekTheme] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [dayPlans, setDayPlans] = useState<Record<string, string>>({
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const weekStartString = weekStart.toISOString().split('T')[0];

  function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  const loadWeekPlan = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start_date', weekStartString)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setWeekTheme(data.week_theme || '');
        setFocusArea(data.focus_area || '');
        setDayPlans({
          monday: data.monday_plan || '',
          tuesday: data.tuesday_plan || '',
          wednesday: data.wednesday_plan || '',
          thursday: data.thursday_plan || '',
          friday: data.friday_plan || '',
          saturday: data.saturday_plan || '',
          sunday: data.sunday_plan || '',
        });
      } else {
        setWeekTheme('');
        setFocusArea('');
        setDayPlans({
          monday: '',
          tuesday: '',
          wednesday: '',
          thursday: '',
          friday: '',
          saturday: '',
          sunday: '',
        });
      }
    } catch (error) {
      console.error('Error loading week plan:', error);
    } finally {
      setLoading(false);
    }
  }, [user, weekStartString]);

  useEffect(() => {
    loadWeekPlan();
  }, [loadWeekPlan]);

  const saveWeekPlan = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('weekly_plans')
        .upsert(
          {
            user_id: user.id,
            week_start_date: weekStartString,
            week_theme: weekTheme,
            focus_area: focusArea,
            monday_plan: dayPlans.monday,
            tuesday_plan: dayPlans.tuesday,
            wednesday_plan: dayPlans.wednesday,
            thursday_plan: dayPlans.thursday,
            friday_plan: dayPlans.friday,
            saturday_plan: dayPlans.saturday,
            sunday_plan: dayPlans.sunday,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,week_start_date' }
        );

      if (error) throw error;
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving week plan:', error);
    } finally {
      setSaving(false);
    }
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() - 7);
    setWeekStart(newDate);
    setLoading(true);
  };

  const goToNextWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + 7);
    setWeekStart(newDate);
    setLoading(true);
  };

  const goToCurrentWeek = () => {
    setWeekStart(getMonday(new Date()));
    setLoading(true);
  };

  const weekEndDate = new Date(weekStart);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

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
          <TouchableOpacity onPress={goToPreviousWeek} style={styles.navButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>
              {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' - '}
              {weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={goToCurrentWeek}>
              <Text style={styles.todayButton}>Current Week</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={goToNextWeek} style={styles.navButton}>
            <ChevronRight size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={saveWeekPlan}
          disabled={saving}
          style={styles.saveButton}
        >
          <Save size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>

        {lastSaved && (
          <Text style={styles.lastSavedText}>
            Last saved: {lastSaved.toLocaleTimeString()}
          </Text>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Week Theme</Text>
          <TextInput
            style={styles.themeInput}
            placeholder="What's your focus this week?"
            placeholderTextColor={colors.textSecondary}
            value={weekTheme}
            onChangeText={setWeekTheme}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Primary Focus Area</Text>
          <TextInput
            style={styles.themeInput}
            placeholder="What's the one thing that matters most?"
            placeholderTextColor={colors.textSecondary}
            value={focusArea}
            onChangeText={setFocusArea}
          />
        </View>

        {DAYS.map((day, index) => {
          const dayKey = DAY_KEYS[index];
          return (
            <View key={day} style={styles.daySection}>
              <Text style={styles.dayTitle}>{day}</Text>
              <TextInput
                style={styles.dayInput}
                placeholder={`Plan for ${day}...`}
                placeholderTextColor={colors.textSecondary}
                value={dayPlans[dayKey]}
                onChangeText={(text) =>
                  setDayPlans((prev) => ({ ...prev, [dayKey]: text }))
                }
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          );
        })}
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
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    todayButton: {
      fontSize: 12,
      color: colors.primary,
      marginTop: 4,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginTop: 8,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    lastSavedText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    themeInput: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    daySection: {
      marginBottom: 16,
    },
    dayTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    dayInput: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      fontSize: 14,
      color: colors.text,
      minHeight: 100,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });

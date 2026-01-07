import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import {
  Smile,
  Heart,
  BookOpen,
  Activity,
  FileText,
  Settings,
  LogOut,
  Sun,
  Moon,
  Smartphone,
  ChevronRight,
  X,
  Save,
  Download,
} from 'lucide-react-native';

export default function MoreScreen() {
  const { user, signOut } = useAuth();
  const { colors, theme, setTheme } = useTheme();
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showGratitudeModal, setShowGratitudeModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [moodScore, setMoodScore] = useState(5);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [gratitudeEntries, setGratitudeEntries] = useState(['', '', '']);
  const [sleepHours, setSleepHours] = useState('');
  const [waterIntake, setWaterIntake] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [todayMood, setTodayMood] = useState<any>(null);
  const [todayGratitude, setTodayGratitude] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const todayString = new Date().toISOString().split('T')[0];

  const loadTodayData = useCallback(async () => {
    if (!user) return;

    try {
      const [mood, gratitude] = await Promise.all([
        supabase
          .from('mood_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('entry_date', todayString)
          .maybeSingle(),
        supabase
          .from('gratitude_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('entry_date', todayString)
          .maybeSingle(),
      ]);

      setTodayMood(mood.data);
      setTodayGratitude(gratitude.data);
    } catch (error) {
      console.error('Error loading today data:', error);
    }
  }, [user, todayString]);

  useEffect(() => {
    loadTodayData();
  }, [loadTodayData]);

  const saveMood = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('mood_entries').upsert(
        {
          user_id: user.id,
          entry_date: todayString,
          mood_score: moodScore,
          energy_level: energyLevel,
        },
        { onConflict: 'user_id,entry_date' }
      );

      if (error) throw error;

      setShowMoodModal(false);
      loadTodayData();
    } catch (error) {
      console.error('Error saving mood:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGratitude = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const validEntries = gratitudeEntries.filter((e) => e.trim() !== '');
      const { error } = await supabase.from('gratitude_entries').upsert(
        {
          user_id: user.id,
          entry_date: todayString,
          entries: validEntries,
          mood_correlation: todayMood?.mood_score || null,
        },
        { onConflict: 'user_id,entry_date' }
      );

      if (error) throw error;

      setShowGratitudeModal(false);
      loadTodayData();
    } catch (error) {
      console.error('Error saving gratitude:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveHealth = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('health_metrics').upsert(
        {
          user_id: user.id,
          metric_date: todayString,
          sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
          water_intake_ml: waterIntake ? parseInt(waterIntake) : null,
        },
        { onConflict: 'user_id,metric_date' }
      );

      if (error) throw error;

      setShowHealthModal(false);
      setSleepHours('');
      setWaterIntake('');
    } catch (error) {
      console.error('Error saving health metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveQuickNote = async () => {
    if (!user || !noteContent.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('quick_notes').insert({
        user_id: user.id,
        content: noteContent,
      });

      if (error) throw error;

      setShowNoteModal(false);
      setNoteContent('');
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    if (!user) return;

    try {
      const [tasks, goals, habits, moods, reflections] = await Promise.all([
        supabase.from('daily_tasks').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('mood_entries').select('*').eq('user_id', user.id),
        supabase.from('reflections').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        tasks: tasks.data,
        goals: goals.data,
        habits: habits.data,
        moods: moods.data,
        reflections: reflections.data,
      };

      console.log('Export data ready:', exportData);
      alert('Data export ready! Check console for details.');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data');
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
        <Text style={styles.headerSubtitle}>
          Track your wellbeing and manage settings
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowMoodModal(true)}
        >
          <View style={styles.menuIconContainer}>
            <Smile size={24} color={colors.success} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Mood & Energy</Text>
            <Text style={styles.menuSubtitle}>
              {todayMood
                ? `Mood: ${todayMood.mood_score}/10`
                : 'Track how you feel today'}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowGratitudeModal(true)}
        >
          <View style={styles.menuIconContainer}>
            <Heart size={24} color={colors.error} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Gratitude Journal</Text>
            <Text style={styles.menuSubtitle}>
              {todayGratitude
                ? `${todayGratitude.entries.length} entries today`
                : 'What are you grateful for?'}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowHealthModal(true)}
        >
          <View style={styles.menuIconContainer}>
            <Activity size={24} color={colors.primary} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Health Metrics</Text>
            <Text style={styles.menuSubtitle}>Sleep, water, exercise</Text>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowNoteModal(true)}
        >
          <View style={styles.menuIconContainer}>
            <FileText size={24} color={colors.accent} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Quick Note</Text>
            <Text style={styles.menuSubtitle}>Capture ideas instantly</Text>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Appearance</Text>

        <View style={styles.themeSelector}>
          <TouchableOpacity
            style={[
              styles.themeOption,
              theme === 'light' && styles.themeOptionSelected,
            ]}
            onPress={() => setTheme('light')}
          >
            <Sun size={20} color={colors.text} />
            <Text style={styles.themeOptionText}>Light</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeOption,
              theme === 'dark' && styles.themeOptionSelected,
            ]}
            onPress={() => setTheme('dark')}
          >
            <Moon size={20} color={colors.text} />
            <Text style={styles.themeOptionText}>Dark</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeOption,
              theme === 'auto' && styles.themeOptionSelected,
            ]}
            onPress={() => setTheme('auto')}
          >
            <Smartphone size={20} color={colors.text} />
            <Text style={styles.themeOptionText}>Auto</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Data</Text>

        <TouchableOpacity style={styles.menuItem} onPress={exportData}>
          <View style={styles.menuIconContainer}>
            <Download size={24} color={colors.primary} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Export Data</Text>
            <Text style={styles.menuSubtitle}>
              Download all your data
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.signOutButton]}
          onPress={handleSignOut}
        >
          <View style={styles.menuIconContainer}>
            <LogOut size={24} color={colors.error} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={[styles.menuTitle, { color: colors.error }]}>
              Sign Out
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showMoodModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMoodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mood & Energy</Text>
              <TouchableOpacity onPress={() => setShowMoodModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Mood (1-10)</Text>
            <View style={styles.sliderContainer}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.sliderOption,
                    moodScore === num && styles.sliderOptionSelected,
                  ]}
                  onPress={() => setMoodScore(num)}
                >
                  <Text
                    style={[
                      styles.sliderOptionText,
                      moodScore === num && styles.sliderOptionTextSelected,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Energy Level (1-10)</Text>
            <View style={styles.sliderContainer}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.sliderOption,
                    energyLevel === num && styles.sliderOptionSelected,
                  ]}
                  onPress={() => setEnergyLevel(num)}
                >
                  <Text
                    style={[
                      styles.sliderOptionText,
                      energyLevel === num && styles.sliderOptionTextSelected,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveMood}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Save size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showGratitudeModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowGratitudeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gratitude Journal</Text>
              <TouchableOpacity onPress={() => setShowGratitudeModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>
              What are you grateful for today?
            </Text>
            {[0, 1, 2].map((index) => (
              <TextInput
                key={index}
                style={styles.input}
                placeholder={`Gratitude ${index + 1}...`}
                placeholderTextColor={colors.textSecondary}
                value={gratitudeEntries[index]}
                onChangeText={(text) => {
                  const newEntries = [...gratitudeEntries];
                  newEntries[index] = text;
                  setGratitudeEntries(newEntries);
                }}
              />
            ))}

            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveGratitude}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Save size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showHealthModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowHealthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Health Metrics</Text>
              <TouchableOpacity onPress={() => setShowHealthModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Sleep (hours)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 7.5"
              placeholderTextColor={colors.textSecondary}
              value={sleepHours}
              onChangeText={setSleepHours}
              keyboardType="decimal-pad"
            />

            <Text style={styles.inputLabel}>Water Intake (ml)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2000"
              placeholderTextColor={colors.textSecondary}
              value={waterIntake}
              onChangeText={setWaterIntake}
              keyboardType="number-pad"
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveHealth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Save size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showNoteModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Note</Text>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Write your note..."
              placeholderTextColor={colors.textSecondary}
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                !noteContent.trim() && styles.saveButtonDisabled,
              ]}
              onPress={saveQuickNote}
              disabled={loading || !noteContent.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Save size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save Note</Text>
                </>
              )}
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
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 16,
      marginBottom: 12,
      textTransform: 'uppercase',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    menuIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    menuInfo: {
      flex: 1,
    },
    menuTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 2,
    },
    menuSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    themeSelector: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    themeOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.card,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    themeOptionSelected: {
      borderColor: colors.primary,
      borderWidth: 2,
      backgroundColor: colors.primaryLight,
    },
    themeOptionText: {
      fontSize: 14,
      color: colors.text,
    },
    signOutButton: {
      marginTop: 16,
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
      minHeight: 120,
    },
    sliderContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    sliderOption: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sliderOptionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    sliderOptionText: {
      fontSize: 14,
      color: colors.text,
    },
    sliderOptionTextSelected: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      marginTop: 12,
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

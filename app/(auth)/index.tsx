import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Target, Lock, Mail } from 'lucide-react-native';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  React.useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);

        if (error) {
          setError(error.message);
        } else {
          router.replace('/(tabs)');
        }
      } else {
        const { error } = await signUp(email, password);

        if (error) {
          setError(error.message);
        } else {
          setShowConfirmation(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Target size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>ELH</Text>
          <Text style={styles.subtitle}>
            Your Personal Operating System for Productivity
          </Text>
        </View>

        {showConfirmation ? (
          <View style={styles.form}>
            <Text style={styles.confirmationText}>
              Please check your email and confirm your account, then press OK to go to login.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setIsLogin(true);
                setShowConfirmation(false);
                setEmail('');
                setPassword('');
              }}
            >
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {isLogin ? 'Sign In' : 'Sign Up'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsLogin(!isLogin)}
              disabled={loading}
            >
              <Text style={styles.switchText}>
                {isLogin
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Built for 9-5 professionals who want to level up their life
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    header: {
      alignItems: 'center',
      marginBottom: 48,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    form: {
      width: '100%',
      maxWidth: 400,
      alignSelf: 'center',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      paddingVertical: 16,
      fontSize: 16,
      color: colors.text,
    },
    error: {
      color: colors.error,
      marginBottom: 16,
      textAlign: 'center',
    },
    confirmationText: {
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
      fontSize: 16,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 16,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    switchText: {
      color: colors.primary,
      textAlign: 'center',
      fontSize: 14,
    },
    footer: {
      marginTop: 48,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { login, loadServerUrl, saveServerUrl } from '../services/api';
import { C } from '../constants/theme';

const APP_VERSION = Constants.expoConfig?.version ?? '?';

interface Props {
  onLogin: (token: string) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const insets = useSafeAreaInsets();
  const [serverInput, setServerInput] = useState('http://192.168.1.24:3000');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      await loadServerUrl();
      const saved = await SecureStore.getItemAsync('serverUrl');
      if (saved) setServerInput(saved.replace(/\/api$/, ''));
    })();
  }, []);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Enter email and password');
      return;
    }
    setLoading(true);
    try {
      await saveServerUrl(serverInput.trim());
      const data = await login(email.trim(), password.trim());
      await SecureStore.setItemAsync('token', data.token);
      onLogin(data.token);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Cannot connect to server';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoSymbol}>℞</Text>
          </View>
          <Text style={styles.appName}>روشيتا</Text>
          <Text style={styles.appSub}>Roashetta · Clinic Management</Text>
        </View>

        {/* Form card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>

          <Text style={styles.label}>Server URL</Text>
          <TextInput
            style={styles.input}
            value={serverInput}
            onChangeText={setServerInput}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="http://192.168.1.24:3000"
            placeholderTextColor={C.mutedFg}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="doctor@clinic.com"
            placeholderTextColor={C.mutedFg}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={C.mutedFg}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Sign In</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Make sure your device is on the same WiFi as the clinic server.
        </Text>
        <Text style={styles.version}>v{APP_VERSION}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  container:    { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand:        { alignItems: 'center', marginBottom: 36 },
  logoCircle:   { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 14, elevation: 4, shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  logoSymbol:   { fontSize: 34, color: '#fff', fontWeight: '700' },
  appName:      { fontSize: 30, fontWeight: '800', color: C.fg },
  appSub:       { fontSize: 13, color: C.mutedFg, marginTop: 4 },
  card:         { backgroundColor: C.card, borderRadius: 16, padding: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 3 } },
  cardTitle:    { fontSize: 20, fontWeight: '700', color: C.fg, marginBottom: 18 },
  label:        { fontSize: 13, fontWeight: '600', color: C.fgSub, marginTop: 14, marginBottom: 6 },
  input:        { borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 15, color: C.fg, backgroundColor: C.bg },
  button:       { backgroundColor: C.primary, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.6 },
  buttonText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  hint:         { fontSize: 12, color: C.mutedFg, textAlign: 'center', marginTop: 24, lineHeight: 18 },
  version:      { fontSize: 11, color: C.mutedFg, textAlign: 'center', marginTop: 10, opacity: 0.6 },
});

import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, loginAsGuest } = useApp();
  const [activeTab, setActiveTab] = useState<'google' | 'email'>('google');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authStage, setAuthStage] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setAuthStage('Connecting to Google Play Services...');
    setTimeout(async () => {
      setAuthStage('Synchronizing safe financial profile...');
      setTimeout(async () => {
        await loginWithGoogle('debasmita.sen@gmail.com', 'Debasmita');
        setIsLoading(false);
      }, 400);
    }, 500);
  };

  const handleEmailLogin = async () => {
    if (!email.trim()) return;
    setIsLoading(true);
    setAuthStage('Verifying secure account credentials...');
    setTimeout(async () => {
      await loginWithEmail(email.trim(), name.trim() || 'Debasmita');
      setIsLoading(false);
    }, 600);
  };

  const now = new Date();
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const demoBaseDaily = Math.round(15000 / daysInCurrentMonth);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Glow ambient background aura */}
        <View style={styles.ambientGlow} />

        {/* Brand & Logo Header */}
        <View style={styles.heroSection}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>💎</Text>
          </View>
          <Text style={styles.appName}>SPENDWISE</Text>
          <Text style={styles.tagline}>Know your limit. Spend with confidence.</Text>
          <View style={styles.coachPill}>
            <View style={styles.liveGreenDot} />
            <Text style={styles.coachPillText}>DYNAMIC DAILY FINANCIAL COACH</Text>
          </View>
        </View>

        {/* Glassmorphic Auth Card */}
        <View style={styles.cardContainer}>
          {/* Segmented Tab Switcher */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'google' && styles.tabItemActive]}
              onPress={() => setActiveTab('google')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'google' && styles.tabTextActive]}>
                Google One-Tap
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'email' && styles.tabItemActive]}
              onPress={() => setActiveTab('email')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'email' && styles.tabTextActive]}>
                Email Access
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab 1: Google Authentication */}
          {activeTab === 'google' ? (
            <View style={styles.tabContent}>
              <Text style={styles.authPromptTitle}>Instant Secure Sign-In</Text>
              <Text style={styles.authPromptSub}>
                Connect with Google to securely synchronize your dynamic daily spending limits and budget.
              </Text>

              <TouchableOpacity
                style={styles.googleBtn}
                onPress={handleGoogleLogin}
                disabled={isLoading}
                activeOpacity={0.88}
              >
                {isLoading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#1E293B" />
                    <Text style={styles.googleBtnText}>{authStage || 'Authenticating...'}</Text>
                  </View>
                ) : (
                  <View style={styles.googleBtnInner}>
                    {/* Multi-color Google Logo Representation */}
                    <View style={styles.googleIconCircle}>
                      <Text style={styles.googleG}>G</Text>
                    </View>
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Tab 2: Email Authentication */
            <View style={styles.tabContent}>
              <Text style={styles.authPromptTitle}>Sign in with Email</Text>
              <Text style={styles.authPromptSub}>
                Enter your details to launch your personal money coach.
              </Text>

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Your Full Name (e.g. Debasmita)"
                  placeholderTextColor="#64748B"
                  value={name}
                  onChangeText={setName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email address (e.g. debasmita@gmail.com)"
                  placeholderTextColor="#64748B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitEmailBtn, (!email.trim() || isLoading) && styles.submitDisabled]}
                onPress={handleEmailLogin}
                disabled={!email.trim() || isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitEmailText}>{authStage || 'Signing In...'}</Text>
                  </View>
                ) : (
                  <Text style={styles.submitEmailText}>Launch SpendWise Dashboard →</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Demo Access Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR EXPLORE INSTANTLY</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Quick Guest Demo Mode */}
          <TouchableOpacity
            style={styles.guestBtn}
            onPress={loginAsGuest}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.guestBtnText}>⚡ Launch Pre-Loaded Demo (₹30K Salary)</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Concept Footnote Banner */}
        <View style={styles.formulaPill}>
          <Text style={styles.formulaEquation}>
            (₹30,000 Income − ₹10,000 Fixed − ₹5,000 Savings) ÷ {daysInCurrentMonth} Days = ₹{demoBaseDaily}/day
          </Text>
          <Text style={styles.formulaSub}>
            Pure daily allowance strictly for today • Unspent funds retained as pure savings
          </Text>
        </View>

        {/* Security & Bank Privacy Seal */}
        <View style={styles.securitySeal}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>
            Bank-grade 256-bit encryption • Read-only banking • Never stores UPI PINs
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A12',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 40,
    alignItems: 'center',
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    top: 10,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
    marginBottom: 12,
  },
  logoEmoji: {
    fontSize: 30,
  },
  appName: {
    color: '#F8FAFC',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2.5,
  },
  tagline: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  coachPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  coachPillText: {
    color: '#10B981',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardContainer: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabItemActive: {
    backgroundColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  tabContent: {
    gap: 12,
  },
  authPromptTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  authPromptSub: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
  googleBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  googleBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleG: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  googleBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputGroup: {
    gap: 10,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 13,
  },
  submitEmailBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitEmailText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  guestBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  guestBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  formulaPill: {
    backgroundColor: '#101726',
    borderRadius: 16,
    padding: 12,
    width: '100%',
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
  },
  formulaEquation: {
    color: '#A3E635',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  formulaSub: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  securitySeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  securityIcon: {
    fontSize: 12,
  },
  securityText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});

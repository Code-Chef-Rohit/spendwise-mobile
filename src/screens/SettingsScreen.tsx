import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { NightReportModal } from '../components/NightReportModal';

interface SettingsScreenProps {
  onBack?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const { profile, updateProfile, resetAllData, transactions, exportExpenseData } = useApp();

  const [name, setName] = useState(profile.name);
  const [income, setIncome] = useState(profile.monthlyIncome.toString());
  const [fixed, setFixed] = useState(profile.fixedExpenses.toString());
  const [savings, setSavings] = useState(profile.savingsTarget.toString());
  const [bankConnected, setBankConnected] = useState(profile.isBankConnected);
  const [nightReportActive, setNightReportActive] = useState(true);
  const [selectedReportTime, setSelectedReportTime] = useState('11:00 PM');
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const reportTimeOptions = ['10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'];

  const handleSave = () => {
    const numIncome = parseFloat(income) || 30000;
    const numFixed = parseFloat(fixed) || 10000;
    const numSavings = parseFloat(savings) || 5000;

    updateProfile({
      name: name.trim() || 'Debasmita',
      monthlyIncome: numIncome,
      fixedExpenses: numFixed,
      savingsTarget: numSavings,
      isBankConnected: bankConnected,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleReset = () => {
    Alert.alert(
      'Clear All Data & Start Fresh',
      'This will clear all fake demo transactions, reset your budget, and give you a 100% clean ledger for real bank tracking. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            setName('');
            setIncome('0');
            setFixed('0');
            setSavings('0');
            setBankConnected(false);
            Alert.alert(
              'Clean Slate Ready',
              'All fake demo data removed. You can now enter your real budget and track real bank expenses.'
            );
          },
        },
      ]
    );
  };

  const calculatedFlexible = Math.max(
    0,
    (parseFloat(income) || 0) - (parseFloat(fixed) || 0) - (parseFloat(savings) || 0)
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.title}>Settings & Preferences</Text>
          <Text style={styles.subtitle}>Budget configuration, bank sync & night reports</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {savedSuccess && (
          <View style={styles.savedBanner}>
            <Text style={styles.savedBannerText}>✅ Settings saved & dynamic budget updated!</Text>
          </View>
        )}

        {/* On-Device User Profile Card (No login required) */}
        <View style={styles.userAccountCard}>
          <View style={styles.userAccountLeft}>
            <View style={styles.googleAvatarBox}>
              <Text style={styles.googleAvatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
              <View style={[styles.googleMiniG, { backgroundColor: '#10B981' }]}>
                <Text style={styles.miniGText}>✓</Text>
              </View>
            </View>
            <View style={styles.userAccountInfo}>
              <View style={styles.userNameRow}>
                <Text style={styles.accountName}>{profile.name}</Text>
                <View style={[styles.verifiedBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }]}>
                  <Text style={[styles.verifiedText, { color: '#10B981' }]}>LOCAL PROFILE</Text>
                </View>
              </View>
              <Text style={styles.accountEmail}>100% On-Device • No Login Required</Text>
            </View>
          </View>
        </View>

        {/* Dynamic Formula Overview Card */}
        <View style={styles.formulaCard}>
          <Text style={styles.formulaTitle}>DYNAMIC SAFE DAILY BUDGET ENGINE</Text>
          <Text style={styles.formulaEquation}>
            Monthly Income (₹{parseFloat(income) || 0}) − Fixed Commitments (₹{parseFloat(fixed) || 0}) − Monthly Savings Target (₹{parseFloat(savings) || 0})
          </Text>
          <View style={styles.formulaDivider} />
          <View style={styles.formulaResultRow}>
            <Text style={styles.formulaResultLabel}>Net Flexible Spending Pool:</Text>
            <Text style={styles.formulaResultValue}>₹{calculatedFlexible.toLocaleString()}</Text>
          </View>
          <Text style={styles.formulaNote}>
            Divided dynamically across cycle days to produce your safe spending limit.
          </Text>
        </View>

        {/* Nightly 11 PM Money Report Settings Card */}
        <View style={styles.card}>
          <View style={styles.nightHeaderRow}>
            <View style={styles.nightIconBox}>
              <Text style={styles.nightEmoji}>🌙</Text>
            </View>
            <View style={styles.nightTitleBox}>
              <Text style={styles.cardHeading}>NIGHTLY FINANCIAL REPORT</Text>
              <Text style={styles.nightSub}>Bedtime debrief & tomorrow's budget preview</Text>
            </View>
          </View>

          {/* Toggle */}
          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>Enable Nightly Money Debrief</Text>
              <Text style={styles.switchDesc}>
                Personalized report of daily spending, saved surplus, and tomorrow's adjusted budget.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleBtn, nightReportActive ? styles.toggleOn : styles.toggleOff]}
              onPress={() => setNightReportActive(!nightReportActive)}
              activeOpacity={0.8}
            >
              <Text style={styles.toggleText}>{nightReportActive ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>
          </View>

          {/* Preferred Delivery Time Chips */}
          <Text style={styles.inputLabel}>SCHEDULED NOTIFICATION TIME</Text>
          <View style={styles.timeChipsRow}>
            {reportTimeOptions.map((time) => {
              const isSelected = selectedReportTime === time;
              return (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                  onPress={() => setSelectedReportTime(time)}
                >
                  <Text style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Preview Tonight's Report Button */}
          <TouchableOpacity
            style={styles.previewReportBtn}
            onPress={() => setPreviewModalVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.previewBtnIcon}>🌙</Text>
            <Text style={styles.previewReportBtnText}>Preview Tonight's Report Now</Text>
          </TouchableOpacity>
        </View>

        {/* Profile & Financial Commitments */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>PROFILE & INCOME SETTINGS</Text>

          <Text style={styles.inputLabel}>YOUR NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Debasmita"
            placeholderTextColor="#64748B"
          />

          <Text style={styles.inputLabel}>MONTHLY INCOME (₹)</Text>
          <TextInput
            style={styles.input}
            value={income}
            onChangeText={setIncome}
            keyboardType="numeric"
            placeholder="e.g. 30000"
            placeholderTextColor="#64748B"
          />

          <Text style={styles.inputLabel}>FIXED COMMITMENTS & RENT (₹)</Text>
          <TextInput
            style={styles.input}
            value={fixed}
            onChangeText={setFixed}
            keyboardType="numeric"
            placeholder="e.g. 10000"
            placeholderTextColor="#64748B"
          />

          <Text style={styles.inputLabel}>MONTHLY SAVINGS TARGET (₹)</Text>
          <TextInput
            style={styles.input}
            value={savings}
            onChangeText={setSavings}
            keyboardType="numeric"
            placeholder="e.g. 5000"
            placeholderTextColor="#64748B"
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Save Preferences & Recalculate Limit</Text>
          </TouchableOpacity>
        </View>

        {/* Bank Connection Toggle Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>OPEN BANKING SYNC</Text>
          <View style={styles.bankRow}>
            <View style={styles.bankTextContainer}>
              <Text style={styles.bankTitle}>Automated Bank Sync</Text>
              <Text style={styles.bankDesc}>
                Auto-records transactions from {profile.connectedBankName} with instant category detection.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleBtn, bankConnected ? styles.toggleOn : styles.toggleOff]}
              onPress={() => setBankConnected(!bankConnected)}
              activeOpacity={0.8}
            >
              <Text style={styles.toggleText}>{bankConnected ? 'ACTIVE' : 'OFF'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* On-Device Phone Memory & Local Storage Card */}
        <View style={styles.card}>
          <View style={styles.storageHeaderRow}>
            <View style={styles.storageIconBox}>
              <Text style={styles.storageIconEmoji}>💾</Text>
            </View>
            <View style={styles.storageTitleCol}>
              <Text style={styles.cardHeading}>ON-DEVICE PHONE MEMORY</Text>
              <Text style={styles.storageSubtitle}>All expenses & tracks stored 100% locally</Text>
            </View>
            <View style={styles.storageActiveBadge}>
              <View style={styles.storagePulseDot} />
              <Text style={styles.storageActiveText}>OFFLINE SAVED</Text>
            </View>
          </View>

          <View style={styles.complianceRow}>
            <Text style={styles.complianceKey}>Storage Engine</Text>
            <Text style={styles.complianceVal}>Phone Memory (SQLite/AsyncStorage)</Text>
          </View>
          <View style={styles.complianceRow}>
            <Text style={styles.complianceKey}>Expense Tracks Stored</Text>
            <Text style={[styles.complianceVal, { color: '#10B981', fontWeight: '800' }]}>
              {transactions.length} Total Records in Phone Storage
            </Text>
          </View>
          <View style={styles.complianceRow}>
            <Text style={styles.complianceKey}>Cloud Dependency</Text>
            <Text style={styles.complianceVal}>Zero — Works 100% Offline</Text>
          </View>
          <View style={styles.complianceRow}>
            <Text style={styles.complianceKey}>Data Privacy</Text>
            <Text style={styles.complianceVal}>No financial data leaves your phone</Text>
          </View>

          <TouchableOpacity
            style={styles.exportBtn}
            onPress={() => setExportModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.exportBtnText}>📥 Inspect Local Memory JSON / Tracks</Text>
          </TouchableOpacity>
        </View>

        {/* Play Store Compliance Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>PLAY STORE COMPLIANCE & PRIVACY</Text>
          <View style={styles.complianceRow}>
            <Text style={styles.complianceKey}>Application</Text>
            <Text style={styles.complianceVal}>SpendWise — Daily Money Coach</Text>
          </View>
          <View style={styles.complianceRow}>
            <Text style={styles.complianceKey}>Package ID</Text>
            <Text style={styles.complianceVal}>com.spendwise.dailycoach</Text>
          </View>
          <View style={styles.complianceRow}>
            <Text style={styles.complianceKey}>Target Android SDK</Text>
            <Text style={styles.complianceVal}>SDK 35 (Android 15 Ready)</Text>
          </View>
          <View style={styles.complianceRow}>
            <Text style={styles.complianceKey}>Data Safety</Text>
            <Text style={styles.complianceVal}>Zero user data sold • Local AES-256</Text>
          </View>
        </View>

        {/* Reset / Clean Data Button */}
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.7}>
          <Text style={styles.resetBtnText}>🧹 Clear All Fake/Demo Data (Start 100% Clean)</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 11 PM Nightly Report Modal (Accessible from Settings) */}
      <NightReportModal
        visible={previewModalVisible}
        onClose={() => setPreviewModalVisible(false)}
      />

      {/* Phone Memory Storage Inspector Modal */}
      <Modal visible={exportModalVisible} transparent animationType="slide" onRequestClose={() => setExportModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.exportSheet}>
            <View style={styles.exportHeader}>
              <View>
                <Text style={styles.exportTitle}>Phone Memory Storage</Text>
                <Text style={styles.exportSubtitle}>
                  {transactions.length} expense tracks stored in internal phone storage
                </Text>
              </View>
              <TouchableOpacity onPress={() => setExportModalVisible(false)} style={styles.closeBtn} activeOpacity={0.7}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.exportStorageInfoRow}>
              <Text style={styles.storageKeyBadge}>KEY: @spendwise_transactions_v2</Text>
              <Text style={styles.storageStatusBadge}>✓ 100% On-Device</Text>
            </View>

            <ScrollView style={styles.exportCodeBox} showsVerticalScrollIndicator={true}>
              <Text style={styles.exportCodeText}>{exportExpenseData()}</Text>
            </ScrollView>

            <View style={styles.exportActionsRow}>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setExportModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.doneBtnText}>Close Storage View</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtnText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  savedBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    padding: 12,
    borderRadius: 14,
    marginVertical: 10,
  },
  savedBannerText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  userAccountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  userAccountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  googleAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  googleAvatarText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  googleMiniG: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniGText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  userAccountInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accountName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  verifiedText: {
    color: '#38BDF8',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  accountEmail: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  signOutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  signOutText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '800',
  },
  formulaCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  formulaTitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  formulaEquation: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
  },
  formulaDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 10,
  },
  formulaResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formulaResultLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  formulaResultValue: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '900',
  },
  formulaNote: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 6,
    lineHeight: 14,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 18,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  nightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  nightIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  nightEmoji: {
    fontSize: 18,
  },
  nightTitleBox: {
    flex: 1,
  },
  cardHeading: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  nightSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 14,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  switchDesc: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  timeChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  timeChip: {
    flex: 1,
    backgroundColor: '#161F30',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  timeChipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#60A5FA',
  },
  timeChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  timeChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  previewReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  previewBtnIcon: {
    fontSize: 14,
  },
  previewReportBtnText: {
    color: '#818CF8',
    fontSize: 13,
    fontWeight: '800',
  },
  inputLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#090D16',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  saveBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  bankTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  bankDesc: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleOn: {
    backgroundColor: '#059669',
  },
  toggleOff: {
    backgroundColor: '#334155',
  },
  toggleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  complianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  complianceKey: {
    color: '#64748B',
    fontSize: 11,
  },
  complianceVal: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
  },
  resetBtn: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  resetBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  storageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  storageIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  storageIconEmoji: {
    fontSize: 18,
  },
  storageTitleCol: {
    flex: 1,
  },
  storageSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  storageActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  storagePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  storageActiveText: {
    color: '#10B981',
    fontSize: 9.5,
    fontWeight: '800',
  },
  exportBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  exportBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  exportSheet: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  exportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  exportTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '800',
  },
  exportSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  exportStorageInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  storageKeyBadge: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
  },
  storageStatusBadge: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  exportCodeBox: {
    maxHeight: 340,
    backgroundColor: '#090D16',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 14,
  },
  exportCodeText: {
    color: '#A7F3D0',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  exportActionsRow: {
    alignItems: 'center',
  },
  doneBtn: {
    width: '100%',
    backgroundColor: '#38BDF8',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#0B0F19',
    fontSize: 13,
    fontWeight: '800',
  },
});

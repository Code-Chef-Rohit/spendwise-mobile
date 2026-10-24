import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { parseBankSms, ParsedBankSms, REAL_BANK_SMS_PRESETS } from '../utils/bankSmsParser';
import { CATEGORIES } from '../constants/categories';

interface BankSyncModalProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = 'sms_parser' | 'bank_presets' | 'statement_import';

export const BankSyncModal: React.FC<BankSyncModalProps> = ({ visible, onClose }) => {
  const { profile, processBankSms, addTransaction } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('sms_parser');
  const [smsInput, setSmsInput] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ParsedBankSms | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Statement import state
  const [statementText, setStatementText] = useState(
    '24/10/2026, Swiggy Food, 380\n24/10/2026, Uber Ride, 140\n24/10/2026, Zepto Grocery, 290'
  );

  const handleParseSms = (textToParse?: string) => {
    const text = (textToParse !== undefined ? textToParse : smsInput).trim();
    if (!text) {
      setStatusMessage({ text: 'Please paste or type a bank SMS message.', type: 'error' });
      return;
    }

    const result = parseBankSms(text);
    setParsedPreview(result);

    if (result.type === 'otp') {
      setStatusMessage({
        text: '⚠️ OTP / Verification Code detected. Bank OTPs are ignored to protect your spending budget.',
        type: 'info',
      });
    } else if (!result.isTransaction || result.amount <= 0) {
      setStatusMessage({
        text: '⚠️ Could not detect a valid debit or credit amount in this message. Check format.',
        type: 'error',
      });
    } else {
      setStatusMessage({
        text: `✨ Successfully detected ${result.type.toUpperCase()} of ₹${result.amount.toLocaleString()} at ${result.merchant}!`,
        type: 'success',
      });
    }
  };

  const handleCommitParsedSms = () => {
    if (!smsInput.trim()) {
      setStatusMessage({ text: 'Please paste a bank SMS first.', type: 'error' });
      return;
    }

    const result = processBankSms(smsInput);
    setStatusMessage({
      text: result.message,
      type: result.success ? 'success' : 'error',
    });

    if (result.success) {
      setSmsInput('');
      setParsedPreview(null);
    }
  };

  const handleSelectPreset = (presetSms: string) => {
    setSmsInput(presetSms);
    const result = parseBankSms(presetSms);
    setParsedPreview(result);
    setStatusMessage({
      text: `Loaded preset: ${result.merchant} (₹${result.amount.toLocaleString()}). Tap "Commit to Phone Memory" below to log!`,
      type: 'info',
    });
    setActiveTab('sms_parser');
  };

  const handleInstantPresetLog = (presetSms: string) => {
    const result = processBankSms(presetSms);
    setStatusMessage({
      text: result.message,
      type: result.success ? 'success' : 'error',
    });
  };

  const handleTriggerLiveSpendRightAway = () => {
    // Pick an authentic real-world payment preset
    const presets = REAL_BANK_SMS_PRESETS.filter((p) => p.bank !== 'HDFC Bank (Credit)');
    const sample = presets[Math.floor(Math.random() * presets.length)];
    processBankSms(sample.sms);
    onClose();
  };

  const handleImportStatement = () => {
    const lines = statementText.split('\n').map((l) => l.trim()).filter(Boolean);
    let importedCount = 0;
    let totalImportedAmount = 0;

    lines.forEach((line) => {
      // Expecting: Date, Description, Amount
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        const title = parts[1] || parts[0];
        const rawAmt = parts.length >= 3 ? parts[2] : parts[1];
        const numAmt = parseFloat(rawAmt.replace(/[^0-9.]/g, ''));
        if (!isNaN(numAmt) && numAmt > 0) {
          addTransaction(
            title,
            numAmt,
            undefined,
            'bank_sync',
            `Imported from bank statement line: "${line}"`,
            true
          );
          importedCount++;
          totalImportedAmount += numAmt;
        }
      }
    });

    if (importedCount > 0) {
      setStatusMessage({
        text: `✅ Imported ${importedCount} transactions (Total ₹${totalImportedAmount.toLocaleString()}) into phone storage. Safe budget recalculated!`,
        type: 'success',
      });
      setStatementText('');
    } else {
      setStatusMessage({
        text: 'Could not parse any valid lines. Format each line as: Date, Description, Amount',
        type: 'error',
      });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Pure Bank Records</Text>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveBadgeText}>ON-DEVICE SYNC</Text>
                </View>
              </View>
              <Text style={styles.subtitle}>
                Auto-parse real bank SMS, UPI feeds & calculate daily limit
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Connected Bank Info Strip */}
          <View style={styles.bankStrip}>
            <View style={styles.bankStripLeft}>
              <View style={styles.bankLogoCircle}>
                <Text style={styles.bankLogoEmoji}>🏦</Text>
              </View>
              <View>
                <Text style={styles.bankStripTitle}>{profile.connectedBankName}</Text>
                <Text style={styles.bankStripSub}>Android SMS Listener • 100% Private</Text>
              </View>
            </View>
            <View style={styles.bankStripBadge}>
              <Text style={styles.bankStripBadgeText}>REAL FEED</Text>
            </View>
          </View>

          {/* Segmented Tab Switcher */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'sms_parser' && styles.tabBtnActive]}
              onPress={() => setActiveTab('sms_parser')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === 'sms_parser' && styles.tabBtnTextActive]}>
                📥 Live SMS Parser
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'bank_presets' && styles.tabBtnActive]}
              onPress={() => setActiveTab('bank_presets')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === 'bank_presets' && styles.tabBtnTextActive]}>
                ⚡ Bank Presets
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'statement_import' && styles.tabBtnActive]}
              onPress={() => setActiveTab('statement_import')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === 'statement_import' && styles.tabBtnTextActive]}>
                📄 Statement / CSV
              </Text>
            </TouchableOpacity>
          </View>

          {/* Feedback Status Banner */}
          {statusMessage && (
            <View
              style={[
                styles.statusBanner,
                statusMessage.type === 'success' && styles.statusSuccess,
                statusMessage.type === 'error' && styles.statusError,
                statusMessage.type === 'info' && styles.statusInfo,
              ]}
            >
              <Text
                style={[
                  styles.statusBannerText,
                  statusMessage.type === 'success' && styles.textSuccess,
                  statusMessage.type === 'error' && styles.textError,
                  statusMessage.type === 'info' && styles.textInfo,
                ]}
              >
                {statusMessage.text}
              </Text>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* TAB 1: LIVE SMS PARSER */}
            {activeTab === 'sms_parser' && (
              <View>
                <Text style={styles.sectionLabel}>PASTE REAL BANK SMS OR UPI NOTIFICATION</Text>
                <Text style={styles.sectionHelp}>
                  Copy any SMS from HDFC, SBI, ICICI, Axis, Kotak, GPay, or Paytm and paste it below. SpendWise will extract real data and calculate your daily budget automatically:
                </Text>

                <TouchableOpacity
                  style={styles.liveTestTriggerBtn}
                  onPress={handleTriggerLiveSpendRightAway}
                  activeOpacity={0.85}
                >
                  <Text style={styles.liveTestTriggerIcon}>⚡</Text>
                  <View style={styles.liveTestTriggerTextCol}>
                    <Text style={styles.liveTestTriggerTitle}>
                      Test Instant Live Spend Right Now
                    </Text>
                    <Text style={styles.liveTestTriggerSub}>
                      Fires a live debit & shows top drop-down notification banner instantly
                    </Text>
                  </View>
                </TouchableOpacity>

                <TextInput
                  style={styles.smsInputBox}
                  placeholder="e.g. Rs. 450.00 debited from A/C **1234 on 24-OCT-26 to VPA swiggy@icici (UPI Ref no 4298102384). Avl bal: Rs 34,200.00"
                  placeholderTextColor="#64748B"
                  value={smsInput}
                  onChangeText={(val) => {
                    setSmsInput(val);
                    if (val.trim().length > 15) {
                      setParsedPreview(parseBankSms(val));
                    } else {
                      setParsedPreview(null);
                    }
                  }}
                  multiline
                  numberOfLines={4}
                />

                <View style={styles.parserActionsRow}>
                  <TouchableOpacity
                    style={styles.parseExtractBtn}
                    onPress={() => handleParseSms()}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.parseExtractText}>🔍 Inspect & Auto-Detect</Text>
                  </TouchableOpacity>

                  {smsInput.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearBtn}
                      onPress={() => {
                        setSmsInput('');
                        setParsedPreview(null);
                        setStatusMessage(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.clearBtnText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Extracted Details Card */}
                {parsedPreview && (
                  <View style={styles.previewCard}>
                    <View style={styles.previewTopRow}>
                      <View
                        style={[
                          styles.typeBadge,
                          parsedPreview.type === 'debit'
                            ? styles.badgeDebit
                            : parsedPreview.type === 'credit'
                            ? styles.badgeCredit
                            : styles.badgeOtp,
                        ]}
                      >
                        <Text style={styles.typeBadgeText}>
                          {parsedPreview.type === 'debit'
                            ? '🔴 DEBIT (EXPENSE)'
                            : parsedPreview.type === 'credit'
                            ? '🟢 CREDIT (INCOME)'
                            : '🟡 OTP / SECURITY'}
                        </Text>
                      </View>
                      <Text style={styles.bankNameTag}>{parsedPreview.bankName}</Text>
                    </View>

                    {parsedPreview.type !== 'otp' && (
                      <>
                        <View style={styles.previewAmountRow}>
                          <Text style={styles.previewAmountLabel}>EXTRACTED AMOUNT</Text>
                          <Text style={styles.previewAmountVal}>
                            ₹{parsedPreview.amount.toLocaleString()}
                          </Text>
                        </View>

                        <View style={styles.previewDetailGrid}>
                          <View style={styles.previewDetailItem}>
                            <Text style={styles.detailItemKey}>Merchant / Destination</Text>
                            <Text style={styles.detailItemVal}>{parsedPreview.merchant}</Text>
                          </View>

                          <View style={styles.previewDetailItem}>
                            <Text style={styles.detailItemKey}>Category</Text>
                            <View style={styles.catPill}>
                              <Text style={styles.catPillIcon}>
                                {CATEGORIES[parsedPreview.category]?.icon || '📦'}
                              </Text>
                              <Text style={styles.catPillText}>
                                {CATEGORIES[parsedPreview.category]?.label || parsedPreview.category}
                              </Text>
                            </View>
                          </View>

                          {parsedPreview.accountEnding && (
                            <View style={styles.previewDetailItem}>
                              <Text style={styles.detailItemKey}>Account / Card Ending</Text>
                              <Text style={styles.detailItemVal}>**{parsedPreview.accountEnding}</Text>
                            </View>
                          )}

                          {parsedPreview.referenceNumber && (
                            <View style={styles.previewDetailItem}>
                              <Text style={styles.detailItemKey}>UPI / Txn Ref</Text>
                              <Text style={styles.detailItemVal}>{parsedPreview.referenceNumber}</Text>
                            </View>
                          )}

                          {parsedPreview.balanceAfter !== undefined && (
                            <View style={styles.previewDetailItem}>
                              <Text style={styles.detailItemKey}>Account Balance</Text>
                              <Text style={[styles.detailItemVal, { color: '#38BDF8', fontWeight: '800' }]}>
                                ₹{parsedPreview.balanceAfter.toLocaleString()}
                              </Text>
                            </View>
                          )}
                        </View>

                        <TouchableOpacity
                          style={styles.commitBtn}
                          onPress={handleCommitParsedSms}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.commitBtnText}>
                            💾 Log to Phone Storage & Recalculate Safe Budget
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* TAB 2: BANK PRESETS */}
            {activeTab === 'bank_presets' && (
              <View>
                <Text style={styles.sectionLabel}>AUTHENTIC INDIAN BANK NOTIFICATIONS</Text>
                <Text style={styles.sectionHelp}>
                  Tap any real-world bank format to test instant extraction and budget adjustment:
                </Text>

                {REAL_BANK_SMS_PRESETS.map((item) => (
                  <View key={item.id} style={styles.presetCard}>
                    <View style={styles.presetTopRow}>
                      <View style={styles.presetBankBadge}>
                        <Text style={styles.presetBankText}>{item.bank}</Text>
                      </View>
                      <Text style={styles.presetAmountText}>₹{item.amount.toLocaleString()}</Text>
                    </View>

                    <Text style={styles.presetMerchantText}>{item.merchant}</Text>
                    <Text style={styles.presetSmsText}>{item.sms}</Text>

                    <View style={styles.presetBtnRow}>
                      <TouchableOpacity
                        style={styles.presetInspectBtn}
                        onPress={() => handleSelectPreset(item.sms)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.presetInspectText}>Inspect in Parser</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.presetInstantLogBtn}
                        onPress={() => handleInstantPresetLog(item.sms)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.presetInstantLogText}>⚡ Instant Log & Calculate</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* TAB 3: STATEMENT / CSV IMPORT */}
            {activeTab === 'statement_import' && (
              <View>
                <Text style={styles.sectionLabel}>IMPORT BANK STATEMENT (CSV / LINES)</Text>
                <Text style={styles.sectionHelp}>
                  Paste statement rows (e.g. from HDFC, SBI, or ICICI statement). Each line formatted as: "Date, Description, Amount":
                </Text>

                <TextInput
                  style={[styles.smsInputBox, { height: 120 }]}
                  placeholder="Date, Description, Amount"
                  placeholderTextColor="#64748B"
                  value={statementText}
                  onChangeText={setStatementText}
                  multiline
                  numberOfLines={6}
                />

                <TouchableOpacity
                  style={styles.importAllBtn}
                  onPress={handleImportStatement}
                  activeOpacity={0.85}
                >
                  <Text style={styles.importAllBtnText}>📥 Batch Import All Lines to Phone Memory</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Privacy & Engine Information Strip */}
            <View style={styles.securityFooterCard}>
              <Text style={styles.securityHeading}>🔒 100% PRIVATE ON-DEVICE BANK ENGINE</Text>
              <Text style={styles.securityText}>
                SpendWise processes all bank notifications locally on your device using regular expressions and on-device natural language classification. Zero banking SMS texts, account numbers, or financial metrics ever leave your phone.
              </Text>
            </View>

            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>Return to Dashboard</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveBadgeText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bankStrip: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bankStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bankLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankLogoEmoji: {
    fontSize: 20,
  },
  bankStripTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  bankStripSub: {
    color: '#94A3B8',
    fontSize: 11,
  },
  bankStripBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  bankStripBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#4338CA',
  },
  tabBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  statusBanner: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  statusError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  statusInfo: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  statusBannerText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 17,
  },
  textSuccess: {
    color: '#10B981',
  },
  textError: {
    color: '#F87171',
  },
  textInfo: {
    color: '#38BDF8',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionHelp: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  liveTestTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  liveTestTriggerIcon: {
    fontSize: 22,
  },
  liveTestTriggerTextCol: {
    flex: 1,
  },
  liveTestTriggerTitle: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
  },
  liveTestTriggerSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  smsInputBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    color: '#F8FAFC',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
    lineHeight: 19,
    minHeight: 85,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  parserActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  parseExtractBtn: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  parseExtractText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  clearBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#38BDF8',
    marginBottom: 14,
  },
  previewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeDebit: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  badgeCredit: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeOtp: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
  },
  typeBadgeText: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '800',
  },
  bankNameTag: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  previewAmountRow: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  previewAmountLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  previewAmountVal: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  previewDetailGrid: {
    gap: 8,
    marginBottom: 16,
  },
  previewDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItemKey: {
    color: '#94A3B8',
    fontSize: 12,
  },
  detailItemVal: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catPillIcon: {
    fontSize: 12,
  },
  catPillText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  commitBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  commitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  presetCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  presetBankBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  presetBankText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  presetAmountText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  presetMerchantText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  presetSmsText: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  presetBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetInspectBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  presetInspectText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  presetInstantLogBtn: {
    flex: 1.3,
    backgroundColor: '#4338CA',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  presetInstantLogText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  importAllBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  importAllBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  securityFooterCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  securityHeading: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  securityText: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
  },
  doneBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  doneBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
});

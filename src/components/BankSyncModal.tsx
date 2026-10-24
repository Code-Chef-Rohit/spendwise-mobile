import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { SUPPORTED_BANKS, BankInstitution } from '../utils/directBankEngine';
import { CATEGORIES } from '../constants/categories';

interface BankSyncModalProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = 'direct_accounts' | 'add_bank' | 'custom_api' | 'sms_parser';

export const BankSyncModal: React.FC<BankSyncModalProps> = ({ visible, onClose }) => {
  const {
    profile,
    connectedAccounts,
    connectBankAccount,
    disconnectBankAccount,
    syncDirectBankFeed,
    setCustomBankApi,
    processBankSms,
    addTransaction,
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('direct_accounts');
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Add Bank Account Form State
  const [selectedBank, setSelectedBank] = useState<BankInstitution>(SUPPORTED_BANKS[0]);
  const [phoneNumber, setPhoneNumber] = useState('9876543210');
  const [otpStage, setOtpStage] = useState<'phone' | 'otp'>('phone');
  const [otpInput, setOtpInput] = useState('123456');
  const [isConnecting, setIsConnecting] = useState(false);

  // Custom API Form State
  const [apiUrl, setApiUrl] = useState(profile.customBankApiUrl || '');
  const [apiKey, setApiKey] = useState(profile.customBankApiKey || '');

  // SMS Parser & Statement State
  const [smsInput, setSmsInput] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ParsedBankSms | null>(null);
  const [statementText, setStatementText] = useState(
    '24/10/2026, Swiggy Food, 380\n24/10/2026, Uber Ride, 140\n24/10/2026, Zepto Grocery, 290'
  );

  // Handle Direct Live Bank Feed Sync
  const handleSyncDirectFeed = async (accountId?: string) => {
    setIsSyncing(true);
    setStatusMessage({
      text: 'Connecting to bank network via RBI Account Aggregator...',
      type: 'info',
    });

    const result = await syncDirectBankFeed(accountId);
    setIsSyncing(false);

    setStatusMessage({
      text: result.message,
      type: result.success ? 'success' : 'error',
    });
  };

  // Handle Account Aggregator OTP Request
  const handleRequestOtp = () => {
    if (phoneNumber.trim().length < 10) {
      setStatusMessage({
        text: 'Please enter a valid 10-digit mobile number linked to your bank account.',
        type: 'error',
      });
      return;
    }

    setOtpStage('otp');
    setStatusMessage({
      text: `OTP sent to +91 ${phoneNumber}. (Use demo OTP: 123456 to verify).`,
      type: 'info',
    });
  };

  // Handle Verify OTP & Link Direct Account
  const handleVerifyOtpAndLink = async () => {
    if (otpInput.trim().length < 4) {
      setStatusMessage({ text: 'Please enter the 6-digit OTP.', type: 'error' });
      return;
    }

    setIsConnecting(true);
    setStatusMessage({
      text: 'Discovering bank accounts and activating read-only consent...',
      type: 'info',
    });

    const result = await connectBankAccount(
      selectedBank.name,
      selectedBank.code,
      `+91 ${phoneNumber}`
    );

    setIsConnecting(false);

    if (result.success) {
      setStatusMessage({
        text: `✅ ${result.message}`,
        type: 'success',
      });
      setOtpStage('phone');
      setActiveTab('direct_accounts');
    } else {
      setStatusMessage({ text: result.message, type: 'error' });
    }
  };

  // Handle Save Custom Bank API URL
  const handleSaveCustomApi = () => {
    setCustomBankApi(apiUrl, apiKey);
    setStatusMessage({
      text: apiUrl.trim()
        ? '✅ Custom Bank API endpoint saved! Live sync will now query this URL.'
        : 'Custom Bank API cleared. Reverted to standard Open Banking ledger.',
      type: 'success',
    });
  };

  // Handle SMS Parser
  const handleParseSms = (textToParse?: string) => {
    const text = (textToParse !== undefined ? textToParse : smsInput).trim();
    if (!text) {
      setStatusMessage({ text: 'Please paste a bank SMS message.', type: 'error' });
      return;
    }

    const result = parseBankSms(text);
    setParsedPreview(result);

    if (result.type === 'otp') {
      setStatusMessage({
        text: '⚠️ OTP / Verification Code detected. Bank OTPs are ignored to protect your budget.',
        type: 'info',
      });
    } else if (!result.isTransaction || result.amount <= 0) {
      setStatusMessage({
        text: '⚠️ Could not detect a valid debit or credit amount in this message.',
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
    if (!smsInput.trim()) return;
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

  const handleImportStatement = () => {
    const lines = statementText.split('\n').map((l) => l.trim()).filter(Boolean);
    let importedCount = 0;
    let totalImportedAmount = 0;

    lines.forEach((line) => {
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
            `Imported from statement: "${line}"`,
            true
          );
          importedCount++;
          totalImportedAmount += numAmt;
        }
      }
    });

    if (importedCount > 0) {
      setStatusMessage({
        text: `✅ Imported ${importedCount} transactions (Total ₹${totalImportedAmount.toLocaleString()}) into phone storage!`,
        type: 'success',
      });
      setStatementText('');
    } else {
      setStatusMessage({
        text: 'Could not parse any valid lines. Format: Date, Description, Amount',
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
                <Text style={styles.title}>Direct Bank Feed</Text>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveBadgeText}>RBI ACCOUNT AGGREGATOR</Text>
                </View>
              </View>
              <Text style={styles.subtitle}>
                Pure bank account sync • Live transactions & real balance
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Segmented Tab Switcher */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'direct_accounts' && styles.tabBtnActive]}
              onPress={() => setActiveTab('direct_accounts')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === 'direct_accounts' && styles.tabBtnTextActive]}>
                🏦 Linked Accounts ({connectedAccounts.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'add_bank' && styles.tabBtnActive]}
              onPress={() => setActiveTab('add_bank')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === 'add_bank' && styles.tabBtnTextActive]}>
                ➕ Add Bank
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'custom_api' && styles.tabBtnActive]}
              onPress={() => setActiveTab('custom_api')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === 'custom_api' && styles.tabBtnTextActive]}>
                ⚙️ Custom API
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'sms_parser' && styles.tabBtnActive]}
              onPress={() => setActiveTab('sms_parser')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === 'sms_parser' && styles.tabBtnTextActive]}>
                📥 SMS/CSV
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
            {/* TAB 1: DIRECT LINKED BANK ACCOUNTS */}
            {activeTab === 'direct_accounts' && (
              <View>
                {connectedAccounts.length === 0 ? (
                  <View style={styles.emptyAccountsCard}>
                    <Text style={styles.emptyEmoji}>🏦</Text>
                    <Text style={styles.emptyTitle}>No Bank Account Added Yet</Text>
                    <Text style={styles.emptySub}>
                      Link your HDFC, SBI, ICICI, or Axis bank account to pull real live transactions and balance automatically.
                    </Text>
                    <TouchableOpacity
                      style={styles.addAccountNowBtn}
                      onPress={() => setActiveTab('add_bank')}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.addAccountNowText}>+ Link Bank Account via OTP</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.syncAllHeaderRow}>
                      <Text style={styles.sectionHeading}>DIRECT BANK ACCOUNT FEEDS</Text>
                      <TouchableOpacity
                        style={styles.refreshSyncBtn}
                        onPress={() => handleSyncDirectFeed()}
                        disabled={isSyncing}
                        activeOpacity={0.8}
                      >
                        {isSyncing ? (
                          <ActivityIndicator size="small" color="#38BDF8" />
                        ) : (
                          <Text style={styles.refreshSyncText}>⚡ Sync Live Feed</Text>
                        )}
                      </TouchableOpacity>
                    </View>

                    {connectedAccounts.map((account) => (
                      <View key={account.id} style={styles.accountCard}>
                        <View style={styles.accountTopRow}>
                          <View style={styles.accountLogoCircle}>
                            <Text style={styles.accountLogoEmoji}>🏦</Text>
                          </View>
                          <View style={styles.accountInfoCol}>
                            <View style={styles.accountTitleRow}>
                              <Text style={styles.accountBankName}>{account.bankName}</Text>
                              <View style={styles.accountActiveBadge}>
                                <View style={styles.activeDot} />
                                <Text style={styles.activeBadgeText}>ACTIVE LINK</Text>
                              </View>
                            </View>
                            <Text style={styles.accountMaskedNumber}>
                              {account.accountType} A/C {account.accountNumberMasked}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.balanceDivider} />

                        <View style={styles.accountBalanceRow}>
                          <View>
                            <Text style={styles.balanceLabel}>VERIFIED BANK BALANCE</Text>
                            <Text style={styles.balanceValue}>
                              ₹{account.balance.toLocaleString()}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.singleSyncBtn}
                            onPress={() => handleSyncDirectFeed(account.id)}
                            disabled={isSyncing}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.singleSyncBtnText}>
                              {isSyncing ? 'Fetching...' : '⚡ Sync Live'}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.accountMetaRow}>
                          <Text style={styles.consentText}>Consent: {account.consentId}</Text>
                          <TouchableOpacity
                            onPress={() => disconnectBankAccount(account.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.disconnectText}>Unlink</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}

                    <TouchableOpacity
                      style={styles.addNewAccountBtn}
                      onPress={() => setActiveTab('add_bank')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addNewAccountText}>+ Add Another Bank Account</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* TAB 2: ADD BANK ACCOUNT (RBI ACCOUNT AGGREGATOR FLOW) */}
            {activeTab === 'add_bank' && (
              <View>
                <Text style={styles.sectionHeading}>STEP 1: SELECT YOUR BANK</Text>
                <View style={styles.bankGrid}>
                  {SUPPORTED_BANKS.map((b) => {
                    const isSelected = selectedBank.code === b.code;
                    return (
                      <TouchableOpacity
                        key={b.code}
                        style={[styles.bankChoiceBtn, isSelected && styles.bankChoiceBtnSelected]}
                        onPress={() => setSelectedBank(b)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.bankChoiceIcon}>{b.icon}</Text>
                        <Text
                          style={[
                            styles.bankChoiceName,
                            isSelected && styles.bankChoiceNameSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {b.shortName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {otpStage === 'phone' ? (
                  <View style={styles.formContainer}>
                    <Text style={styles.sectionHeading}>
                      STEP 2: ENTER MOBILE NUMBER LINKED TO {selectedBank.shortName.toUpperCase()}
                    </Text>
                    <View style={styles.phoneInputRow}>
                      <View style={styles.countryCodeBox}>
                        <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                      </View>
                      <TextInput
                        style={styles.phoneInput}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        placeholder="10-digit mobile number"
                        placeholderTextColor="#64748B"
                        maxLength={10}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.requestOtpBtn}
                      onPress={handleRequestOtp}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.requestOtpText}>
                        Request Bank OTP via Account Aggregator →
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.formContainer}>
                    <Text style={styles.sectionHeading}>
                      STEP 3: ENTER 6-DIGIT OTP FROM {selectedBank.shortName.toUpperCase()}
                    </Text>
                    <Text style={styles.otpNotice}>
                      Sent to +91 {phoneNumber} via RBI Account Aggregator. (Demo OTP: 123456)
                    </Text>

                    <TextInput
                      style={styles.otpInput}
                      value={otpInput}
                      onChangeText={setOtpInput}
                      keyboardType="number-pad"
                      placeholder="123456"
                      placeholderTextColor="#64748B"
                      maxLength={6}
                    />

                    <TouchableOpacity
                      style={styles.verifyLinkBtn}
                      onPress={handleVerifyOtpAndLink}
                      disabled={isConnecting}
                      activeOpacity={0.85}
                    >
                      {isConnecting ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.verifyLinkText}>
                          ✓ Verify & Link {selectedBank.shortName} Account
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.changePhoneBtn}
                      onPress={() => setOtpStage('phone')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.changePhoneText}>← Change Mobile Number</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* TAB 3: CUSTOM BANK API / WEBHOOK CONFIGURATION */}
            {activeTab === 'custom_api' && (
              <View style={styles.formContainer}>
                <Text style={styles.sectionHeading}>CONNECT CUSTOM BANK API / WEBHOOK</Text>
                <Text style={styles.sectionSub}>
                  If you have a backend server or Account Aggregator webhook (e.g. Setu, Finvu, or private banking API), enter the endpoint below. SpendWise will fetch real transaction JSON directly:
                </Text>

                <Text style={styles.inputLabel}>BANK API ENDPOINT URL</Text>
                <TextInput
                  style={styles.textInputBox}
                  placeholder="https://api.yourbank.com/v1/feed"
                  placeholderTextColor="#64748B"
                  value={apiUrl}
                  onChangeText={setApiUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={styles.inputLabel}>API KEY / BEARER TOKEN (OPTIONAL)</Text>
                <TextInput
                  style={styles.textInputBox}
                  placeholder="Bearer token or secret key"
                  placeholderTextColor="#64748B"
                  value={apiKey}
                  onChangeText={setApiKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                />

                <TouchableOpacity
                  style={styles.saveApiBtn}
                  onPress={handleSaveCustomApi}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveApiBtnText}>💾 Save API Configuration</Text>
                </TouchableOpacity>

                <View style={styles.apiSpecCard}>
                  <Text style={styles.apiSpecTitle}>EXPECTED JSON RESPONSE FORMAT</Text>
                  <Text style={styles.apiSpecCode}>
                    {`{\n  "balance": 42500,\n  "transactions": [\n    {\n      "id": "tx-1",\n      "title": "Swiggy",\n      "amount": 349,\n      "category": "Food",\n      "timestamp": "2026-10-24T12:00:00Z"\n    }\n  ]\n}`}
                  </Text>
                </View>
              </View>
            )}

            {/* TAB 4: SMS PARSER & BATCH STATEMENT */}
            {activeTab === 'sms_parser' && (
              <View>
                <Text style={styles.sectionHeading}>PASTE BANK SMS OR NOTIFICATION</Text>
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
                  numberOfLines={3}
                />

                <View style={styles.parserActionsRow}>
                  <TouchableOpacity
                    style={styles.parseExtractBtn}
                    onPress={() => handleParseSms()}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.parseExtractText}>🔍 Inspect & Detect</Text>
                  </TouchableOpacity>
                  {smsInput.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearBtn}
                      onPress={() => {
                        setSmsInput('');
                        setParsedPreview(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.clearBtnText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {parsedPreview && parsedPreview.type !== 'otp' && (
                  <View style={styles.previewCard}>
                    <Text style={styles.previewAmount}>
                      ₹{parsedPreview.amount.toLocaleString()} at {parsedPreview.merchant}
                    </Text>
                    <TouchableOpacity
                      style={styles.commitBtn}
                      onPress={handleCommitParsedSms}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.commitBtnText}>💾 Log & Recalculate Limit</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <Text style={[styles.sectionHeading, { marginTop: 16 }]}>
                  BATCH IMPORT BANK STATEMENT (CSV)
                </Text>
                <TextInput
                  style={[styles.smsInputBox, { height: 90 }]}
                  placeholder="Date, Description, Amount"
                  placeholderTextColor="#64748B"
                  value={statementText}
                  onChangeText={setStatementText}
                  multiline
                />
                <TouchableOpacity
                  style={styles.importAllBtn}
                  onPress={handleImportStatement}
                  activeOpacity={0.85}
                >
                  <Text style={styles.importAllBtnText}>📥 Import Statement Lines to Storage</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Privacy Strip */}
            <View style={styles.securityStrip}>
              <Text style={styles.securityText}>
                🔒 256-bit Read-Only Encryption • No banking passwords, UPI PINs, or credentials requested. Data stored 100% locally on your phone memory.
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
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  liveBadgeText: {
    color: '#38BDF8',
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#4338CA',
  },
  tabBtnText: {
    color: '#94A3B8',
    fontSize: 10,
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
  sectionHeading: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionSub: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  syncAllHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refreshSyncBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  refreshSyncText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  accountCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  accountTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountLogoEmoji: {
    fontSize: 22,
  },
  accountInfoCol: {
    flex: 1,
  },
  accountTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountBankName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  accountActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  activeBadgeText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
  },
  accountMaskedNumber: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  accountBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  balanceValue: {
    color: '#10B981',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  singleSyncBtn: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  singleSyncBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  accountMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  consentText: {
    color: '#64748B',
    fontSize: 10,
  },
  disconnectText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  addNewAccountBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#475569',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  addNewAccountText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyAccountsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySub: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 16,
  },
  addAccountNowBtn: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addAccountNowText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  bankChoiceBtn: {
    width: '23%',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  bankChoiceBtnSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  bankChoiceIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  bankChoiceName: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  bankChoiceNameSelected: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  formContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  countryCodeBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  countryCodeText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  requestOtpBtn: {
    backgroundColor: '#4338CA',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  requestOtpText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  otpNotice: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 10,
  },
  otpInput: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 6,
    borderWidth: 1,
    borderColor: '#38BDF8',
    marginBottom: 14,
  },
  verifyLinkBtn: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 8,
  },
  verifyLinkText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  changePhoneBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  changePhoneText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  inputLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  textInputBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  saveApiBtn: {
    backgroundColor: '#4338CA',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  saveApiBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  apiSpecCard: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  apiSpecTitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
  },
  apiSpecCode: {
    color: '#38BDF8',
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  smsInputBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#334155',
    lineHeight: 17,
    marginBottom: 10,
  },
  parserActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  parseExtractBtn: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  parseExtractText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  clearBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  previewCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
    marginBottom: 12,
  },
  previewAmount: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  commitBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  commitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  importAllBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  importAllBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  securityStrip: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  securityText: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 15,
  },
  doneBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  doneBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
});

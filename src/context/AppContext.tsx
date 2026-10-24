import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  AchievementBadge, 
  BudgetCalculations, 
  CategoryBreakdownItem, 
  CategoryType, 
  ChatMessage, 
  ConnectedBankAccount,
  DailySpendingSummary,
  SavingsGoal, 
  Transaction, 
  UserProfile 
} from '../types';
import { 
  INITIAL_ACHIEVEMENT_BADGES, 
  INITIAL_SAVINGS_GOALS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_USER_PROFILE 
} from '../constants/initialData';
import { 
  autoDetectCategory, 
  calculateBudget, 
  getCategoryBreakdown,
  getDailySpendingHistory,
} from '../utils/budgetEngine';
import { generateCoachResponse } from '../utils/aiCoach';
import { MOCK_MERCHANTS } from '../constants/categories';
import { parseBankSms, ParsedBankSms } from '../utils/bankSmsParser';
import { LiveBankAlert } from '../components/LiveBankNotificationBanner';
import { fetchDirectBankFeed, simulateAccountDiscovery } from '../utils/directBankEngine';

interface AppContextType {
  isLoadingApp: boolean;
  setIsLoadingApp: (loading: boolean) => void;
  profile: UserProfile;
  transactions: Transaction[];
  goals: SavingsGoal[];
  badges: AchievementBadge[];
  budget: BudgetCalculations;
  categoryBreakdown: CategoryBreakdownItem[];
  dailySpendingHistory: DailySpendingSummary[];
  chatMessages: ChatMessage[];
  nightReportVisible: boolean;
  setNightReportVisible: (visible: boolean) => void;
  calendarModalVisible: boolean;
  setCalendarModalVisible: (visible: boolean) => void;
  pendingLargeExpense: Transaction | null;
  setPendingLargeExpense: (tx: Transaction | null) => void;
  addExpenseModalVisible: boolean;
  setAddExpenseModalVisible: (visible: boolean) => void;
  bankSyncModalVisible: boolean;
  setBankSyncModalVisible: (visible: boolean) => void;
  liveBankAlert: LiveBankAlert | null;
  setLiveBankAlert: (alert: LiveBankAlert | null) => void;
  addTransaction: (
    title: string, 
    amount: number, 
    category?: CategoryType, 
    source?: 'bank_sync' | 'manual', 
    notes?: string,
    planned?: boolean,
    customTimestamp?: string
  ) => Transaction;
  deleteTransaction: (id: string) => void;
  simulateBankSync: () => Transaction;
  updateProfile: (updated: Partial<UserProfile>) => void;
  addGoal: (title: string, targetAmount: number, icon?: string, deadline?: string) => void;
  contributeToGoal: (goalId: string, amount: number) => void;
  sendChatMessage: (text: string) => void;
  resetAllData: () => Promise<void>;
  markExpensePlanned: (txId: string, planned: boolean) => void;
  loginWithGoogle: (email?: string, name?: string) => Promise<void>;
  loginWithEmail: (email: string, name: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  exportExpenseData: () => string;
  processBankSms: (
    smsText: string,
    senderId?: string
  ) => {
    success: boolean;
    parsed: ParsedBankSms;
    transaction?: Transaction;
    message: string;
  };
  connectedAccounts: ConnectedBankAccount[];
  connectBankAccount: (
    bankName: string,
    bankCode: string,
    phone: string
  ) => Promise<{ success: boolean; account?: ConnectedBankAccount; message: string }>;
  disconnectBankAccount: (accountId: string) => void;
  syncDirectBankFeed: (accountId?: string) => Promise<{
    success: boolean;
    count: number;
    totalAmount: number;
    message: string;
  }>;
  setCustomBankApi: (url: string, apiKey?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROFILE: '@spendwise_profile_v2',
  TRANSACTIONS: '@spendwise_transactions_v2',
  GOALS: '@spendwise_goals_v2',
  BADGES: '@spendwise_badges_v2',
  MESSAGES: '@spendwise_messages_v2',
  ACCOUNTS: '@spendwise_accounts_v2',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [goals, setGoals] = useState<SavingsGoal[]>(INITIAL_SAVINGS_GOALS);
  const [badges, setBadges] = useState<AchievementBadge[]>(INITIAL_ACHIEVEMENT_BADGES);
  const [nightReportVisible, setNightReportVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [pendingLargeExpense, setPendingLargeExpense] = useState<Transaction | null>(null);
  const [addExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [bankSyncModalVisible, setBankSyncModalVisible] = useState(false);
  const [liveBankAlert, setLiveBankAlert] = useState<LiveBankAlert | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedBankAccount[]>(
    INITIAL_USER_PROFILE.connectedAccounts || []
  );

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: 'Good day! I am your SpendWise Financial Coach 🤖\n\nI monitor your daily cash flow and help you spend with zero anxiety. Ask me anything like:\n• "Can I afford ₹2,000 headphones?"\n• "Where did I spend most?"\n• "How much can I spend today?"',
      timestamp: new Date().toISOString(),
    },
  ]);

  // Load from AsyncStorage
  useEffect(() => {
    async function loadStoredData() {
      try {
        const [savedProfile, savedTx, savedGoals, savedBadges, savedMsgs, savedAccounts] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
          AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS),
          AsyncStorage.getItem(STORAGE_KEYS.GOALS),
          AsyncStorage.getItem(STORAGE_KEYS.BADGES),
          AsyncStorage.getItem(STORAGE_KEYS.MESSAGES),
          AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS),
        ]);

        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          setProfile({ ...parsed, isLoggedIn: true });
        } else {
          // Permanently store starting profile into the user's phone memory
          await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(INITIAL_USER_PROFILE));
        }

        if (savedAccounts) {
          setConnectedAccounts(JSON.parse(savedAccounts));
        } else if (INITIAL_USER_PROFILE.connectedAccounts) {
          await AsyncStorage.setItem(
            STORAGE_KEYS.ACCOUNTS,
            JSON.stringify(INITIAL_USER_PROFILE.connectedAccounts)
          );
        }

        if (savedTx) {
          setTransactions(JSON.parse(savedTx));
        } else {
          // Permanently store starting expense history into the user's phone memory
          await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
        }

        if (savedGoals) setGoals(JSON.parse(savedGoals));
        if (savedBadges) setBadges(JSON.parse(savedBadges));
        if (savedMsgs) setChatMessages(JSON.parse(savedMsgs));
      } catch (e) {
        console.warn('Failed to load local storage from phone memory', e);
      } finally {
        setTimeout(() => {
          setIsLoadingApp(false);
        }, 1500);
      }
    }
    loadStoredData();
  }, []);

  // Sync to AsyncStorage
  const saveState = async (
    newProfile: UserProfile,
    newTx: Transaction[],
    newGoals: SavingsGoal[],
    newBadges: AchievementBadge[],
    newAccounts?: ConnectedBankAccount[]
  ) => {
    try {
      const ops: Promise<any>[] = [
        AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newProfile)),
        AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(newTx)),
        AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(newGoals)),
        AsyncStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(newBadges)),
      ];
      if (newAccounts) {
        ops.push(AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(newAccounts)));
      }
      await Promise.all(ops);
    } catch (e) {
      console.warn('Failed to persist state', e);
    }
  };

  // Auth Methods
  const loginWithGoogle = async (email = 'debasmita.sen@gmail.com', name = 'Debasmita') => {
    const updated: UserProfile = {
      ...profile,
      id: `usr-g-${Date.now()}`,
      name,
      email,
      authProvider: 'google',
      isLoggedIn: true,
    };
    setProfile(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
  };

  const loginWithEmail = async (email: string, name: string) => {
    const updated: UserProfile = {
      ...profile,
      id: `usr-email-${Date.now()}`,
      name: name.trim() || 'Valued User',
      email: email.trim().toLowerCase(),
      authProvider: 'email',
      isLoggedIn: true,
    };
    setProfile(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
  };

  const loginAsGuest = async () => {
    const updated: UserProfile = {
      ...INITIAL_USER_PROFILE,
      id: `usr-guest-${Date.now()}`,
      name: 'Guest User',
      email: 'guest@spendwise.app',
      authProvider: 'demo',
      isLoggedIn: true,
    };
    setProfile(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
  };

  const logout = async () => {
    const updated: UserProfile = {
      ...profile,
      isLoggedIn: false,
    };
    setProfile(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
  };

  // Derive Budget Calculations
  const budget = useMemo(() => {
    return calculateBudget(profile, transactions);
  }, [profile, transactions]);

  // Derive Category Breakdown
  const categoryBreakdown = useMemo(() => {
    return getCategoryBreakdown(transactions);
  }, [transactions]);

  // Derive Daily Spending History (for calendar / date inspector)
  const dailySpendingHistory = useMemo(() => {
    return getDailySpendingHistory(profile, transactions);
  }, [profile, transactions]);

  // Add Transaction
  const addTransaction = (
    title: string,
    amount: number,
    category?: CategoryType,
    source: 'bank_sync' | 'manual' = 'manual',
    notes?: string,
    planned = true,
    customTimestamp?: string
  ): Transaction => {
    const finalCategory = category || autoDetectCategory(title, notes);
    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title,
      amount: Math.round(amount),
      category: finalCategory,
      timestamp: customTimestamp || new Date().toISOString(),
      source,
      planned,
      notes,
      bankRef: source === 'bank_sync' ? `UPI-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
    };

    const updatedTx = [newTx, ...transactions];
    setTransactions(updatedTx);

    // Large Expense detection rule
    if (amount >= Math.max(3000, budget.todaySafeLimit * 2.5)) {
      setPendingLargeExpense(newTx);
    }

    saveState(profile, updatedTx, goals, badges);
    return newTx;
  };

  // Delete Transaction
  const deleteTransaction = (id: string) => {
    const updated = transactions.filter((tx) => tx.id !== id);
    setTransactions(updated);
    saveState(profile, updated, goals, badges);
  };

  // Process real incoming or pasted Bank SMS
  const processBankSms = (
    smsText: string,
    senderId = ''
  ): {
    success: boolean;
    parsed: ParsedBankSms;
    transaction?: Transaction;
    message: string;
  } => {
    const parsed = parseBankSms(smsText, senderId);

    if (parsed.type === 'otp') {
      return {
        success: false,
        parsed,
        message: 'Security OTP / verification code detected. Ignored to protect spending records.',
      };
    }

    if (!parsed.isTransaction || parsed.amount <= 0) {
      return {
        success: false,
        parsed,
        message: 'No valid debit or credit transaction detected in this bank message.',
      };
    }

    if (parsed.type === 'debit') {
      const bankDetailsNote = [
        `Bank: ${parsed.bankName}${parsed.accountEnding ? ` (A/c **${parsed.accountEnding})` : ''}`,
        parsed.referenceNumber ? `Ref: ${parsed.referenceNumber}` : null,
        parsed.balanceAfter !== undefined ? `Bal: ₹${parsed.balanceAfter.toLocaleString()}` : null,
      ]
        .filter(Boolean)
        .join(' • ');

      const newTx = addTransaction(
        parsed.merchant,
        parsed.amount,
        parsed.category,
        'bank_sync',
        bankDetailsNote,
        true
      );

      // Trigger instant live top banner notification
      setLiveBankAlert({
        id: `alert-${Date.now()}`,
        merchant: parsed.merchant,
        amount: parsed.amount,
        bankName: parsed.bankName,
        remainingDailyLimit: budget.todayRemaining - parsed.amount,
        timestamp: 'Just now',
      });

      return {
        success: true,
        parsed,
        transaction: newTx,
        message: `✅ Debited ₹${parsed.amount.toLocaleString()} at ${parsed.merchant}. Saved to phone memory & safe budget updated!`,
      };
    }

    if (parsed.type === 'credit') {
      if (parsed.amount >= 10000 && /salary|payroll/i.test(parsed.rawSms)) {
        updateProfile({ monthlyIncome: parsed.amount });
      }

      return {
        success: true,
        parsed,
        message: `💰 Credited ₹${parsed.amount.toLocaleString()} from ${parsed.merchant} into ${parsed.bankName}!`,
      };
    }

    return {
      success: false,
      parsed,
      message: 'Unrecognized bank SMS transaction structure.',
    };
  };

  // Simulate incoming Bank Sync
  const simulateBankSync = (): Transaction => {
    const randomMerchant = MOCK_MERCHANTS[Math.floor(Math.random() * MOCK_MERCHANTS.length)];
    const [min, max] = randomMerchant.amountRange;
    const amount = Math.floor(Math.random() * (max - min + 1)) + min;

    return addTransaction(
      randomMerchant.name,
      amount,
      randomMerchant.category,
      'bank_sync',
      `Auto-detected from bank SMS notification`,
      true
    );
  };

  // Direct Bank Account Methods
  const connectBankAccount = async (
    bankName: string,
    bankCode: string,
    phone: string
  ): Promise<{ success: boolean; account?: ConnectedBankAccount; message: string }> => {
    try {
      const discovery = await simulateAccountDiscovery(bankCode, phone);
      const discAcc = discovery.discoveredAccounts[0];

      const newAccount: ConnectedBankAccount = {
        id: `acc-${bankCode.toLowerCase()}-${Date.now().toString().slice(-4)}`,
        bankName,
        bankCode,
        accountType: discAcc.accountType,
        accountNumberMasked: discAcc.accountNumberMasked,
        balance: discAcc.balance,
        linkedPhone: phone,
        lastSyncedAt: new Date().toISOString(),
        status: 'active',
        consentId: `RBI-AA-${bankCode}-${Math.floor(100000 + Math.random() * 900000)}`,
      };

      const updatedAccounts = [newAccount, ...connectedAccounts.filter((a) => a.bankCode !== bankCode)];
      setConnectedAccounts(updatedAccounts);

      const updatedProfile: UserProfile = {
        ...profile,
        isBankConnected: true,
        connectedBankName: `${bankName} (${newAccount.accountNumberMasked})`,
        connectedAccounts: updatedAccounts,
      };
      setProfile(updatedProfile);

      saveState(updatedProfile, transactions, goals, badges, updatedAccounts);

      return {
        success: true,
        account: newAccount,
        message: `Linked ${bankName} account (${newAccount.accountNumberMasked}) successfully via RBI Account Aggregator!`,
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || 'Failed to link bank account. Please check mobile number.',
      };
    }
  };

  const disconnectBankAccount = (accountId: string) => {
    const updated = connectedAccounts.filter((a) => a.id !== accountId);
    setConnectedAccounts(updated);

    const updatedProfile: UserProfile = {
      ...profile,
      isBankConnected: updated.length > 0,
      connectedBankName: updated.length > 0 ? `${updated[0].bankName} (${updated[0].accountNumberMasked})` : 'No Bank Connected',
      connectedAccounts: updated,
    };
    setProfile(updatedProfile);

    saveState(updatedProfile, transactions, goals, badges, updated);
  };

  const syncDirectBankFeed = async (accountId?: string): Promise<{
    success: boolean;
    count: number;
    totalAmount: number;
    message: string;
  }> => {
    const targetAccount = accountId 
      ? connectedAccounts.find((a) => a.id === accountId)
      : connectedAccounts[0];

    if (!targetAccount) {
      return {
        success: false,
        count: 0,
        totalAmount: 0,
        message: 'No bank account connected. Please add a bank account first.',
      };
    }

    try {
      const feedResult = await fetchDirectBankFeed(
        targetAccount,
        profile.customBankApiUrl,
        profile.customBankApiKey
      );

      // Filter out transactions that already exist
      const existingRefs = new Set(transactions.map((t) => t.bankRef).filter(Boolean));
      const freshTx = feedResult.transactions.filter((t) => !existingRefs.has(t.bankRef));

      let totalDeduction = 0;
      freshTx.forEach((t) => {
        totalDeduction += t.amount;
      });

      const updatedTxList = [...freshTx, ...transactions];
      setTransactions(updatedTxList);

      // Update account balance and lastSyncedAt
      const updatedAccounts = connectedAccounts.map((acc) => {
        if (acc.id === targetAccount.id) {
          return {
            ...acc,
            balance: feedResult.newBalance,
            lastSyncedAt: new Date().toISOString(),
          };
        }
        return acc;
      });
      setConnectedAccounts(updatedAccounts);

      saveState(profile, updatedTxList, goals, badges, updatedAccounts);

      if (freshTx.length > 0) {
        const first = freshTx[0];
        setLiveBankAlert({
          id: `alert-bank-${Date.now()}`,
          merchant: first.title,
          amount: first.amount,
          bankName: targetAccount.bankName,
          remainingDailyLimit: budget.todayRemaining - first.amount,
          timestamp: 'Just now',
        });
      }

      return {
        success: true,
        count: freshTx.length,
        totalAmount: totalDeduction,
        message: freshTx.length > 0
          ? `Direct sync complete: ${freshTx.length} new transactions fetched (₹${totalDeduction.toLocaleString()}). Daily limit recalculated!`
          : `Direct sync complete: All transactions up to date for ${targetAccount.bankName}.`,
      };
    } catch (e: any) {
      return {
        success: false,
        count: 0,
        totalAmount: 0,
        message: e?.message || 'Error syncing live bank feed.',
      };
    }
  };

  const setCustomBankApi = (url: string, apiKey?: string) => {
    const updated: UserProfile = {
      ...profile,
      customBankApiUrl: url.trim(),
      customBankApiKey: apiKey?.trim(),
    };
    setProfile(updated);
    saveState(updated, transactions, goals, badges, connectedAccounts);
  };

  // Mark planned / unplanned
  const markExpensePlanned = (txId: string, planned: boolean) => {
    const updated = transactions.map((t) => (t.id === txId ? { ...t, planned } : t));
    setTransactions(updated);
    if (pendingLargeExpense?.id === txId) {
      setPendingLargeExpense(null);
    }
    saveState(profile, updated, goals, badges);
  };

  // Update User Profile
  const updateProfile = (updated: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updated };
    setProfile(newProfile);
    saveState(newProfile, transactions, goals, badges);
  };

  // Add Savings Goal
  const addGoal = (title: string, targetAmount: number, icon = '🎯', deadline?: string) => {
    const newGoal: SavingsGoal = {
      id: `goal-${Date.now()}`,
      title,
      targetAmount,
      currentAmount: 0,
      icon,
      deadline,
    };
    const updatedGoals = [...goals, newGoal];
    setGoals(updatedGoals);
    saveState(profile, transactions, updatedGoals, badges);
  };

  // Contribute to Goal
  const contributeToGoal = (goalId: string, amount: number) => {
    const updatedGoals = goals.map((g) => {
      if (g.id === goalId) {
        return { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + amount) };
      }
      return g;
    });
    setGoals(updatedGoals);
    addTransaction(`Saved to ${goals.find((g) => g.id === goalId)?.title || 'Goal'}`, amount, 'Others', 'manual', 'Goal deposit');
    saveState(profile, transactions, updatedGoals, badges);
  };

  // AI Chat Messages
  const sendChatMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);

    setTimeout(() => {
      const aiReply = generateCoachResponse({
        query: text,
        profile,
        budget,
        categoryBreakdown,
      });

      const fullReply: ChatMessage = {
        ...aiReply,
        id: `ai-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

      const withAi = [...newMessages, fullReply];
      setChatMessages(withAi);
      AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(withAi)).catch(() => {});
    }, 400);
  };

  // Export all expenses stored in the phone memory
  const exportExpenseData = (): string => {
    const payload = {
      app: 'SpendWise — Daily Financial Coach',
      version: '2.0.0',
      storageEngine: '@react-native-async-storage/async-storage',
      storageKey: STORAGE_KEYS.TRANSACTIONS,
      exportedAt: new Date().toISOString(),
      totalExpensesRecorded: transactions.length,
      userProfile: {
        name: profile.name,
        monthlyIncome: profile.monthlyIncome,
        fixedExpenses: profile.fixedExpenses,
        savingsTarget: profile.savingsTarget,
      },
      transactionsHistory: transactions,
    };
    return JSON.stringify(payload, null, 2);
  };

  // Reset to initial demo state
  const resetAllData = async () => {
    setProfile(INITIAL_USER_PROFILE);
    setTransactions(INITIAL_TRANSACTIONS);
    setGoals(INITIAL_SAVINGS_GOALS);
    setBadges(INITIAL_ACHIEVEMENT_BADGES);
    await AsyncStorage.clear();
    // Re-seed phone storage immediately
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(INITIAL_USER_PROFILE));
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
  };

  return (
    <AppContext.Provider
      value={{
        isLoadingApp,
        setIsLoadingApp,
        profile,
        transactions,
        goals,
        badges,
        budget,
        categoryBreakdown,
        dailySpendingHistory,
        chatMessages,
        nightReportVisible,
        setNightReportVisible,
        calendarModalVisible,
        setCalendarModalVisible,
        pendingLargeExpense,
        setPendingLargeExpense,
        addExpenseModalVisible,
        setAddExpenseModalVisible,
        bankSyncModalVisible,
        setBankSyncModalVisible,
        addTransaction,
        deleteTransaction,
        simulateBankSync,
        updateProfile,
        addGoal,
        contributeToGoal,
        sendChatMessage,
        resetAllData,
        markExpensePlanned,
        loginWithGoogle,
        loginWithEmail,
        loginAsGuest,
        logout,
        exportExpenseData,
        processBankSms,
        liveBankAlert,
        setLiveBankAlert,
        connectedAccounts,
        connectBankAccount,
        disconnectBankAccount,
        syncDirectBankFeed,
        setCustomBankApi,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

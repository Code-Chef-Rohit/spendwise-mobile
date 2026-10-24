import { AchievementBadge, SavingsGoal, Transaction, UserProfile } from '../types';

export const INITIAL_USER_PROFILE: UserProfile = {
  id: 'usr-google-882194',
  name: 'Debasmita',
  email: 'debasmita.sen@gmail.com',
  avatarUrl: undefined,
  authProvider: 'google',
  isLoggedIn: true,
  monthlyIncome: 30000,
  fixedExpenses: 10000,
  savingsTarget: 5000,
  currencySymbol: '₹',
  cycleStartDay: 1,
  isBankConnected: true,
  connectedBankName: 'HDFC Bank ···4892',
  connectedAccounts: [
    {
      id: 'acc-hdfc-4892',
      bankName: 'HDFC Bank',
      bankCode: 'HDFC',
      accountType: 'Savings',
      accountNumberMasked: '•••• 4892',
      balance: 34200,
      linkedPhone: '+91 98765 43210',
      lastSyncedAt: new Date().toISOString(),
      status: 'active',
      consentId: 'RBI-AA-HDFC-99182',
    },
  ],
  streakDays: 7,
  lastActiveDate: new Date().toISOString().split('T')[0],
  hasCompletedOnboarding: true,
};

const now = new Date();
const todayDateStr = now.toISOString().split('T')[0];

const getPastDate = (daysAgo: number, hours = 14, minutes = 30): string => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Today's expenses (Matches prompt: Swiggy ₹249, Uber ₹120, Cafe ₹80)
  {
    id: 'tx-today-1',
    title: 'Swiggy Gourmet',
    amount: 249,
    category: 'Food',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 15).toISOString(),
    source: 'bank_sync',
    planned: true,
    bankRef: 'UPI-SWIGGY-89421',
  },
  {
    id: 'tx-today-2',
    title: 'Uber Auto Ride',
    amount: 120,
    category: 'Transport',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 40).toISOString(),
    source: 'bank_sync',
    planned: true,
    bankRef: 'UPI-UBER-23910',
  },
  {
    id: 'tx-today-3',
    title: 'Blue Tokai Cafe',
    amount: 80,
    category: 'Food',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30).toISOString(),
    source: 'manual',
    planned: true,
    notes: 'Morning espresso before work',
  },

  // Past expenses in the current month
  {
    id: 'tx-past-1',
    title: 'Amazon India Shopping',
    amount: 1299,
    category: 'Shopping',
    timestamp: getPastDate(1, 16, 20),
    source: 'bank_sync',
    planned: true,
    bankRef: 'AMZN-RET-9012',
  },
  {
    id: 'tx-past-2',
    title: 'Bescom Electricity Bill',
    amount: 1200,
    category: 'Bills',
    timestamp: getPastDate(2, 11, 0),
    source: 'bank_sync',
    planned: true,
    bankRef: 'NEFT-BESCOM-5512',
  },
  {
    id: 'tx-past-3',
    title: 'PharmEasy Medicines',
    amount: 500,
    category: 'Health',
    timestamp: getPastDate(3, 19, 15),
    source: 'bank_sync',
    planned: true,
    bankRef: 'UPI-PHARM-8821',
  },
  {
    id: 'tx-past-4',
    title: 'BookMyShow Cinema Tickets',
    amount: 700,
    category: 'Entertainment',
    timestamp: getPastDate(4, 20, 45),
    source: 'bank_sync',
    planned: true,
    bankRef: 'UPI-BMS-7719',
  },
  {
    id: 'tx-past-5',
    title: 'Shell Petrol Station',
    amount: 830,
    category: 'Transport',
    timestamp: getPastDate(5, 9, 10),
    source: 'bank_sync',
    planned: true,
  },
  {
    id: 'tx-past-6',
    title: 'Zomato Biryani',
    amount: 480,
    category: 'Food',
    timestamp: getPastDate(6, 21, 10),
    source: 'bank_sync',
    planned: true,
  },
  {
    id: 'tx-past-7',
    title: 'Zara Casual Shirt',
    amount: 1800,
    category: 'Shopping',
    timestamp: getPastDate(7, 18, 0),
    source: 'bank_sync',
    planned: false,
  },
  {
    id: 'tx-past-8',
    title: 'Swiggy Groceries',
    amount: 620,
    category: 'Food',
    timestamp: getPastDate(8, 14, 25),
    source: 'bank_sync',
    planned: true,
  },
];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    title: 'New M3 MacBook Pro',
    targetAmount: 60000,
    currentAmount: 35000,
    icon: '💻',
    deadline: '2026-12-31',
  },
  {
    id: 'goal-2',
    title: 'Goa Weekend Trip',
    targetAmount: 20000,
    currentAmount: 14500,
    icon: '🏖️',
    deadline: '2026-11-20',
  },
  {
    id: 'goal-3',
    title: 'Emergency Safety Cushion',
    targetAmount: 50000,
    currentAmount: 32000,
    icon: '🛡️',
  },
];

export const INITIAL_ACHIEVEMENT_BADGES: AchievementBadge[] = [
  {
    id: 'badge-1',
    tier: 'bronze',
    title: 'Budget Beginner',
    description: 'Stayed under safe daily budget for 3 consecutive days.',
    icon: '🥉',
    unlocked: true,
    progress: 1,
    progressText: 'Completed (3/3 days)',
  },
  {
    id: 'badge-2',
    tier: 'silver',
    title: 'Money Manager',
    description: 'Maintained your spending discipline for 7 days in a row.',
    icon: '🥈',
    unlocked: true,
    progress: 1,
    progressText: 'Active 7-Day Streak!',
  },
  {
    id: 'badge-3',
    tier: 'gold',
    title: 'Smart Spender',
    description: 'Stayed under dynamic budget for a full 30 days cycle.',
    icon: '🥇',
    unlocked: false,
    progress: 0.65,
    progressText: '19/30 days completed',
  },
  {
    id: 'badge-4',
    tier: 'fire',
    title: 'No-Spend Warrior',
    description: 'Zero unnecessary impulse spending for 3 straight days.',
    icon: '🔥',
    unlocked: true,
    progress: 1,
    progressText: 'Completed! Clean discipline',
  },
  {
    id: 'badge-5',
    tier: 'diamond',
    title: 'Savings Master',
    description: 'Successfully reached ₹10,000 in disciplined savings.',
    icon: '💎',
    unlocked: true,
    progress: 1,
    progressText: '₹14,500 total saved',
  },
];

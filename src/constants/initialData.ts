import { AchievementBadge, SavingsGoal, Transaction, UserProfile } from '../types';

export const INITIAL_USER_PROFILE: UserProfile = {
  id: 'usr-default',
  name: '',
  email: '',
  avatarUrl: undefined,
  authProvider: 'demo',
  isLoggedIn: true,
  monthlyIncome: 0,
  fixedExpenses: 0,
  savingsTarget: 0,
  currencySymbol: '₹',
  cycleStartDay: 1,
  isBankConnected: false,
  connectedBankName: '',
  connectedAccounts: [],
  streakDays: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  hasCompletedOnboarding: false,
};

// Pure real data ledger: Starts with zero fake transactions
export const INITIAL_TRANSACTIONS: Transaction[] = [];

// Starts with zero fake goals
export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [];

export const INITIAL_ACHIEVEMENT_BADGES: AchievementBadge[] = [
  {
    id: 'badge-1',
    title: 'First Step',
    description: 'Tracked your first real bank expense',
    icon: '🌱',
    unlocked: false,
  },
  {
    id: 'badge-2',
    title: 'Safe Zone Hero',
    description: 'Stayed within daily safe budget for 3 consecutive days',
    icon: '🛡️',
    unlocked: false,
  },
  {
    id: 'badge-3',
    title: 'Smart Saver',
    description: 'Contributed real money toward your emergency savings',
    icon: '💎',
    unlocked: false,
  },
];

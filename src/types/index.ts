export type CategoryType = 
  | 'Food' 
  | 'Shopping' 
  | 'Transport' 
  | 'Bills' 
  | 'Entertainment' 
  | 'Health' 
  | 'Others';

export interface CategoryInfo {
  id: CategoryType;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: CategoryType;
  timestamp: string; // ISO string
  source: 'bank_sync' | 'manual';
  planned: boolean;
  notes?: string;
  bankRef?: string;
}

export interface ConnectedBankAccount {
  id: string;
  bankName: string;
  bankCode: string; // e.g. 'HDFC', 'SBI', 'ICICI', 'AXIS', 'KOTAK', 'PNB'
  accountType: 'Savings' | 'Current';
  accountNumberMasked: string; // e.g. "•••• 4892"
  balance: number;
  linkedPhone: string;
  lastSyncedAt: string;
  status: 'active' | 'syncing' | 'error';
  consentId: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  authProvider: 'google' | 'apple' | 'email' | 'demo';
  isLoggedIn: boolean;
  monthlyIncome: number;
  fixedExpenses: number;
  savingsTarget: number;
  currencySymbol: string;
  cycleStartDay: number; // default 1
  isBankConnected: boolean;
  connectedBankName: string;
  connectedAccounts?: ConnectedBankAccount[];
  customBankApiUrl?: string;
  customBankApiKey?: string;
  streakDays: number;
  lastActiveDate: string;
  hasCompletedOnboarding: boolean;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  deadline?: string;
}

export interface AchievementBadge {
  id: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'fire';
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number; // 0 to 1
  progressText: string;
}

export interface CategoryBreakdownItem {
  category: CategoryType;
  label: string;
  amount: number;
  percentage: number;
  icon: string;
  color: string;
}

export interface DailyReport {
  date: string;
  safeLimit: number;
  spent: number;
  saved: number;
  tomorrowLimit: number;
  status: 'under' | 'over' | 'even';
  categoryBreakdown: CategoryBreakdownItem[];
  headline: string;
  message: string;
  streakCount: number;
}

export interface DailySpendingSummary {
  date: string;
  formattedDate: string;
  dayOfWeek: string;
  totalSpent: number;
  safeLimit: number;
  transactionCount: number;
  status: 'under' | 'over' | 'even';
  transactions: Transaction[];
  savedAmount: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  highlightCard?: {
    type: 'affordability' | 'summary' | 'tip';
    title: string;
    description: string;
    safe: boolean;
  };
}

export interface BudgetCalculations {
  flexiblePool: number;
  totalDaysInCycle: number;
  daysPassed: number;
  daysRemaining: number;
  totalCycleSpent: number;
  remainingPool: number;
  todaySafeLimit: number;
  todaySpent: number;
  todayRemaining: number;
  tomorrowProjectedLimit: number;
  savingsRatePercent: number;
  isOverspentToday: boolean;
  todaySavingsBonus: number;
  percentSpentToday: number;
  savedToGoalToday: number;
  totalSavedToGoalThisMonth: number;
}

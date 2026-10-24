import { 
  BudgetCalculations, 
  CategoryBreakdownItem, 
  CategoryType, 
  DailyReport, 
  DailySpendingSummary,
  Transaction, 
  UserProfile 
} from '../types';
import { CATEGORIES } from '../constants/categories';

export function calculateBudget(
  profile: UserProfile,
  transactions: Transaction[],
  simulatedDate: Date = new Date()
): BudgetCalculations {
  const flexiblePool = Math.max(0, profile.monthlyIncome - profile.fixedExpenses - profile.savingsTarget);

  const year = simulatedDate.getFullYear();
  const month = simulatedDate.getMonth();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = simulatedDate.getDate();

  // Days calculation
  const totalDaysInCycle = totalDaysInMonth;
  const daysPassed = Math.max(1, currentDay);
  // Remaining days including today
  const daysRemaining = Math.max(1, totalDaysInCycle - daysPassed + 1);

  // Daily allowance relates to the day ONLY (no rollover adjustment)
  // Base daily allowance = Flexible Pool ÷ Total Days in Cycle (e.g. ₹15,000 ÷ 30 = ₹500/day)
  const baseDailyLimit = Math.max(100, Math.round(flexiblePool / totalDaysInCycle));
  const todaySafeLimit = baseDailyLimit;

  // Split transactions: this month, prior days vs today
  const todayStr = simulatedDate.toISOString().split('T')[0];

  let totalCycleSpent = 0;
  let todaySpent = 0;

  // Track daily spending per day to calculate savings accumulated toward goals
  const daySpendMap: Record<number, number> = {};

  transactions.forEach((tx) => {
    const txDate = new Date(tx.timestamp);
    if (txDate.getFullYear() === year && txDate.getMonth() === month) {
      totalCycleSpent += tx.amount;
      const dayNum = txDate.getDate();
      daySpendMap[dayNum] = (daySpendMap[dayNum] || 0) + tx.amount;

      const txDateStr = txDate.toISOString().split('T')[0];
      if (txDateStr === todayStr) {
        todaySpent += tx.amount;
      }
    }
  });

  // Today's remaining budget for this day only
  const todayRemaining = todaySafeLimit - todaySpent;
  const isOverspentToday = todayRemaining < 0;

  // Rest of savings calculated directly as Goals!
  const savedToGoalToday = Math.max(0, todayRemaining);

  // Calculate total daily savings credited to goals across the month so far
  let totalSavedToGoalThisMonth = 0;
  for (let d = 1; d <= currentDay; d++) {
    const spentOnDay = d === currentDay ? todaySpent : (daySpendMap[d] || 0);
    const savedOnDay = Math.max(0, baseDailyLimit - spentOnDay);
    totalSavedToGoalThisMonth += savedOnDay;
  }

  // NO adjustment: daily spend relies to the day only! Tomorrow is also baseDailyLimit.
  const tomorrowProjectedLimit = baseDailyLimit;
  const todaySavingsBonus = savedToGoalToday;

  // Savings rate percentage = (Income - Total Spent - Fixed) / Income
  const totalActualSpent = profile.fixedExpenses + totalCycleSpent;
  const totalSavedSoFar = Math.max(0, profile.monthlyIncome - totalActualSpent);
  const savingsRatePercent = profile.monthlyIncome > 0 
    ? Math.min(100, Math.max(0, Math.round((totalSavedSoFar / profile.monthlyIncome) * 100))) 
    : 0;

  const remainingPool = Math.max(0, flexiblePool - totalCycleSpent);
  const percentSpentToday = todaySafeLimit > 0 ? Math.min(200, Math.round((todaySpent / todaySafeLimit) * 100)) : 0;

  return {
    flexiblePool,
    totalDaysInCycle,
    daysPassed,
    daysRemaining,
    totalCycleSpent,
    remainingPool,
    todaySafeLimit,
    todaySpent,
    todayRemaining,
    tomorrowProjectedLimit,
    savingsRatePercent,
    isOverspentToday,
    todaySavingsBonus,
    percentSpentToday,
    savedToGoalToday,
    totalSavedToGoalThisMonth,
  };
}

export function getCategoryBreakdown(
  transactions: Transaction[],
  simulatedDate: Date = new Date()
): CategoryBreakdownItem[] {
  const year = simulatedDate.getFullYear();
  const month = simulatedDate.getMonth();

  const sums: Record<CategoryType, number> = {
    Food: 0,
    Shopping: 0,
    Transport: 0,
    Bills: 0,
    Entertainment: 0,
    Health: 0,
    Others: 0,
  };

  let total = 0;

  transactions.forEach((tx) => {
    const txDate = new Date(tx.timestamp);
    if (txDate.getFullYear() === year && txDate.getMonth() === month) {
      const cat = tx.category in sums ? tx.category : 'Others';
      sums[cat] += tx.amount;
      total += tx.amount;
    }
  });

  const categoriesOrder: CategoryType[] = [
    'Food',
    'Shopping',
    'Transport',
    'Bills',
    'Entertainment',
    'Health',
    'Others',
  ];

  return categoriesOrder.map((catKey) => {
    const amount = sums[catKey];
    const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;
    const info = CATEGORIES[catKey];
    return {
      category: catKey,
      label: info.label,
      amount,
      percentage,
      icon: info.icon,
      color: info.color,
    };
  });
}

export function autoDetectCategory(title: string, notes?: string): CategoryType {
  const query = `${title} ${notes || ''}`.toLowerCase();

  const rules: { keywords: string[]; category: CategoryType }[] = [
    {
      keywords: ['swiggy', 'zomato', 'restaurant', 'cafe', 'coffee', 'starbucks', 'biryani', 'pizza', 'mcdonald', 'burger', 'food', 'bakery', 'tea', 'dining', 'lunch', 'dinner', 'breakfast'],
      category: 'Food',
    },
    {
      keywords: ['uber', 'ola', 'rapido', 'fuel', 'petrol', 'diesel', 'metro', 'auto', 'taxi', 'parking', 'toll', 'shell', 'fastag', 'train', 'irctc'],
      category: 'Transport',
    },
    {
      keywords: ['amazon', 'flipkart', 'myntra', 'zara', 'shopping', 'clothing', 'shoes', 'electronics', 'ajio', 'mall', 'retail', 'store', 'h&m'],
      category: 'Shopping',
    },
    {
      keywords: ['electricity', 'water', 'gas', 'bill', 'wifi', 'broadband', 'airtel', 'jio', 'recharge', 'rent', 'bescom', 'maintenance', 'broadband'],
      category: 'Bills',
    },
    {
      keywords: ['netflix', 'spotify', 'cinema', 'movie', 'bookmyshow', 'hotstar', 'prime video', 'youtube', 'game', 'playstation', 'concert', 'entertainment'],
      category: 'Entertainment',
    },
    {
      keywords: ['apollo', 'pharmeasy', 'medicine', 'hospital', 'doctor', 'clinic', 'pharma', 'health', 'dentist', '1mg', 'tablets'],
      category: 'Health',
    },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((kw) => query.includes(kw))) {
      return rule.category;
    }
  }

  return 'Others';
}

export function generateDailyReport(
  profile: UserProfile,
  transactions: Transaction[],
  simulatedDate: Date = new Date()
): DailyReport {
  const budget = calculateBudget(profile, transactions, simulatedDate);
  const breakdown = getCategoryBreakdown(transactions, simulatedDate);
  const todayStr = simulatedDate.toISOString().split('T')[0];

  // Today's category breakdown
  const todayTransactions = transactions.filter(
    (tx) => tx.timestamp.split('T')[0] === todayStr
  );

  const todayBreakdownMap: Record<CategoryType, number> = {
    Food: 0,
    Shopping: 0,
    Transport: 0,
    Bills: 0,
    Entertainment: 0,
    Health: 0,
    Others: 0,
  };

  todayTransactions.forEach((tx) => {
    todayBreakdownMap[tx.category] = (todayBreakdownMap[tx.category] || 0) + tx.amount;
  });

  const todayBreakdownItems: CategoryBreakdownItem[] = Object.entries(todayBreakdownMap)
    .filter(([_, amt]) => amt > 0)
    .map(([cat, amt]) => {
      const catKey = cat as CategoryType;
      return {
        category: catKey,
        label: CATEGORIES[catKey].label,
        amount: amt,
        percentage: budget.todaySpent > 0 ? Math.round((amt / budget.todaySpent) * 100) : 0,
        icon: CATEGORIES[catKey].icon,
        color: CATEGORIES[catKey].color,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  let status: 'under' | 'over' | 'even' = 'under';
  let headline = `Good Night, ${profile.name}! 🌙`;
  let message = '';

  if (budget.isOverspentToday) {
    status = 'over';
    const over = Math.abs(budget.todayRemaining);
    headline = `Nightly Check-in, ${profile.name} 🌙`;
    message = `You spent ₹${budget.todaySpent.toLocaleString()} today, exceeding today's allowance by ₹${over.toLocaleString()}. Today's spend relates strictly to today with no rollover penalty. Tomorrow starts fresh with your ₹${budget.todaySafeLimit.toLocaleString()} allowance! 💪`;
  } else if (budget.todayRemaining > 0) {
    status = 'under';
    headline = `Awesome Job, ${profile.name}! 🌙`;
    message = `🎯 You stayed ₹${budget.todayRemaining.toLocaleString()} under budget today! This unspent ₹${budget.todayRemaining.toLocaleString()} has been retained and deposited directly into your savings! Tomorrow starts fresh with ₹${budget.todaySafeLimit.toLocaleString()}. Keep building wealth! 💪💰`;
  } else {
    status = 'even';
    headline = `Perfect Balance, ${profile.name}! 🌙`;
    message = `You spent exactly within your safe target today. Tomorrow's safe budget remains steady at ₹${budget.tomorrowProjectedLimit.toLocaleString()}. Rest well!`;
  }

  return {
    date: todayStr,
    safeLimit: budget.todaySafeLimit,
    spent: budget.todaySpent,
    saved: Math.max(0, budget.todayRemaining),
    tomorrowLimit: budget.tomorrowProjectedLimit,
    status,
    categoryBreakdown: todayBreakdownItems.length > 0 ? todayBreakdownItems : breakdown.filter((b) => b.amount > 0).slice(0, 3),
    headline,
    message,
    streakCount: profile.streakDays,
  };
}

export function getDailySpendingHistory(
  profile: UserProfile,
  transactions: Transaction[],
  simulatedDate: Date = new Date()
): DailySpendingSummary[] {
  const budget = calculateBudget(profile, transactions, simulatedDate);
  const safeDailyTarget = budget.todaySafeLimit;
  const year = simulatedDate.getFullYear();
  const month = simulatedDate.getMonth();
  const currentDay = simulatedDate.getDate();

  // Group transactions by day number of current month
  const dayTxMap: Record<number, Transaction[]> = {};
  transactions.forEach((tx) => {
    const txDate = new Date(tx.timestamp);
    if (txDate.getFullYear() === year && txDate.getMonth() === month) {
      const day = txDate.getDate();
      if (!dayTxMap[day]) dayTxMap[day] = [];
      dayTxMap[day].push(tx);
    }
  });

  // Generate exact date entries for every single day from today down to day 1
  const history: DailySpendingSummary[] = [];

  for (let d = currentDay; d >= 1; d--) {
    const dayTx = dayTxMap[d] || [];
    const totalSpent = dayTx.reduce((sum, t) => sum + t.amount, 0);
    const dateObj = new Date(year, month, d, 12, 0, 0);
    const monthNum = String(month + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    const dateStr = `${year}-${monthNum}-${dayStr}`;
    const formattedDate = dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const dayOfWeek = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });

    let status: 'under' | 'over' | 'even' = 'under';
    if (totalSpent > safeDailyTarget) {
      status = 'over';
    } else if (totalSpent === safeDailyTarget) {
      status = 'even';
    }

    history.push({
      date: dateStr,
      formattedDate,
      dayOfWeek,
      totalSpent,
      safeLimit: safeDailyTarget,
      transactionCount: dayTx.length,
      status,
      transactions: dayTx,
      savedAmount: Math.max(0, safeDailyTarget - totalSpent),
    });
  }

  return history;
}


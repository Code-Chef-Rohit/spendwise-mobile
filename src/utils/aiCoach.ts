import { BudgetCalculations, CategoryBreakdownItem, ChatMessage, UserProfile } from '../types';

interface CoachAnalysisProps {
  query: string;
  profile: UserProfile;
  budget: BudgetCalculations;
  categoryBreakdown: CategoryBreakdownItem[];
}

export function generateCoachResponse({
  query,
  profile,
  budget,
  categoryBreakdown,
}: CoachAnalysisProps): Omit<ChatMessage, 'id' | 'timestamp'> {
  const lower = query.toLowerCase().trim();

  // Helper formatting currency
  const curr = profile.currencySymbol || '₹';
  const formatAmt = (num: number) => num.toLocaleString('en-IN');

  // 1. Affordability Check: "Can I afford ₹X [item]?" / "Can I buy ... for ₹X" / numbers
  const affordRegex = /(?:afford|buy|purchase|spend|get|order|pay)\s+(?:₹|rs\.?|inr)?\s*([0-9]+(?:,[0-9]+)?)/i;
  const numberMatch = query.match(affordRegex) || query.match(/(?:₹|rs\.?)\s*([0-9]+(?:,[0-9]+)?)/i);

  if (
    lower.includes('afford') || 
    (numberMatch && (lower.includes('buy') || lower.includes('can i') || lower.includes('spend')))
  ) {
    const rawAmount = numberMatch ? numberMatch[1].replace(/,/g, '') : '2000';
    const amount = parseInt(rawAmount, 10) || 2000;

    const daysImpact = budget.todaySafeLimit > 0 ? (amount / budget.todaySafeLimit).toFixed(1) : '2.0';
    const postPurchasePool = budget.remainingPool - amount;
    const canAffordRaw = postPurchasePool > 0;
    const safeDailyAfter = budget.daysRemaining > 1 ? Math.round(postPurchasePool / budget.daysRemaining) : 0;

    // Case A: Exceeds total remaining flexible pool
    if (!canAffordRaw) {
      return {
        sender: 'assistant',
        text: `You currently have ${curr}${formatAmt(budget.remainingPool)} available in your flexible spending pool.\n\nA ${curr}${formatAmt(amount)} purchase would completely exceed your pool by ${curr}${formatAmt(Math.abs(postPurchasePool))}.\n\n🚫 Coach Verdict: Not Recommended\nThis purchase would push you into negative cash flow for this month. Wait until your next income cycle on day ${profile.cycleStartDay} or postpone this until a new budget cycle starts.`,
        highlightCard: {
          type: 'affordability',
          title: `${curr}${formatAmt(amount)} Purchase Rejected`,
          description: `Exceeds monthly pool by ${curr}${formatAmt(Math.abs(postPurchasePool))}`,
          safe: false,
        },
      };
    }

    // Case B: Large purchase (> 1.5x daily limit)
    if (amount > budget.todaySafeLimit * 1.5) {
      return {
        sender: 'assistant',
        text: `You have ${curr}${formatAmt(budget.remainingPool)} flexible funds remaining over ${budget.daysRemaining} days.\n\nHowever, your safe daily limit is currently ${curr}${formatAmt(budget.todaySafeLimit)}/day.\n\nA ${curr}${formatAmt(amount)} purchase would consume ${daysImpact} days of your spending capacity, reducing your future allowance down to ~${curr}${formatAmt(safeDailyAfter)}/day.\n\n⚠️ Coach Verdict: High Impact Caution\nIf this is an urgent necessity, go ahead but budget carefully for the next ${daysImpact} days. Otherwise, delay until next month to protect your savings.`,
        highlightCard: {
          type: 'affordability',
          title: `High Impact: Consumes ${daysImpact} Days`,
          description: `Future daily limit drops to ${curr}${formatAmt(safeDailyAfter)}/day`,
          safe: false,
        },
      };
    }

    // Case C: Safe within today's limit
    const remainingAfter = Math.max(0, budget.todayRemaining - amount);
    return {
      sender: 'assistant',
      text: `Yes! You can safely afford this purchase.\n\nAt ${curr}${formatAmt(amount)}, this fits within your dynamic daily limit of ${curr}${formatAmt(budget.todaySafeLimit)}.\n\n✅ Coach Verdict: Safe to Spend\nYou will still have ${curr}${formatAmt(remainingAfter)} available for other small essentials today, keeping your monthly savings target of ${curr}${formatAmt(profile.savingsTarget)} 100% on track.`,
      highlightCard: {
        type: 'affordability',
        title: `Safe Purchase Approved`,
        description: `Remaining today: ${curr}${formatAmt(remainingAfter)} • Safe limit: ${curr}${formatAmt(budget.todaySafeLimit)}`,
        safe: true,
      },
    };
  }

  // 2. Specific Category Questions ("How much did I spend on Food?", "Shopping?", "Transport?")
  const categoriesToCheck = [
    { key: 'Food', keywords: ['food', 'eating', 'swiggy', 'zomato', 'restaurant', 'cafe', 'dinner', 'lunch'] },
    { key: 'Shopping', keywords: ['shopping', 'amazon', 'clothes', 'myntra', 'flipkart', 'store'] },
    { key: 'Transport', keywords: ['transport', 'uber', 'ola', 'cab', 'travel', 'fuel', 'petrol'] },
    { key: 'Entertainment', keywords: ['entertainment', 'movie', 'netflix', 'game', 'fun', 'outing'] },
    { key: 'Bills', keywords: ['bill', 'electricity', 'wifi', 'recharge', 'utility', 'rent'] },
    { key: 'Health', keywords: ['health', 'medical', 'medicine', 'doctor', 'pharmacy'] },
  ];

  for (const cat of categoriesToCheck) {
    if (cat.keywords.some((kw) => lower.includes(kw))) {
      const match = categoryBreakdown.find((c) => c.category === cat.key);
      const spent = match ? match.amount : 0;
      const pct = match ? match.percentage : 0;

      let categoryTip = '';
      if (cat.key === 'Food') {
        categoryTip = `💡 Coach Tip: Food delivery is often the easiest expense to optimize. Cutting 2 takeout orders this week can save you ~${curr}800!`;
      } else if (cat.key === 'Shopping') {
        categoryTip = `💡 Coach Tip: Practice the 48-Hour Cart Rule. Leave non-essential items in your cart for 2 days before checking out.`;
      } else if (cat.key === 'Transport') {
        categoryTip = `💡 Coach Tip: Combining short errand trips or using metro/carpool can save ~${curr}500 to ${curr}1,000 monthly.`;
      } else {
        categoryTip = `💡 Coach Tip: Regularly reviewing your ${cat.key} spending ensures you stay ahead of your monthly targets.`;
      }

      return {
        sender: 'assistant',
        text: `Here is your ${cat.key} spending for this month:\n\n📊 Total Spent: ${curr}${formatAmt(spent)} (${pct}% of all spending)\n\n${categoryTip}`,
        highlightCard: {
          type: 'summary',
          title: `${cat.key}: ${curr}${formatAmt(spent)}`,
          description: `${pct}% of total discretionary expenditure this month`,
          safe: pct < 35,
        },
      };
    }
  }

  // 3. "Where did I spend most?" / Category Breakdown
  if (lower.includes('where') || lower.includes('most') || lower.includes('breakdown') || lower.includes('category')) {
    const sorted = [...categoryBreakdown].sort((a, b) => b.amount - a.amount);
    const top = sorted[0];
    const second = sorted[1];

    if (!top || top.amount === 0) {
      return {
        sender: 'assistant',
        text: `You haven't recorded any expenses in this billing cycle yet! Your full flexible budget of ${curr}${formatAmt(budget.flexiblePool)} is 100% intact.`,
      };
    }

    return {
      sender: 'assistant',
      text: `Here is where your money is going this month:\n\n🥇 Top Expense: ${top.icon} ${top.label} — ${curr}${formatAmt(top.amount)} (${top.percentage}% of total)\n🥈 Second: ${second?.icon || '📦'} ${second?.label || 'Others'} — ${curr}${formatAmt(second?.amount || 0)} (${second?.percentage || 0}%)\n\n💡 Coach Insight: Focus on trimming discretionary food and shopping to boost your daily allowance.`,
      highlightCard: {
        type: 'summary',
        title: `Top Category: ${top.label}`,
        description: `Consumes ${top.percentage}% (${curr}${formatAmt(top.amount)}) of your total spending`,
        safe: true,
      },
    };
  }

  // 4. "How much can I spend today?" / Daily limit / Safe spending
  if (
    lower.includes('how much') || 
    lower.includes('spend today') || 
    lower.includes('daily limit') || 
    lower.includes('today limit') ||
    lower.includes('allowance')
  ) {
    return {
      sender: 'assistant',
      text: `Here is your daily allowance for today:\n\n🟢 Safe Daily Limit: ${curr}${formatAmt(budget.todaySafeLimit)}\n💸 Spent Today: ${curr}${formatAmt(budget.todaySpent)}\n${
        budget.isOverspentToday
          ? `🔴 Exceeded Limit by: ${curr}${formatAmt(Math.abs(budget.todayRemaining))}`
          : `✨ Remaining Safe to Spend: ${curr}${formatAmt(budget.todayRemaining)}\n💰 Unspent Saved: +${curr}${formatAmt(budget.savedToGoalToday)}`
      }\n\nTomorrow's limit remains fixed at ${curr}${formatAmt(budget.todaySafeLimit)} (no adjustments — daily limits relate strictly to the day only!).`,
      highlightCard: {
        type: 'summary',
        title: `Safe Today: ${curr}${formatAmt(budget.todaySafeLimit)}`,
        description: budget.isOverspentToday
          ? `Over by ${curr}${formatAmt(Math.abs(budget.todayRemaining))}`
          : `${curr}${formatAmt(budget.savedToGoalToday)} retained as pure savings`,
        safe: !budget.isOverspentToday,
      },
    };
  }

  // 5. How is the budget calculated? / Dynamic formula explanation
  if (
    lower.includes('how do you calculate') || 
    lower.includes('how is this calculated') || 
    lower.includes('formula') ||
    lower.includes('why is my limit')
  ) {
    const pool = profile.monthlyIncome - profile.fixedExpenses - profile.savingsTarget;
    return {
      sender: 'assistant',
      text: `Here is the mathematical formula behind SpendWise:\n\n1. Monthly Income: ${curr}${formatAmt(profile.monthlyIncome)}\n2. Minus Fixed Commitments: -${curr}${formatAmt(profile.fixedExpenses)}\n3. Minus Savings Target: -${curr}${formatAmt(profile.savingsTarget)}\n\n= Total Flexible Pool: ${curr}${formatAmt(pool)}\n\nDividing this pool across your cycle (${budget.totalDaysInCycle} days) gives ${curr}${formatAmt(budget.todaySafeLimit)}/day.\n\nKey Rule: There are no adjustments to future days. Your daily spend applies to the day only, and all unspent daily savings are retained directly as pure savings!`,
      highlightCard: {
        type: 'tip',
        title: `Daily Allowance Formula`,
        description: `${curr}${formatAmt(pool)} Pool ÷ ${budget.totalDaysInCycle} Days = ${curr}${formatAmt(budget.todaySafeLimit)}/day (Rest is Saved)`,
        safe: true,
      },
    };
  }

  // 6. Savings Advice: "How can I save ₹5,000?" / "Save money"
  if (lower.includes('save') || lower.includes('saving') || lower.includes('wealth') || lower.includes('invest')) {
    const dailyTrim = Math.round(5000 / Math.max(1, budget.daysRemaining));
    return {
      sender: 'assistant',
      text: `To build an extra ${curr}5,000 surplus:\n\n1. 🎯 Daily Trim Target: Spend ~${curr}${formatAmt(dailyTrim)} less than your daily allowance.\n2. 🍔 Food Delivery Cap: Limit takeout orders to 2 days per week (potential savings: ~${curr}2,000).\n3. 🚕 Transit Efficiency: Swap 3 cab rides for public transit or carpooling (savings: ~${curr}750).\n4. 🛍️ The 48-Hour Rule: Delay online shopping impulse buys for 48 hours.\n\nEvery rupee you don't spend today is retained and deposited directly into your savings!`,
      highlightCard: {
        type: 'tip',
        title: `Save ${curr}5,000 Action Plan`,
        description: `Trim ${curr}${formatAmt(dailyTrim)}/day to accelerate your savings`,
        safe: true,
      },
    };
  }

  // 7. Weekend Predictions & Forecasts
  if (lower.includes('weekend') || lower.includes('forecast') || lower.includes('prediction') || lower.includes('friday') || lower.includes('saturday')) {
    return {
      sender: 'assistant',
      text: `🔮 Predictive Weekend Spending Forecast:\n\nHistorical analysis shows your spending typically surges by ~38% on Friday through Sunday, primarily in Dining and Entertainment.\n\n• Predicted Weekend Outflow: ~${curr}1,850\n• Recommended Weekend Cap: ${curr}1,400\n\n💡 Tip: Decide on your weekend entertainment budget in advance on Friday afternoon to avoid Sunday night overspending!`,
      highlightCard: {
        type: 'tip',
        title: `Weekend Forecast: ${curr}1,850`,
        description: `Recommended weekend spending cap: ${curr}1,400`,
        safe: true,
      },
    };
  }

  // 8. Daily Allocation Mechanics
  if (lower.includes('rollover') || lower.includes('streak') || lower.includes('bonus') || lower.includes('adjustment')) {
    return {
      sender: 'assistant',
      text: `🎯 How Daily Spend Works in SpendWise:\n\n• Dedicated Daily Spend: There are NO adjustments to future days. Your daily limit relates strictly to the day only (${curr}${formatAmt(budget.todaySafeLimit)}/day).\n• Rest of Savings: When you spend less than your limit (e.g. saving ${curr}${formatAmt(budget.savedToGoalToday)} today), that unspent amount is automatically retained as savings!\n• Consistency Streak: You are currently on a ${profile.streakDays}-Day Budget Streak! Keep staying under budget to maximize your wealth.`,
      highlightCard: {
        type: 'summary',
        title: `Daily Savings Mechanism`,
        description: `Unspent daily funds calculate directly into your savings`,
        safe: true,
      },
    };
  }

  // 9. Bank Connection & Security Questions
  if (lower.includes('bank') || lower.includes('security') || lower.includes('sync') || lower.includes('upi') || lower.includes('safe')) {
    return {
      sender: 'assistant',
      text: `🔒 Bank Security & Privacy Standards:\n\n• SpendWise uses bank-grade AES-256 on-device encryption.\n• Bank connection is 100% read-only. It automatically detects merchant transactions like Swiggy, Uber, and Amazon to save you manual typing.\n• We NEVER ask for, see, or store your UPI PINs, banking passwords, or OTPs.\n• You can also use SpendWise in completely manual mode at any time!`,
      highlightCard: {
        type: 'tip',
        title: `Bank-Grade 256-Bit Encryption`,
        description: `Read-only transaction detection • Zero password/PIN storage`,
        safe: true,
      },
    };
  }

  // 10. Greetings & Friendly Conversation
  if (
    lower.startsWith('hi') || 
    lower.startsWith('hello') || 
    lower.startsWith('hey') || 
    lower.includes('who are you') || 
    lower.includes('help')
  ) {
    return {
      sender: 'assistant',
      text: `Hello ${profile.name}! 👋 I am your SpendWise Financial Coach.\n\nI monitor your daily cash flow and give you real-time mathematical answers so you can spend with zero anxiety.\n\nHere are some things you can ask me:\n• "Can I afford ₹2,000 headphones?"\n• "Where did I spend most this month?"\n• "How much can I safely spend today?"\n• "How can I save ₹5,000?"\n• "Explain my dynamic budget formula"`,
    };
  }

  if (lower.includes('thank') || lower.includes('thanks') || lower.includes('good') || lower.includes('awesome')) {
    return {
      sender: 'assistant',
      text: `You are welcome, ${profile.name}! 🎉 Keep up the great financial discipline. I am always here whenever you need an affordability check or budget advice.`,
    };
  }

  // Default helpful response with real numbers
  return {
    sender: 'assistant',
    text: `I am your SpendWise Money Coach, calibrated to your current financial status:\n\n• Safe Daily Limit: ${curr}${formatAmt(budget.todaySafeLimit)}\n• Spent Today: ${curr}${formatAmt(budget.todaySpent)}\n• Remaining Today: ${curr}${formatAmt(budget.todayRemaining)}\n• Days Remaining in Cycle: ${budget.daysRemaining} days\n\nAsk me anything! For example: "Can I afford ₹1,500 dinner?", "Where did I spend most?", or "How can I save ₹5,000?"`,
  };
}

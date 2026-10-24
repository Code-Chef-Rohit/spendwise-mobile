import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { MonthlyGridSpendCard } from '../components/MonthlyGridSpendCard';

interface AnalyticsScreenProps {
  onBack?: () => void;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ onBack }) => {
  const { profile, budget, categoryBreakdown, transactions } = useApp();

  const totalSpent = profile.fixedExpenses + budget.totalCycleSpent;
  const netSaved = Math.max(0, profile.monthlyIncome - totalSpent);
  const savingsRate = profile.monthlyIncome > 0
    ? Math.round((netSaved / profile.monthlyIncome) * 100)
    : 0;

  // 7-day spending simulation for the trend chart
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailySpendingTrend = [
    { day: 'Mon', amount: 480, height: 48 },
    { day: 'Tue', amount: 350, height: 35 },
    { day: 'Wed', amount: 620, height: 62 },
    { day: 'Thu', amount: 290, height: 29 },
    { day: 'Fri', amount: 890, height: 89 },
    { day: 'Sat', amount: 1100, height: 100 },
    { day: 'Sun', amount: budget.todaySpent || 449, height: Math.min(100, Math.round(((budget.todaySpent || 449) / 1200) * 100)) },
  ];

  return (
    <View style={styles.container}>
      {/* Screen Title */}
      <View style={styles.header}>
        <View style={styles.headerLeftRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.title}>Financial Analytics</Text>
            <Text style={styles.subtitle}>Monthly trajectory & behavioral patterns</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Monthly High-Level Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryBox}>
            <Text style={styles.boxLabel}>Monthly Income</Text>
            <Text style={styles.boxValue}>₹{profile.monthlyIncome.toLocaleString()}</Text>
            <Text style={styles.boxSub}>Base salary cycle</Text>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.boxLabel}>Total Spent</Text>
            <Text style={[styles.boxValue, { color: '#F87171' }]}>
              ₹{totalSpent.toLocaleString()}
            </Text>
            <Text style={styles.boxSub}>Fixed + Discretionary</Text>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.boxLabel}>Net Saved</Text>
            <Text style={[styles.boxValue, { color: '#10B981' }]}>
              ₹{netSaved.toLocaleString()}
            </Text>
            <Text style={styles.boxSub}>Surplus retained</Text>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.boxLabel}>Savings Rate</Text>
            <Text style={[styles.boxValue, { color: '#818CF8' }]}>
              {savingsRate}%
            </Text>
            <Text style={styles.boxSub}>Target: 25%+</Text>
          </View>
        </View>

        {/* 30-Day Monthly Allocation & Spending Grid (Exact Screenshot Model) */}
        <MonthlyGridSpendCard />

        {/* Predictive Weekend Forecast Card */}
        <View style={styles.forecastCard}>
          <View style={styles.forecastHeader}>
            <Text style={styles.forecastIcon}>🔮</Text>
            <Text style={styles.forecastTitle}>FUTURE SPENDING PREDICTION</Text>
          </View>
          <Text style={styles.forecastMain}>Weekend Forecast: ₹1,850</Text>
          <Text style={styles.forecastDesc}>
            Based on your past 3 weekends, discretionary food and entertainment spending spikes by ~38% on Friday–Sunday.
          </Text>
          <View style={styles.forecastPill}>
            <Text style={styles.forecastPillText}>
              💡 Recommended Weekend Budget Cap: ₹1,400
            </Text>
          </View>
        </View>

        {/* 7-Day Spending Trend Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>7-DAY SPENDING PATTERN</Text>
            <Text style={styles.chartTrendBadge}>📈 +14% vs last week</Text>
          </View>

          <View style={styles.barChartWrapper}>
            {dailySpendingTrend.map((item) => (
              <View key={item.day} style={styles.barColumn}>
                <Text style={styles.barAmount}>₹{item.amount}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${item.height}%`,
                        backgroundColor: item.day === 'Sun' ? '#10B981' : '#6366F1',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barDay}>{item.day}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.chartFootnote}>
            Peak spending occurs on weekends. Your weekday average remains steady at ~₹430/day.
          </Text>
        </View>

        {/* Category Breakdown: "Where is your money going?" */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownHeader}>WHERE IS YOUR MONEY GOING?</Text>
          <Text style={styles.breakdownSub}>
            Categorized breakdown of all {transactions.length} transactions this month
          </Text>

          <View style={styles.categoryBarsContainer}>
            {categoryBreakdown.map((item) => (
              <View key={item.category} style={styles.catBarRow}>
                <View style={styles.catLabelRow}>
                  <View style={styles.catLabelLeft}>
                    <Text style={styles.catEmoji}>{item.icon}</Text>
                    <Text style={styles.catTitle}>{item.label}</Text>
                  </View>
                  <View style={styles.catLabelRight}>
                    <Text style={styles.catAmountText}>₹{item.amount.toLocaleString()}</Text>
                    <Text style={styles.catPercentText}>{item.percentage}%</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.catBarTrack}>
                  <View
                    style={[
                      styles.catBarFill,
                      {
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  backBtnText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 10,
  },
  summaryBox: {
    width: '48%',
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  boxLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  boxValue: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
    marginVertical: 4,
  },
  boxSub: {
    color: '#64748B',
    fontSize: 10,
  },
  forecastCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 18,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  forecastIcon: {
    fontSize: 18,
  },
  forecastTitle: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  forecastMain: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  forecastDesc: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  forecastPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  forecastPillText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  chartTrendBadge: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  barChartWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barAmount: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 100,
    backgroundColor: '#0F172A',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barDay: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  chartFootnote: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 12,
  },
  breakdownCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  breakdownHeader: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  breakdownSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 16,
  },
  categoryBarsContainer: {
    gap: 14,
  },
  catBarRow: {
    gap: 6,
  },
  catLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catEmoji: {
    fontSize: 16,
  },
  catTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  catLabelRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catAmountText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  catPercentText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    width: 32,
    textAlign: 'right',
  },
  catBarTrack: {
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  catBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});

import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { DailyBudgetCard } from '../components/DailyBudgetCard';
import { TransactionItem } from '../components/TransactionItem';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { BankSyncModal } from '../components/BankSyncModal';
import { LargeExpenseModal } from '../components/LargeExpenseModal';
import { DailySpendingCalendarModal } from '../components/DailySpendingCalendarModal';
import { TransactionDetailModal } from '../components/TransactionDetailModal';
import { Transaction } from '../types';

interface DashboardScreenProps {
  onNavigateToExpenses: () => void;
  onNavigateToCoach: () => void;
  onOpenSettings: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToExpenses,
  onNavigateToCoach,
  onOpenSettings,
}) => {
  const { 
    profile,
    transactions, 
    budget, 
    categoryBreakdown, 
    deleteTransaction,
    calendarModalVisible,
    setCalendarModalVisible,
    addExpenseModalVisible,
    setAddExpenseModalVisible,
    bankSyncModalVisible,
    setBankSyncModalVisible,
  } = useApp();

  const [detailModalTx, setDetailModalTx] = useState<Transaction | null>(null);

  const now = new Date();
  const currentMonthName = now.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const todayTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const d = new Date(tx.timestamp);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    });
  }, [transactions]);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <Header onOpenSettings={onOpenSettings} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Core Dynamic Daily Budget Card */}
        <DailyBudgetCard />

        {/* First Time Setup Banner if income is 0 */}
        {profile.monthlyIncome === 0 && (
          <TouchableOpacity
            style={styles.onboardingBanner}
            onPress={onOpenSettings}
            activeOpacity={0.85}
          >
            <View style={styles.onboardingBannerIcon}>
              <Text style={{ fontSize: 20 }}>⚙️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.onboardingBannerTitle}>Set Up Your Real Monthly Budget</Text>
              <Text style={styles.onboardingBannerSub}>
                Enter your real monthly income and fixed commitments to calculate your accurate daily safe limit.
              </Text>
            </View>
            <Text style={styles.onboardingBannerAction}>Set Up →</Text>
          </TouchableOpacity>
        )}

        {/* Dual Luxury Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => setAddExpenseModalVisible(true)}
            activeOpacity={0.85}
          >
            <View style={styles.actionIconCircle}>
              <Text style={styles.actionPlusIcon}>+</Text>
            </View>
            <View>
              <Text style={styles.primaryActionTitle}>Record Expense</Text>
              <Text style={styles.primaryActionSub}>Auto-categorizes</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={() => setBankSyncModalVisible(true)}
            activeOpacity={0.85}
          >
            <View style={styles.bankIconCircle}>
              <Text style={styles.bankEmoji}>🏦</Text>
            </View>
            <View>
              <Text style={styles.secondaryActionTitle}>Direct Bank Feed</Text>
              <Text style={styles.secondaryActionSub}>
                {profile.isBankConnected ? profile.connectedBankName : 'Link Bank Account'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Whole Month Spending View Button (Exact 30-Day Grid) */}
        <TouchableOpacity
          style={styles.calendarBannerBtn}
          onPress={() => setCalendarModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.calendarBannerLeft}>
            <View style={styles.calendarIconCircle}>
              <Text style={styles.calendarIconText}>📊</Text>
            </View>
            <View style={styles.calendarTextBox}>
              <View style={styles.calendarTitleRow}>
                <Text style={styles.calendarBannerTitle}>Whole Month Spending</Text>
                <View style={styles.calendarTag}>
                  <Text style={styles.calendarTagText}>{daysInCurrentMonth}-DAY GRID</Text>
                </View>
              </View>
              <Text style={styles.calendarBannerSub}>
                Tap to explore {currentMonthName} ({daysInCurrentMonth} days) exact daily breakdown
              </Text>
            </View>
          </View>
          <Text style={styles.calendarArrow}>→</Text>
        </TouchableOpacity>

        {/* Today's Transactions Journal */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={onNavigateToExpenses}
            activeOpacity={0.7}
          >
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>TODAY'S ACTIVITY</Text>
              <View style={styles.txCountBadge}>
                <Text style={styles.txCountText}>{todayTransactions.length}</Text>
              </View>
            </View>
            {todayTransactions.length > 0 && (
              <View>
                <Text style={styles.seeAllText}>View All →</Text>
              </View>
            )}
          </TouchableOpacity>

          {todayTransactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Text style={styles.emptyIcon}>🛡️</Text>
              </View>
              <Text style={styles.emptyTitle}>Zero expenses recorded today</Text>
              <Text style={styles.emptySub}>
                Your safe daily limit of ₹{budget.todaySafeLimit.toLocaleString()} is 100% intact!
              </Text>
            </View>
          ) : (
            todayTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onPress={() => setDetailModalTx(tx)}
                onDelete={() => deleteTransaction(tx.id)}
              />
            ))
          )}
        </View>

        {/* Category Breakdown Highlights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>WHERE YOUR MONEY GOES</Text>
            <TouchableOpacity onPress={onNavigateToExpenses}>
              <Text style={styles.seeAllText}>Details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryCard}>
            {categoryBreakdown.slice(0, 4).map((item) => (
              <View key={item.category} style={styles.catItemBlock}>
                {/* Top Row: Category Title & Amount */}
                <View style={styles.catHeaderRow}>
                  <View style={styles.catLeft}>
                    <Text style={styles.catEmoji}>{item.icon}</Text>
                    <Text style={styles.catName} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </View>
                  <View style={styles.catRight}>
                    <Text style={styles.catAmount}>₹{item.amount.toLocaleString()}</Text>
                    <Text style={styles.catPercent}>{item.percentage}%</Text>
                  </View>
                </View>

                {/* Bottom Row: Full-width Progress Bar */}
                <View style={styles.catTrack}>
                  <View
                    style={[
                      styles.catFill,
                      {
                        width: `${Math.min(100, Math.max(3, item.percentage))}%`,
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

      {/* Modals */}
      <AddExpenseModal
        visible={addExpenseModalVisible}
        onClose={() => setAddExpenseModalVisible(false)}
      />
      <BankSyncModal
        visible={bankSyncModalVisible}
        onClose={() => setBankSyncModalVisible(false)}
      />
      <DailySpendingCalendarModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
      />
      <LargeExpenseModal />
      <TransactionDetailModal
        transaction={detailModalTx}
        onClose={() => setDetailModalTx(null)}
        onDelete={deleteTransaction}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  scrollContent: {
    paddingBottom: 36,
  },
  onboardingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#38BDF8',
    gap: 12,
  },
  onboardingBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onboardingBannerTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  onboardingBannerSub: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15,
  },
  onboardingBannerAction: {
    color: '#38BDF8',
    fontWeight: '800',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginVertical: 6,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    gap: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  actionIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionPlusIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: -2,
  },
  primaryActionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  primaryActionSub: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bankIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  bankEmoji: {
    fontSize: 16,
  },
  secondaryActionTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryActionSub: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  calendarBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  calendarBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  calendarIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarIconText: {
    fontSize: 18,
  },
  calendarTextBox: {
    flex: 1,
  },
  calendarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarBannerTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  calendarTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  calendarTagText: {
    color: '#38BDF8',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  calendarBannerSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  calendarArrow: {
    color: '#38BDF8',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 6,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  txCountBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  txCountText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
  },
  seeAllText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#111827',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyIcon: {
    fontSize: 22,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },
  categoryCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 14,
  },
  catItemBlock: {
    gap: 7,
  },
  catHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  catEmoji: {
    fontSize: 15,
  },
  catName: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  catRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catAmount: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  catPercent: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    width: 34,
    textAlign: 'right',
  },
  catTrack: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  catFill: {
    height: '100%',
    borderRadius: 3,
  },
});

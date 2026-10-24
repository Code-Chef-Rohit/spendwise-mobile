import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { DailySpendingSummary, Transaction } from '../types';
import { CATEGORIES } from '../constants/categories';
import { MonthlyGridSpendCard } from './MonthlyGridSpendCard';

interface DailySpendingCalendarModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DailySpendingCalendarModal: React.FC<DailySpendingCalendarModalProps> = ({
  visible,
  onClose,
}) => {
  const { dailySpendingHistory, budget, profile } = useApp();
  const [selectedGridDay, setSelectedGridDay] = useState<number | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const now = new Date();
  const currentMonthName = now.toLocaleDateString('en-IN', { month: 'long' });
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const toggleExpand = (date: string) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

  const handleSelectDayFromGrid = (dayNum: number, dayTx: Transaction[], daySpent: number) => {
    setSelectedGridDay(dayNum);
    // Find matching date in dailySpendingHistory
    const target = dailySpendingHistory.find((d) => {
      const day = parseInt(d.date.split('-')[2], 10);
      return day === dayNum;
    });
    if (target) {
      setExpandedDate(target.date);
    }
  };

  const daysUnderBudgetCount = dailySpendingHistory.filter((d) => d.status === 'under').length;
  const totalDaysRecorded = dailySpendingHistory.length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.badgeRow}>
                <Text style={styles.calendarIcon}>📅</Text>
                <Text style={styles.title}>Monthly Spending Tracker</Text>
              </View>
              <Text style={styles.subtitle}>
                {currentMonthName} ({daysInCurrentMonth} days) • Exact daily allocation & transactions
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* The 30-Day Grid Expense Card (From Your Screenshot!) */}
            <MonthlyGridSpendCard
              selectedDay={selectedGridDay}
              onSelectDay={handleSelectDayFromGrid}
            />

            {/* Quick Discipline Stat Bar */}
            <View style={styles.statBanner}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>DAYS DISCIPLINED</Text>
                <Text style={styles.statValue}>
                  {daysUnderBudgetCount}/{totalDaysRecorded} Days
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>AVG DAILY SPEND</Text>
                <Text style={styles.statValue}>
                  {profile.currencySymbol}
                  {totalDaysRecorded > 0
                    ? Math.round(
                        dailySpendingHistory.reduce((s, d) => s + d.totalSpent, 0) /
                          totalDaysRecorded
                      ).toLocaleString()
                    : 0}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>SAFE TARGET</Text>
                <Text style={[styles.statValue, { color: '#10B981' }]}>
                  {profile.currencySymbol}{budget.todaySafeLimit.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Detailed Day-by-Day List */}
            <Text style={styles.sectionHeader}>DETAILED DAILY LOG</Text>
            {dailySpendingHistory.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🗓️</Text>
                <Text style={styles.emptyTitle}>No transaction history yet</Text>
                <Text style={styles.emptySub}>
                  Record an expense or sync your bank account to see your daily breakdown.
                </Text>
              </View>
            ) : (
              dailySpendingHistory.map((daySummary: DailySpendingSummary) => {
                const isExpanded = expandedDate === daySummary.date;
                const isUnder = daySummary.status === 'under';
                const difference = Math.abs(daySummary.safeLimit - daySummary.totalSpent);
                const progressRatio = Math.min(1.5, daySummary.totalSpent / daySummary.safeLimit);

                return (
                  <View key={daySummary.date} style={styles.dayCard}>
                    <TouchableOpacity
                      style={styles.dayHeader}
                      onPress={() => toggleExpand(daySummary.date)}
                      activeOpacity={0.7}
                    >
                      {/* Left: Date & Day */}
                      <View style={styles.dateCol}>
                        <Text style={styles.dayOfWeek}>{daySummary.dayOfWeek.toUpperCase()}</Text>
                        <Text style={styles.formattedDate}>{daySummary.formattedDate}</Text>
                      </View>

                      {/* Center: Spent vs Limit Mini Bar */}
                      <View style={styles.centerBarCol}>
                        <View style={styles.amountsRow}>
                          <Text style={styles.spentText}>
                            {profile.currencySymbol}{daySummary.totalSpent.toLocaleString()}
                          </Text>
                          <Text style={styles.limitText}>
                            / {profile.currencySymbol}{daySummary.safeLimit.toLocaleString()}
                          </Text>
                        </View>
                        <Text style={styles.spentAllowanceSublabel}>SPENT / ALLOWANCE</Text>
                        <View style={styles.miniTrack}>
                          <View
                            style={[
                              styles.miniFill,
                              {
                                width: `${Math.min(100, Math.round(progressRatio * 100))}%`,
                                backgroundColor: isUnder ? '#10B981' : '#EF4444',
                              },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Right: Status Pill & Caret */}
                      <View style={styles.rightPillCol}>
                        <View
                          style={[
                            styles.statusPill,
                            isUnder ? styles.pillUnder : styles.pillOver,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              isUnder ? styles.statusUnderText : styles.statusOverText,
                            ]}
                          >
                            {isUnder
                              ? `+${profile.currencySymbol}${difference} Saved`
                              : `-${profile.currencySymbol}${difference} Over`}
                          </Text>
                        </View>
                        <Text style={styles.expandCaret}>{isExpanded ? '▲' : '▼'}</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Expandable Transactions for this exact date */}
                    {isExpanded && (
                      <View style={styles.expandedTxList}>
                        <View style={styles.expandedDivider} />
                        <Text style={styles.expandedHeader}>
                          {daySummary.transactionCount} TRANSACTIONS ON {daySummary.formattedDate.toUpperCase()}
                        </Text>
                        {daySummary.transactions.map((tx) => {
                          const cat = CATEGORIES[tx.category] || CATEGORIES.Others;
                          const time = new Date(tx.timestamp).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          });

                          return (
                            <View key={tx.id} style={styles.txRow}>
                              <View style={styles.txLeft}>
                                <Text style={styles.txEmoji}>{cat.icon}</Text>
                                <View>
                                  <Text style={styles.txTitle}>{tx.title}</Text>
                                  <Text style={styles.txMeta}>
                                    {cat.label} • {time}
                                  </Text>
                                </View>
                              </View>
                              <Text style={styles.txAmount}>
                                -{profile.currencySymbol}{tx.amount.toLocaleString()}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })
            )}

            {/* Footer Close */}
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>Close Monthly Tracker</Text>
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
    padding: 18,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarIcon: {
    fontSize: 22,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 11,
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
    fontSize: 13,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  statBanner: {
    flexDirection: 'row',
    backgroundColor: '#161F30',
    borderRadius: 16,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeader: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  emptyContainer: {
    backgroundColor: '#1E293B',
    padding: 30,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },
  dayCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateCol: {
    width: 60,
  },
  dayOfWeek: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  formattedDate: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  centerBarCol: {
    flex: 1,
    paddingHorizontal: 12,
  },
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  spentAllowanceSublabel: {
    color: '#475569',
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  spentText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  limitText: {
    color: '#64748B',
    fontSize: 11,
    marginLeft: 4,
  },
  miniTrack: {
    height: 5,
    backgroundColor: '#1E293B',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  rightPillCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pillUnder: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  pillOver: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusUnderText: {
    color: '#10B981',
  },
  statusOverText: {
    color: '#EF4444',
  },
  expandCaret: {
    color: '#475569',
    fontSize: 8,
  },
  expandedTxList: {
    marginTop: 12,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 10,
  },
  expandedHeader: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  txEmoji: {
    fontSize: 16,
  },
  txTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  txMeta: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 1,
  },
  txAmount: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  doneBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
});

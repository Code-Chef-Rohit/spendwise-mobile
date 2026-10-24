import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';

interface MonthlyGridSpendCardProps {
  onSelectDay?: (dayNum: number, dayTx: Transaction[], daySpent: number) => void;
  selectedDay?: number | null;
}

export const MonthlyGridSpendCard: React.FC<MonthlyGridSpendCardProps> = ({
  onSelectDay,
  selectedDay: controlledSelectedDay,
}) => {
  const { budget, profile, transactions } = useApp();
  const [internalSelectedDay, setInternalSelectedDay] = useState<number | null>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const currentDay = now.getDate();

  const activeSelectedDay =
    controlledSelectedDay !== undefined && controlledSelectedDay !== null
      ? controlledSelectedDay
      : (internalSelectedDay !== null ? internalSelectedDay : currentDay);

  // Flexible Spending Pool = Income - Fixed - Savings
  const flexiblePool = budget.flexiblePool > 0 ? budget.flexiblePool : 15000;
  
  // Exact days in this month! (e.g. 31 for October, 30 for November, etc.)
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const cycleDays = totalDaysInMonth; 
  const monthName = now.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
  const basePerDay = Math.round(flexiblePool / cycleDays);

  // Exact calendar days array for this exact month (1 to cycleDays)
  const daysArray = Array.from({ length: cycleDays }, (_, i) => i + 1);

  // Map transactions in this month to exact day numbers
  const dayTxMap: Record<number, Transaction[]> = {};
  transactions.forEach((tx) => {
    const d = new Date(tx.timestamp);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!dayTxMap[day]) dayTxMap[day] = [];
      dayTxMap[day].push(tx);
    }
  });

  const handleTilePress = (dayNum: number) => {
    setInternalSelectedDay(dayNum);
    const dayTx = dayTxMap[dayNum] || [];
    const daySpent = dayTx.reduce((s, t) => s + t.amount, 0);
    if (onSelectDay) {
      onSelectDay(dayNum, dayTx, daySpent);
    }
  };

  // Compute selected day details for the hero banner below the grid on exact date
  const selDayTx = dayTxMap[activeSelectedDay] || [];
  const selIsToday = activeSelectedDay === currentDay;
  const selIsPast = activeSelectedDay < currentDay;
  const selDateObj = new Date(year, month, activeSelectedDay);
  const selFormattedDate = selDateObj.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Real exact spent on that exact date (no fake multipliers!)
  const selSpent = selIsToday ? budget.todaySpent : selDayTx.reduce((s, t) => s + t.amount, 0);
  const selAllowance = basePerDay;
  const selDiff = selAllowance - selSpent;
  const selIsUnder = selDiff >= 0;

  return (
    <View style={styles.wrapper}>
      {/* Dark Modern Card Container */}
      <View style={styles.card}>
        {/* Top Header Row: SPEND / DAILY ALLOWANCE and Exact Month Days */}
        <View style={styles.topHeader}>
          <Text style={styles.perDayLabel}>SPEND / DAILY ALLOWANCE</Text>
          <Text style={styles.cycleDaysLabel}>{cycleDays} DAYS ({monthName})</Text>
        </View>

        {/* Big Mathematical Equation: Flexible Pool ÷ Exact Month Days */}
        <View style={styles.equationRow}>
          <Text style={styles.poolAmount}>
            {profile.currencySymbol}{flexiblePool.toLocaleString()}
          </Text>
          <Text style={styles.divideOperator}> ÷ {cycleDays}</Text>
          <View style={styles.equationSubBadge}>
            <Text style={styles.equationSubText}>
              = {profile.currencySymbol}{basePerDay.toLocaleString()}/day exact allowance
            </Text>
          </View>
        </View>

        {/* Legend Row */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#A3E635' }]} />
            <Text style={styles.legendText}>Under Allowance</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Exceeded</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#38BDF8' }]} />
            <Text style={styles.legendText}>Selected Day</Text>
          </View>
        </View>

        {/* 30-Day Calendar Grid (6 columns x 5 rows) */}
        <View style={styles.gridContainer}>
          {daysArray.map((dayNum) => {
            const isToday = dayNum === currentDay;
            const isPast = dayNum < currentDay;
            const isSelected = activeSelectedDay === dayNum;
            const dayTx = dayTxMap[dayNum] || [];
            const daySpent = dayTx.reduce((sum, t) => sum + t.amount, 0);

            // Calculation for this tile
            const tileAllowance = isToday ? budget.todaySafeLimit : basePerDay;
            let displaySpent = 0;
            let isUnder = true;

            if (isToday) {
              displaySpent = budget.todaySpent;
              isUnder = !budget.isOverspentToday;
            } else if (isPast) {
              displaySpent = daySpent;
              isUnder = displaySpent <= tileAllowance;
            }

            return (
              <TouchableOpacity
                key={dayNum}
                style={[
                  styles.dayTile,
                  (isPast || isToday) && (isUnder ? styles.dayTileGreen : styles.dayTileRed),
                  isToday && styles.dayTileToday,
                  !isPast && !isToday && styles.dayTileFuture,
                  isSelected && styles.dayTileSelected,
                ]}
                onPress={() => handleTilePress(dayNum)}
                activeOpacity={0.75}
              >
                {/* Day Number in top-left */}
                <View style={styles.dayNumRow}>
                  <Text
                    style={[
                      styles.dayNumText,
                      isToday && styles.dayNumTodayText,
                      (isPast || isToday) ? styles.dayNumActiveText : styles.dayNumFutureText,
                    ]}
                  >
                    {dayNum}
                  </Text>
                  {isToday && <View style={styles.todaySmallDot} />}
                </View>

                {/* Spend / Daily Allowance Display on Tile */}
                {(isPast || isToday) ? (
                  <View style={styles.tileDataCol}>
                    <Text
                      style={[
                        styles.tileSpentText,
                        isUnder ? styles.tileSpentGreen : styles.tileSpentRed,
                      ]}
                      numberOfLines={1}
                    >
                      {profile.currencySymbol}{displaySpent.toLocaleString()}
                    </Text>
                    <Text style={styles.tileAllowanceText} numberOfLines={1}>
                      /{profile.currencySymbol}{tileAllowance.toLocaleString()}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.tileDataCol}>
                    <Text style={styles.tileFutureDash}>-</Text>
                    <Text style={styles.tileAllowanceText} numberOfLines={1}>
                      /{profile.currencySymbol}{basePerDay.toLocaleString()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Hero Callout Below: SPEND / DAILY ALLOWANCE HIGHLIGHT ON EXACT DATE */}
      <View style={styles.heroResultContainer}>
        <View style={styles.heroResultCard}>
          <View style={styles.heroResultTopRow}>
            <View style={styles.heroDayBadge}>
              <Text style={styles.heroDayBadgeText}>
                {selFormattedDate.toUpperCase()} {selIsToday ? '(TODAY)' : ''}
              </Text>
            </View>
            <View style={[styles.heroStatusBadge, selIsUnder ? styles.badgeGreen : styles.badgeRed]}>
              <Text style={[styles.heroStatusText, selIsUnder ? styles.textGreen : styles.textRed]}>
                {selIsUnder ? `+₹${Math.abs(selDiff)} SAVED` : `-₹${Math.abs(selDiff)} OVER LIMIT`}
              </Text>
            </View>
          </View>

          {/* Bold Spend / Daily Allowance Display */}
          <View style={styles.heroEquationDisplay}>
            <Text style={[styles.heroSpentBig, !selIsUnder && styles.heroSpentRed]}>
              {profile.currencySymbol}{selSpent.toLocaleString()}
            </Text>
            <Text style={styles.heroSlash}> spent / </Text>
            <Text style={styles.heroAllowanceBig}>
              {profile.currencySymbol}{selAllowance.toLocaleString()}
            </Text>
            <Text style={styles.heroAllowanceLabel}> daily allowance</Text>
          </View>

          {/* Subtitle feedback on exact date */}
          <Text style={styles.heroSubText}>
            {selIsToday
              ? `Today (${selFormattedDate}): ${profile.currencySymbol}${selSpent.toLocaleString()} spent of ${profile.currencySymbol}{selAllowance.toLocaleString()} allowance. ${selIsUnder ? `Remaining ${profile.currencySymbol}${Math.abs(selDiff)} saved as pure surplus!` : 'Over daily allowance.'}`
              : selDayTx.length > 0
                ? `${selFormattedDate}: Recorded ${selDayTx.length} transaction${selDayTx.length > 1 ? 's' : ''} totaling ${profile.currencySymbol}${selSpent.toLocaleString()}. ${selIsUnder ? `+${profile.currencySymbol}${Math.abs(selDiff)} retained as savings.` : `Exceeded daily allowance by ${profile.currencySymbol}${Math.abs(selDiff)}.`}`
                : `${selFormattedDate}: Zero expenses recorded on this exact date. Full ${profile.currencySymbol}${selAllowance.toLocaleString()} allowance retained as savings! 💰`}
          </Text>

          {/* If there are transactions on this exact date, list them cleanly! */}
          {selDayTx.length > 0 && (
            <View style={styles.selTxContainer}>
              <Text style={styles.selTxHeader}>TRANSACTIONS ON {selFormattedDate.toUpperCase()}:</Text>
              {selDayTx.map((tx) => (
                <View key={tx.id} style={styles.selTxRow}>
                  <Text style={styles.selTxTitle}>• {tx.title}</Text>
                  <Text style={styles.selTxAmount}>-{profile.currencySymbol}{tx.amount.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 10,
  },
  card: {
    backgroundColor: '#121824',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  perDayLabel: {
    color: '#A3E635',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  cycleDaysLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  equationRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  poolAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  divideOperator: {
    color: '#818CF8',
    fontSize: 22,
    fontWeight: '800',
    marginLeft: 6,
  },
  equationSubBadge: {
    marginLeft: 10,
  },
  equationSubText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 7,
  },
  dayTile: {
    width: '15.2%',
    minHeight: 52,
    borderRadius: 9,
    padding: 3,
    justifyContent: 'space-between',
  },
  dayTileGreen: {
    backgroundColor: 'rgba(163, 230, 53, 0.14)',
    borderWidth: 0.5,
    borderColor: 'rgba(163, 230, 53, 0.35)',
  },
  dayTileRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderWidth: 0.5,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  dayTileToday: {
    borderWidth: 1.5,
    borderColor: '#A3E635',
    shadowColor: '#A3E635',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  dayTileFuture: {
    backgroundColor: '#161F2E',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  dayTileSelected: {
    borderWidth: 2,
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
  },
  dayNumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayNumText: {
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'left',
  },
  dayNumActiveText: {
    color: '#94A3B8',
  },
  dayNumTodayText: {
    color: '#A3E635',
    fontWeight: '900',
  },
  dayNumFutureText: {
    color: '#475569',
  },
  todaySmallDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#A3E635',
  },
  tileDataCol: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tileSpentText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  tileSpentGreen: {
    color: '#A3E635',
  },
  tileSpentRed: {
    color: '#EF4444',
  },
  tileAllowanceText: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: -0.2,
    textAlign: 'center',
    marginTop: -1,
  },
  tileFutureDash: {
    fontSize: 9,
    color: '#475569',
    fontWeight: '700',
    textAlign: 'center',
  },
  heroResultContainer: {
    marginTop: 14,
    marginBottom: 4,
  },
  heroResultCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  heroResultTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroDayBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroDayBadgeText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeGreen: {
    backgroundColor: 'rgba(163, 230, 53, 0.15)',
  },
  badgeRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  heroStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  textGreen: {
    color: '#A3E635',
  },
  textRed: {
    color: '#EF4444',
  },
  heroEquationDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  heroSpentBig: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroSpentRed: {
    color: '#EF4444',
  },
  heroSlash: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '700',
  },
  heroAllowanceBig: {
    color: '#A3E635',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroAllowanceLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  heroSubText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
    lineHeight: 16,
  },
  selTxContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  selTxHeader: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  selTxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  selTxTitle: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
  selTxAmount: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';

export const DailyBudgetCard: React.FC = () => {
  const { budget, profile } = useApp();

  const isOverspent = budget.isOverspentToday;
  const progressRatio = budget.todaySafeLimit > 0 
    ? Math.min(1, budget.todaySpent / budget.todaySafeLimit) 
    : 1;

  const percentSpent = Math.min(100, Math.round(progressRatio * 100));

  const getAccentColor = () => {
    if (isOverspent) return '#EF4444';
    if (progressRatio > 0.8) return '#F59E0B';
    return '#10B981';
  };

  const overspentAmount = Math.abs(Math.min(0, budget.todayRemaining));
  const accentColor = getAccentColor();

  return (
    <View style={styles.card}>
      {/* Background Subtle Glow Decor */}
      <View style={[styles.cardGlow, { backgroundColor: isOverspent ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)' }]} />

      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={[styles.statusPill, { borderColor: `${accentColor}40` }]}>
          <View style={[styles.pulseDot, { backgroundColor: accentColor }]} />
          <Text style={[styles.statusPillText, { color: accentColor }]}>
            {isOverspent ? 'LIMIT EXCEEDED' : 'SAFE DAILY LIMIT'}
          </Text>
        </View>

        <View style={styles.dateBadge}>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>

      {/* Hero Limit Centerpiece - Spent Out of Daily Limit */}
      <View style={styles.heroSection}>
        <Text style={styles.heroSubLabel}>TODAY'S SPENDING / DAILY LIMIT</Text>

        {/* Big Bold Spent Out of Limit Display */}
        <View style={styles.heroRatioRow}>
          <Text
            style={[
              styles.heroSpentValue,
              isOverspent && styles.heroSpentOver,
            ]}
          >
            {profile.currencySymbol}{budget.todaySpent.toLocaleString()}
          </Text>
          <Text style={styles.heroSlash}> / </Text>
          <Text style={styles.heroLimitValue}>
            {profile.currencySymbol}{budget.todaySafeLimit.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Luxury Progress Bar with Percent Tag */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>BUDGET CONSUMED</Text>
          <Text style={[styles.progressPercent, { color: accentColor }]}>
            {percentSpent}%
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentSpent}%`,
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>
      </View>

      {/* Concise Alert only when overspent */}
      {isOverspent && (
        <View style={styles.overspentWarningBox}>
          <Text style={styles.overspentWarningText}>
            ⚠️ Exceeded today's allowance by {profile.currencySymbol}{overspentAmount.toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dateBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dateText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 4,
  },
  heroTagRow: {
    marginBottom: 4,
  },
  heroSubLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heroRatioRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: 2,
  },
  heroSpentValue: {
    color: '#F8FAFC',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroSpentOver: {
    color: '#EF4444',
  },
  heroSlash: {
    color: '#64748B',
    fontSize: 24,
    fontWeight: '700',
    marginHorizontal: 3,
  },
  heroLimitValue: {
    color: '#10B981',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
  },
  progressContainer: {
    marginTop: 18,
    marginBottom: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  overspentWarningBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
  },
  overspentWarningText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
});

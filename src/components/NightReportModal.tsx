import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { generateDailyReport } from '../utils/budgetEngine';

interface NightReportModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NightReportModal: React.FC<NightReportModalProps> = ({ visible, onClose }) => {
  const { profile, transactions } = useApp();
  const report = generateDailyReport(profile, transactions);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <Text style={styles.moonIcon}>🌙</Text>
              <View style={styles.tag}>
                <Text style={styles.tagText}>11 PM MONEY COACH REPORT</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Headline */}
            <Text style={styles.headline}>{report.headline}</Text>
            <Text style={styles.subheadline}>Here is your financial debrief for today:</Text>

            {/* Core 3-Metric Summary Card */}
            <View style={styles.metricsCard}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>💰 Daily budget</Text>
                <Text style={styles.metricValue}>₹{report.safeLimit.toLocaleString()}</Text>
              </View>
              <View style={styles.metricDivider} />

              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>💸 Spent</Text>
                <Text style={[styles.metricValue, { color: '#F87171' }]}>
                  ₹{report.spent.toLocaleString()}
                </Text>
              </View>
              <View style={styles.metricDivider} />

              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>
                  {report.status === 'over' ? '🔴 Exceeded' : '🟢 Saved'}
                </Text>
                <Text
                  style={[
                    styles.metricValue,
                    { color: report.status === 'over' ? '#EF4444' : '#10B981' },
                  ]}
                >
                  ₹{Math.abs(report.safeLimit - report.spent).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Where you spent section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Where you spent:</Text>
              {report.categoryBreakdown.length > 0 ? (
                <View style={styles.breakdownList}>
                  {report.categoryBreakdown.map((item) => (
                    <View key={item.category} style={styles.categoryRow}>
                      <View style={styles.categoryLeft}>
                        <Text style={styles.catIcon}>{item.icon}</Text>
                        <Text style={styles.catName}>{item.label}</Text>
                      </View>
                      <Text style={styles.catAmount}>₹{item.amount.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptySpend}>
                  <Text style={styles.emptySpendText}>🎉 Zero spending recorded today!</Text>
                </View>
              )}
            </View>

            {/* Motivational Outcome Banner */}
            <View
              style={[
                styles.coachBanner,
                report.status === 'over' ? styles.coachBannerOver : styles.coachBannerUnder,
              ]}
            >
              <Text style={styles.coachBannerTitle}>
                {report.status === 'over'
                  ? '⚠️ Spending Exceeded Target'
                  : `🎯 You stayed ₹${report.saved.toLocaleString()} under budget!`}
              </Text>
              <Text style={styles.coachBannerDesc}>{report.message}</Text>
              <View style={styles.tomorrowHighlight}>
                <Text style={styles.tomorrowText}>
                  Your tomorrow budget is set to{' '}
                  <Text style={styles.tomorrowAmount}>₹{report.tomorrowLimit.toLocaleString()}</Text>
                </Text>
              </View>
            </View>

            {/* Streak & Milestone Footer */}
            <View style={styles.streakCard}>
              <Text style={styles.streakIcon}>🔥</Text>
              <View style={styles.streakInfo}>
                <Text style={styles.streakTitle}>
                  {profile.streakDays}-Day Budget Streak Maintained!
                </Text>
                <Text style={styles.streakDesc}>
                  You're in the top 8% of disciplined savers this month.
                </Text>
              </View>
            </View>

            {/* Dismiss Button */}
            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Sleep Well & Lock In Tomorrow 💤</Text>
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
    padding: 24,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moonIcon: {
    fontSize: 24,
  },
  tag: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  tagText: {
    color: '#818CF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  headline: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  subheadline: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 16,
  },
  metricsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricDivider: {
    height: 1,
    backgroundColor: '#334155',
  },
  metricLabel: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  metricValue: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  breakdownList: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catIcon: {
    fontSize: 18,
  },
  catName: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '500',
  },
  catAmount: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  emptySpend: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  emptySpendText: {
    color: '#10B981',
    fontWeight: '700',
  },
  coachBanner: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  coachBannerUnder: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  coachBannerOver: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  coachBannerTitle: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  coachBannerDesc: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  tomorrowHighlight: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 10,
    borderRadius: 10,
  },
  tomorrowText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  tomorrowAmount: {
    color: '#10B981',
    fontWeight: '800',
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 16,
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  streakIcon: {
    fontSize: 24,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  streakDesc: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  doneBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

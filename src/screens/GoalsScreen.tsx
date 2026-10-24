import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';

interface GoalsScreenProps {
  onBack?: () => void;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({ onBack }) => {
  const { 
    goals, 
    badges, 
    profile, 
    budget, 
    addGoal, 
    contributeToGoal,
    goalCreateModalVisible,
    setGoalCreateModalVisible,
    goalDepositModalVisible,
    setGoalDepositModalVisible,
  } = useApp();
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalIcon, setGoalIcon] = useState('🎯');

  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const handleCreateGoal = () => {
    const target = parseFloat(goalTarget);
    if (!goalTitle.trim() || isNaN(target) || target <= 0) return;
    addGoal(goalTitle.trim(), target, goalIcon);
    setGoalTitle('');
    setGoalTarget('');
    setGoalCreateModalVisible(false);
  };

  const handleDeposit = () => {
    const amt = parseFloat(depositAmount);
    if (!activeGoalId || isNaN(amt) || amt <= 0) return;
    contributeToGoal(activeGoalId, amt);
    setDepositAmount('');
    setActiveGoalId(null);
    setGoalDepositModalVisible(false);
  };

  const emojiOptions = ['🎯', '💻', '🏖️', '🚗', '🏠', '📱', '💍', '🎓'];

  return (
    <View style={styles.container}>
      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerLeftRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.title}>Goals & Achievements</Text>
            <Text style={styles.subtitle}>Savings milestones & financial streak</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setGoalCreateModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ New Goal</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Streak & Consistency Highlight */}
        <View style={styles.streakBanner}>
          <View style={styles.streakLeft}>
            <Text style={styles.streakFlame}>🔥</Text>
            <View>
              <Text style={styles.streakTitle}>{profile.streakDays} Day Budget Streak</Text>
              <Text style={styles.streakSubtitle}>
                Consistent adherence to daily limits
              </Text>
            </View>
          </View>
          <View style={styles.streakTag}>
            <Text style={styles.streakTagText}>ACTIVE</Text>
          </View>
        </View>

        {/* Daily Savings to Goals Accelerator Card */}
        <View style={styles.dailySavingsCard}>
          <View style={styles.dailySavingsTopRow}>
            <View style={styles.dailySavingsIconBox}>
              <Text style={styles.dailySavingsEmoji}>💰</Text>
            </View>
            <View style={styles.dailySavingsTitleCol}>
              <Text style={styles.dailySavingsLabel}>DAILY SAVINGS ACCELERATOR</Text>
              <Text style={styles.dailySavingsAmount}>
                +{profile.currencySymbol}{budget.totalSavedToGoalThisMonth.toLocaleString()}
              </Text>
            </View>
            <View style={styles.dailySavingsPill}>
              <Text style={styles.dailySavingsPillText}>TO GOALS</Text>
            </View>
          </View>
          <Text style={styles.dailySavingsNote}>
            All unspent daily allowances (+{profile.currencySymbol}{budget.savedToGoalToday.toLocaleString()} saved today) are calculated directly as goals. Daily limits stay fixed with zero rolling penalties!
          </Text>
        </View>

        {/* Section 1: Savings Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>TARGET SAVINGS GOALS</Text>
          {goals.map((goal, idx) => {
            // Unspent daily savings are credited to active goals
            const creditedSavings = idx === 0 ? budget.totalSavedToGoalThisMonth : 0;
            const effectiveAmount = goal.currentAmount + creditedSavings;
            const percent = Math.min(100, Math.round((effectiveAmount / goal.targetAmount) * 100));
            const remaining = Math.max(0, goal.targetAmount - effectiveAmount);

            return (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalTopRow}>
                  <View style={styles.goalTitleRow}>
                    <Text style={styles.goalIcon}>{goal.icon}</Text>
                    <View>
                      <Text style={styles.goalTitleText}>{goal.title}</Text>
                      {goal.deadline && (
                        <Text style={styles.goalDeadlineText}>Due: {goal.deadline}</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.goalPercentText}>{percent}%</Text>
                </View>

                {/* Progress bar */}
                <View style={styles.goalProgressTrack}>
                  <View
                    style={[
                      styles.goalProgressFill,
                      { width: `${percent}%` },
                    ]}
                  />
                </View>

                {/* Amounts row */}
                <View style={styles.goalAmountsRow}>
                  <Text style={styles.goalCurrent}>
                    ₹{effectiveAmount.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()}
                  </Text>
                  <Text style={styles.goalRemaining}>
                    ₹{remaining.toLocaleString()} left
                  </Text>
                </View>

                {creditedSavings > 0 && (
                  <View style={styles.creditedPill}>
                    <Text style={styles.creditedPillText}>
                      ⚡ Includes +₹{creditedSavings.toLocaleString()} daily savings credited
                    </Text>
                  </View>
                )}

                {/* Deposit action button */}
                <TouchableOpacity
                  style={styles.depositBtn}
                  onPress={() => {
                    setActiveGoalId(goal.id);
                    setGoalDepositModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.depositBtnText}>+ Contribute Funds</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Section 2: Gamification Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ACHIEVEMENT BADGES</Text>
          <View style={styles.badgesGrid}>
            {badges.map((badge) => (
              <View
                key={badge.id}
                style={[
                  styles.badgeCard,
                  !badge.unlocked && styles.badgeLocked,
                ]}
              >
                <View style={styles.badgeTop}>
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                  <View
                    style={[
                      styles.badgeStatusPill,
                      badge.unlocked ? styles.statusUnlocked : styles.statusLocked,
                    ]}
                  >
                    <Text style={styles.badgeStatusText}>
                      {badge.unlocked ? 'UNLOCKED' : 'IN PROGRESS'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.badgeTitle}>{badge.title}</Text>
                <Text style={styles.badgeDesc}>{badge.description}</Text>
                <Text style={styles.badgeProgressText}>{badge.progressText}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={goalCreateModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeading}>Create Savings Goal</Text>

            <Text style={styles.inputLabel}>CHOOSE ICON</Text>
            <View style={styles.emojiRow}>
              {emojiOptions.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, goalIcon === e && styles.emojiBtnActive]}
                  onPress={() => setGoalIcon(e)}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>GOAL TITLE</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. New M3 MacBook, Goa Vacation"
              placeholderTextColor="#64748B"
              value={goalTitle}
              onChangeText={setGoalTitle}
            />

            <Text style={styles.inputLabel}>TARGET AMOUNT (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 60000"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              value={goalTarget}
              onChangeText={setGoalTarget}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setGoalCreateModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleCreateGoal}
              >
                <Text style={styles.saveBtnText}>Save Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Deposit to Goal Modal */}
      <Modal visible={goalDepositModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeading}>Deposit into Goal</Text>
            <Text style={styles.inputLabel}>AMOUNT TO ALLOCATE (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2000"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              value={depositAmount}
              onChangeText={setDepositAmount}
              autoFocus
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setGoalDepositModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleDeposit}
              >
                <Text style={styles.saveBtnText}>Deposit Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  streakBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1B4B',
    padding: 16,
    borderRadius: 18,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakFlame: {
    fontSize: 28,
  },
  streakTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  streakSubtitle: {
    color: '#A5B4FC',
    fontSize: 12,
    marginTop: 2,
  },
  streakTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  streakTagText: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '800',
  },
  dailySavingsCard: {
    backgroundColor: '#0F1E2A',
    borderRadius: 18,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  dailySavingsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dailySavingsIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailySavingsEmoji: {
    fontSize: 22,
  },
  dailySavingsTitleCol: {
    flex: 1,
  },
  dailySavingsLabel: {
    color: '#10B981',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dailySavingsAmount: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  dailySavingsPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dailySavingsPillText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  dailySavingsNote: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10,
  },
  creditedPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  creditedPillText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  section: {
    marginTop: 14,
  },
  sectionHeader: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  goalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  goalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goalIcon: {
    fontSize: 24,
  },
  goalTitleText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  goalDeadlineText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  goalPercentText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '800',
  },
  goalProgressTrack: {
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  goalAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalCurrent: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  goalRemaining: {
    color: '#64748B',
    fontSize: 12,
  },
  depositBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  depositBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  badgesGrid: {
    gap: 10,
  },
  badgeCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  badgeLocked: {
    opacity: 0.6,
  },
  badgeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeIcon: {
    fontSize: 26,
  },
  badgeStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusUnlocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusLocked: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  badgeStatusText: {
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: '800',
  },
  badgeTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  badgeDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  badgeProgressText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeading: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  inputLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  emojiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  emojiBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiBtnActive: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  emojiText: {
    fontSize: 18,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

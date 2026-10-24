import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../constants/categories';

export const LargeExpenseModal: React.FC = () => {
  const { pendingLargeExpense, markExpensePlanned, budget, profile } = useApp();

  if (!pendingLargeExpense) return null;

  const category = CATEGORIES[pendingLargeExpense.category] || CATEGORIES.Others;
  const multiplier = budget.todaySafeLimit > 0 
    ? Math.round(pendingLargeExpense.amount / budget.todaySafeLimit) 
    : 10;

  return (
    <Modal visible={!!pendingLargeExpense} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Warning Icon Banner */}
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>⚠️</Text>
          </View>

          <Text style={styles.title}>Large Expense Detected</Text>

          <View style={styles.amountBox}>
            <Text style={styles.amount}>
              {profile.currencySymbol}{pendingLargeExpense.amount.toLocaleString()}
            </Text>
            <Text style={styles.merchant}>
              {pendingLargeExpense.title} ({category.label})
            </Text>
          </View>

          <Text style={styles.explanation}>
            This is <Text style={styles.bold}>{multiplier}×</Text> your safe daily spending limit.
            Significant one-off purchases can disrupt your monthly savings trajectory if left untracked.
          </Text>

          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>Was this a planned purchase?</Text>
            <Text style={styles.questionSubtext}>
              Selecting "YES" marks this as a known budget milestone. Selecting "NO" flags an impulse trigger for your weekly coach report.
            </Text>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, styles.plannedBtn]}
                onPress={() => markExpensePlanned(pendingLargeExpense.id, true)}
                activeOpacity={0.8}
              >
                <Text style={styles.btnText}>YES, PLANNED</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.impulseBtn]}
                onPress={() => markExpensePlanned(pendingLargeExpense.id, false)}
                activeOpacity={0.8}
              >
                <Text style={styles.btnText}>NO, IMPULSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: '#F59E0B',
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 30,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  amountBox: {
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  amount: {
    color: '#F59E0B',
    fontSize: 28,
    fontWeight: '900',
  },
  merchant: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  explanation: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginVertical: 8,
  },
  bold: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  questionContainer: {
    marginTop: 14,
    width: '100%',
    alignItems: 'center',
  },
  questionText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  questionSubtext: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  plannedBtn: {
    backgroundColor: '#10B981',
  },
  impulseBtn: {
    backgroundColor: '#475569',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

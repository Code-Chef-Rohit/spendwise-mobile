import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Transaction } from '../types';
import { CATEGORIES } from '../constants/categories';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onDelete,
}) => {
  if (!transaction) return null;

  const cat = CATEGORIES[transaction.category] || CATEGORIES.Others;
  const dateObj = new Date(transaction.timestamp);
  const now = new Date();
  const isToday =
    dateObj.getFullYear() === now.getFullYear() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getDate() === now.getDate();

  const formattedDate = isToday
    ? `Today (${dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`
    : dateObj.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <Modal visible={!!transaction} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {isToday ? '⚡ TODAY’S TRANSACTION' : '🗓️ PAST TRANSACTION'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Centerpiece Hero Amount */}
          <View style={styles.heroBox}>
            <View style={[styles.catIconCircle, { backgroundColor: `${cat.color}20`, borderColor: cat.color }]}>
              <Text style={styles.catEmoji}>{cat.icon}</Text>
            </View>
            <Text style={styles.titleText}>{transaction.title}</Text>
            <Text style={styles.amountText}>-₹{transaction.amount.toLocaleString()}</Text>
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>{formattedDate} • {timeStr}</Text>
            </View>
          </View>

          {/* Detail Rows */}
          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>CATEGORY</Text>
              <View style={styles.detailValueRow}>
                <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                <Text style={styles.detailValue}>{cat.label}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>RECORDED VIA</Text>
              <Text style={styles.detailValue}>
                {transaction.source === 'bank_sync'
                  ? `Bank Live Feed (${transaction.bankRef || 'UPI Auto'})`
                  : 'Manual User Entry'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>EXPENSE INTENT</Text>
              <Text style={[styles.detailValue, { color: transaction.planned ? '#10B981' : '#F59E0B' }]}>
                {transaction.planned ? 'Planned Expense ✓' : 'Impulse Buy ⚠️'}
              </Text>
            </View>

            {transaction.notes ? (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>NOTES</Text>
                  <Text style={styles.detailValue}>{transaction.notes}</Text>
                </View>
              </>
            ) : null}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            {onDelete && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => {
                  onDelete(transaction.id);
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  headerBadgeText: {
    color: '#38BDF8',
    fontSize: 10.5,
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
    fontSize: 13,
    fontWeight: 'bold',
  },
  heroBox: {
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#161F30',
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  catIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    marginBottom: 8,
  },
  catEmoji: {
    fontSize: 24,
  },
  titleText: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  amountText: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  dateBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  detailsList: {
    backgroundColor: '#161F30',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailValue: {
    color: '#F8FAFC',
    fontSize: 12.5,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginVertical: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
  },
  doneBtn: {
    flex: 1,
    backgroundColor: '#38BDF8',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#0B0F19',
    fontSize: 13,
    fontWeight: '800',
  },
});

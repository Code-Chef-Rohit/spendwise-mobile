import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Transaction } from '../types';
import { CATEGORIES } from '../constants/categories';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  onDelete?: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onPress,
  onDelete,
}) => {
  const categoryInfo = CATEGORIES[transaction.category] || CATEGORIES.Others;
  const dateObj = new Date(transaction.timestamp);
  const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* Category Icon Squircle */}
      <View style={[styles.iconBox, { backgroundColor: `${categoryInfo.color}15`, borderColor: `${categoryInfo.color}35` }]}>
        <Text style={styles.iconText}>{categoryInfo.icon}</Text>
      </View>

      {/* Middle Information */}
      <View style={styles.infoCol}>
        <View style={styles.topLine}>
          <Text style={styles.title} numberOfLines={1}>
            {transaction.title}
          </Text>
          {transaction.source === 'bank_sync' && (
            <View style={styles.bankPill}>
              <Text style={styles.bankPillText}>AUTO</Text>
            </View>
          )}
        </View>

        <View style={styles.subLine}>
          <Text style={styles.categoryName}>{categoryInfo.label}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.timeText}>{timeStr}</Text>
          {transaction.notes && (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.notesText} numberOfLines={1}>
                {transaction.notes}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Amount and Delete Action */}
      <View style={styles.amountCol}>
        <Text style={styles.amountText}>-₹{transaction.amount.toLocaleString()}</Text>
        {onDelete && (
          <TouchableOpacity
            style={styles.deleteTouch}
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.deleteIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  iconText: {
    fontSize: 20,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  bankPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  bankPillText: {
    color: '#38BDF8',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  categoryName: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  dot: {
    color: '#475569',
    fontSize: 10,
  },
  timeText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '500',
  },
  notesText: {
    color: '#64748B',
    fontSize: 10,
    flexShrink: 1,
  },
  amountCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  amountText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  deleteTouch: {
    marginTop: 3,
    padding: 2,
  },
  deleteIcon: {
    color: '#475569',
    fontSize: 11,
  },
});

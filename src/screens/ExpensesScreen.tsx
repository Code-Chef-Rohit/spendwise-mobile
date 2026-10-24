import React, { useState, useMemo, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { CategoryType, Transaction } from '../types';
import { CATEGORIES } from '../constants/categories';
import { TransactionItem } from '../components/TransactionItem';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { TransactionDetailModal } from '../components/TransactionDetailModal';

interface ExpensesScreenProps {
  onBack?: () => void;
  initialScope?: 'today' | 'month';
}

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({ onBack, initialScope = 'today' }) => {
  const { 
    transactions, 
    deleteTransaction, 
    profile,
    addExpenseModalVisible,
    setAddExpenseModalVisible,
  } = useApp();
  const [dateScope, setDateScope] = useState<'today' | 'month'>(initialScope);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailModalTx, setDetailModalTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (initialScope) {
      setDateScope(initialScope);
    }
  }, [initialScope]);

  const categoryFilters = ['ALL', ...Object.keys(CATEGORIES)];

  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();
  const todayDate = now.getDate();

  const todayCount = useMemo(() => {
    return transactions.filter((tx) => {
      const d = new Date(tx.timestamp);
      return (
        d.getFullYear() === todayYear &&
        d.getMonth() === todayMonth &&
        d.getDate() === todayDate
      );
    }).length;
  }, [transactions, todayYear, todayMonth, todayDate]);

  const monthCount = useMemo(() => {
    return transactions.filter((tx) => {
      const d = new Date(tx.timestamp);
      return d.getFullYear() === todayYear && d.getMonth() === todayMonth;
    }).length;
  }, [transactions, todayYear, todayMonth]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = new Date(tx.timestamp);

      // Exact Date Scope Filter
      if (dateScope === 'today') {
        const isToday =
          txDate.getFullYear() === todayYear &&
          txDate.getMonth() === todayMonth &&
          txDate.getDate() === todayDate;
        if (!isToday) return false;
      } else {
        const isThisMonth =
          txDate.getFullYear() === todayYear &&
          txDate.getMonth() === todayMonth;
        if (!isThisMonth) return false;
      }

      // Category filter
      const matchesCategory =
        selectedCategory === 'ALL' || tx.category === selectedCategory;

      // Search filter
      const matchesSearch =
        tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.notes && tx.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [transactions, dateScope, selectedCategory, searchQuery, todayYear, todayMonth, todayDate]);

  const totalFilteredAmount = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [filteredTransactions]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeftRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>Expense Journal</Text>
            <Text style={styles.headerSubtitle}>
              {dateScope === 'today'
                ? `${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? 's' : ''} today`
                : `${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? 's' : ''} this month`}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAddExpenseModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Date Scope Segmented Switcher */}
      <View style={styles.scopeContainer}>
        <TouchableOpacity
          style={[styles.scopeBtn, dateScope === 'today' && styles.scopeBtnActive]}
          onPress={() => setDateScope('today')}
          activeOpacity={0.8}
        >
          <Text style={[styles.scopeBtnText, dateScope === 'today' && styles.scopeBtnTextActive]}>
            ⚡ Today's Activity ({todayCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scopeBtn, dateScope === 'month' && styles.scopeBtnActive]}
          onPress={() => setDateScope('month')}
          activeOpacity={0.8}
        >
          <Text style={[styles.scopeBtnText, dateScope === 'month' && styles.scopeBtnTextActive]}>
            🗓️ Whole Month ({monthCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Banner */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryLabel}>
            {dateScope === 'today'
              ? (selectedCategory === 'ALL' ? "TODAY'S TOTAL SPEND" : `TODAY'S ${selectedCategory.toUpperCase()}`)
              : (selectedCategory === 'ALL' ? 'TOTAL MONTH SPENDING' : `${selectedCategory.toUpperCase()} TOTAL`)}
          </Text>
          <Text style={styles.summaryAmount}>
            {profile.currencySymbol}{totalFilteredAmount.toLocaleString()}
          </Text>
        </View>
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryBadgeText}>
            {dateScope === 'today' ? '⚡ Active Day' : '🗓️ Monthly Log'}
          </Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search merchants, items, notes..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Category Filters */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {categoryFilters.map((catKey) => {
            const isSelected = selectedCategory === catKey;
            const catInfo = catKey === 'ALL' ? null : CATEGORIES[catKey as CategoryType];
            return (
              <TouchableOpacity
                key={catKey}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillSelected,
                ]}
                onPress={() => setSelectedCategory(catKey)}
              >
                {catInfo && <Text style={styles.filterIcon}>{catInfo.icon}</Text>}
                <Text
                  style={[
                    styles.filterText,
                    isSelected && styles.filterTextSelected,
                  ]}
                >
                  {catKey === 'ALL' ? 'All Expenses' : catInfo?.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Transactions List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>{dateScope === 'today' ? '🛡️' : '📦'}</Text>
            <Text style={styles.emptyTitle}>
              {dateScope === 'today' ? 'No expenses recorded today' : 'No transactions found'}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? `No transactions matching "${searchQuery}"`
                : dateScope === 'today'
                  ? 'Your daily budget is 100% untouched today. Tap + Add above to log an expense!'
                  : 'No transactions recorded in this period yet.'}
            </Text>
          </View>
        ) : (
          filteredTransactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              onPress={() => setDetailModalTx(tx)}
              onDelete={() => deleteTransaction(tx.id)}
            />
          ))
        )}
      </ScrollView>

      <AddExpenseModal
        visible={addExpenseModalVisible}
        onClose={() => setAddExpenseModalVisible(false)}
      />

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
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  scopeContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeBtnActive: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  scopeBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  scopeBtnTextActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLeft: {
    flex: 1,
  },
  summaryBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  summaryBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  summaryAmount: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    paddingVertical: 10,
  },
  clearText: {
    color: '#64748B',
    fontSize: 14,
    padding: 4,
  },
  filtersWrapper: {
    marginBottom: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  filterPillSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#60A5FA',
  },
  filterIcon: {
    fontSize: 14,
  },
  filterText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  emptyContainer: {
    backgroundColor: '#1E293B',
    padding: 30,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
  },
});

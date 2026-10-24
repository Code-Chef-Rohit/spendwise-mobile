import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CategoryType } from '../types';
import { CATEGORIES } from '../constants/categories';
import { autoDetectCategory } from '../utils/budgetEngine';
import { useApp } from '../context/AppContext';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ visible, onClose }) => {
  const { addTransaction, budget } = useApp();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Food');
  const [notes, setNotes] = useState('');
  const [isPlanned, setIsPlanned] = useState(true);
  const [dateChoice, setDateChoice] = useState<'today' | 'yesterday' | 'dayBefore'>('today');

  // Auto-detect category whenever user types the title
  useEffect(() => {
    if (title.trim()) {
      const detected = autoDetectCategory(title, notes);
      setSelectedCategory(detected);
    }
  }, [title]);

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) {
      return;
    }

    let customTimestamp = new Date().toISOString();
    if (dateChoice === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      customTimestamp = d.toISOString();
    } else if (dateChoice === 'dayBefore') {
      const d = new Date();
      d.setDate(d.getDate() - 2);
      customTimestamp = d.toISOString();
    }

    addTransaction(
      title.trim(),
      numAmount,
      selectedCategory,
      'manual',
      notes.trim() || undefined,
      isPlanned,
      customTimestamp
    );

    // Reset fields and close
    setTitle('');
    setAmount('');
    setNotes('');
    setIsPlanned(true);
    setDateChoice('today');
    onClose();
  };

  const categoriesList = Object.keys(CATEGORIES) as CategoryType[];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.modalTitle}>Add New Expense</Text>
              <Text style={styles.modalSubtitle}>
                Today's remaining budget: ₹{budget.todayRemaining.toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>AMOUNT (₹)</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor="#475569"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus
                />
              </View>
            </View>

            {/* Exact Date Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>TRANSACTION DATE</Text>
              <View style={styles.dateSelectorRow}>
                <TouchableOpacity
                  style={[styles.dateChip, dateChoice === 'today' && styles.dateChipActive]}
                  onPress={() => setDateChoice('today')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dateChipText, dateChoice === 'today' && styles.dateChipTextActive]}>
                    Today ({new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dateChip, dateChoice === 'yesterday' && styles.dateChipActive]}
                  onPress={() => setDateChoice('yesterday')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dateChipText, dateChoice === 'yesterday' && styles.dateChipTextActive]}>
                    Yesterday ({(() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 1);
                      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    })()})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dateChip, dateChoice === 'dayBefore' && styles.dateChipActive]}
                  onPress={() => setDateChoice('dayBefore')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dateChipText, dateChoice === 'dayBefore' && styles.dateChipTextActive]}>
                    {(() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 2);
                      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    })()}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Merchant / Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>WHERE DID YOU SPEND?</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Swiggy, Uber, Zara, Electricity"
                placeholderTextColor="#64748B"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Category selection */}
            <View style={styles.inputGroup}>
              <View style={styles.categoryLabelRow}>
                <Text style={styles.label}>CATEGORY</Text>
                <Text style={styles.smartBadge}>✨ Auto-detected</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {categoriesList.map((catKey) => {
                  const cat = CATEGORIES[catKey];
                  const isSelected = selectedCategory === catKey;
                  return (
                    <TouchableOpacity
                      key={catKey}
                      style={[
                        styles.categoryPill,
                        isSelected && { borderColor: cat.color, backgroundColor: '#334155' },
                      ]}
                      onPress={() => setSelectedCategory(catKey)}
                    >
                      <Text style={styles.categoryPillIcon}>{cat.icon}</Text>
                      <Text
                        style={[
                          styles.categoryPillText,
                          isSelected && { color: '#F8FAFC', fontWeight: '700' },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOTES / REASON (OPTIONAL)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Team lunch with coworkers"
                placeholderTextColor="#64748B"
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Planned Purchase Toggle */}
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleTitle}>Planned Expense</Text>
                <Text style={styles.toggleDesc}>Turn off if this was an impulse buy</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggleBtn, isPlanned ? styles.toggleOn : styles.toggleOff]}
                onPress={() => setIsPlanned(!isPlanned)}
              >
                <Text style={styles.toggleBtnText}>{isPlanned ? 'YES' : 'NO'}</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!title.trim() || !amount) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!title.trim() || !amount}
            >
              <Text style={styles.submitButtonText}>Record & Recalculate Budget</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  categoryLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  smartBadge: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  currencyPrefix: {
    color: '#10B981',
    fontSize: 28,
    fontWeight: '900',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '800',
    paddingVertical: 12,
  },
  textInput: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  categoryPillIcon: {
    fontSize: 16,
  },
  categoryPillText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  toggleDesc: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleOn: {
    backgroundColor: '#10B981',
  },
  toggleOff: {
    backgroundColor: '#64748B',
  },
  toggleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  dateSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateChip: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  dateChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  dateChipText: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  dateChipTextActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
});

import { CategoryInfo, CategoryType } from '../types';

export const CATEGORIES: Record<CategoryType, CategoryInfo> = {
  Food: {
    id: 'Food',
    label: 'Food & Dining',
    icon: '🍔',
    color: '#EF4444',
    bgColor: '#FEE2E2',
  },
  Shopping: {
    id: 'Shopping',
    label: 'Shopping',
    icon: '🛍️',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
  },
  Transport: {
    id: 'Transport',
    label: 'Transport & Fuel',
    icon: '🚕',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  Bills: {
    id: 'Bills',
    label: 'Bills & Utilities',
    icon: '🏠',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
  },
  Entertainment: {
    id: 'Entertainment',
    label: 'Entertainment',
    icon: '🎬',
    color: '#EC4899',
    bgColor: '#FCE7F3',
  },
  Health: {
    id: 'Health',
    label: 'Health & Medical',
    icon: '💊',
    color: '#10B981',
    bgColor: '#D1FAE5',
  },
  Others: {
    id: 'Others',
    label: 'General & Others',
    icon: '📦',
    color: '#6B7280',
    bgColor: '#F3F4F6',
  },
};

export const MOCK_MERCHANTS: { name: string; category: CategoryType; amountRange: [number, number] }[] = [
  { name: 'Swiggy', category: 'Food', amountRange: [220, 650] },
  { name: 'Zomato', category: 'Food', amountRange: [180, 520] },
  { name: 'Amazon India', category: 'Shopping', amountRange: [499, 2499] },
  { name: 'Flipkart', category: 'Shopping', amountRange: [350, 1899] },
  { name: 'Uber Trip', category: 'Transport', amountRange: [120, 380] },
  { name: 'Ola Cabs', category: 'Transport', amountRange: [90, 290] },
  { name: 'Netflix Subscription', category: 'Entertainment', amountRange: [199, 649] },
  { name: 'BookMyShow', category: 'Entertainment', amountRange: [300, 850] },
  { name: 'Apollo Pharmacy', category: 'Health', amountRange: [150, 850] },
  { name: 'PharmEasy', category: 'Health', amountRange: [320, 1100] },
  { name: 'Airtel Broadband', category: 'Bills', amountRange: [799, 1199] },
  { name: 'Bescom Electricity', category: 'Bills', amountRange: [950, 1600] },
  { name: 'Blue Tokai Coffee', category: 'Food', amountRange: [180, 380] },
  { name: 'Zara Fashion', category: 'Shopping', amountRange: [1490, 3990] },
  { name: 'Shell Petrol Pump', category: 'Transport', amountRange: [500, 1500] },
];

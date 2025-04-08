
import { Transaction } from '@/types';
import { toast } from 'sonner';

// Generate unique ID for transactions
export const generateTransactionId = (): string => {
  return `T${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
};

// Create a new transaction
export const createTransaction = (
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'FAILOVER' | 'REBALANCE',
  amount: number,
  details: string
): Transaction => {
  return {
    id: generateTransactionId(),
    type,
    amount,
    timestamp: new Date(),
    details
  };
};

// Show toast notification
export const showNotification = (
  title: string,
  description: string,
  type: 'success' | 'error' | 'info' = 'info'
) => {
  if (type === 'success') {
    toast.success(title, { description });
  } else if (type === 'error') {
    toast.error(title, { description });
  } else {
    toast.info(title, { description });
  }
};

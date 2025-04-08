
import { Bank, BankStatus } from '@/types';
import { BorrowedAmounts } from './types';
import { createTransaction, showNotification } from './transactionUtils';

// Toggle a bank's status
export const toggleBank = (
  banks: Bank[], 
  bankId: string,
  addTransaction: (transaction: any) => void
): Bank[] => {
  const bank = banks.find(b => b.id === bankId);
  
  if (bank) {
    const newStatus = bank.status === 'UP' ? 'DOWN' : 'UP';
    
    addTransaction(
      createTransaction(
        'FAILOVER',
        0,
        `${bank.name} status changed to ${newStatus}`
      )
    );
    
    showNotification(
      `${bank.name} is now ${newStatus}`,
      newStatus === 'DOWN' 
        ? "Failover system will activate for withdrawals" 
        : "Bank is now active for deposits and withdrawals"
    );
  }
  
  return banks.map(bank => 
    bank.id === bankId 
      ? { ...bank, status: bank.status === 'UP' ? 'DOWN' as BankStatus : 'UP' as BankStatus } 
      : bank
  );
};

// Rebalance funds when a bank comes back online
export const rebalanceFunds = (
  bankId: string,
  banks: Bank[],
  borrowedAmounts: BorrowedAmounts,
  updateBanks: (banks: Bank[]) => void,
  updateLiquidityPool: (change: number) => void,
  updateBorrowedAmounts: (bankId: string, amount: number) => void,
  addTransaction: (transaction: any) => void
) => {
  const borrowedAmount = borrowedAmounts[bankId];
  if (borrowedAmount <= 0) return;
  
  const bank = banks.find(b => b.id === bankId);
  if (!bank) return;
  
  // Update the bank's balance
  const updatedBanks = banks.map(b => 
    b.id === bankId
      ? { ...b, balance: b.balance - borrowedAmount }
      : b
  );
  
  updateBanks(updatedBanks);
  
  // Update liquidity pool
  updateLiquidityPool(borrowedAmount);
  
  // Reset the borrowed amount for this bank
  updateBorrowedAmounts(bankId, 0);
  
  // Add rebalance transaction to the log
  addTransaction(
    createTransaction(
      'REBALANCE',
      borrowedAmount,
      `Rebalanced ₹${borrowedAmount.toLocaleString()} from ${bank.name} back to Liquidity Pool`
    )
  );
  
  showNotification(
    `Rebalanced Funds`,
    `₹${borrowedAmount.toLocaleString()} returned to Liquidity Pool from ${bank.name}`,
    'info'
  );
};

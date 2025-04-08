
import { Bank, User, LiquidityPool } from '@/types';
import { BorrowedAmounts } from './types';
import { createTransaction, showNotification } from './transactionUtils';

// Make a withdrawal with failover logic
export const makeWithdrawal = (
  amount: number,
  banks: Bank[],
  users: User[],
  liquidityPool: LiquidityPool,
  borrowedAmounts: BorrowedAmounts,
  getTotalUserBalance: () => number,
  updateBanks: (banks: Bank[]) => void,
  updateUsers: (users: User[]) => void,
  updateLiquidityPool: (change: number) => void,
  updateBorrowedAmounts: (bankId: string, amount: number) => void,
  addTransaction: (transaction: any) => void
): void => {
  if (amount <= 0) {
    showNotification("Invalid Amount", "Please enter a valid withdrawal amount", "error");
    return;
  }

  const totalBalance = getTotalUserBalance();
  
  if (amount > totalBalance) {
    showNotification("Insufficient Balance", "Insufficient balance for withdrawal", "error");
    return;
  }

  let remainingAmount = amount;
  const withdrawalDetails: string[] = [];
  const updatedBanks = [...banks];
  let liquidityUsed = 0;
  let liquidityBorrowedDetails: Record<string, number> = {};

  // First try to withdraw from active banks
  for (const bank of updatedBanks.filter(b => b.status === 'UP')) {
    if (remainingAmount <= 0) break;
    
    const bankWithdrawal = Math.min(bank.balance, remainingAmount);
    if (bankWithdrawal > 0) {
      bank.balance -= bankWithdrawal;
      remainingAmount -= bankWithdrawal;
      withdrawalDetails.push(`₹${bankWithdrawal.toLocaleString()} from ${bank.name}`);
    }
  }

  // If we still need funds and have down banks with deposits, use liquidity pool
  if (remainingAmount > 0) {
    // Find down banks that have deposits
    const downBanks = banks.filter(bank => bank.status === 'DOWN');
    
    // Check user deposits in down banks
    const user = users[0];
    
    for (const bank of downBanks) {
      if (remainingAmount <= 0) break;
      
      // Find if user has deposits in this down bank
      const userDeposit = user.deposits.find(d => d.bankId === bank.id);
      
      if (userDeposit && userDeposit.amount > 0) {
        // Calculate how much we can take from this bank's deposits
        const amountFromBank = Math.min(userDeposit.amount, remainingAmount);
        
        if (amountFromBank > 0 && liquidityPool.balance >= amountFromBank) {
          liquidityUsed += amountFromBank;
          remainingAmount -= amountFromBank;
          
          // Track which down bank this liquidity is covering for
          liquidityBorrowedDetails[bank.id] = (liquidityBorrowedDetails[bank.id] || 0) + amountFromBank;
          
          withdrawalDetails.push(`₹${amountFromBank.toLocaleString()} from Liquidity Pool (for ${bank.name})`);
        }
      }
    }
    
    // Use general liquidity for any remaining amount
    if (remainingAmount > 0 && liquidityPool.balance >= remainingAmount) {
      liquidityUsed += remainingAmount;
      withdrawalDetails.push(`₹${remainingAmount.toLocaleString()} from Liquidity Pool (general)`);
      remainingAmount = 0;
    }
    
    // Update liquidity pool balance
    if (liquidityUsed > 0) {
      updateLiquidityPool(-liquidityUsed);
      
      // Update borrowed amounts tracking
      Object.keys(liquidityBorrowedDetails).forEach(bankId => {
        updateBorrowedAmounts(bankId, liquidityBorrowedDetails[bankId]);
      });
    }
  }

  // Update bank balances
  updateBanks(updatedBanks);

  // Update user deposits
  const updatedUsers = [...users];
  const user = updatedUsers[0];
  let userAmountToWithdraw = amount;
  
  // Calculate new deposits after withdrawal
  const newDeposits = user.deposits
    .map(deposit => {
      const bank = banks.find(b => b.id === deposit.bankId);
      if (!bank || userAmountToWithdraw <= 0) return deposit;
      
      const withdrawAmount = Math.min(deposit.amount, userAmountToWithdraw);
      userAmountToWithdraw -= withdrawAmount;
      return { ...deposit, amount: deposit.amount - withdrawAmount };
    })
    .filter(deposit => deposit.amount > 0); // Remove zero balance deposits
  
  updatedUsers[0] = { ...user, deposits: newDeposits };
  updateUsers(updatedUsers);

  // Add transaction log
  addTransaction(
    createTransaction(
      'WITHDRAWAL',
      amount,
      `Withdrew ₹${amount.toLocaleString()}: ${withdrawalDetails.join(', ')}`
    )
  );
  
  if (liquidityUsed > 0) {
    Object.entries(liquidityBorrowedDetails).forEach(([bankId, borrowedAmount]) => {
      if (borrowedAmount > 0) {
        const bank = banks.find(b => b.id === bankId);
        addTransaction(
          createTransaction(
            'FAILOVER',
            borrowedAmount,
            `Used ₹${borrowedAmount.toLocaleString()} from Liquidity Pool for ${bank ? bank.name : 'Bank ' + bankId} (DOWN)`
          )
        );
      }
    });
  }
  
  showNotification(
    `Withdrew ₹${amount.toLocaleString()}`,
    withdrawalDetails.join(', '),
    "success"
  );
};

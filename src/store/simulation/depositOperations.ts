
import { Bank, User, Deposit } from '@/types';
import { createTransaction, showNotification } from './transactionUtils';

// Make a deposit, splitting across specified number of banks
export const makeDeposit = (
  amount: number, 
  numBanks: number,
  banks: Bank[],
  users: User[],
  updateBanks: (banks: Bank[]) => void,
  updateUsers: (users: User[]) => void,
  updateLiquidityPool: (change: number) => void,
  addTransaction: (transaction: any) => void
): void => {
  if (amount <= 0) {
    showNotification("Invalid Amount", "Please enter a valid deposit amount", "error");
    return;
  }

  const activeBanks = banks.filter(bank => bank.status === 'UP');

  if (activeBanks.length < numBanks) {
    showNotification(
      "Cannot Complete Deposit",
      `Cannot split across ${numBanks} banks. Only ${activeBanks.length} banks are active.`,
      "error"
    );
    return;
  }

  // First, add the full amount to the liquidity pool
  updateLiquidityPool(amount);

  // Add transaction for transfer to liquidity pool
  addTransaction(
    createTransaction(
      'DEPOSIT',
      amount,
      `Added ₹${amount.toLocaleString()} to Liquidity Pool`
    )
  );

  // Calculate amount per bank
  const availableBanks = activeBanks.slice(0, numBanks);
  const amountPerBank = Math.floor(amount / numBanks);
  const remainder = amount % numBanks;

  // Update user deposits
  const updatedUsers = [...users];
  const user = updatedUsers[0]; // We're working with a single user for now
  const newDeposits: Deposit[] = [...user.deposits];
  
  availableBanks.forEach((bank, index) => {
    // Add remainder to first bank
    const depositAmount = index === 0 ? amountPerBank + remainder : amountPerBank;
    
    // Find if user already has deposit in this bank
    const existingDepositIndex = newDeposits.findIndex(d => d.bankId === bank.id);
    
    if (existingDepositIndex >= 0) {
      newDeposits[existingDepositIndex].amount += depositAmount;
    } else {
      newDeposits.push({ bankId: bank.id, amount: depositAmount });
    }
  });
  
  updatedUsers[0] = { ...user, deposits: newDeposits };
  updateUsers(updatedUsers);
  
  // Update bank balances
  const updatedBanks = banks.map(bank => {
    if (availableBanks.find(b => b.id === bank.id)) {
      const bankIndex = availableBanks.findIndex(b => b.id === bank.id);
      const depositAmount = bankIndex === 0 ? amountPerBank + remainder : amountPerBank;
      return { ...bank, balance: bank.balance + depositAmount };
    }
    return bank;
  });
  
  updateBanks(updatedBanks);
  
  // Add transaction log for distribution to banks
  const bankNames = availableBanks.map(bank => bank.name).join(', ');
  addTransaction(
    createTransaction(
      'DEPOSIT',
      amount,
      `Distributed ₹${amount.toLocaleString()} from Liquidity Pool across ${bankNames}`
    )
  );
  
  showNotification(
    `Deposited ₹${amount.toLocaleString()}`,
    `First transferred to Liquidity Pool, then split across ${availableBanks.length} banks`,
    "success"
  );
};


import React, { createContext, useContext, useState } from 'react';
import { Bank, User, LiquidityPool, Transaction } from '@/types';
import { SimulationContextType, BorrowedAmounts } from './types';
import { initialBanks, initialUsers, initialLiquidityPool, initialBorrowedAmounts } from './initialState';
import { toggleBank, rebalanceFunds } from './bankOperations';
import { makeDeposit } from './depositOperations';
import { makeWithdrawal } from './withdrawalOperations';
import { createTransaction } from './transactionUtils';

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Initialize state
  const [banks, setBanks] = useState<Bank[]>(initialBanks);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [liquidityPool, setLiquidityPool] = useState<LiquidityPool>(initialLiquidityPool);
  const [borrowedAmounts, setBorrowedAmounts] = useState<BorrowedAmounts>(initialBorrowedAmounts);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Calculate active banks (status === 'UP')
  const activeBanks = banks.filter(bank => bank.status === 'UP');

  // Add a new transaction to the log
  const addTransaction = (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  };

  // Update liquidity pool balance
  const updateLiquidityPool = (change: number) => {
    setLiquidityPool(prev => ({
      balance: prev.balance + change
    }));
  };

  // Update borrowed amounts for a specific bank
  const updateBorrowedAmount = (bankId: string, additionalAmount: number) => {
    setBorrowedAmounts(prev => ({
      ...prev,
      [bankId]: prev[bankId] + additionalAmount
    }));
  };

  // Toggle bank status handler
  const toggleBankStatus = (bankId: string) => {
    setBanks(prevBanks => {
      const updatedBanks = toggleBank(prevBanks, bankId, addTransaction);
      
      const bank = updatedBanks.find(b => b.id === bankId);
      
      // If the bank is coming back online, rebalance funds
      if (bank && bank.status === 'UP') {
        // We'll rebalance after state update
        setTimeout(() => 
          rebalanceFunds(
            bankId, 
            updatedBanks, 
            borrowedAmounts,
            setBanks,
            updateLiquidityPool,
            updateBorrowedAmount,
            addTransaction
          ), 
        0);
      }
      
      return updatedBanks;
    });
  };

  // Get total user balance across all banks
  const getTotalUserBalance = (): number => {
    const user = users[0];
    return user.deposits.reduce((total, deposit) => total + deposit.amount, 0);
  };

  // Handle deposit with the refactored function
  const handleDeposit = (amount: number, numBanks: number) => {
    makeDeposit(
      amount,
      numBanks,
      banks,
      users,
      setBanks,
      setUsers,
      updateLiquidityPool,
      addTransaction
    );
  };

  // Handle withdrawal with the refactored function
  const handleWithdrawal = (amount: number) => {
    makeWithdrawal(
      amount,
      banks,
      users,
      liquidityPool,
      borrowedAmounts,
      getTotalUserBalance,
      setBanks,
      setUsers,
      updateLiquidityPool,
      updateBorrowedAmount,
      addTransaction
    );
  };

  return (
    <SimulationContext.Provider value={{
      banks,
      users,
      liquidityPool,
      transactions,
      activeBanks,
      toggleBankStatus,
      makeDeposit: handleDeposit,
      makeWithdrawal: handleWithdrawal,
      getTotalUserBalance
    }}>
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = (): SimulationContextType => {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};

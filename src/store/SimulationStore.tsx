
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Bank, User, LiquidityPool, Transaction, BankStatus, Deposit } from '@/types';
import { toast } from 'sonner';

interface SimulationContextType {
  banks: Bank[];
  users: User[];
  liquidityPool: LiquidityPool;
  transactions: Transaction[];
  activeBanks: Bank[];
  toggleBankStatus: (bankId: string) => void;
  makeDeposit: (amount: number, numBanks: number) => void;
  makeWithdrawal: (amount: number) => void;
  getTotalUserBalance: () => number;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Initialize state
  const [banks, setBanks] = useState<Bank[]>([
    { id: "A", name: "Bank A", balance: 0, status: "UP" },
    { id: "B", name: "Bank B", balance: 0, status: "UP" },
    { id: "C", name: "Bank C", balance: 0, status: "UP" }
  ]);
  
  const [users, setUsers] = useState<User[]>([
    {
      id: "U001",
      name: "User",
      deposits: []
    }
  ]);
  
  const [liquidityPool, setLiquidityPool] = useState<LiquidityPool>({
    balance: 50000
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Calculate active banks (status === 'UP')
  const activeBanks = banks.filter(bank => bank.status === 'UP');

  // Generate unique ID for transactions
  const generateTransactionId = (): string => {
    return `T${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
  };

  // Add a new transaction to the log
  const addTransaction = (
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'FAILOVER' | 'REBALANCE',
    amount: number,
    details: string
  ) => {
    const newTransaction: Transaction = {
      id: generateTransactionId(),
      type,
      amount,
      timestamp: new Date(),
      details
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
  };

  // Toggle a bank's status
  const toggleBankStatus = (bankId: string) => {
    setBanks(prevBanks => 
      prevBanks.map(bank => 
        bank.id === bankId 
          ? { ...bank, status: bank.status === 'UP' ? 'DOWN' : 'UP' } 
          : bank
      )
    );
    
    const bank = banks.find(b => b.id === bankId);
    if (bank) {
      const newStatus = bank.status === 'UP' ? 'DOWN' : 'UP';
      addTransaction(
        'FAILOVER',
        0,
        `${bank.name} status changed to ${newStatus}`
      );
      
      toast(`${bank.name} is now ${newStatus}`, {
        description: newStatus === 'DOWN' 
          ? "Failover system will activate for withdrawals" 
          : "Bank is now active for deposits and withdrawals"
      });
    }
  };

  // Make a deposit, splitting across specified number of banks
  const makeDeposit = (amount: number, numBanks: number) => {
    if (amount <= 0) {
      toast.error("Please enter a valid deposit amount");
      return;
    }

    if (activeBanks.length < numBanks) {
      toast.error(`Cannot split across ${numBanks} banks. Only ${activeBanks.length} banks are active.`);
      return;
    }

    // First, add the full amount to the liquidity pool
    setLiquidityPool(prev => ({
      balance: prev.balance + amount
    }));

    // Add transaction for transfer to liquidity pool
    addTransaction(
      'DEPOSIT',
      amount,
      `Added ₹${amount.toLocaleString()} to Liquidity Pool`
    );

    // Calculate amount per bank
    const availableBanks = activeBanks.slice(0, numBanks);
    const amountPerBank = Math.floor(amount / numBanks);
    const remainder = amount % numBanks;

    // Update user deposits and bank balances
    setUsers(prevUsers => {
      const user = prevUsers[0]; // We're working with a single user for now
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
      
      return [{ ...user, deposits: newDeposits }];
    });
    
    // Update bank balances
    setBanks(prevBanks => {
      return prevBanks.map(bank => {
        if (availableBanks.find(b => b.id === bank.id)) {
          const bankIndex = availableBanks.findIndex(b => b.id === bank.id);
          const depositAmount = bankIndex === 0 ? amountPerBank + remainder : amountPerBank;
          return { ...bank, balance: bank.balance + depositAmount };
        }
        return bank;
      });
    });
    
    // Add transaction log for distribution to banks
    const bankNames = availableBanks.map(bank => bank.name).join(', ');
    addTransaction(
      'DEPOSIT',
      amount,
      `Distributed ₹${amount.toLocaleString()} from Liquidity Pool across ${bankNames}`
    );
    
    toast.success(`Deposited ₹${amount.toLocaleString()}`, {
      description: `First transferred to Liquidity Pool, then split across ${availableBanks.length} banks`
    });
  };

  // Make a withdrawal with failover logic
  const makeWithdrawal = (amount: number) => {
    if (amount <= 0) {
      toast.error("Please enter a valid withdrawal amount");
      return;
    }

    const totalBalance = getTotalUserBalance();
    
    if (amount > totalBalance) {
      toast.error("Insufficient balance for withdrawal");
      return;
    }

    let remainingAmount = amount;
    const withdrawalDetails: string[] = [];
    const updatedBanks = [...banks];
    let liquidityUsed = 0;

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

    // If we couldn't get enough from active banks, use liquidity pool for remaining amount
    if (remainingAmount > 0 && liquidityPool.balance >= remainingAmount) {
      liquidityUsed = remainingAmount;
      setLiquidityPool(prev => ({ balance: prev.balance - remainingAmount }));
      withdrawalDetails.push(`₹${remainingAmount.toLocaleString()} from Liquidity Pool`);
      remainingAmount = 0;
    }

    // Update bank balances
    setBanks(updatedBanks);

    // Update user deposits
    setUsers(prevUsers => {
      const user = prevUsers[0];
      let userAmountToWithdraw = amount;
      
      // Calculate new deposits after withdrawal
      const newDeposits = user.deposits
        .map(deposit => {
          const bank = banks.find(b => b.id === deposit.bankId);
          if (!bank || userAmountToWithdraw <= 0) return deposit;
          
          // If bank is UP, withdraw normally
          if (bank.status === 'UP') {
            const withdrawAmount = Math.min(deposit.amount, userAmountToWithdraw);
            userAmountToWithdraw -= withdrawAmount;
            return { ...deposit, amount: deposit.amount - withdrawAmount };
          }
          
          // If bank is DOWN, we'll handle this through the liquidity pool
          return deposit;
        })
        .filter(deposit => deposit.amount > 0); // Remove zero balance deposits
      
      return [{ ...user, deposits: newDeposits }];
    });

    // Add transaction log
    addTransaction(
      'WITHDRAWAL',
      amount,
      `Withdrew ₹${amount.toLocaleString()}: ${withdrawalDetails.join(', ')}`
    );
    
    if (liquidityUsed > 0) {
      addTransaction(
        'FAILOVER',
        liquidityUsed,
        `Used ₹${liquidityUsed.toLocaleString()} from Liquidity Pool due to bank unavailability`
      );
    }
    
    toast.success(`Withdrew ₹${amount.toLocaleString()}`, {
      description: withdrawalDetails.join(', ')
    });
  };

  // Get total user balance across all banks
  const getTotalUserBalance = (): number => {
    const user = users[0];
    return user.deposits.reduce((total, deposit) => total + deposit.amount, 0);
  };

  return (
    <SimulationContext.Provider value={{
      banks,
      users,
      liquidityPool,
      transactions,
      activeBanks,
      toggleBankStatus,
      makeDeposit,
      makeWithdrawal,
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

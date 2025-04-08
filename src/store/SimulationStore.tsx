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

  // Track borrowed money from liquidity pool for each bank
  const [borrowedAmounts, setBorrowedAmounts] = useState<Record<string, number>>({
    "A": 0,
    "B": 0,
    "C": 0
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

  // Rebalance funds when a bank comes back online
  const rebalanceFunds = (bankId: string) => {
    const borrowedAmount = borrowedAmounts[bankId];
    if (borrowedAmount <= 0) return;
    
    // Find the bank
    const bank = banks.find(b => b.id === bankId);
    if (!bank) return;
    
    // Update the bank's balance and the liquidity pool
    setBanks(prevBanks => 
      prevBanks.map(b => 
        b.id === bankId
          ? { ...b, balance: b.balance - borrowedAmount }
          : b
      )
    );
    
    setLiquidityPool(prev => ({
      balance: prev.balance + borrowedAmount
    }));
    
    // Reset the borrowed amount for this bank
    setBorrowedAmounts(prev => ({
      ...prev,
      [bankId]: 0
    }));
    
    // Add rebalance transaction to the log
    addTransaction(
      'REBALANCE',
      borrowedAmount,
      `Rebalanced ₹${borrowedAmount.toLocaleString()} from ${bank.name} back to Liquidity Pool`
    );
    
    toast.info(`Rebalanced Funds`, {
      description: `₹${borrowedAmount.toLocaleString()} returned to Liquidity Pool from ${bank.name}`
    });
  };

  // Toggle a bank's status
  const toggleBankStatus = (bankId: string) => {
    setBanks(prevBanks => {
      const updatedBanks = prevBanks.map(bank => 
        bank.id === bankId 
          ? { ...bank, status: bank.status === 'UP' ? 'DOWN' as BankStatus : 'UP' as BankStatus } 
          : bank
      );
      
      const bank = updatedBanks.find(b => b.id === bankId);
      
      // If the bank is coming back online, rebalance funds
      if (bank && bank.status === 'UP') {
        // We'll rebalance after state update
        setTimeout(() => rebalanceFunds(bankId), 0);
      }
      
      return updatedBanks;
    });
    
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
        setLiquidityPool(prev => ({ balance: prev.balance - liquidityUsed }));
        
        // Update borrowed amounts tracking
        setBorrowedAmounts(prev => {
          const updated = { ...prev };
          Object.keys(liquidityBorrowedDetails).forEach(bankId => {
            updated[bankId] += liquidityBorrowedDetails[bankId];
          });
          return updated;
        });
      }
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
          
          const withdrawAmount = Math.min(deposit.amount, userAmountToWithdraw);
          userAmountToWithdraw -= withdrawAmount;
          return { ...deposit, amount: deposit.amount - withdrawAmount };
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
      Object.entries(liquidityBorrowedDetails).forEach(([bankId, borrowedAmount]) => {
        if (borrowedAmount > 0) {
          const bank = banks.find(b => b.id === bankId);
          addTransaction(
            'FAILOVER',
            borrowedAmount,
            `Used ₹${borrowedAmount.toLocaleString()} from Liquidity Pool for ${bank ? bank.name : 'Bank ' + bankId} (DOWN)`
          );
        }
      });
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


import { Bank, User, LiquidityPool, Transaction, BankStatus, Deposit } from '@/types';

export interface SimulationContextType {
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

export interface BorrowedAmounts {
  [bankId: string]: number;
}

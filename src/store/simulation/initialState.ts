
import { Bank, User, LiquidityPool } from '@/types';
import { BorrowedAmounts } from './types';

// Initial state for banks
export const initialBanks: Bank[] = [
  { id: "A", name: "Bank A", balance: 0, status: "UP" },
  { id: "B", name: "Bank B", balance: 0, status: "UP" },
  { id: "C", name: "Bank C", balance: 0, status: "UP" }
];

// Initial state for users
export const initialUsers: User[] = [
  {
    id: "U001",
    name: "User",
    deposits: []
  }
];

// Initial state for liquidity pool
export const initialLiquidityPool: LiquidityPool = {
  balance: 50000
};

// Initial borrowed amounts
export const initialBorrowedAmounts: BorrowedAmounts = {
  "A": 0,
  "B": 0,
  "C": 0
};

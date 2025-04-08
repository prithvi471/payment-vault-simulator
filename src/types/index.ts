
export type BankStatus = 'UP' | 'DOWN';

export interface Bank {
  id: string;
  name: string;
  balance: number;
  status: BankStatus;
}

export interface Deposit {
  bankId: string;
  amount: number;
}

export interface User {
  id: string;
  name: string;
  deposits: Deposit[];
}

export interface LiquidityPool {
  balance: number;
}

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'FAILOVER' | 'REBALANCE';
  amount: number;
  timestamp: Date;
  details: string;
}

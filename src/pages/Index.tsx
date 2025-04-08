
import React from 'react';
import { SimulationProvider } from '@/store/SimulationStore';
import DepositPanel from '@/components/DepositPanel';
import WithdrawalPanel from '@/components/WithdrawalPanel';
import BankStatus from '@/components/BankStatus';
import LedgerView from '@/components/LedgerView';
import TransactionLog from '@/components/TransactionLog';

const Index = () => {
  return (
    <SimulationProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Multi-Bank Failover Payment System</h1>
            <p className="text-gray-500 mt-1">A resilient payment processing prototype simulation</p>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left column */}
            <div className="space-y-6">
              <DepositPanel />
              <WithdrawalPanel />
            </div>
            
            {/* Middle column */}
            <div className="space-y-6">
              <BankStatus />
              <LedgerView />
            </div>
            
            {/* Right column */}
            <div>
              <TransactionLog />
            </div>
          </div>
        </main>
        
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              Payment Vault Simulator &copy; 2025
            </p>
          </div>
        </footer>
      </div>
    </SimulationProvider>
  );
};

export default Index;


import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSimulation } from '@/store/SimulationStore';
import { CoinsIcon } from 'lucide-react';

const LedgerView: React.FC = () => {
  const { banks, liquidityPool, users, getTotalUserBalance } = useSimulation();
  const user = users[0]; // We're working with a single user for now
  const totalUserBalance = getTotalUserBalance();

  // Calculate percentage for progress bars
  const calculatePercentage = (amount: number) => {
    return totalUserBalance > 0 ? (amount / totalUserBalance) * 100 : 0;
  };

  const getBankDepositAmount = (bankId: string): number => {
    const deposit = user.deposits.find(d => d.bankId === bankId);
    return deposit ? deposit.amount : 0;
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CoinsIcon className="h-5 w-5" />
          Funds Ledger
        </CardTitle>
        <CardDescription>
          Current balance distribution across banks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Balance</span>
              <span className="font-semibold">₹{totalUserBalance.toLocaleString()}</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>

          {banks.map((bank) => {
            const depositAmount = getBankDepositAmount(bank.id);
            const percentage = calculatePercentage(depositAmount);
            
            return (
              <div key={bank.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        bank.status === 'UP' ? 'bg-bank-up' : 'bg-bank-down'
                      }`}
                    />
                    <span className="font-medium">{bank.name}</span>
                  </div>
                  <span>₹{depositAmount.toLocaleString()}</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}

          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Liquidity Pool</span>
              <span>₹{liquidityPool.balance.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LedgerView;

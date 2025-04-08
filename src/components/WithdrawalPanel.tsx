
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleDollarSignIcon } from 'lucide-react';
import { useSimulation } from '@/store/SimulationStore';

const WithdrawalPanel: React.FC = () => {
  const { makeWithdrawal, getTotalUserBalance } = useSimulation();
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const totalBalance = getTotalUserBalance();

  const handleWithdrawal = () => {
    const amount = parseInt(withdrawalAmount);
    if (!isNaN(amount) && amount > 0) {
      makeWithdrawal(amount);
      setWithdrawalAmount('');
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-bank-secondary bg-opacity-10 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <CircleDollarSignIcon className="h-5 w-5" />
          Withdraw Funds
        </CardTitle>
        <CardDescription>
          The system will automatically use available banks
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Available Balance</Label>
            <span className="text-lg font-semibold">₹{totalBalance.toLocaleString()}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="withdrawal-amount">Withdrawal Amount (₹)</Label>
            <Input
              id="withdrawal-amount"
              type="number"
              placeholder="Enter amount"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-bank-secondary hover:bg-bank-secondary/80" 
          onClick={handleWithdrawal}
          disabled={!withdrawalAmount || totalBalance === 0}
        >
          Withdraw Funds
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WithdrawalPanel;

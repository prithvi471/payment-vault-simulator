
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSimulation } from '@/store/SimulationStore';
import { BanknoteIcon } from 'lucide-react';

const DepositPanel: React.FC = () => {
  const { makeDeposit, activeBanks } = useSimulation();
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [numBanks, setNumBanks] = useState<string>(Math.min(activeBanks.length, 3).toString());

  const handleDeposit = () => {
    const amount = parseInt(depositAmount);
    if (!isNaN(amount) && amount > 0) {
      makeDeposit(amount, parseInt(numBanks));
      setDepositAmount('');
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-bank-primary bg-opacity-10 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <BanknoteIcon className="h-5 w-5" />
          Deposit Funds
        </CardTitle>
        <CardDescription>
          Split your deposit across multiple banks
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deposit-amount">Deposit Amount (₹)</Label>
            <Input
              id="deposit-amount"
              type="number"
              placeholder="Enter amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank-count">Split across</Label>
            <Select
              value={numBanks}
              onValueChange={setNumBanks}
              disabled={activeBanks.length === 0}
            >
              <SelectTrigger id="bank-count">
                <SelectValue placeholder="Select number of banks" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Array.from({ length: Math.min(activeBanks.length, 3) }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'Bank' : 'Banks'}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {activeBanks.length === 0 && (
              <p className="text-sm text-destructive mt-1">No active banks available</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-bank-primary hover:bg-bank-primary/80" 
          onClick={handleDeposit}
          disabled={!depositAmount || activeBanks.length === 0}
        >
          Deposit Funds
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DepositPanel;

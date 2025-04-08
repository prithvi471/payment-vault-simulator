
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSimulation } from '@/store/SimulationStore';
import { DatabaseIcon } from 'lucide-react';

const BankStatus: React.FC = () => {
  const { banks, toggleBankStatus } = useSimulation();

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DatabaseIcon className="h-5 w-5" />
          Bank Status
        </CardTitle>
        <CardDescription>
          Toggle banks between UP and DOWN states
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {banks.map((bank) => (
            <div 
              key={bank.id} 
              className="flex items-center justify-between p-3 rounded-md border"
            >
              <div className="flex items-center gap-2">
                <Badge 
                  className={`${
                    bank.status === 'UP' 
                      ? 'bg-bank-up animate-pulse-status' 
                      : 'bg-bank-down'
                  } uppercase`}
                >
                  {bank.status}
                </Badge>
                <span className="font-medium">{bank.name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleBankStatus(bank.id)}
              >
                Toggle Status
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BankStatus;

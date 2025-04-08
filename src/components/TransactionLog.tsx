
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSimulation } from '@/store/SimulationStore';
import { FileTextIcon } from 'lucide-react';

const TransactionLog: React.FC = () => {
  const { transactions } = useSimulation();

  // Function to format timestamp
  const formatTimestamp = (date: Date): string => {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true
    }).format(date);
  };

  // Get badge color based on transaction type
  const getBadgeColor = (type: string): string => {
    switch (type) {
      case 'DEPOSIT':
        return 'bg-bank-primary text-white';
      case 'WITHDRAWAL':
        return 'bg-bank-secondary text-white';
      case 'FAILOVER':
        return 'bg-bank-down text-white';
      case 'REBALANCE':
        return 'bg-bank-accent text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileTextIcon className="h-5 w-5" />
          Transaction Log
        </CardTitle>
        <CardDescription>
          History of deposits, withdrawals, and failover actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {transactions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
              <p>No transactions yet. Start by making a deposit.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getBadgeColor(transaction.type)}>
                          {transaction.type}
                        </Badge>
                        {transaction.type === 'DEPOSIT' || transaction.type === 'WITHDRAWAL' ? (
                          <span className="font-semibold">₹{transaction.amount.toLocaleString()}</span>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">{transaction.details}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(transaction.timestamp)}
                    </span>
                  </div>
                  <Separator className="mt-2" />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TransactionLog;

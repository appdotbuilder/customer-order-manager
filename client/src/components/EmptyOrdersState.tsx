import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface EmptyOrdersStateProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function EmptyOrdersState({ onRefresh, isLoading = false }: EmptyOrdersStateProps) {
  return (
    <Card className="text-center py-12">
      <CardContent className="space-y-6">
        <div className="text-8xl mb-4">📦</div>
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-gray-900">No Orders Yet</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            You haven't placed any orders yet. Start shopping to see your orders here!
          </p>
        </div>
        
        {onRefresh && (
          <Button 
            onClick={onRefresh} 
            disabled={isLoading}
            variant="outline"
            className="mt-4"
          >
            {isLoading ? 'Refreshing...' : '🔄 Refresh Orders'}
          </Button>
        )}
        
        <Alert className="max-w-2xl mx-auto">
          <AlertDescription className="text-sm text-left">
            <strong>🚧 Development Note:</strong> Order data is currently using stub implementation. 
            The server handlers need to be implemented to show real order data from the database.
            <br /><br />
            <strong>Expected functionality:</strong>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• Customer authentication with email/password</li>
              <li>• Fetch orders specific to the logged-in customer</li>
              <li>• Display order details including items, prices, and status</li>
              <li>• Real-time order status updates</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
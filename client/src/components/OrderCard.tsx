import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { OrderWithDetails } from '../../../server/src/schema';

interface OrderCardProps {
  order: OrderWithDetails;
}

export function OrderCard({ order }: OrderCardProps) {
  // Get status badge color
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default' as const;
      case 'shipped':
        return 'secondary' as const;
      case 'processing':
        return 'outline' as const;
      case 'cancelled':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return '✅';
      case 'shipped':
        return '🚚';
      case 'processing':
        return '⚙️';
      case 'cancelled':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '📦';
    }
  };

  return (
    <Card className="overflow-hidden order-card">
      <CardHeader className="bg-gray-50">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              📦 Order #{order.id}
            </CardTitle>
            <CardDescription>
              Placed on {order.order_date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </CardDescription>
          </div>
          <div className="text-right">
            <Badge 
              variant={getStatusBadgeVariant(order.status)} 
              className="mb-2 status-badge flex items-center gap-1"
            >
              <span>{getStatusIcon(order.status)}</span>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            <div className="text-xl font-bold text-gray-900">
              ${order.total_price.toFixed(2)}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          🛍️ Items Ordered:
        </h4>
        <div className="space-y-3">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <span className="font-medium text-gray-900">{item.product_name}</span>
                <div className="text-sm text-gray-600">
                  Quantity: {item.quantity} × ${item.unit_price.toFixed(2)} each
                </div>
              </div>
              <div className="text-gray-900 font-medium">
                ${(item.unit_price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        
        {order.order_items.length > 1 && (
          <>
            <Separator className="my-4" />
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Order Total:</span>
              <span className="text-green-600">${order.total_price.toFixed(2)}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
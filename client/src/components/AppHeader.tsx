import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Customer } from '../../../server/src/schema';

interface AppHeaderProps {
  user: Customer;
  orderCount: number;
  onLogout: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function AppHeader({ user, orderCount, onLogout, onRefresh, isLoading = false }: AppHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🛒</span>
              <h1 className="text-xl font-bold text-gray-900">Order Management</h1>
            </div>
            {orderCount > 0 && (
              <Badge variant="secondary" className="hidden sm:flex">
                {orderCount} order{orderCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
              <span>👋 Welcome,</span>
              <span className="font-medium">{user.name}</span>
            </div>
            <Button 
              variant="ghost" 
              onClick={onRefresh} 
              disabled={isLoading}
              size="sm"
              className="hidden sm:flex"
            >
              {isLoading ? '🔄' : '↻'} Refresh
            </Button>
            <Button variant="outline" onClick={onLogout} size="sm">
              Sign Out
            </Button>
          </div>
        </div>
        
        {/* Mobile user info */}
        <div className="md:hidden pb-3 flex items-center justify-between">
          <span className="text-sm text-gray-600">👋 Welcome, {user.name}</span>
          {orderCount > 0 && (
            <Badge variant="secondary">
              {orderCount} order{orderCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
import { useState, useCallback } from 'react';
import './App.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { OrderCard } from '@/components/OrderCard';
import { EmptyOrdersState } from '@/components/EmptyOrdersState';
import { AppHeader } from '@/components/AppHeader';
import { LoadingSpinner } from '@/components/LoadingSpinner';
// Using type-only imports for better TypeScript compliance
import type { Customer, CustomerLoginInput, OrderWithDetails } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Login form state
  const [loginData, setLoginData] = useState<CustomerLoginInput>({
    email: '',
    password: ''
  });

  // Load orders for authenticated user
  const loadOrders = useCallback(async (customerId: number) => {
    try {
      setIsLoadingOrders(true);
      setError(null);
      const result = await trpc.getCustomerOrders.query({ customer_id: customerId });
      setOrders(result);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setError('Failed to load orders. Please try again.');
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const user = await trpc.authenticateCustomer.mutate(loginData);
      if (user) {
        setCurrentUser(user);
        await loadOrders(user.id);
        // Reset login form
        setLoginData({ email: '', password: '' });
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    setCurrentUser(null);
    setOrders([]);
    setError(null);
  };



  // If not logged in, show login form
  if (!currentUser) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">🛒 Order Management</CardTitle>
            <CardDescription>
              Sign in to view your orders and track deliveries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={loginData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginData((prev: CustomerLoginInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginData((prev: CustomerLoginInput) => ({ ...prev, password: e.target.value }))
                  }
                  required
                  className="w-full"
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Note about stub implementation */}
            <Alert className="mt-4">
              <AlertDescription className="text-sm">
                <strong>Note:</strong> This is a demo with stub data. The authentication handler is not yet implemented on the server.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main application view for authenticated users
  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <AppHeader 
        user={currentUser}
        orderCount={orders.length}
        onLogout={handleLogout}
        onRefresh={() => loadOrders(currentUser.id)}
        isLoading={isLoadingOrders}
      />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Orders</h2>
          <p className="text-gray-600">Track your current and past orders</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Orders list */}
        {isLoadingOrders ? (
          <Card className="text-center py-12">
            <CardContent>
              <LoadingSpinner size="lg" text="Loading your orders..." />
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <EmptyOrdersState 
            onRefresh={() => currentUser && loadOrders(currentUser.id)}
            isLoading={isLoadingOrders}
          />
        ) : (
          <div className="space-y-6">
            {orders.map((order: OrderWithDetails) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
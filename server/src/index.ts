import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  customerLoginInputSchema, 
  getCustomerOrdersInputSchema 
} from './schema';

// Import handlers
import { authenticateCustomer } from './handlers/authenticate_customer';
import { getCustomerOrders } from './handlers/get_customer_orders';
import { getOrderById } from './handlers/get_order_by_id';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Customer authentication endpoint
  authenticateCustomer: publicProcedure
    .input(customerLoginInputSchema)
    .mutation(({ input }) => authenticateCustomer(input)),

  // Get all orders for a customer
  getCustomerOrders: publicProcedure
    .input(getCustomerOrdersInputSchema)
    .query(({ input }) => getCustomerOrders(input)),

  // Get a specific order by ID (with customer verification)
  getOrderById: publicProcedure
    .input(z.object({
      orderId: z.number(),
      customerId: z.number()
    }))
    .query(({ input }) => getOrderById(input.orderId, input.customerId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
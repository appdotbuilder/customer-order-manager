import { db } from '../db';
import { ordersTable, orderItemsTable, productsTable } from '../db/schema';
import { type GetCustomerOrdersInput, type OrderWithDetails } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getCustomerOrders(input: GetCustomerOrdersInput): Promise<OrderWithDetails[]> {
  try {
    // Query orders with their items and product details
    const results = await db.select({
      // Order fields
      order_id: ordersTable.id,
      total_price: ordersTable.total_price,
      status: ordersTable.status,
      order_date: ordersTable.order_date,
      // Order item fields
      item_id: orderItemsTable.id,
      quantity: orderItemsTable.quantity,
      unit_price: orderItemsTable.unit_price,
      // Product fields
      product_name: productsTable.name,
    })
    .from(ordersTable)
    .innerJoin(orderItemsTable, eq(ordersTable.id, orderItemsTable.order_id))
    .innerJoin(productsTable, eq(orderItemsTable.product_id, productsTable.id))
    .where(eq(ordersTable.customer_id, input.customer_id))
    .orderBy(desc(ordersTable.order_date))
    .execute();

    // Group results by order_id to structure the response
    const ordersMap = new Map<number, OrderWithDetails>();

    for (const row of results) {
      if (!ordersMap.has(row.order_id)) {
        // Create new order entry
        ordersMap.set(row.order_id, {
          id: row.order_id,
          total_price: parseFloat(row.total_price), // Convert numeric to number
          status: row.status,
          order_date: row.order_date,
          order_items: []
        });
      }

      // Add order item to the order
      const order = ordersMap.get(row.order_id)!;
      order.order_items.push({
        id: row.item_id,
        product_name: row.product_name,
        quantity: row.quantity,
        unit_price: parseFloat(row.unit_price) // Convert numeric to number
      });
    }

    // Convert map to array and return
    return Array.from(ordersMap.values());
  } catch (error) {
    console.error('Failed to fetch customer orders:', error);
    throw error;
  }
}
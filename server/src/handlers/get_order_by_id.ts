import { db } from '../db';
import { ordersTable, orderItemsTable, productsTable } from '../db/schema';
import { type OrderWithDetails } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getOrderById(orderId: number, customerId: number): Promise<OrderWithDetails | null> {
  try {
    // First, fetch the order and verify it belongs to the customer
    const orderResults = await db.select()
      .from(ordersTable)
      .where(and(
        eq(ordersTable.id, orderId),
        eq(ordersTable.customer_id, customerId)
      ))
      .execute();

    if (orderResults.length === 0) {
      return null; // Order not found or doesn't belong to customer
    }

    const order = orderResults[0];

    // Fetch order items with product details
    const orderItemsResults = await db.select()
      .from(orderItemsTable)
      .innerJoin(productsTable, eq(orderItemsTable.product_id, productsTable.id))
      .where(eq(orderItemsTable.order_id, orderId))
      .execute();

    // Transform the order items data
    const orderItems = orderItemsResults.map(result => ({
      id: result.order_items.id,
      product_name: result.products.name,
      quantity: result.order_items.quantity,
      unit_price: parseFloat(result.order_items.unit_price) // Convert numeric to number
    }));

    // Return the order with details
    return {
      id: order.id,
      total_price: parseFloat(order.total_price), // Convert numeric to number
      status: order.status,
      order_date: order.order_date,
      order_items: orderItems
    };
  } catch (error) {
    console.error('Get order by ID failed:', error);
    throw error;
  }
}
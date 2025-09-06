import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, productsTable, ordersTable, orderItemsTable } from '../db/schema';
import { type GetCustomerOrdersInput } from '../schema';
import { getCustomerOrders } from '../handlers/get_customer_orders';

describe('getCustomerOrders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for customer with no orders', async () => {
    // Create customer but no orders
    const [customer] = await db.insert(customersTable)
      .values({
        email: 'test@example.com',
        name: 'Test Customer',
        password_hash: 'hash123'
      })
      .returning()
      .execute();

    const input: GetCustomerOrdersInput = {
      customer_id: customer.id
    };

    const result = await getCustomerOrders(input);

    expect(result).toEqual([]);
  });

  it('should return orders with items for a customer', async () => {
    // Create customer
    const [customer] = await db.insert(customersTable)
      .values({
        email: 'test@example.com',
        name: 'Test Customer',
        password_hash: 'hash123'
      })
      .returning()
      .execute();

    // Create products
    const [product1, product2] = await db.insert(productsTable)
      .values([
        {
          name: 'Product 1',
          description: 'First product',
          price: '19.99'
        },
        {
          name: 'Product 2',
          description: 'Second product',
          price: '29.99'
        }
      ])
      .returning()
      .execute();

    // Create order
    const [order] = await db.insert(ordersTable)
      .values({
        customer_id: customer.id,
        total_price: '69.97', // 19.99 * 2 + 29.99 * 1
        status: 'pending'
      })
      .returning()
      .execute();

    // Create order items
    await db.insert(orderItemsTable)
      .values([
        {
          order_id: order.id,
          product_id: product1.id,
          quantity: 2,
          unit_price: '19.99'
        },
        {
          order_id: order.id,
          product_id: product2.id,
          quantity: 1,
          unit_price: '29.99'
        }
      ])
      .execute();

    const input: GetCustomerOrdersInput = {
      customer_id: customer.id
    };

    const result = await getCustomerOrders(input);

    expect(result).toHaveLength(1);
    
    const orderResult = result[0];
    expect(orderResult.id).toEqual(order.id);
    expect(orderResult.total_price).toEqual(69.97);
    expect(typeof orderResult.total_price).toBe('number');
    expect(orderResult.status).toEqual('pending');
    expect(orderResult.order_date).toBeInstanceOf(Date);
    expect(orderResult.order_items).toHaveLength(2);

    // Check order items
    const items = orderResult.order_items;
    
    // Find items by product name
    const item1 = items.find(item => item.product_name === 'Product 1');
    const item2 = items.find(item => item.product_name === 'Product 2');

    expect(item1).toBeDefined();
    expect(item1!.quantity).toEqual(2);
    expect(item1!.unit_price).toEqual(19.99);
    expect(typeof item1!.unit_price).toBe('number');

    expect(item2).toBeDefined();
    expect(item2!.quantity).toEqual(1);
    expect(item2!.unit_price).toEqual(29.99);
    expect(typeof item2!.unit_price).toBe('number');
  });

  it('should return multiple orders ordered by date descending', async () => {
    // Create customer
    const [customer] = await db.insert(customersTable)
      .values({
        email: 'test@example.com',
        name: 'Test Customer',
        password_hash: 'hash123'
      })
      .returning()
      .execute();

    // Create product
    const [product] = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        price: '10.00'
      })
      .returning()
      .execute();

    // Create orders with different dates
    const olderDate = new Date('2024-01-01');
    const newerDate = new Date('2024-02-01');

    const [olderOrder, newerOrder] = await db.insert(ordersTable)
      .values([
        {
          customer_id: customer.id,
          total_price: '10.00',
          status: 'delivered',
          order_date: olderDate
        },
        {
          customer_id: customer.id,
          total_price: '20.00',
          status: 'shipped',
          order_date: newerDate
        }
      ])
      .returning()
      .execute();

    // Create order items for both orders
    await db.insert(orderItemsTable)
      .values([
        {
          order_id: olderOrder.id,
          product_id: product.id,
          quantity: 1,
          unit_price: '10.00'
        },
        {
          order_id: newerOrder.id,
          product_id: product.id,
          quantity: 2,
          unit_price: '10.00'
        }
      ])
      .execute();

    const input: GetCustomerOrdersInput = {
      customer_id: customer.id
    };

    const result = await getCustomerOrders(input);

    expect(result).toHaveLength(2);
    
    // Should be ordered by date descending (newest first)
    expect(result[0].id).toEqual(newerOrder.id);
    expect(result[0].status).toEqual('shipped');
    expect(result[0].total_price).toEqual(20.00);
    expect(result[0].order_items).toHaveLength(1);
    expect(result[0].order_items[0].quantity).toEqual(2);

    expect(result[1].id).toEqual(olderOrder.id);
    expect(result[1].status).toEqual('delivered');
    expect(result[1].total_price).toEqual(10.00);
    expect(result[1].order_items).toHaveLength(1);
    expect(result[1].order_items[0].quantity).toEqual(1);
  });

  it('should not return orders for other customers', async () => {
    // Create two customers
    const [customer1, customer2] = await db.insert(customersTable)
      .values([
        {
          email: 'customer1@example.com',
          name: 'Customer 1',
          password_hash: 'hash1'
        },
        {
          email: 'customer2@example.com',
          name: 'Customer 2',
          password_hash: 'hash2'
        }
      ])
      .returning()
      .execute();

    // Create product
    const [product] = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        price: '10.00'
      })
      .returning()
      .execute();

    // Create orders for both customers
    const [order1, order2] = await db.insert(ordersTable)
      .values([
        {
          customer_id: customer1.id,
          total_price: '10.00',
          status: 'pending'
        },
        {
          customer_id: customer2.id,
          total_price: '20.00',
          status: 'shipped'
        }
      ])
      .returning()
      .execute();

    // Create order items for both orders
    await db.insert(orderItemsTable)
      .values([
        {
          order_id: order1.id,
          product_id: product.id,
          quantity: 1,
          unit_price: '10.00'
        },
        {
          order_id: order2.id,
          product_id: product.id,
          quantity: 2,
          unit_price: '10.00'
        }
      ])
      .execute();

    // Query for customer1's orders
    const input: GetCustomerOrdersInput = {
      customer_id: customer1.id
    };

    const result = await getCustomerOrders(input);

    // Should only return customer1's order
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(order1.id);
    expect(result[0].status).toEqual('pending');
    expect(result[0].total_price).toEqual(10.00);
  });

  it('should handle orders with multiple different products', async () => {
    // Create customer
    const [customer] = await db.insert(customersTable)
      .values({
        email: 'test@example.com',
        name: 'Test Customer',
        password_hash: 'hash123'
      })
      .returning()
      .execute();

    // Create multiple products
    const products = await db.insert(productsTable)
      .values([
        { name: 'Product A', description: 'First product', price: '15.99' },
        { name: 'Product B', description: 'Second product', price: '25.99' },
        { name: 'Product C', description: 'Third product', price: '35.99' }
      ])
      .returning()
      .execute();

    // Create order
    const [order] = await db.insert(ordersTable)
      .values({
        customer_id: customer.id,
        total_price: '103.96', // 15.99*2 + 25.99*1 + 35.99*1
        status: 'processing'
      })
      .returning()
      .execute();

    // Create order items with different quantities
    await db.insert(orderItemsTable)
      .values([
        {
          order_id: order.id,
          product_id: products[0].id,
          quantity: 2,
          unit_price: '15.99'
        },
        {
          order_id: order.id,
          product_id: products[1].id,
          quantity: 1,
          unit_price: '25.99'
        },
        {
          order_id: order.id,
          product_id: products[2].id,
          quantity: 1,
          unit_price: '35.99'
        }
      ])
      .execute();

    const input: GetCustomerOrdersInput = {
      customer_id: customer.id
    };

    const result = await getCustomerOrders(input);

    expect(result).toHaveLength(1);
    
    const orderResult = result[0];
    expect(orderResult.order_items).toHaveLength(3);

    // Verify each product is included with correct details
    const itemA = orderResult.order_items.find(item => item.product_name === 'Product A');
    const itemB = orderResult.order_items.find(item => item.product_name === 'Product B');
    const itemC = orderResult.order_items.find(item => item.product_name === 'Product C');

    expect(itemA).toBeDefined();
    expect(itemA!.quantity).toEqual(2);
    expect(itemA!.unit_price).toEqual(15.99);

    expect(itemB).toBeDefined();
    expect(itemB!.quantity).toEqual(1);
    expect(itemB!.unit_price).toEqual(25.99);

    expect(itemC).toBeDefined();
    expect(itemC!.quantity).toEqual(1);
    expect(itemC!.unit_price).toEqual(35.99);
  });
});
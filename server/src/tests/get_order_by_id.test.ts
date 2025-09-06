import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, productsTable, ordersTable, orderItemsTable } from '../db/schema';
import { getOrderById } from '../handlers/get_order_by_id';

describe('getOrderById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return order with details when order exists and belongs to customer', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        email: 'customer@test.com',
        name: 'Test Customer',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const customerId = customerResult[0].id;

    // Create test products
    const productResults = await db.insert(productsTable)
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
    const product1Id = productResults[0].id;
    const product2Id = productResults[1].id;

    // Create test order
    const orderResult = await db.insert(ordersTable)
      .values({
        customer_id: customerId,
        total_price: '69.97', // 19.99 * 2 + 29.99 * 1
        status: 'processing'
      })
      .returning()
      .execute();
    const orderId = orderResult[0].id;

    // Create order items
    await db.insert(orderItemsTable)
      .values([
        {
          order_id: orderId,
          product_id: product1Id,
          quantity: 2,
          unit_price: '19.99'
        },
        {
          order_id: orderId,
          product_id: product2Id,
          quantity: 1,
          unit_price: '29.99'
        }
      ])
      .execute();

    const result = await getOrderById(orderId, customerId);

    // Verify order details
    expect(result).not.toBeNull();
    expect(result!.id).toBe(orderId);
    expect(result!.total_price).toBe(69.97);
    expect(result!.status).toBe('processing');
    expect(result!.order_date).toBeInstanceOf(Date);
    
    // Verify order items
    expect(result!.order_items).toHaveLength(2);
    
    // First item
    const item1 = result!.order_items.find(item => item.product_name === 'Product 1');
    expect(item1).toBeDefined();
    expect(item1!.quantity).toBe(2);
    expect(item1!.unit_price).toBe(19.99);
    expect(typeof item1!.unit_price).toBe('number');
    
    // Second item
    const item2 = result!.order_items.find(item => item.product_name === 'Product 2');
    expect(item2).toBeDefined();
    expect(item2!.quantity).toBe(1);
    expect(item2!.unit_price).toBe(29.99);
    expect(typeof item2!.unit_price).toBe('number');
  });

  it('should return null when order does not exist', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        email: 'customer@test.com',
        name: 'Test Customer',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const customerId = customerResult[0].id;

    const result = await getOrderById(999, customerId);

    expect(result).toBeNull();
  });

  it('should return null when order exists but belongs to different customer', async () => {
    // Create two customers
    const customerResults = await db.insert(customersTable)
      .values([
        {
          email: 'customer1@test.com',
          name: 'Customer 1',
          password_hash: 'hashed_password1'
        },
        {
          email: 'customer2@test.com',
          name: 'Customer 2',
          password_hash: 'hashed_password2'
        }
      ])
      .returning()
      .execute();
    const customer1Id = customerResults[0].id;
    const customer2Id = customerResults[1].id;

    // Create product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        price: '19.99'
      })
      .returning()
      .execute();
    const productId = productResult[0].id;

    // Create order for customer 1
    const orderResult = await db.insert(ordersTable)
      .values({
        customer_id: customer1Id,
        total_price: '19.99',
        status: 'pending'
      })
      .returning()
      .execute();
    const orderId = orderResult[0].id;

    // Create order item
    await db.insert(orderItemsTable)
      .values({
        order_id: orderId,
        product_id: productId,
        quantity: 1,
        unit_price: '19.99'
      })
      .execute();

    // Try to get order as customer 2
    const result = await getOrderById(orderId, customer2Id);

    expect(result).toBeNull();
  });

  it('should handle order with no items', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        email: 'customer@test.com',
        name: 'Test Customer',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const customerId = customerResult[0].id;

    // Create order without items
    const orderResult = await db.insert(ordersTable)
      .values({
        customer_id: customerId,
        total_price: '0.00',
        status: 'cancelled'
      })
      .returning()
      .execute();
    const orderId = orderResult[0].id;

    const result = await getOrderById(orderId, customerId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(orderId);
    expect(result!.total_price).toBe(0.00);
    expect(result!.status).toBe('cancelled');
    expect(result!.order_items).toHaveLength(0);
  });

  it('should handle numeric field conversions correctly', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        email: 'customer@test.com',
        name: 'Test Customer',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const customerId = customerResult[0].id;

    // Create product with decimal price
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Decimal Product',
        description: 'Product with decimal price',
        price: '123.45'
      })
      .returning()
      .execute();
    const productId = productResult[0].id;

    // Create order with decimal total
    const orderResult = await db.insert(ordersTable)
      .values({
        customer_id: customerId,
        total_price: '246.90', // 123.45 * 2
        status: 'delivered'
      })
      .returning()
      .execute();
    const orderId = orderResult[0].id;

    // Create order item with decimal unit price
    await db.insert(orderItemsTable)
      .values({
        order_id: orderId,
        product_id: productId,
        quantity: 2,
        unit_price: '123.45'
      })
      .execute();

    const result = await getOrderById(orderId, customerId);

    expect(result).not.toBeNull();
    
    // Verify numeric conversions
    expect(typeof result!.total_price).toBe('number');
    expect(result!.total_price).toBe(246.90);
    
    expect(result!.order_items).toHaveLength(1);
    expect(typeof result!.order_items[0].unit_price).toBe('number');
    expect(result!.order_items[0].unit_price).toBe(123.45);
  });
});
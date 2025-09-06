import { z } from 'zod';

// Order status enum schema
export const orderStatusSchema = z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

// Customer schema
export const customerSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  password_hash: z.string(),
  created_at: z.coerce.date()
});

export type Customer = z.infer<typeof customerSchema>;

// Product schema
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(), // Will be converted from string (numeric) to number
  created_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Order item schema (individual products within an order)
export const orderItemSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int(),
  unit_price: z.number(), // Price at time of order
  product: productSchema.optional() // For joined queries
});

export type OrderItem = z.infer<typeof orderItemSchema>;

// Order schema
export const orderSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  total_price: z.number(), // Calculated total
  status: orderStatusSchema,
  order_date: z.coerce.date(),
  created_at: z.coerce.date(),
  order_items: z.array(orderItemSchema).optional() // For joined queries
});

export type Order = z.infer<typeof orderSchema>;

// Customer login input schema
export const customerLoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type CustomerLoginInput = z.infer<typeof customerLoginInputSchema>;

// Get customer orders input schema
export const getCustomerOrdersInputSchema = z.object({
  customer_id: z.number()
});

export type GetCustomerOrdersInput = z.infer<typeof getCustomerOrdersInputSchema>;

// Order with full details for customer view
export const orderWithDetailsSchema = z.object({
  id: z.number(),
  total_price: z.number(),
  status: orderStatusSchema,
  order_date: z.coerce.date(),
  order_items: z.array(z.object({
    id: z.number(),
    product_name: z.string(),
    quantity: z.number().int(),
    unit_price: z.number()
  }))
});

export type OrderWithDetails = z.infer<typeof orderWithDetailsSchema>;
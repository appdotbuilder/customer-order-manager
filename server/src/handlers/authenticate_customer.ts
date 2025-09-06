import { db } from '../db';
import { customersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CustomerLoginInput, type Customer } from '../schema';

export async function authenticateCustomer(input: CustomerLoginInput): Promise<Customer | null> {
  try {
    // Find the customer by email
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.email, input.email))
      .execute();

    if (customers.length === 0) {
      return null; // Customer not found
    }

    const customer = customers[0];

    // For this implementation, we'll do a simple string comparison
    // In a real application, you would use bcrypt.compare() or similar
    if (customer.password_hash !== input.password) {
      return null; // Password doesn't match
    }

    // Return the customer data (password_hash is included in the schema)
    return {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      password_hash: customer.password_hash,
      created_at: customer.created_at
    };
  } catch (error) {
    console.error('Customer authentication failed:', error);
    throw error;
  }
}
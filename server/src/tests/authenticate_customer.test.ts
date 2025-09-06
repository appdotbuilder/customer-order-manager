import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CustomerLoginInput } from '../schema';
import { authenticateCustomer } from '../handlers/authenticate_customer';

// Test customer data
const testCustomer = {
  email: 'test@example.com',
  name: 'Test Customer',
  password_hash: 'hashed_password_123'
};

// Valid login input
const validLoginInput: CustomerLoginInput = {
  email: 'test@example.com',
  password: 'hashed_password_123'
};

// Invalid login inputs
const invalidEmailInput: CustomerLoginInput = {
  email: 'nonexistent@example.com',
  password: 'hashed_password_123'
};

const invalidPasswordInput: CustomerLoginInput = {
  email: 'test@example.com',
  password: 'wrong_password'
};

describe('authenticateCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate customer with valid credentials', async () => {
    // Create test customer
    await db.insert(customersTable)
      .values(testCustomer)
      .execute();

    const result = await authenticateCustomer(validLoginInput);

    // Should return customer data
    expect(result).not.toBeNull();
    expect(result!.email).toEqual(testCustomer.email);
    expect(result!.name).toEqual(testCustomer.name);
    expect(result!.password_hash).toEqual(testCustomer.password_hash);
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent email', async () => {
    // Create test customer but try to authenticate with different email
    await db.insert(customersTable)
      .values(testCustomer)
      .execute();

    const result = await authenticateCustomer(invalidEmailInput);

    expect(result).toBeNull();
  });

  it('should return null for incorrect password', async () => {
    // Create test customer but try to authenticate with wrong password
    await db.insert(customersTable)
      .values(testCustomer)
      .execute();

    const result = await authenticateCustomer(invalidPasswordInput);

    expect(result).toBeNull();
  });

  it('should return null when no customers exist', async () => {
    // Don't create any customers
    const result = await authenticateCustomer(validLoginInput);

    expect(result).toBeNull();
  });

  it('should handle case-sensitive email matching', async () => {
    await db.insert(customersTable)
      .values(testCustomer)
      .execute();

    // Try with uppercase email
    const uppercaseEmailInput: CustomerLoginInput = {
      email: 'TEST@EXAMPLE.COM',
      password: 'hashed_password_123'
    };

    const result = await authenticateCustomer(uppercaseEmailInput);

    // Should return null since emails don't match exactly
    expect(result).toBeNull();
  });

  it('should authenticate multiple customers correctly', async () => {
    // Create multiple customers
    const customer1 = {
      email: 'customer1@example.com',
      name: 'Customer One',
      password_hash: 'password1'
    };

    const customer2 = {
      email: 'customer2@example.com',
      name: 'Customer Two',
      password_hash: 'password2'
    };

    await db.insert(customersTable)
      .values([customer1, customer2])
      .execute();

    // Authenticate first customer
    const result1 = await authenticateCustomer({
      email: customer1.email,
      password: customer1.password_hash
    });

    expect(result1).not.toBeNull();
    expect(result1!.email).toEqual(customer1.email);
    expect(result1!.name).toEqual(customer1.name);

    // Authenticate second customer
    const result2 = await authenticateCustomer({
      email: customer2.email,
      password: customer2.password_hash
    });

    expect(result2).not.toBeNull();
    expect(result2!.email).toEqual(customer2.email);
    expect(result2!.name).toEqual(customer2.name);

    // Try wrong password for first customer
    const result3 = await authenticateCustomer({
      email: customer1.email,
      password: customer2.password_hash
    });

    expect(result3).toBeNull();
  });
});
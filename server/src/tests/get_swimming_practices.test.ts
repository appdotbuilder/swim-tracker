import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { swimmingPracticesTable } from '../db/schema';
import { type GetSwimmingPracticesQuery, type CreateSwimmingPracticeInput } from '../schema';
import { getSwimmingPractices } from '../handlers/get_swimming_practices';

// Helper function to create test swimming practice
const createTestPractice = async (input: CreateSwimmingPracticeInput) => {
  const dateStr = input.date.toISOString().split('T')[0]; // Convert Date to string for date column
  
  const result = await db.insert(swimmingPracticesTable)
    .values({
      date: dateStr,
      duration_minutes: input.duration_minutes,
      total_distance: input.total_distance,
      main_stroke: input.main_stroke,
      notes: input.notes
    })
    .returning()
    .execute();

  return {
    ...result[0],
    date: new Date(result[0].date), // Convert string back to Date
    total_distance: parseFloat(result[0].total_distance.toString()) // Convert back to number
  };
};

describe('getSwimmingPractices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no practices exist', async () => {
    const result = await getSwimmingPractices();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all practices when no filters provided', async () => {
    // Create test practices
    const practice1: CreateSwimmingPracticeInput = {
      date: new Date('2024-01-01'),
      duration_minutes: 60,
      total_distance: 2000.5,
      main_stroke: 'Freestyle',
      notes: 'Great practice'
    };

    const practice2: CreateSwimmingPracticeInput = {
      date: new Date('2024-01-02'),
      duration_minutes: 45,
      total_distance: 1500.0,
      main_stroke: 'Backstroke',
      notes: null
    };

    await createTestPractice(practice1);
    await createTestPractice(practice2);

    const result = await getSwimmingPractices();

    expect(result).toHaveLength(2);
    expect(result[0].date).toEqual(new Date('2024-01-02')); // Most recent first
    expect(result[1].date).toEqual(new Date('2024-01-01'));
    expect(typeof result[0].total_distance).toBe('number');
    expect(result[0].total_distance).toBe(1500.0);
  });

  it('should filter by stroke type', async () => {
    // Create practices with different stroke types
    await createTestPractice({
      date: new Date('2024-01-01'),
      duration_minutes: 60,
      total_distance: 2000,
      main_stroke: 'Freestyle',
      notes: 'Freestyle practice'
    });

    await createTestPractice({
      date: new Date('2024-01-02'),
      duration_minutes: 45,
      total_distance: 1500,
      main_stroke: 'Butterfly',
      notes: 'Butterfly practice'
    });

    const query: GetSwimmingPracticesQuery = {
      stroke_type: 'Freestyle'
    };

    const result = await getSwimmingPractices(query);

    expect(result).toHaveLength(1);
    expect(result[0].main_stroke).toBe('Freestyle');
    expect(result[0].notes).toBe('Freestyle practice');
  });

  it('should filter by date range', async () => {
    // Create practices across different dates
    await createTestPractice({
      date: new Date('2024-01-01'),
      duration_minutes: 60,
      total_distance: 2000,
      main_stroke: 'Freestyle',
      notes: 'January 1st'
    });

    await createTestPractice({
      date: new Date('2024-01-15'),
      duration_minutes: 45,
      total_distance: 1500,
      main_stroke: 'Backstroke',
      notes: 'January 15th'
    });

    await createTestPractice({
      date: new Date('2024-02-01'),
      duration_minutes: 50,
      total_distance: 1800,
      main_stroke: 'Butterfly',
      notes: 'February 1st'
    });

    // Filter for January practices only
    const query: GetSwimmingPracticesQuery = {
      date_from: new Date('2024-01-01'),
      date_to: new Date('2024-01-31')
    };

    const result = await getSwimmingPractices(query);

    expect(result).toHaveLength(2);
    expect(result[0].notes).toBe('January 15th'); // Most recent first
    expect(result[1].notes).toBe('January 1st');
  });

  it('should apply pagination correctly', async () => {
    // Create multiple practices
    for (let i = 1; i <= 5; i++) {
      await createTestPractice({
        date: new Date(`2024-01-0${i}`),
        duration_minutes: 60,
        total_distance: 2000,
        main_stroke: 'Freestyle',
        notes: `Practice ${i}`
      });
    }

    // Test limit
    const limitQuery: GetSwimmingPracticesQuery = { limit: 2 };
    const limitResult = await getSwimmingPractices(limitQuery);
    expect(limitResult).toHaveLength(2);

    // Test offset
    const offsetQuery: GetSwimmingPracticesQuery = { limit: 2, offset: 2 };
    const offsetResult = await getSwimmingPractices(offsetQuery);
    expect(offsetResult).toHaveLength(2);
    expect(offsetResult[0].notes).not.toBe(limitResult[0].notes); // Different results
  });

  it('should combine multiple filters', async () => {
    // Create various practices
    await createTestPractice({
      date: new Date('2024-01-01'),
      duration_minutes: 60,
      total_distance: 2000,
      main_stroke: 'Freestyle',
      notes: 'Freestyle Jan 1'
    });

    await createTestPractice({
      date: new Date('2024-01-15'),
      duration_minutes: 45,
      total_distance: 1500,
      main_stroke: 'Freestyle',
      notes: 'Freestyle Jan 15'
    });

    await createTestPractice({
      date: new Date('2024-01-20'),
      duration_minutes: 50,
      total_distance: 1800,
      main_stroke: 'Backstroke',
      notes: 'Backstroke Jan 20'
    });

    // Combine stroke type and date filters
    const query: GetSwimmingPracticesQuery = {
      stroke_type: 'Freestyle',
      date_from: new Date('2024-01-10'),
      date_to: new Date('2024-01-31'),
      limit: 10
    };

    const result = await getSwimmingPractices(query);

    expect(result).toHaveLength(1);
    expect(result[0].main_stroke).toBe('Freestyle');
    expect(result[0].notes).toBe('Freestyle Jan 15');
  });

  it('should handle edge cases correctly', async () => {
    // Create a practice with decimal distance and null notes
    await createTestPractice({
      date: new Date('2024-01-01'),
      duration_minutes: 30,
      total_distance: 1250.75, // Decimal distance
      main_stroke: 'IM',
      notes: null // Null notes
    });

    const result = await getSwimmingPractices();

    expect(result).toHaveLength(1);
    expect(result[0].total_distance).toBe(1250.75); // Should preserve decimal precision
    expect(result[0].notes).toBe(null); // Should handle null notes
    expect(result[0].main_stroke).toBe('IM');
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle empty date range correctly', async () => {
    await createTestPractice({
      date: new Date('2024-01-01'),
      duration_minutes: 60,
      total_distance: 2000,
      main_stroke: 'Freestyle',
      notes: 'Test practice'
    });

    // Query for date range with no matches
    const query: GetSwimmingPracticesQuery = {
      date_from: new Date('2024-02-01'),
      date_to: new Date('2024-02-28')
    };

    const result = await getSwimmingPractices(query);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});
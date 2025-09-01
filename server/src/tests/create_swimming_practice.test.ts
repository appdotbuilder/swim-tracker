import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { swimmingPracticesTable } from '../db/schema';
import { type CreateSwimmingPracticeInput } from '../schema';
import { createSwimmingPractice } from '../handlers/create_swimming_practice';
import { eq, gte, between, and } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateSwimmingPracticeInput = {
  date: new Date('2024-01-15'),
  duration_minutes: 60,
  total_distance: 2000.5,
  main_stroke: 'Freestyle',
  notes: 'Great practice session with focus on technique'
};

// Test input with null notes
const testInputNullNotes: CreateSwimmingPracticeInput = {
  date: new Date('2024-01-16'),
  duration_minutes: 45,
  total_distance: 1500,
  main_stroke: 'Breaststroke',
  notes: null
};

describe('createSwimmingPractice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a swimming practice with all fields', async () => {
    const result = await createSwimmingPractice(testInput);

    // Basic field validation
    expect(result.date).toEqual(testInput.date);
    expect(result.duration_minutes).toEqual(60);
    expect(result.total_distance).toEqual(2000.5);
    expect(result.main_stroke).toEqual('Freestyle');
    expect(result.notes).toEqual('Great practice session with focus on technique');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a swimming practice with null notes', async () => {
    const result = await createSwimmingPractice(testInputNullNotes);

    // Validate null notes are handled correctly
    expect(result.date).toEqual(testInputNullNotes.date);
    expect(result.duration_minutes).toEqual(45);
    expect(result.total_distance).toEqual(1500);
    expect(result.main_stroke).toEqual('Breaststroke');
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save swimming practice to database', async () => {
    const result = await createSwimmingPractice(testInput);

    // Query using proper drizzle syntax
    const practices = await db.select()
      .from(swimmingPracticesTable)
      .where(eq(swimmingPracticesTable.id, result.id))
      .execute();

    expect(practices).toHaveLength(1);
    const savedPractice = practices[0];
    expect(savedPractice.date).toEqual('2024-01-15'); // Database stores as string
    expect(savedPractice.duration_minutes).toEqual(60);
    expect(savedPractice.total_distance).toEqual(2000.5);
    expect(savedPractice.main_stroke).toEqual('Freestyle');
    expect(savedPractice.notes).toEqual('Great practice session with focus on technique');
    expect(savedPractice.created_at).toBeInstanceOf(Date);
  });

  it('should handle different stroke types correctly', async () => {
    const butterflyInput: CreateSwimmingPracticeInput = {
      date: new Date('2024-01-17'),
      duration_minutes: 90,
      total_distance: 3000,
      main_stroke: 'Butterfly',
      notes: 'Intensive butterfly training'
    };

    const result = await createSwimmingPractice(butterflyInput);

    expect(result.main_stroke).toEqual('Butterfly');
    expect(result.duration_minutes).toEqual(90);
    expect(result.total_distance).toEqual(3000);
  });

  it('should query practices by date range correctly', async () => {
    // Create multiple test practices
    await createSwimmingPractice(testInput);
    await createSwimmingPractice(testInputNullNotes);

    // Test date filtering using the practice date column
    const dateFromStr = '2024-01-01';
    const dateToStr = '2024-01-31';

    // Query practices within date range
    const practices = await db.select()
      .from(swimmingPracticesTable)
      .where(
        and(
          gte(swimmingPracticesTable.date, dateFromStr),
          between(swimmingPracticesTable.date, dateFromStr, dateToStr)
        )
      )
      .execute();

    expect(practices.length).toBeGreaterThan(0);
    practices.forEach(practice => {
      expect(practice.created_at).toBeInstanceOf(Date);
      expect(practice.date >= dateFromStr).toBe(true);
      expect(practice.date <= dateToStr).toBe(true);
      expect(practice.main_stroke).toMatch(/^(Freestyle|Breaststroke|Backstroke|Butterfly|IM)$/);
    });
  });

  it('should handle decimal distances correctly', async () => {
    const decimalInput: CreateSwimmingPracticeInput = {
      date: new Date('2024-01-18'),
      duration_minutes: 30,
      total_distance: 1250.75, // Test decimal distance
      main_stroke: 'Backstroke',
      notes: 'Short practice with precise distance tracking'
    };

    const result = await createSwimmingPractice(decimalInput);

    expect(result.total_distance).toEqual(1250.75);
    expect(typeof result.total_distance).toEqual('number');

    // Verify in database
    const practices = await db.select()
      .from(swimmingPracticesTable)
      .where(eq(swimmingPracticesTable.id, result.id))
      .execute();

    expect(practices[0].total_distance).toEqual(1250.75);
  });
});
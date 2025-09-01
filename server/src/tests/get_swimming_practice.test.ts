import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { swimmingPracticesTable } from '../db/schema';
import { type CreateSwimmingPracticeInput } from '../schema';
import { getSwimmingPractice } from '../handlers/get_swimming_practice';

// Test data for swimming practices
const testPractice: CreateSwimmingPracticeInput = {
  date: new Date('2024-01-15'),
  duration_minutes: 90,
  total_distance: 2500.5,
  main_stroke: 'Freestyle',
  notes: 'Great workout today!'
};

const testPracticeWithNullNotes: CreateSwimmingPracticeInput = {
  date: new Date('2024-01-16'),
  duration_minutes: 60,
  total_distance: 1800,
  main_stroke: 'Butterfly',
  notes: null
};

describe('getSwimmingPractice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a swimming practice when it exists', async () => {
    // Create a test practice
    const insertResult = await db.insert(swimmingPracticesTable)
      .values({
        date: testPractice.date.toISOString().split('T')[0], // Convert to date string
        duration_minutes: testPractice.duration_minutes,
        total_distance: testPractice.total_distance,
        main_stroke: testPractice.main_stroke,
        notes: testPractice.notes
      })
      .returning()
      .execute();

    const createdPractice = insertResult[0];

    // Test the handler
    const result = await getSwimmingPractice(createdPractice.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPractice.id);
    expect(result!.date).toEqual(testPractice.date);
    expect(result!.duration_minutes).toEqual(90);
    expect(result!.total_distance).toEqual(2500.5);
    expect(typeof result!.total_distance).toBe('number'); // Verify numeric conversion
    expect(result!.main_stroke).toEqual('Freestyle');
    expect(result!.notes).toEqual('Great workout today!');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return a practice with null notes correctly', async () => {
    // Create a practice with null notes
    const insertResult = await db.insert(swimmingPracticesTable)
      .values({
        date: testPracticeWithNullNotes.date.toISOString().split('T')[0],
        duration_minutes: testPracticeWithNullNotes.duration_minutes,
        total_distance: testPracticeWithNullNotes.total_distance,
        main_stroke: testPracticeWithNullNotes.main_stroke,
        notes: testPracticeWithNullNotes.notes
      })
      .returning()
      .execute();

    const createdPractice = insertResult[0];

    // Test the handler
    const result = await getSwimmingPractice(createdPractice.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPractice.id);
    expect(result!.main_stroke).toEqual('Butterfly');
    expect(result!.notes).toBeNull();
    expect(result!.duration_minutes).toEqual(60);
    expect(result!.total_distance).toEqual(1800);
    expect(typeof result!.total_distance).toBe('number'); // Verify numeric conversion
  });

  it('should return null when practice does not exist', async () => {
    // Test with a non-existent ID
    const result = await getSwimmingPractice(999);

    expect(result).toBeNull();
  });

  it('should handle different stroke types correctly', async () => {
    // Create practices with different stroke types
    const strokes = ['Freestyle', 'Breaststroke', 'Backstroke', 'Butterfly', 'IM'] as const;
    const practiceIds: number[] = [];

    // Create multiple practices
    for (const stroke of strokes) {
      const insertResult = await db.insert(swimmingPracticesTable)
        .values({
          date: '2024-01-20',
          duration_minutes: 60,
          total_distance: 2000,
          main_stroke: stroke,
          notes: `Practice with ${stroke}`
        })
        .returning()
        .execute();

      practiceIds.push(insertResult[0].id);
    }

    // Test retrieving each practice
    for (let i = 0; i < strokes.length; i++) {
      const result = await getSwimmingPractice(practiceIds[i]);
      
      expect(result).not.toBeNull();
      expect(result!.main_stroke).toEqual(strokes[i]);
      expect(result!.notes).toEqual(`Practice with ${strokes[i]}`);
    }
  });

  it('should handle decimal distances correctly', async () => {
    // Test with various decimal distances
    const distances = [1500.25, 2000.75, 3000.5, 1234.567];
    const practiceIds: number[] = [];

    for (const distance of distances) {
      const insertResult = await db.insert(swimmingPracticesTable)
        .values({
          date: '2024-01-21',
          duration_minutes: 75,
          total_distance: distance,
          main_stroke: 'Freestyle',
          notes: `Distance: ${distance}m`
        })
        .returning()
        .execute();

      practiceIds.push(insertResult[0].id);
    }

    // Verify each distance is correctly retrieved and converted
    for (let i = 0; i < distances.length; i++) {
      const result = await getSwimmingPractice(practiceIds[i]);
      
      expect(result).not.toBeNull();
      expect(result!.total_distance).toBeCloseTo(distances[i], 6); // Allow for floating point precision
      expect(typeof result!.total_distance).toBe('number');
    }
  });

  it('should handle zero ID gracefully', async () => {
    // Test with ID 0 (which should not exist)
    const result = await getSwimmingPractice(0);

    expect(result).toBeNull();
  });

  it('should handle negative ID gracefully', async () => {
    // Test with negative ID
    const result = await getSwimmingPractice(-1);

    expect(result).toBeNull();
  });
});
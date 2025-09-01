import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { swimmingPracticesTable } from '../db/schema';
import { type CreateSwimmingPracticeInput } from '../schema';
import { deleteSwimmingPractice } from '../handlers/delete_swimming_practice';
import { eq } from 'drizzle-orm';

// Test data for creating swimming practices
const testPractice: CreateSwimmingPracticeInput = {
  date: new Date('2024-01-15'),
  duration_minutes: 60,
  total_distance: 2000,
  main_stroke: 'Freestyle',
  notes: 'Good practice session'
};

const testPractice2: CreateSwimmingPracticeInput = {
  date: new Date('2024-01-16'),
  duration_minutes: 45,
  total_distance: 1500,
  main_stroke: 'Backstroke',
  notes: null
};

describe('deleteSwimmingPractice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing swimming practice and return true', async () => {
    // Create a practice to delete
    const insertResult = await db.insert(swimmingPracticesTable)
      .values({
        date: testPractice.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        duration_minutes: testPractice.duration_minutes,
        total_distance: testPractice.total_distance,
        main_stroke: testPractice.main_stroke,
        notes: testPractice.notes
      })
      .returning()
      .execute();

    const createdPractice = insertResult[0];
    
    // Delete the practice
    const result = await deleteSwimmingPractice(createdPractice.id);
    
    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify practice was actually deleted from database
    const remainingPractices = await db.select()
      .from(swimmingPracticesTable)
      .where(eq(swimmingPracticesTable.id, createdPractice.id))
      .execute();

    expect(remainingPractices).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent practice', async () => {
    // Try to delete a practice that doesn't exist
    const result = await deleteSwimmingPractice(99999);
    
    // Should return false indicating no record was found
    expect(result).toBe(false);
  });

  it('should only delete the specified practice and leave others intact', async () => {
    // Create two practices
    const insertResult1 = await db.insert(swimmingPracticesTable)
      .values({
        date: testPractice.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        duration_minutes: testPractice.duration_minutes,
        total_distance: testPractice.total_distance,
        main_stroke: testPractice.main_stroke,
        notes: testPractice.notes
      })
      .returning()
      .execute();

    const insertResult2 = await db.insert(swimmingPracticesTable)
      .values({
        date: testPractice2.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        duration_minutes: testPractice2.duration_minutes,
        total_distance: testPractice2.total_distance,
        main_stroke: testPractice2.main_stroke,
        notes: testPractice2.notes
      })
      .returning()
      .execute();

    const practice1 = insertResult1[0];
    const practice2 = insertResult2[0];

    // Delete only the first practice
    const result = await deleteSwimmingPractice(practice1.id);
    
    expect(result).toBe(true);

    // Verify first practice was deleted
    const deletedPractice = await db.select()
      .from(swimmingPracticesTable)
      .where(eq(swimmingPracticesTable.id, practice1.id))
      .execute();

    expect(deletedPractice).toHaveLength(0);

    // Verify second practice still exists
    const remainingPractice = await db.select()
      .from(swimmingPracticesTable)
      .where(eq(swimmingPracticesTable.id, practice2.id))
      .execute();

    expect(remainingPractice).toHaveLength(1);
    expect(remainingPractice[0].id).toBe(practice2.id);
    expect(remainingPractice[0].main_stroke).toBe('Backstroke');
  });

  it('should handle deletion of practice with null notes', async () => {
    // Create practice with null notes
    const insertResult = await db.insert(swimmingPracticesTable)
      .values({
        date: testPractice2.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        duration_minutes: testPractice2.duration_minutes,
        total_distance: testPractice2.total_distance,
        main_stroke: testPractice2.main_stroke,
        notes: null
      })
      .returning()
      .execute();

    const createdPractice = insertResult[0];
    
    // Delete the practice
    const result = await deleteSwimmingPractice(createdPractice.id);
    
    expect(result).toBe(true);

    // Verify deletion
    const remainingPractices = await db.select()
      .from(swimmingPracticesTable)
      .where(eq(swimmingPracticesTable.id, createdPractice.id))
      .execute();

    expect(remainingPractices).toHaveLength(0);
  });

  it('should handle deletion with various stroke types', async () => {
    const strokes = ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'IM'] as const;
    
    // Create practices with different stroke types
    const createdPractices = [];
    for (const stroke of strokes) {
      const insertResult = await db.insert(swimmingPracticesTable)
        .values({
          date: new Date('2024-01-20').toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
          duration_minutes: 30,
          total_distance: 1000,
          main_stroke: stroke,
          notes: `Practice with ${stroke}`
        })
        .returning()
        .execute();
      
      createdPractices.push(insertResult[0]);
    }

    // Delete the Butterfly practice
    const butterflyPractice = createdPractices.find(p => p.main_stroke === 'Butterfly')!;
    const result = await deleteSwimmingPractice(butterflyPractice.id);
    
    expect(result).toBe(true);

    // Verify only the Butterfly practice was deleted
    const allPractices = await db.select()
      .from(swimmingPracticesTable)
      .execute();

    expect(allPractices).toHaveLength(4);
    expect(allPractices.every(p => p.main_stroke !== 'Butterfly')).toBe(true);
  });
});
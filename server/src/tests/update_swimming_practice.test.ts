import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { swimmingPracticesTable } from '../db/schema';
import { type UpdateSwimmingPracticeInput, type CreateSwimmingPracticeInput } from '../schema';
import { updateSwimmingPractice } from '../handlers/update_swimming_practice';
import { eq } from 'drizzle-orm';

// Helper to create a test practice
const createTestPractice = async (): Promise<number> => {
  const testData: CreateSwimmingPracticeInput = {
    date: new Date('2024-01-15'),
    duration_minutes: 60,
    total_distance: 2000,
    main_stroke: 'Freestyle',
    notes: 'Initial practice'
  };

  const result = await db.insert(swimmingPracticesTable)
    .values({
      date: testData.date.toISOString().split('T')[0],
      duration_minutes: testData.duration_minutes,
      total_distance: testData.total_distance,
      main_stroke: testData.main_stroke,
      notes: testData.notes
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateSwimmingPractice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a swimming practice', async () => {
    const practiceId = await createTestPractice();

    const updateInput: UpdateSwimmingPracticeInput = {
      id: practiceId,
      date: new Date('2024-01-20'),
      duration_minutes: 90,
      total_distance: 3000,
      main_stroke: 'Butterfly',
      notes: 'Updated practice with butterfly stroke'
    };

    const result = await updateSwimmingPractice(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(practiceId);
    expect(result!.date).toEqual(new Date('2024-01-20'));
    expect(result!.duration_minutes).toEqual(90);
    expect(result!.total_distance).toEqual(3000);
    expect(result!.main_stroke).toEqual('Butterfly');
    expect(result!.notes).toEqual('Updated practice with butterfly stroke');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const practiceId = await createTestPractice();

    // Update only duration and notes
    const updateInput: UpdateSwimmingPracticeInput = {
      id: practiceId,
      duration_minutes: 45,
      notes: 'Shorter practice today'
    };

    const result = await updateSwimmingPractice(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(practiceId);
    expect(result!.duration_minutes).toEqual(45);
    expect(result!.notes).toEqual('Shorter practice today');
    // Original values should remain unchanged
    expect(result!.date).toEqual(new Date('2024-01-15'));
    expect(result!.total_distance).toEqual(2000);
    expect(result!.main_stroke).toEqual('Freestyle');
  });

  it('should update notes to null', async () => {
    const practiceId = await createTestPractice();

    const updateInput: UpdateSwimmingPracticeInput = {
      id: practiceId,
      notes: null
    };

    const result = await updateSwimmingPractice(updateInput);

    expect(result).toBeDefined();
    expect(result!.notes).toBeNull();
    // Other fields should remain unchanged
    expect(result!.duration_minutes).toEqual(60);
    expect(result!.total_distance).toEqual(2000);
  });

  it('should persist changes in database', async () => {
    const practiceId = await createTestPractice();

    const updateInput: UpdateSwimmingPracticeInput = {
      id: practiceId,
      main_stroke: 'Backstroke',
      total_distance: 2500
    };

    await updateSwimmingPractice(updateInput);

    // Verify changes are persisted in database
    const practices = await db.select()
      .from(swimmingPracticesTable)
      .where(eq(swimmingPracticesTable.id, practiceId))
      .execute();

    expect(practices).toHaveLength(1);
    expect(practices[0].main_stroke).toEqual('Backstroke');
    expect(practices[0].total_distance).toEqual(2500);
    expect(practices[0].duration_minutes).toEqual(60); // Unchanged field
  });

  it('should return null for non-existent practice', async () => {
    const nonExistentId = 99999;

    const updateInput: UpdateSwimmingPracticeInput = {
      id: nonExistentId,
      duration_minutes: 30
    };

    const result = await updateSwimmingPractice(updateInput);

    expect(result).toBeNull();
  });

  it('should handle date updates correctly', async () => {
    const practiceId = await createTestPractice();

    const newDate = new Date('2024-02-01');
    const updateInput: UpdateSwimmingPracticeInput = {
      id: practiceId,
      date: newDate
    };

    const result = await updateSwimmingPractice(updateInput);

    expect(result).toBeDefined();
    expect(result!.date).toEqual(newDate);
    expect(result!.date).toBeInstanceOf(Date);

    // Verify in database
    const practices = await db.select()
      .from(swimmingPracticesTable)
      .where(eq(swimmingPracticesTable.id, practiceId))
      .execute();

    expect(practices[0].date).toEqual('2024-02-01'); // Database stores as string
  });

  it('should handle all stroke types', async () => {
    const practiceId = await createTestPractice();

    const strokeTypes = ['Freestyle', 'Breaststroke', 'Backstroke', 'Butterfly', 'IM'] as const;

    for (const stroke of strokeTypes) {
      const updateInput: UpdateSwimmingPracticeInput = {
        id: practiceId,
        main_stroke: stroke
      };

      const result = await updateSwimmingPractice(updateInput);

      expect(result).toBeDefined();
      expect(result!.main_stroke).toEqual(stroke);
    }
  });

  it('should handle decimal distances', async () => {
    const practiceId = await createTestPractice();

    const updateInput: UpdateSwimmingPracticeInput = {
      id: practiceId,
      total_distance: 1500.5 // Decimal distance
    };

    const result = await updateSwimmingPractice(updateInput);

    expect(result).toBeDefined();
    expect(result!.total_distance).toEqual(1500.5);
    expect(typeof result!.total_distance).toBe('number');
  });
});
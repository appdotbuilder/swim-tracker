import { db } from '../db';
import { swimmingPracticesTable } from '../db/schema';
import { type CreateSwimmingPracticeInput, type SwimmingPractice } from '../schema';

export async function createSwimmingPractice(input: CreateSwimmingPracticeInput): Promise<SwimmingPractice> {
  try {
    // Insert swimming practice record
    const result = await db.insert(swimmingPracticesTable)
      .values({
        date: input.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string format
        duration_minutes: input.duration_minutes,
        total_distance: input.total_distance, // real column - no conversion needed
        main_stroke: input.main_stroke,
        notes: input.notes
      })
      .returning()
      .execute();

    // Return the created swimming practice record
    const practice = result[0];
    return {
      ...practice,
      date: new Date(practice.date), // Convert string back to Date object for consistency with schema
    };
  } catch (error) {
    console.error('Swimming practice creation failed:', error);
    throw error;
  }
}
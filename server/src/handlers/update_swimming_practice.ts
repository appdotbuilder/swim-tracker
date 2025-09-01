import { db } from '../db';
import { swimmingPracticesTable } from '../db/schema';
import { type UpdateSwimmingPracticeInput, type SwimmingPractice } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateSwimmingPractice(input: UpdateSwimmingPracticeInput): Promise<SwimmingPractice | null> {
  try {
    // First check if the practice exists
    const existing = await db.select()
      .from(swimmingPracticesTable)
      .where(eq(swimmingPracticesTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof swimmingPracticesTable.$inferInsert> = {};
    
    if (input.date !== undefined) {
      updateData.date = input.date.toISOString().split('T')[0]; // Convert Date to YYYY-MM-DD string
    }
    
    if (input.duration_minutes !== undefined) {
      updateData.duration_minutes = input.duration_minutes;
    }
    
    if (input.total_distance !== undefined) {
      updateData.total_distance = input.total_distance;
    }
    
    if (input.main_stroke !== undefined) {
      updateData.main_stroke = input.main_stroke;
    }
    
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Update the record and return the updated data
    const result = await db.update(swimmingPracticesTable)
      .set(updateData)
      .where(eq(swimmingPracticesTable.id, input.id))
      .returning()
      .execute();

    // Convert the result to match the expected SwimmingPractice type
    const updatedPractice = result[0];
    return {
      ...updatedPractice,
      date: new Date(updatedPractice.date), // Convert string back to Date
      created_at: new Date(updatedPractice.created_at) // Ensure created_at is Date
    };
  } catch (error) {
    console.error('Swimming practice update failed:', error);
    throw error;
  }
}
import { db } from '../db';
import { swimmingPracticesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type SwimmingPractice } from '../schema';

export async function getSwimmingPractice(id: number): Promise<SwimmingPractice | null> {
  try {
    // Query for a single swimming practice by ID
    const results = await db.select()
      .from(swimmingPracticesTable)
      .where(eq(swimmingPracticesTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Convert fields to match the schema types
    const practice = results[0];
    return {
      ...practice,
      date: new Date(practice.date), // Convert date string to Date object
      total_distance: parseFloat(practice.total_distance.toString()) // Convert real to number
    };
  } catch (error) {
    console.error('Failed to get swimming practice:', error);
    throw error;
  }
}
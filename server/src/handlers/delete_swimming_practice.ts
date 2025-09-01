import { db } from '../db';
import { swimmingPracticesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteSwimmingPractice(id: number): Promise<boolean> {
  try {
    // Delete the swimming practice record by ID
    const result = await db.delete(swimmingPracticesTable)
      .where(eq(swimmingPracticesTable.id, id))
      .execute();

    // Return true if a record was deleted, false if no record was found
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Swimming practice deletion failed:', error);
    throw error;
  }
}
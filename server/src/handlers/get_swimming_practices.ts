import { db } from '../db';
import { swimmingPracticesTable } from '../db/schema';
import { type SwimmingPractice, type GetSwimmingPracticesQuery } from '../schema';
import { eq, gte, lte, and, desc, type SQL } from 'drizzle-orm';

export async function getSwimmingPractices(query?: GetSwimmingPracticesQuery): Promise<SwimmingPractice[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Apply filters if provided
    if (query?.stroke_type) {
      conditions.push(eq(swimmingPracticesTable.main_stroke, query.stroke_type));
    }

    if (query?.date_from) {
      // Convert Date to string for comparison with date column
      const dateFromStr = query.date_from.toISOString().split('T')[0];
      conditions.push(gte(swimmingPracticesTable.date, dateFromStr));
    }

    if (query?.date_to) {
      // Convert Date to string for comparison with date column
      const dateToStr = query.date_to.toISOString().split('T')[0];
      conditions.push(lte(swimmingPracticesTable.date, dateToStr));
    }

    // Apply pagination - use defaults if not provided
    const limit = query?.limit || 50; // Default limit of 50
    const offset = query?.offset || 0; // Default offset of 0

    // Build query with conditional where clause
    const results = conditions.length > 0
      ? await db.select()
          .from(swimmingPracticesTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(swimmingPracticesTable.date))
          .limit(limit)
          .offset(offset)
          .execute()
      : await db.select()
          .from(swimmingPracticesTable)
          .orderBy(desc(swimmingPracticesTable.date))
          .limit(limit)
          .offset(offset)
          .execute();

    // Convert fields to match schema expectations
    return results.map(practice => ({
      ...practice,
      date: new Date(practice.date), // Convert string date to Date object
      total_distance: parseFloat(practice.total_distance.toString()) // Convert real to number
    }));

  } catch (error) {
    console.error('Failed to fetch swimming practices:', error);
    throw error;
  }
}
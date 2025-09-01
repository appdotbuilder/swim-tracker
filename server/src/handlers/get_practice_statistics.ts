import { db } from '../db';
import { swimmingPracticesTable } from '../db/schema';
import { type StrokeType } from '../schema';
import { and, gte, lte, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export interface PracticeStatistics {
    total_practices: number;
    total_distance: number;
    total_time_minutes: number;
    average_distance_per_practice: number;
    average_time_per_practice: number;
    stroke_distribution: Record<StrokeType, number>; // Count of practices by stroke type
    most_common_stroke: StrokeType | null;
}

export async function getPracticeStatistics(
    dateFrom?: Date,
    dateTo?: Date
): Promise<PracticeStatistics> {
    try {
        // Build conditions for date filtering
        const conditions: SQL<unknown>[] = [];

        if (dateFrom) {
            conditions.push(gte(swimmingPracticesTable.date, dateFrom.toISOString().split('T')[0]));
        }

        if (dateTo) {
            conditions.push(lte(swimmingPracticesTable.date, dateTo.toISOString().split('T')[0]));
        }

        // Execute query with optional where clause
        const practices = conditions.length > 0
            ? await db.select()
                .from(swimmingPracticesTable)
                .where(conditions.length === 1 ? conditions[0] : and(...conditions))
                .execute()
            : await db.select()
                .from(swimmingPracticesTable)
                .execute();

        // Initialize stroke distribution with all stroke types
        const strokeDistribution: Record<StrokeType, number> = {
            'Freestyle': 0,
            'Breaststroke': 0,
            'Backstroke': 0,
            'Butterfly': 0,
            'IM': 0
        };

        // Calculate basic statistics
        const totalPractices = practices.length;
        let totalDistance = 0;
        let totalTimeMinutes = 0;

        // Process each practice to calculate totals and stroke distribution
        practices.forEach(practice => {
            totalDistance += practice.total_distance;
            totalTimeMinutes += practice.duration_minutes;
            strokeDistribution[practice.main_stroke as StrokeType]++;
        });

        // Calculate averages (handle division by zero)
        const averageDistancePerPractice = totalPractices > 0 ? totalDistance / totalPractices : 0;
        const averageTimePerPractice = totalPractices > 0 ? totalTimeMinutes / totalPractices : 0;

        // Find most common stroke
        let mostCommonStroke: StrokeType | null = null;
        let maxCount = 0;

        Object.entries(strokeDistribution).forEach(([stroke, count]) => {
            if (count > maxCount) {
                maxCount = count;
                mostCommonStroke = stroke as StrokeType;
            }
        });

        // If no practices exist or all strokes have zero count, most common should be null
        if (maxCount === 0) {
            mostCommonStroke = null;
        }

        return {
            total_practices: totalPractices,
            total_distance: totalDistance,
            total_time_minutes: totalTimeMinutes,
            average_distance_per_practice: Math.round(averageDistancePerPractice * 100) / 100, // Round to 2 decimal places
            average_time_per_practice: Math.round(averageTimePerPractice * 100) / 100, // Round to 2 decimal places
            stroke_distribution: strokeDistribution,
            most_common_stroke: mostCommonStroke
        };
    } catch (error) {
        console.error('Practice statistics calculation failed:', error);
        throw error;
    }
}
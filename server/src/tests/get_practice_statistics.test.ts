import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { swimmingPracticesTable } from '../db/schema';
import { getPracticeStatistics } from '../handlers/get_practice_statistics';
import type { StrokeType } from '../schema';

// Helper function to create a practice
const createPractice = async (
    date: Date,
    durationMinutes: number,
    totalDistance: number,
    mainStroke: StrokeType,
    notes?: string | null
) => {
    const result = await db.insert(swimmingPracticesTable)
        .values({
            date: date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
            duration_minutes: durationMinutes,
            total_distance: totalDistance,
            main_stroke: mainStroke,
            notes: notes || null
        })
        .returning()
        .execute();
    
    return result[0];
};

describe('getPracticeStatistics', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should return empty statistics when no practices exist', async () => {
        const result = await getPracticeStatistics();

        expect(result.total_practices).toBe(0);
        expect(result.total_distance).toBe(0);
        expect(result.total_time_minutes).toBe(0);
        expect(result.average_distance_per_practice).toBe(0);
        expect(result.average_time_per_practice).toBe(0);
        expect(result.most_common_stroke).toBeNull();
        
        // All stroke counts should be zero
        expect(result.stroke_distribution.Freestyle).toBe(0);
        expect(result.stroke_distribution.Breaststroke).toBe(0);
        expect(result.stroke_distribution.Backstroke).toBe(0);
        expect(result.stroke_distribution.Butterfly).toBe(0);
        expect(result.stroke_distribution.IM).toBe(0);
    });

    it('should calculate statistics for single practice', async () => {
        const testDate = new Date('2024-01-15');
        await createPractice(testDate, 60, 2000, 'Freestyle', 'Good practice');

        const result = await getPracticeStatistics();

        expect(result.total_practices).toBe(1);
        expect(result.total_distance).toBe(2000);
        expect(result.total_time_minutes).toBe(60);
        expect(result.average_distance_per_practice).toBe(2000);
        expect(result.average_time_per_practice).toBe(60);
        expect(result.most_common_stroke).toBe('Freestyle');
        
        expect(result.stroke_distribution.Freestyle).toBe(1);
        expect(result.stroke_distribution.Breaststroke).toBe(0);
        expect(result.stroke_distribution.Backstroke).toBe(0);
        expect(result.stroke_distribution.Butterfly).toBe(0);
        expect(result.stroke_distribution.IM).toBe(0);
    });

    it('should calculate statistics for multiple practices', async () => {
        const testDate1 = new Date('2024-01-15');
        const testDate2 = new Date('2024-01-16');
        const testDate3 = new Date('2024-01-17');

        await createPractice(testDate1, 60, 2000, 'Freestyle');
        await createPractice(testDate2, 45, 1500, 'Breaststroke');
        await createPractice(testDate3, 75, 2500, 'Freestyle');

        const result = await getPracticeStatistics();

        expect(result.total_practices).toBe(3);
        expect(result.total_distance).toBe(6000); // 2000 + 1500 + 2500
        expect(result.total_time_minutes).toBe(180); // 60 + 45 + 75
        expect(result.average_distance_per_practice).toBe(2000); // 6000 / 3
        expect(result.average_time_per_practice).toBe(60); // 180 / 3
        expect(result.most_common_stroke).toBe('Freestyle'); // 2 freestyle vs 1 breaststroke

        expect(result.stroke_distribution.Freestyle).toBe(2);
        expect(result.stroke_distribution.Breaststroke).toBe(1);
        expect(result.stroke_distribution.Backstroke).toBe(0);
        expect(result.stroke_distribution.Butterfly).toBe(0);
        expect(result.stroke_distribution.IM).toBe(0);
    });

    it('should handle decimal distances and round averages properly', async () => {
        const testDate1 = new Date('2024-01-15');
        const testDate2 = new Date('2024-01-16');

        await createPractice(testDate1, 50, 1500.5, 'Butterfly');
        await createPractice(testDate2, 40, 1000.3, 'Butterfly');

        const result = await getPracticeStatistics();

        expect(result.total_practices).toBe(2);
        expect(result.total_distance).toBe(2500.8); // 1500.5 + 1000.3
        expect(result.total_time_minutes).toBe(90); // 50 + 40
        expect(result.average_distance_per_practice).toBe(1250.4); // (2500.8 / 2) rounded to 2 decimal places
        expect(result.average_time_per_practice).toBe(45); // 90 / 2
        expect(result.most_common_stroke).toBe('Butterfly');

        expect(result.stroke_distribution.Butterfly).toBe(2);
    });

    it('should filter practices by date range correctly', async () => {
        // Create practices across different dates
        await createPractice(new Date('2024-01-10'), 60, 2000, 'Freestyle');
        await createPractice(new Date('2024-01-15'), 45, 1500, 'Breaststroke');
        await createPractice(new Date('2024-01-20'), 75, 2500, 'Backstroke');
        await createPractice(new Date('2024-01-25'), 50, 1800, 'Butterfly');

        // Filter for practices between Jan 12 and Jan 22
        const dateFrom = new Date('2024-01-12');
        const dateTo = new Date('2024-01-22');
        
        const result = await getPracticeStatistics(dateFrom, dateTo);

        // Should only include practices from Jan 15 and Jan 20
        expect(result.total_practices).toBe(2);
        expect(result.total_distance).toBe(4000); // 1500 + 2500
        expect(result.total_time_minutes).toBe(120); // 45 + 75
        expect(result.average_distance_per_practice).toBe(2000);
        expect(result.average_time_per_practice).toBe(60);

        expect(result.stroke_distribution.Freestyle).toBe(0);
        expect(result.stroke_distribution.Breaststroke).toBe(1);
        expect(result.stroke_distribution.Backstroke).toBe(1);
        expect(result.stroke_distribution.Butterfly).toBe(0);
        expect(result.stroke_distribution.IM).toBe(0);

        // With equal counts, the first one encountered (alphabetically in this case) should be selected
        // But since the logic finds the first maximum, it could be either - let's check it's one of them
        expect(['Breaststroke', 'Backstroke'].includes(result.most_common_stroke!)).toBe(true);
    });

    it('should filter practices with only dateFrom parameter', async () => {
        await createPractice(new Date('2024-01-10'), 60, 2000, 'Freestyle');
        await createPractice(new Date('2024-01-15'), 45, 1500, 'Breaststroke');
        await createPractice(new Date('2024-01-20'), 75, 2500, 'Backstroke');

        const dateFrom = new Date('2024-01-15');
        const result = await getPracticeStatistics(dateFrom);

        // Should include practices from Jan 15 and later
        expect(result.total_practices).toBe(2);
        expect(result.total_distance).toBe(4000); // 1500 + 2500
        expect(result.stroke_distribution.Freestyle).toBe(0);
        expect(result.stroke_distribution.Breaststroke).toBe(1);
        expect(result.stroke_distribution.Backstroke).toBe(1);
    });

    it('should filter practices with only dateTo parameter', async () => {
        await createPractice(new Date('2024-01-10'), 60, 2000, 'Freestyle');
        await createPractice(new Date('2024-01-15'), 45, 1500, 'Breaststroke');
        await createPractice(new Date('2024-01-20'), 75, 2500, 'Backstroke');

        const dateTo = new Date('2024-01-15');
        const result = await getPracticeStatistics(undefined, dateTo);

        // Should include practices from Jan 15 and earlier
        expect(result.total_practices).toBe(2);
        expect(result.total_distance).toBe(3500); // 2000 + 1500
        expect(result.stroke_distribution.Freestyle).toBe(1);
        expect(result.stroke_distribution.Breaststroke).toBe(1);
        expect(result.stroke_distribution.Backstroke).toBe(0);
    });

    it('should determine most common stroke correctly with ties', async () => {
        // Create equal counts for different strokes
        await createPractice(new Date('2024-01-15'), 60, 2000, 'Freestyle');
        await createPractice(new Date('2024-01-16'), 45, 1500, 'Breaststroke');
        await createPractice(new Date('2024-01-17'), 50, 1800, 'Freestyle');
        await createPractice(new Date('2024-01-18'), 55, 1900, 'Breaststroke');

        const result = await getPracticeStatistics();

        expect(result.total_practices).toBe(4);
        expect(result.stroke_distribution.Freestyle).toBe(2);
        expect(result.stroke_distribution.Breaststroke).toBe(2);
        
        // With a tie, the first one encountered in the loop should win
        // The order depends on how Object.entries processes the strokeDistribution object
        expect(['Freestyle', 'Breaststroke'].includes(result.most_common_stroke!)).toBe(true);
    });

    it('should handle all stroke types in distribution', async () => {
        await createPractice(new Date('2024-01-15'), 60, 2000, 'Freestyle');
        await createPractice(new Date('2024-01-16'), 45, 1500, 'Breaststroke');
        await createPractice(new Date('2024-01-17'), 50, 1800, 'Backstroke');
        await createPractice(new Date('2024-01-18'), 55, 1900, 'Butterfly');
        await createPractice(new Date('2024-01-19'), 70, 2200, 'IM');

        const result = await getPracticeStatistics();

        expect(result.total_practices).toBe(5);
        expect(result.stroke_distribution.Freestyle).toBe(1);
        expect(result.stroke_distribution.Breaststroke).toBe(1);
        expect(result.stroke_distribution.Backstroke).toBe(1);
        expect(result.stroke_distribution.Butterfly).toBe(1);
        expect(result.stroke_distribution.IM).toBe(1);
        
        // All strokes have equal count, so any could be most common
        const validStrokes: StrokeType[] = ['Freestyle', 'Breaststroke', 'Backstroke', 'Butterfly', 'IM'];
        expect(validStrokes.includes(result.most_common_stroke!)).toBe(true);
    });

    it('should return null for most common stroke when no practices exist in date range', async () => {
        // Create practices outside the date range
        await createPractice(new Date('2024-01-10'), 60, 2000, 'Freestyle');
        await createPractice(new Date('2024-01-30'), 45, 1500, 'Breaststroke');

        // Filter for a date range with no practices
        const dateFrom = new Date('2024-01-15');
        const dateTo = new Date('2024-01-20');
        
        const result = await getPracticeStatistics(dateFrom, dateTo);

        expect(result.total_practices).toBe(0);
        expect(result.most_common_stroke).toBeNull();
    });
});
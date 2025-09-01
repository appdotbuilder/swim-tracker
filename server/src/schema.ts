import { z } from 'zod';

// Enum for stroke types
export const strokeTypeEnum = z.enum([
  'Freestyle',
  'Breaststroke', 
  'Backstroke',
  'Butterfly',
  'IM' // Individual Medley
]);

export type StrokeType = z.infer<typeof strokeTypeEnum>;

// Swimming practice schema
export const swimmingPracticeSchema = z.object({
  id: z.number(),
  date: z.coerce.date(), // Automatically converts string dates to Date objects
  duration_minutes: z.number().int().positive(), // Duration in minutes as positive integer
  total_distance: z.number().positive(), // Total distance in meters/yards as positive number
  main_stroke: strokeTypeEnum, // Main stroke type from enum
  notes: z.string().nullable(), // Additional notes (can be null)
  created_at: z.coerce.date() // Timestamp when record was created
});

export type SwimmingPractice = z.infer<typeof swimmingPracticeSchema>;

// Input schema for creating swimming practices
export const createSwimmingPracticeInputSchema = z.object({
  date: z.coerce.date(), // Practice date
  duration_minutes: z.number().int().positive(), // Duration must be positive integer
  total_distance: z.number().positive(), // Distance must be positive
  main_stroke: strokeTypeEnum, // Must be one of the valid stroke types
  notes: z.string().nullable() // Notes can be null or string
});

export type CreateSwimmingPracticeInput = z.infer<typeof createSwimmingPracticeInputSchema>;

// Input schema for updating swimming practices
export const updateSwimmingPracticeInputSchema = z.object({
  id: z.number(),
  date: z.coerce.date().optional(), // Optional update fields
  duration_minutes: z.number().int().positive().optional(),
  total_distance: z.number().positive().optional(),
  main_stroke: strokeTypeEnum.optional(),
  notes: z.string().nullable().optional() // Can be null, undefined, or string
});

export type UpdateSwimmingPracticeInput = z.infer<typeof updateSwimmingPracticeInputSchema>;

// Query schema for filtering practices
export const getSwimmingPracticesQuerySchema = z.object({
  limit: z.number().int().positive().optional(), // Optional limit for pagination
  offset: z.number().int().nonnegative().optional(), // Optional offset for pagination
  stroke_type: strokeTypeEnum.optional(), // Filter by stroke type
  date_from: z.coerce.date().optional(), // Filter practices from this date
  date_to: z.coerce.date().optional() // Filter practices to this date
});

export type GetSwimmingPracticesQuery = z.infer<typeof getSwimmingPracticesQuerySchema>;
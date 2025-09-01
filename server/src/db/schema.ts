import { serial, text, pgTable, timestamp, integer, real, pgEnum, date } from 'drizzle-orm/pg-core';

// Define stroke type enum for PostgreSQL
export const strokeTypeEnum = pgEnum('stroke_type', [
  'Freestyle',
  'Breaststroke', 
  'Backstroke',
  'Butterfly',
  'IM'
]);

// Swimming practices table
export const swimmingPracticesTable = pgTable('swimming_practices', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(), // Practice date (date only, not timestamp)
  duration_minutes: integer('duration_minutes').notNull(), // Duration in minutes as integer
  total_distance: real('total_distance').notNull(), // Total distance as real number (supports decimals)
  main_stroke: strokeTypeEnum('main_stroke').notNull(), // Main stroke type from enum
  notes: text('notes'), // Notes field (nullable by default)
  created_at: timestamp('created_at').defaultNow().notNull(), // Creation timestamp
});

// TypeScript types for the table schema
export type SwimmingPractice = typeof swimmingPracticesTable.$inferSelect; // For SELECT operations
export type NewSwimmingPractice = typeof swimmingPracticesTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { swimmingPractices: swimmingPracticesTable };
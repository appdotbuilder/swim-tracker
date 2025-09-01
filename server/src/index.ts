import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createSwimmingPracticeInputSchema, 
  updateSwimmingPracticeInputSchema, 
  getSwimmingPracticesQuerySchema 
} from './schema';

// Import handlers
import { createSwimmingPractice } from './handlers/create_swimming_practice';
import { getSwimmingPractices } from './handlers/get_swimming_practices';
import { getSwimmingPractice } from './handlers/get_swimming_practice';
import { updateSwimmingPractice } from './handlers/update_swimming_practice';
import { deleteSwimmingPractice } from './handlers/delete_swimming_practice';
import { getPracticeStatistics } from './handlers/get_practice_statistics';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create a new swimming practice
  createSwimmingPractice: publicProcedure
    .input(createSwimmingPracticeInputSchema)
    .mutation(({ input }) => createSwimmingPractice(input)),

  // Get all swimming practices with optional filtering and pagination
  getSwimmingPractices: publicProcedure
    .input(getSwimmingPracticesQuerySchema.optional())
    .query(({ input }) => getSwimmingPractices(input)),

  // Get a single swimming practice by ID
  getSwimmingPractice: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getSwimmingPractice(input.id)),

  // Update an existing swimming practice
  updateSwimmingPractice: publicProcedure
    .input(updateSwimmingPracticeInputSchema)
    .mutation(({ input }) => updateSwimmingPractice(input)),

  // Delete a swimming practice by ID
  deleteSwimmingPractice: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteSwimmingPractice(input.id)),

  // Get practice statistics with optional date range filtering
  getPracticeStatistics: publicProcedure
    .input(z.object({
      dateFrom: z.coerce.date().optional(),
      dateTo: z.coerce.date().optional()
    }).optional())
    .query(({ input }) => getPracticeStatistics(input?.dateFrom, input?.dateTo)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Swimming Practice Tracker TRPC server listening at port: ${port}`);
}

start();
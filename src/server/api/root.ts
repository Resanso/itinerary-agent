import { router } from './trpc';
import { itineraryRouter } from './routers/itinerary';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = router({
  itinerary: itineraryRouter,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;


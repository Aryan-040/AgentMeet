import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from '@/trpc/init';
import { appRouter } from '@/trpc/routers/_app';
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => {
      const context = await createTRPCContext({ headers: req.headers });
      return {
        userId: context.userId,
        auth: context.auth ? {
          user: {
            id: context.auth.user.id,
            email: context.auth.user.email,
            name: context.auth.user.name || null,
            image: context.auth.user.image || null,
          }
        } : null
      };
    },
  });
export { handler as GET, handler as POST };
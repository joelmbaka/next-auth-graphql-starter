import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { readFileSync } from 'fs';
import { join } from 'path';
import { auth } from '@/auth';
import driver from '@/lib/clients/driver';
import type { Session } from 'next-auth';

import { NextRequest, NextResponse } from 'next/server';
import { ApolloServerOptions, BaseContext } from '@apollo/server';
import resolvers from './resolvers';

const typeDefs = readFileSync(join(process.cwd(), 'app/api/graphql/schema.graphql'), 'utf8');

// Create the Apollo Server instance
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: async (_args: { req: NextRequest; res: NextResponse }) => {
    const session = await auth(_args.req) as Session | null;
    return { driver, session, user: session?.user };
  },
} as ApolloServerOptions<BaseContext>);

export const GET = async (request: Request) => {
  return startServerAndCreateNextHandler(apolloServer)(request);
};

export const POST = async (request: Request) => {
  return startServerAndCreateNextHandler(apolloServer)(request);
}; 
  



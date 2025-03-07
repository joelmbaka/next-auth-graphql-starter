import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import driver from '@/lib/driver';
import { NextRequest, NextResponse } from 'next/server';
import { ApolloServerOptions, BaseContext } from '@apollo/server';
import resolvers from './resolvers';

const typeDefs = readFileSync(join(process.cwd(), 'app/api/graphql/schema.graphql'), 'utf8');

// Create the Apollo Server instance
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req, res }: { req: NextRequest; res: NextResponse }) => {
    const session = await getServerSession(authOptions);
    return { driver, session, user: session?.user };
  },
} as ApolloServerOptions<BaseContext>);

export const GET = async (request: Request) => {
  return startServerAndCreateNextHandler(apolloServer)(request);
};

export const POST = async (request: Request) => {
  return startServerAndCreateNextHandler(apolloServer)(request);
}; 
  



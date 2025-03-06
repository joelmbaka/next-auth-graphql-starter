import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { Neo4jGraphQL } from '@neo4j/graphql';
import neo4j from 'neo4j-driver';
import { NextApiRequest, NextApiResponse } from 'next';

// Define GraphQL type definitions
const typeDefs = `
  type Query {
    hello: String
  }
`;

// Create Neo4j driver
const driver = neo4j.driver(
  process.env.NEO4J_URI || '',
  neo4j.auth.basic(process.env.NEO4J_USERNAME || '', process.env.NEO4J_PASSWORD || '')
);

// Create Neo4jGraphQL instance
const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

// Generate executable schema
const schema = await neoSchema.getSchema();

// Create Apollo Server
const server = new ApolloServer({
  schema,
  introspection: true, // Enable GraphQL Playground in development
});

// Export API route handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return startServerAndCreateNextHandler(server)(req, res);
} 
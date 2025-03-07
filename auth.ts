import NextAuth from "next-auth";
import driver from "@/lib/driver";
import { Neo4jAdapter } from "@auth/neo4j-adapter";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google"; 
import { NextAuthOptions } from "next-auth";

const neo4jSession = driver.session();

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: Neo4jAdapter(neo4jSession),
  session: {
    strategy: 'jwt',
  },
 
  callbacks: {
    // Add JWT callback to ensure token contains user ID
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

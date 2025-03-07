import NextAuth from "next-auth";
import driver from "@/lib/driver";
import { Neo4jAdapter } from "@auth/neo4j-adapter";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google"; 
import { NextAuthOptions } from "next-auth";

const neo4jSession = driver.session();

export const authOptions: NextAuthOptions = NextAuth({
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
    async session({ session, token }: { session: any; token: any }) {
      session.user.id = token.id as string;
      return session;
    },
  },
});

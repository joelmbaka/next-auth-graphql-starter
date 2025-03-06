import NextAuth from "next-auth";
import driver from "@/lib/driver";
import { Neo4jAdapter } from "@auth/neo4j-adapter";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google"; 

const neo4jSession = driver.session();

export const authOptions = NextAuth({
  providers: [
    GitHub,
    Google,
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

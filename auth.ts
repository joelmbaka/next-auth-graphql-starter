import NextAuth from "next-auth";
import { Neo4jAdapter } from "@auth/neo4j-adapter";
import GitHub from "next-auth/providers/github"
import driver from "@/lib/neo4j";

const neo4jSession = driver.session();

const nextAuthConfig = NextAuth({
  providers: [GitHub],
  adapter: Neo4jAdapter(neo4jSession),
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
});

export const { handlers, auth, signIn, signOut } = nextAuthConfig;
export default nextAuthConfig;
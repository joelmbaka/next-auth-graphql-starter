import NextAuth from "next-auth";
import { Neo4jAdapter } from "@auth/neo4j-adapter";
import driver from "@/lib/clients/driver";
import authConfig from "./auth.config";

const neo4jSession = driver.session();

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: Neo4jAdapter(neo4jSession),
  session: { strategy: "jwt" },
  ...authConfig,
});
 
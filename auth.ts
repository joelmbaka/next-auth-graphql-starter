import driver from "@/lib/clients/driver";
import { Neo4jAdapter } from "@auth/neo4j-adapter";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import NextAuth from "next-auth";

const neo4jSession = driver.session();

interface NextAuthCallable {
  (options: any): {
    auth: any;
    handlers: any;
    signIn: any;
    signOut: any;
  };
}

export const authOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: [
            "openid",
            "profile",
            "email",
            "https://www.googleapis.com/auth/contacts",
            "https://www.googleapis.com/auth/contacts.readonly",
            "https://www.googleapis.com/auth/gmail.modify",
            "https://www.googleapis.com/auth/gmail.compose",
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events"
          ].join(" "),
        },
      },
    }),
  ],
  adapter: Neo4jAdapter(neo4jSession),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Capture and persist additional token fields on sign-in
    async jwt({ token, user, account }) {
      // When signing in, `account` is available and contains the access_token and other data.
      if (account) {
        token.accessToken = account.access_token || '';
        token.refreshToken = account.refresh_token || '';
        token.expiresAt = account.expires_at;
      }
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // Make the token accessible in the session so that it can be used on the client
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      return session;
    },
  },
};

export const { auth, handlers, signIn, signOut } = (NextAuth as unknown as NextAuthCallable)(authOptions);
 
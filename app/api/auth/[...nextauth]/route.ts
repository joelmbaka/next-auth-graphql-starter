import NextAuth from "next-auth";
import { authOptions } from "@/auth";

// Export the NextAuth handler for all auth routes
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
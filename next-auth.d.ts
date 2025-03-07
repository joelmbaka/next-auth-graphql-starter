import { DefaultSession, DefaultUser } from "next-auth";

// Augment the "next-auth" module with your custom types.
declare module "next-auth" {
  interface Session {
    user: {
      // Add your custom properties for the session user here.
      id: string;
      role?: string; // Add role field
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    // Add custom properties for the user here.
    id: string;
    locale?: string; 
    avatar?: string; 
    role?: string; 
  }

  // Extend the Account interface if you need to add more properties.
  interface Account {
    // provider and type are already defined by default.
    accessToken?: string; // Add accessToken field
    refreshToken?: string; // Add refreshToken field
    expiresAt?: number; // Add token expiration timestamp
  }

  // Extend the Profile interface to include additional OAuth profile fields.
  interface Profile {
    // The default Profile may be empty or minimal.
    // Add custom fields that your OAuth provider returns.
    locale?: string; // Example field
    avatar?: string; // Example field for user avatar
    bio?: string; // Add bio field
    //C.V : string
        //title:, esperience, education etc fields
  }
}

// Augment the JWT interface in the "next-auth/jwt" module.
declare module "next-auth/jwt" {
  interface JWT {
    // Add custom properties to your JWT, for example:
    id: string;
    // You can add other fields like role, permissions, etc.
    permissions?: string[]; // Add permissions field
  }
}
import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    access_token?: string;
    user: {
      id: string;
      username: string;
      createdAt: string;
      name?: string | null;
      email?: string | null;
    };
  }

  interface User {
    id: string;
    name: string;
    access_token: string;
    user: {
      id: string;
      username: string;
      createdAt: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    access_token?: string;
    user?: {
      id: string;
      username: string;
      createdAt: string;
    };
  }
} 
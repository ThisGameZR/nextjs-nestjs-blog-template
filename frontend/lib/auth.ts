import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { LoginRequest, LoginResponse } from "@/types/auth";
import axios from "axios";
import { ApiResponse } from "@/types/common";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.username) {
          return null;
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL!!;
          const apiBasePath = process.env.NEXT_PUBLIC_API_BASE_PATH!!;

          const requestBody: LoginRequest = {
            username: credentials.username,
          };

          const response = await axios.post<ApiResponse<LoginResponse>>(
            `${apiUrl}${apiBasePath}/auth/login`,
            requestBody
          );

          if (response.status !== 200) {
            return null;
          }

          if (!response.data.success) {
            return null;
          }

          if (response.data.statusCode !== 200) {
            return null;
          }

          const loginData = response.data.data;
          if (!loginData) {
            return null;
          }

          return {
            id: loginData.user.id,
            name: loginData.user.username,
            access_token: loginData.access_token,
            user: loginData.user,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.access_token = (user as any).access_token;
        token.user = (user as any).user;
      }
      return token;
    },
    async session({ session, token }) {
      session.access_token = token.access_token as string;
      session.user = {
        ...session.user,
        id: token.user?.id || "",
        username: token.user?.username || "",
        createdAt: token.user?.createdAt || "",
      };
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

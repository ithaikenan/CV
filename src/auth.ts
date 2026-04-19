import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma, GLOBAL_LEAGUE_ID } from "./lib/db";
import { ensureCoreRows } from "./lib/sync";

const NINETY_DAYS = 60 * 60 * 24 * 90;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Email & password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const email = String(raw?.email ?? "").trim().toLowerCase();
        const password = String(raw?.password ?? "");
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  // JWT is required for Credentials provider. Token persists 90 days in an
  // httpOnly cookie so returning users on the same device stay signed in.
  session: { strategy: "jwt", maxAge: NINETY_DAYS, updateAge: 60 * 60 * 24 },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-playoffmonkey.session-token"
          : "playoffmonkey.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: NINETY_DAYS,
      },
    },
  },
  events: {
    async createUser({ user }) {
      try {
        await ensureCoreRows();
        if (user.id) {
          await prisma.membership.upsert({
            where: { userId_leagueId: { userId: user.id, leagueId: GLOBAL_LEAGUE_ID } },
            update: {},
            create: { userId: user.id, leagueId: GLOBAL_LEAGUE_ID },
          });
        }
      } catch (e) {
        console.error("auto-enroll global league failed", e);
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.userId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        (session.user as { id?: string }).id = String(token.userId);
      }
      return session;
    },
  },
  pages: { signIn: "/signin" },
});

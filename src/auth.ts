import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { PrismaAdapter } from "@auth/prisma-adapter";
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
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  // Database sessions with a 90-day cookie keep users signed in on the same
  // device without re-auth. NextAuth refreshes the session cookie on each
  // request, so active users never get logged out.
  session: { strategy: "database", maxAge: NINETY_DAYS, updateAge: 60 * 60 * 24 },
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
      // Auto-enroll new user in the Global League.
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
    async session({ session, user }) {
      if (session.user && user) {
        (session.user as { id?: string }).id = user.id;
      }
      return session;
    },
  },
  pages: { signIn: "/signin" },
});

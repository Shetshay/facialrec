// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'fallback-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'fallback-client-secret',
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      return `${baseUrl}/FaceScreenshot`;
    },
    async session({ session, token }) {
      return session;
    },
  },
});

export { handler as GET, handler as POST };
// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth';
import LinkedInProvider from 'next-auth/providers/linkedin';

export default NextAuth({
  // Use a secure adapter/session store in prod!
  providers: [
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        url: "https://www.linkedin.com/oauth/v2/authorization",
        params: { scope: "r_liteprofile w_member_social" }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the LinkedIn access token on the JWT
      if (account?.access_token) {
        token.linkedinAccessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Make it available in session
      session.linkedin = { accessToken: token.linkedinAccessToken as string };
      return session;
    }
  }
});

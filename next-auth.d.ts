// next-auth.d.ts

import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    /** LinkedIn access token */
    linkedin?: { accessToken: string };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    linkedinAccessToken?: string;
  }
}

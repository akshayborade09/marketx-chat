import Head from 'next/head';
import { ReactNode } from 'react';

type LayoutProps = {
  title?: string;
  children: ReactNode;
};

export default function Layout({ title = 'Marketx Chat', children }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen px-4 py-6 bg-white text-gray-900">
        {children}
      </div>
    </>
  );
}

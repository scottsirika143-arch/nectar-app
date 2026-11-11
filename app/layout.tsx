import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NECTAR - Stream Movies',
  description: 'Movie streaming platform',
  verification: {
    google: '6sOH3IBCwxCz5A',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1463604168961868" 
          crossOrigin="anonymous">
        </script>
      </head>
      <body className="bg-[#141414] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
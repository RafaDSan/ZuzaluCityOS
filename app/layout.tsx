'use client';
// import type { Metadata } from 'next';
import './globals.css';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import theme from 'theme/theme';
import { WalletProvider } from '../context/WalletContext';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { CeramicProvider } from '../context/CeramicContext';
import { Header } from '@/components/layout';
import AuthPrompt from '@/components/AuthPrompt';
import AppContextProvider from '@/context/AppContext';
import React, { useEffect, useState } from 'react';
const queryClient = new QueryClient();

// export const metadata: Metadata = {
//   title: 'Zuzalu City',
//   description: 'Zuzalu City Powered By Ethereum Community Fund',
// };

function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.webp" />
      </head>
      <title>Zuzalu City</title>
      <meta
        name="description"
        content="Zuzalu City Powered By Ethereum Community Fund"
      />
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <QueryClientProvider client={queryClient}>
              <CeramicProvider>
                <WalletProvider>
                  <AppContextProvider>
                    <Header />
                    {isClient && <AuthPrompt />}
                    {children}
                  </AppContextProvider>
                </WalletProvider>
              </CeramicProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}

export default RootLayout;
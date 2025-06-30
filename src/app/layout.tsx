import type { Metadata } from "next";
import SessionProviders from '@/contexts/SessionContext'
import { GlobalContextProvider } from '@/contexts/GlobalContext'
import { MapControlsContextProvider } from '@/contexts/MapContext'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { HistoryProvider } from '@/contexts/HistoryContext'
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "WarpAI",
  description: "Operate at the speed of light!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body>
        <GlobalContextProvider>
          <SessionProviders>
            <HistoryProvider>
              <MapControlsContextProvider>
                <SidebarProvider>
                {children}
                </SidebarProvider>
              </MapControlsContextProvider>
            </HistoryProvider>
          </SessionProviders>
        </GlobalContextProvider>
      </body>
    </html>
  );
}

import Script from 'next/script'
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ChatInterface } from "@/components/interface/chat-interface";
import RootPage from "@/components/root-page";

export default function Warp() {
  return (
    <>
    <Script
      strategy="afterInteractive"
      id="gtag-script"
      src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GOOGLE_ANALYTICS_CODE}`}
    />
    <Script
      strategy="afterInteractive"
      id="gtag-script"
      dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.GOOGLE_ANALYTICS_CODE}', {
            page_path: window.location.pathname,
          });
        `,
      }}
    />
    <RootPage/>
    </>
  );
}

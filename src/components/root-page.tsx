"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ChatInterface } from "@/components/interface/chat-interface";
import { Icons } from "./ui/icons";

function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Icons.logo2/>
    </div>
  );
}

export default function RootPage() {
  const { data: session, status } = useSession();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (status !== "loading") {
      setHasHydrated(true);
    }
  }, [status]);

  if (!hasHydrated && !session) {
    return <LoadingScreen />;
  }

  return <ChatInterface />;
}

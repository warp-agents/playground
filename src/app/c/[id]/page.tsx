import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ChatInterface } from "@/components/interface/chat-interface";
import { isUserOwner } from "@/lib/dbs/supabase";

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const userId = session.user.id;
  const chatId = params.id;

  // fox later 
  // const isOwner = await isUserOwner("chats", chatId, userId);
  // if (!isOwner) {
  //   redirect("/");
  // }

  return <ChatInterface id={chatId} type="chat" />;
}
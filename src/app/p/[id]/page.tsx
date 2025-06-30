import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ChatInterface } from "@/components/interface/chat-interface";
import { isUserOwner } from "@/lib/dbs/supabase";

interface ContractPageProps {
  params: {
    id: string; 
  };
}

export default async function ContractPage({ params }: ContractPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const userId = session.user.id;
  const proposalId = params.id;

  // fox later 
  // const isOwner = await isUserOwner("proposal", proposalId, userId);
  // if (!isOwner) {
  //   redirect("/");
  // }

  // 4. If all checks pass, render the ChatInterface and pass the proposalId as a prop.
  return <ChatInterface id={proposalId} type="proposal" />;
}
import { getMessagingInbox } from "@/lib/data/message.data";
import { MessagesWorkspace } from "./messages-workspace";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ conversation?: string }> }) {
  const query = await searchParams;
  const inbox = await getMessagingInbox(query.conversation);
  return <MessagesWorkspace {...inbox} />;
}

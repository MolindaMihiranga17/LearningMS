"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import { markConversationRead, sendMessage, startConversation } from "@/lib/actions/message.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";

type Inbox = { role: "institute-admin" | "institute-staff"; selectedId: string | null; conversations: { id: string; peer: { id: string; name: string; email: string }; latestMessageAt: Date | null; latestMessagePreview: string; unread: boolean }[]; messages: { id: string; senderId: string; senderName: string; body: string; deleted: boolean; createdAt: Date }[]; staff: { id: string; name: string; email: string }[] };

export function MessagesWorkspace({ role, selectedId, conversations, messages, staff }: Inbox) {
  const [body, setBody] = useState(""); const [staffId, setStaffId] = useState("");
  const [sendState, sendAction, sending] = useActionState(sendMessage, {}); const [startState, startAction, starting] = useActionState(startConversation, {});
  useEffect(() => { if (sendState.error) toast.error("Could not send message", sendState.error); if (sendState.success) toast.success("Message sent"); }, [sendState]);
  useEffect(() => { if (startState.error) toast.error("Could not start conversation", startState.error); if (startState.success && startState.conversationId) window.location.assign(`/messages?conversation=${startState.conversationId}`); }, [startState]);
  useEffect(() => { if (selectedId) { const data = new FormData(); data.set("conversationId", selectedId); startTransition(() => markConversationRead(data)); } }, [selectedId]);
  const submit = () => { if (!selectedId) return; const data = new FormData(); data.set("conversationId", selectedId); data.set("body", body); setBody(""); startTransition(() => sendAction(data)); };
  const create = () => { const data = new FormData(); data.set("peerId", staffId); startTransition(() => startAction(data)); };
  return <div className="flex flex-col gap-6"><div><h1 className="text-2xl font-semibold">{role === "institute-admin" ? "Staff messages" : "Admin messages"}</h1><p className="text-sm text-muted-foreground">Private conversations within your institute.</p></div>
    <Card><CardHeader><CardTitle>Start a conversation</CardTitle></CardHeader><CardContent className="flex flex-col gap-2 sm:flex-row"><select value={staffId} onChange={(event) => setStaffId(event.target.value)} className="h-9 flex-1 rounded-md border bg-background px-2 text-sm"><option value="">Select active {role === "institute-admin" ? "staff" : "admin"}</option>{staff.map((member) => <option key={member.id} value={member.id}>{member.name} ({member.email})</option>)}</select><Button type="button" disabled={!staffId || starting} onClick={create}>{starting ? "Opening..." : "Open conversation"}</Button></CardContent></Card>
    <div className="grid gap-4 lg:grid-cols-[19rem_1fr]"><Card><CardHeader><CardTitle>Conversations</CardTitle></CardHeader><CardContent className="flex flex-col gap-1">{conversations.length === 0 ? <p className="text-sm text-muted-foreground">No conversations yet.</p> : conversations.map((conversation) => <Link key={conversation.id} href={`/messages?conversation=${conversation.id}`} className={`rounded-lg p-3 text-sm ${conversation.id === selectedId ? "bg-muted" : "hover:bg-muted/60"}`}><div className="flex justify-between gap-2"><span className="font-medium">{conversation.peer.name}</span>{conversation.unread ? <span className="size-2 rounded-full bg-primary" /> : null}</div><p className="truncate text-xs text-muted-foreground">{conversation.latestMessagePreview || "No messages yet"}</p></Link>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>{conversations.find((conversation) => conversation.id === selectedId)?.peer.name ?? "Select a conversation"}</CardTitle></CardHeader><CardContent className="flex min-h-[26rem] flex-col gap-3">{selectedId ? <><div className="flex flex-1 flex-col gap-2 overflow-y-auto">{messages.length === 0 ? <p className="text-sm text-muted-foreground">Start the conversation.</p> : messages.map((message) => <div key={message.id} className="rounded-lg border p-3 text-sm"><p className="text-xs font-medium">{message.senderName}</p><p>{message.body}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(message.createdAt).toLocaleString()}</p></div>)}</div><Textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={4000} placeholder="Write a message" /><Button type="button" className="w-fit" disabled={!body.trim() || sending} onClick={submit}>{sending ? "Sending..." : "Send message"}</Button></> : <p className="text-sm text-muted-foreground">Choose a conversation from the list.</p>}</CardContent></Card></div>
  </div>;
}

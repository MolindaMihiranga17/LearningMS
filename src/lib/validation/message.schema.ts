import { z } from "zod";

export const startConversationSchema = z.object({ peerId: z.string().trim().min(1) });
export const sendMessageSchema = z.object({ conversationId: z.string().trim().min(1), body: z.string().trim().min(1, "Write a message.").max(4000) });
export const conversationIdSchema = z.object({ conversationId: z.string().trim().min(1) });

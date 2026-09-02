import mongoose, { Schema, type InferSchemaType } from "mongoose";

const messageSchema = new Schema({
  instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
  conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  body: { type: String, required: true, trim: true, maxlength: 4000 },
  attachment: { type: Schema.Types.Mixed, default: null },
  readAt: { type: Date, default: null },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  moderatedAt: { type: Date, default: null },
  moderatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });
messageSchema.index({ conversationId: 1, createdAt: 1 });
export type Message = InferSchemaType<typeof messageSchema>;
export default mongoose.models.Message || mongoose.model("Message", messageSchema);

import mongoose, { Schema, type InferSchemaType } from "mongoose";

const readStateSchema = new Schema({ userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, lastReadAt: { type: Date, default: null } }, { _id: false });
const conversationSchema = new Schema({
  instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
  participantIds: { type: [{ type: Schema.Types.ObjectId, ref: "User", required: true }], validate: { validator: (ids: unknown[]) => ids.length === 2 && new Set(ids.map(String)).size === 2, message: "A conversation requires exactly two participants." } },
  adminId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  staffId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  latestMessageAt: { type: Date, default: null, index: true },
  latestMessagePreview: { type: String, trim: true, maxlength: 160, default: "" },
  readStates: { type: [readStateSchema], default: [] },
}, { timestamps: true });
conversationSchema.index({ instituteId: 1, adminId: 1, staffId: 1 }, { unique: true });
export type Conversation = InferSchemaType<typeof conversationSchema>;
export default mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);

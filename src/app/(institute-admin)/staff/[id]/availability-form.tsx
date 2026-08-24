"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { updateStaffAvailability } from "@/lib/actions/user.actions";
import { updateStaffAvailabilitySchema } from "@/lib/validation/user.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type InputValues = z.input<typeof updateStaffAvailabilitySchema>;
type Leave = { startAt: string; endAt: string; reason: string; recordedAt: string };
export function AvailabilityForm({ staffId, availabilityStatus, availabilityNote, leaveHistory }: { staffId: string; availabilityStatus: "available" | "unavailable" | "on-leave"; availabilityNote: string; leaveHistory: Leave[] }) {
  const [state, formAction, pending] = useActionState(updateStaffAvailability, {});
  const form = useForm<InputValues>({ resolver: zodResolver(updateStaffAvailabilitySchema), defaultValues: { availabilityStatus, availabilityNote, leaveStart: "", leaveEnd: "", leaveReason: "" } });
  useEffect(() => { if (state.error) toast.error("Could not update availability", state.error); if (state.success) { toast.success("Availability updated"); form.reset({ ...form.getValues(), leaveStart: "", leaveEnd: "", leaveReason: "" }); } }, [state, form]);
  const submit = form.handleSubmit((values) => { const data = new FormData(); data.set("staffId", staffId); data.set("availabilityStatus", values.availabilityStatus); data.set("availabilityNote", values.availabilityNote ?? ""); data.set("leaveStart", values.leaveStart ?? ""); data.set("leaveEnd", values.leaveEnd ?? ""); data.set("leaveReason", values.leaveReason ?? ""); startTransition(() => formAction(data)); });
  return <Form {...form}><form onSubmit={submit} className="flex flex-col gap-4">
    <div className="grid gap-3 sm:grid-cols-2"><FormField control={form.control} name="availabilityStatus" render={({ field }) => <FormItem><FormLabel>Availability</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectPopup><SelectItem value="available">Available</SelectItem><SelectItem value="unavailable">Unavailable</SelectItem><SelectItem value="on-leave">On leave</SelectItem></SelectPopup></Select><FormMessage /></FormItem>} />
    <FormField control={form.control} name="availabilityNote" render={({ field }) => <FormItem><FormLabel>Availability note</FormLabel><FormControl><Input {...field} value={field.value ?? ""} maxLength={300} placeholder="Optional context" /></FormControl><FormMessage /></FormItem>} /></div>
    <div className="rounded-xl border border-border/70 p-4"><p className="text-sm font-medium">Record leave</p><p className="mt-1 text-xs text-muted-foreground">Leave dates and reason are recorded together in the staff history.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><FormField control={form.control} name="leaveStart" render={({ field }) => <FormItem><FormLabel>Start date</FormLabel><FormControl><Input {...field} value={field.value ?? ""} type="date" /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="leaveEnd" render={({ field }) => <FormItem><FormLabel>End date</FormLabel><FormControl><Input {...field} value={field.value ?? ""} type="date" /></FormControl><FormMessage /></FormItem>} /></div><FormField control={form.control} name="leaveReason" render={({ field }) => <FormItem className="mt-3"><FormLabel>Reason</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} maxLength={300} /></FormControl><FormMessage /></FormItem>} /></div>
    <Button type="submit" disabled={pending} className="w-fit">{pending ? "Saving..." : "Save availability"}</Button>
    <div><p className="text-sm font-medium">Recent leave history</p>{leaveHistory.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No leave recorded yet.</p> : <div className="mt-2 flex flex-col gap-2">{leaveHistory.slice(0, 5).map((leave, index) => <div key={`${leave.recordedAt}-${index}`} className="rounded-lg border border-border px-3 py-2 text-sm"><p className="font-medium">{new Date(leave.startAt).toLocaleDateString()} – {new Date(leave.endAt).toLocaleDateString()}</p><p className="text-muted-foreground">{leave.reason}</p></div>)}</div>}</div>
  </form></Form>;
}

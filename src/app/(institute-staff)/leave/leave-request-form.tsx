"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { createStaffLeaveRequest } from "@/lib/actions/staff-leave.actions";
import { createStaffLeaveRequestSchema } from "@/lib/validation/staff-leave.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type LeaveRequestInput = z.input<typeof createStaffLeaveRequestSchema>;

export function LeaveRequestForm() {
  const [state, formAction, pending] = useActionState(createStaffLeaveRequest, {});
  const form = useForm<LeaveRequestInput>({ resolver: zodResolver(createStaffLeaveRequestSchema), defaultValues: { startAt: "", endAt: "", reason: "" } });
  useEffect(() => { if (state.error) toast.error("Could not submit leave request", state.error); if (state.success) { toast.success("Leave request submitted", "Your institute admin can now review it."); form.reset(); } }, [form, state]);
  return <Form {...form}><form onSubmit={form.handleSubmit((values) => { const data = new FormData(); data.set("startAt", values.startAt); data.set("endAt", values.endAt); data.set("reason", values.reason); startTransition(() => formAction(data)); })} className="grid gap-4 md:grid-cols-2">
    <FormField control={form.control} name="startAt" render={({ field }) => <FormItem><FormLabel>Start date</FormLabel><FormControl><Input {...field} type="date" min={new Date().toISOString().slice(0, 10)} /></FormControl><FormMessage /></FormItem>} />
    <FormField control={form.control} name="endAt" render={({ field }) => <FormItem><FormLabel>End date</FormLabel><FormControl><Input {...field} type="date" min={new Date().toISOString().slice(0, 10)} /></FormControl><FormMessage /></FormItem>} />
    <FormField control={form.control} name="reason" render={({ field }) => <FormItem className="md:col-span-2"><FormLabel>Reason</FormLabel><FormControl><Textarea {...field} placeholder="Briefly explain the leave request" maxLength={1000} /></FormControl><FormMessage /></FormItem>} />
    <Button type="submit" disabled={pending} className="w-fit">{pending ? "Submitting..." : "Submit leave request"}</Button>
  </form></Form>;
}

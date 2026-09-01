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
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type InputValues = z.input<typeof updateStaffAvailabilitySchema>;

export function AvailabilityForm({ staffId, availabilityStatus, availabilityNote }: { staffId: string; availabilityStatus: "available" | "unavailable" | "on-leave"; availabilityNote: string }) {
  const [state, formAction, pending] = useActionState(updateStaffAvailability, {});
  const form = useForm<InputValues>({ resolver: zodResolver(updateStaffAvailabilitySchema), defaultValues: { availabilityStatus, availabilityNote } });
  useEffect(() => { if (state.error) toast.error("Could not update availability", state.error); if (state.success) toast.success("Availability updated"); }, [state]);
  const submit = form.handleSubmit((values) => { const data = new FormData(); data.set("staffId", staffId); data.set("availabilityStatus", values.availabilityStatus); data.set("availabilityNote", values.availabilityNote ?? ""); startTransition(() => formAction(data)); });
  return <Form {...form}><form onSubmit={submit} className="flex flex-col gap-4">
    <div className="grid gap-3 sm:grid-cols-2"><FormField control={form.control} name="availabilityStatus" render={({ field }) => <FormItem><FormLabel>Availability</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectPopup><SelectItem value="available">Available</SelectItem><SelectItem value="unavailable">Unavailable</SelectItem><SelectItem value="on-leave">On leave</SelectItem></SelectPopup></Select><FormMessage /></FormItem>} />
    <FormField control={form.control} name="availabilityNote" render={({ field }) => <FormItem><FormLabel>Availability note</FormLabel><FormControl><Input {...field} value={field.value ?? ""} maxLength={300} placeholder="Optional context" /></FormControl><FormMessage /></FormItem>} /></div>
    <p className="text-xs text-muted-foreground">Leave periods are managed through the Leave requests workspace so staff can request them and administrators can approve them.</p>
    <Button type="submit" disabled={pending} className="w-fit">{pending ? "Saving..." : "Save availability"}</Button>
  </form></Form>;
}

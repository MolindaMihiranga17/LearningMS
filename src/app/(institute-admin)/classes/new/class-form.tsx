"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClass, type CreateClassState } from "@/lib/actions/class.actions";
import { createClassSchema, type CreateClassInput } from "@/lib/validation/class.schema";
import { toast } from "@/lib/toast";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const initialState: CreateClassState = {};

export function ClassForm({ teachers }: { teachers: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createClass, initialState);

  const form = useForm<CreateClassInput>({
    resolver: zodResolver(createClassSchema),
    defaultValues: { name: "", section: "", academicYear: "", classTeacherId: "" },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not create class", state.error);
  }, [state.error]);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.name}&rdquo; created.</p>
        <div className="flex gap-2">
          <Link href="/classes" className={cn(buttonVariants())}>
            View classes
          </Link>
          <Link href="/classes/new" className={cn(buttonVariants({ variant: "outline" }))}>
            Create another
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, String(value ?? ""));
    });
    formAction(formData);
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Grade 10" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="section"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. A" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="academicYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Academic year</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. 2026-2027" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="classTeacherId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class teacher</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="">Unassigned</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create class"}
        </Button>
      </form>
    </Form>
  );
}

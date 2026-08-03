"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createAnnouncement,
  type CreateAnnouncementState,
} from "@/lib/actions/announcement.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initialState: CreateAnnouncementState = {};

export function AnnouncementForm({
  allowInstitute,
  classes,
  courses,
}: {
  allowInstitute: boolean;
  classes: { id: string; name: string; section?: string }[];
  courses: { id: string; title: string }[];
}) {
  const [state, formAction, pending] = useActionState(createAnnouncement, initialState);
  const [audience, setAudience] = useState<"institute" | "class" | "course">(
    allowInstitute ? "institute" : "class"
  );

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">
          Announcement posted to {state.success.recipientCount} recipient
          {state.success.recipientCount === 1 ? "" : "s"}.
        </p>
        <div className="flex gap-2">
          <Link href="/announcements" className={cn(buttonVariants())}>
            View announcements
          </Link>
          <Link href="/announcements/new" className={cn(buttonVariants({ variant: "outline" }))}>
            Post another
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="audience">Audience</Label>
        <select
          id="audience"
          name="audience"
          value={audience}
          onChange={(event) => setAudience(event.target.value as typeof audience)}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {allowInstitute ? <option value="institute">Entire institute</option> : null}
          <option value="class">A class</option>
          <option value="course">A course</option>
        </select>
      </div>

      {audience === "class" ? (
        <div className="grid gap-2">
          <Label htmlFor="classId">Class</Label>
          <select
            id="classId"
            name="classId"
            required
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            defaultValue=""
          >
            <option value="" disabled>
              Select a class
            </option>
            {classes.map((klass) => (
              <option key={klass.id} value={klass.id}>
                {klass.name}
                {klass.section ? ` - ${klass.section}` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {audience === "course" ? (
        <div className="grid gap-2">
          <Label htmlFor="courseId">Course</Label>
          <select
            id="courseId"
            name="courseId"
            required
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            defaultValue=""
          >
            <option value="" disabled>
              Select a course
            </option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required placeholder="e.g. Sports day postponed" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="body">Message</Label>
        <Textarea id="body" name="body" required rows={5} placeholder="Announcement details" />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Posting..." : "Post announcement"}
      </Button>
    </form>
  );
}

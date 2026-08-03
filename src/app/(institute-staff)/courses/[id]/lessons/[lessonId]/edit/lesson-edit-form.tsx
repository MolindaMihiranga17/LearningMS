"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { updateLesson, type UpdateLessonState } from "@/lib/actions/lesson.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploader } from "@/components/shared/file-uploader";
import { cn } from "@/lib/utils";

const initialState: UpdateLessonState = {};

type LessonType = "video" | "pdf" | "text" | "link";

export function LessonEditForm({
  lessonId,
  courseId,
  title,
  type: initialType,
  contentUrl,
  textBody,
  durationSeconds,
  isPreview,
}: {
  lessonId: string;
  courseId: string;
  title: string;
  type: LessonType;
  contentUrl: string;
  textBody: string;
  durationSeconds: number | null;
  isPreview: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateLesson, initialState);
  const [type, setType] = useState<LessonType>(initialType);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.title}&rdquo; updated.</p>
        <Link href={`/courses/${courseId}`} className={cn(buttonVariants())}>
          Back to course
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={lessonId} />
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="title">Lesson title</Label>
          <Input id="title" name="title" required defaultValue={title} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value as LessonType)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="text">Text</option>
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="link">Link</option>
          </select>
        </div>
      </div>

      {type === "text" ? (
        <div className="grid gap-2">
          <Label htmlFor="textBody">Lesson content</Label>
          <textarea
            id="textBody"
            name="textBody"
            rows={6}
            defaultValue={type === initialType ? textBody : ""}
            className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      ) : null}

      {type === "link" ? (
        <div className="grid gap-2">
          <Label htmlFor="contentUrl">URL</Label>
          <Input
            id="contentUrl"
            name="contentUrl"
            defaultValue={type === initialType ? contentUrl : ""}
            placeholder="https://..."
          />
        </div>
      ) : null}

      {type === "video" ? (
        <>
          <FileUploader
            courseId={courseId}
            name="contentUrl"
            label="Video file"
            accept="video/mp4,video/webm,video/quicktime"
            defaultKey={type === initialType ? contentUrl : ""}
          />
          <div className="grid gap-2">
            <Label htmlFor="durationSeconds">Duration (seconds)</Label>
            <Input
              id="durationSeconds"
              name="durationSeconds"
              type="number"
              min={1}
              defaultValue={durationSeconds ?? undefined}
            />
          </div>
        </>
      ) : null}

      {type === "pdf" ? (
        <FileUploader
          courseId={courseId}
          name="contentUrl"
          label="PDF file"
          accept="application/pdf"
          defaultKey={type === initialType ? contentUrl : ""}
        />
      ) : null}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isPreview" defaultChecked={isPreview} className="h-4 w-4" />
        Allow free preview (visible without enrollment)
      </label>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}

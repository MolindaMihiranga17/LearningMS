"use client";

import { useActionState, useState } from "react";
import { createLesson, type CreateLessonState } from "@/lib/actions/lesson.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploader } from "@/components/shared/file-uploader";

const initialState: CreateLessonState = {};

type LessonType = "video" | "pdf" | "text" | "link";

export function AddLessonForm({ moduleId, courseId }: { moduleId: string; courseId: string }) {
  const [state, formAction, pending] = useActionState(createLesson, initialState);
  const [type, setType] = useState<LessonType>("text");

  return (
    <form
      key={state.success?.lessonId ?? "new-lesson"}
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-3"
    >
      <input type="hidden" name="moduleId" value={moduleId} />
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor={`${moduleId}-title`}>Lesson title</Label>
          <Input id={`${moduleId}-title`} name="title" required placeholder="e.g. Introduction" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${moduleId}-type`}>Type</Label>
          <select
            id={`${moduleId}-type`}
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
          <Label htmlFor={`${moduleId}-textBody`}>Lesson content</Label>
          <textarea
            id={`${moduleId}-textBody`}
            name="textBody"
            rows={4}
            className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      ) : null}

      {type === "link" ? (
        <div className="grid gap-2">
          <Label htmlFor={`${moduleId}-contentUrl`}>URL</Label>
          <Input
            id={`${moduleId}-contentUrl`}
            name="contentUrl"
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
          />
          <div className="grid gap-2">
            <Label htmlFor={`${moduleId}-durationSeconds`}>Duration (seconds)</Label>
            <Input
              id={`${moduleId}-durationSeconds`}
              name="durationSeconds"
              type="number"
              min={1}
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
        />
      ) : null}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isPreview" className="h-4 w-4" />
        Allow free preview (visible without enrollment)
      </label>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" size="sm" disabled={pending} className="self-start">
        {pending ? "Adding..." : "Add lesson"}
      </Button>
    </form>
  );
}

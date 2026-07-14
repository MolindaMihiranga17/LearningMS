import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renameModule, deleteModule, moveModule } from "@/lib/actions/module.actions";
import { deleteLesson, moveLesson } from "@/lib/actions/lesson.actions";
import { AddLessonForm } from "./add-lesson-form";

const TYPE_LABEL: Record<string, string> = {
  video: "Video",
  pdf: "PDF",
  text: "Text",
  link: "Link",
};

type LessonSummary = {
  _id: unknown;
  title: string;
  type: string;
  isPreview?: boolean;
};

export function ModuleCard({
  courseId,
  module: courseModule,
  isFirst,
  isLast,
}: {
  courseId: string;
  module: {
    _id: unknown;
    title: string;
    lessons: LessonSummary[];
  };
  isFirst: boolean;
  isLast: boolean;
}) {
  const moduleId = String(courseModule._id);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{courseModule.title}</CardTitle>
        <div className="flex items-center gap-1.5">
          <form action={moveModule}>
            <input type="hidden" name="id" value={moduleId} />
            <input type="hidden" name="direction" value="up" />
            <Button type="submit" variant="outline" size="icon-sm" disabled={isFirst} title="Move up">
              ↑
            </Button>
          </form>
          <form action={moveModule}>
            <input type="hidden" name="id" value={moduleId} />
            <input type="hidden" name="direction" value="down" />
            <Button type="submit" variant="outline" size="icon-sm" disabled={isLast} title="Move down">
              ↓
            </Button>
          </form>
          <form action={deleteModule}>
            <input type="hidden" name="id" value={moduleId} />
            <Button type="submit" variant="destructive" size="sm">
              Delete module
            </Button>
          </form>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={renameModule} className="flex items-center gap-2">
          <input type="hidden" name="id" value={moduleId} />
          <Input name="title" defaultValue={courseModule.title} className="max-w-xs" />
          <Button type="submit" variant="outline" size="sm">
            Rename
          </Button>
        </form>

        {courseModule.lessons.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {courseModule.lessons.map((lesson, index) => {
              const lessonId = String(lesson._id);
              return (
                <li
                  key={lessonId}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{lesson.title}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {TYPE_LABEL[lesson.type] ?? lesson.type}
                    </span>
                    {lesson.isPreview ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Preview
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <form action={moveLesson}>
                      <input type="hidden" name="id" value={lessonId} />
                      <input type="hidden" name="direction" value="up" />
                      <Button
                        type="submit"
                        variant="outline"
                        size="icon-sm"
                        disabled={index === 0}
                        title="Move up"
                      >
                        ↑
                      </Button>
                    </form>
                    <form action={moveLesson}>
                      <input type="hidden" name="id" value={lessonId} />
                      <input type="hidden" name="direction" value="down" />
                      <Button
                        type="submit"
                        variant="outline"
                        size="icon-sm"
                        disabled={index === courseModule.lessons.length - 1}
                        title="Move down"
                      >
                        ↓
                      </Button>
                    </form>
                    <a
                      href={`/courses/${courseId}/lessons/${lessonId}/edit`}
                      className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                    >
                      Edit
                    </a>
                    <form action={deleteLesson}>
                      <input type="hidden" name="id" value={lessonId} />
                      <Button type="submit" variant="destructive" size="icon-sm" title="Delete">
                        ×
                      </Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No lessons yet.</p>
        )}

        <AddLessonForm moduleId={moduleId} courseId={courseId} />
      </CardContent>
    </Card>
  );
}

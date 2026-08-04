import { notFound } from "next/navigation";
import { getSessionStatusForStudent } from "@/lib/data/class-session.data";
import { JoinControls } from "./join-controls";

export default async function ClassJoinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getSessionStatusForStudent(id);

  if (!data) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold">
        {data.class.name}
        {data.class.section ? ` ${data.class.section}` : ""}
      </h1>

      <JoinControls
        classId={id}
        sessionStatus={data.class.sessionStatus}
        attempt={data.attempt}
      />
    </div>
  );
}

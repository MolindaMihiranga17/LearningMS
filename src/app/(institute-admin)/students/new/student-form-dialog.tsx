"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { StudentForm } from "./student-form";

export function StudentFormDialog() {
  const router = useRouter();

  return (
    <FormDialog trigger="New student" title="New student" tone="create" size="lg">
      {({ close, resetKey, resetForm }) => (
        <StudentForm
          key={resetKey}
          onDone={() => {
            close();
            router.refresh();
          }}
          onCreateAnother={resetForm}
        />
      )}
    </FormDialog>
  );
}

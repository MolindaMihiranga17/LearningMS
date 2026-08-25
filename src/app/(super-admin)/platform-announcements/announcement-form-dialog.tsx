"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { FormDialog } from "@/components/form-dialog";
import { PlatformAnnouncementForm } from "./announcement-form";

type Institute = { id: string; name: string; code: string; status: string };
type Plan = { id: string; name: string };
export function PlatformAnnouncementFormDialog({ institutes, plans }: { institutes: Institute[]; plans: Plan[] }) {
  const router = useRouter();
  return <FormDialog title="Publish platform announcement" tone="create" size="lg" trigger={<><Plus /> New announcement</>}>
    {({ close, resetKey }) => <PlatformAnnouncementForm key={resetKey} institutes={institutes} plans={plans} onDone={() => { close(); router.refresh(); }} />}
  </FormDialog>;
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PermissionsForm } from "./permissions-form";
import { SalaryForm } from "./salary-form";
import { CommissionForm } from "./commission-form";

export function StaffManageDialog({
  staffId,
  name,
  email,
  status,
  permissions,
  basicSalary,
  commissions,
}: {
  staffId: string;
  name: string;
  email: string;
  status: string;
  permissions: Record<string, boolean | undefined>;
  basicSalary: number;
  commissions: { month?: string; amount?: number }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) router.refresh();
      }}
    >
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Manage
      </Button>
      <DialogPopup size="xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-4">
            <div>
              <DialogTitle>{name}</DialogTitle>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
            <Badge variant={status === "active" ? "success" : "secondary"} className="capitalize">
              {status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Module permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <PermissionsForm staffId={staffId} permissions={permissions} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Salary</CardTitle>
            </CardHeader>
            <CardContent>
              <SalaryForm staffId={staffId} basicSalary={basicSalary} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly commissions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <CommissionForm staffId={staffId} />
              {commissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No commissions recorded yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {commissions
                    .slice()
                    .reverse()
                    .map((entry, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                      >
                        <span>{entry.month}</span>
                        <span className="font-medium">{(entry.amount ?? 0).toFixed(2)}</span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogPopup>
    </Dialog>
  );
}

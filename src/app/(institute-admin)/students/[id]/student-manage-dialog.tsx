"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { UpdateStudentRecordFormInput } from "@/lib/validation/user.schema";
import { StudentRecordForm } from "./student-record-form";

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Not recorded" : parsed.toLocaleDateString();
}

export function StudentManageDialog({
  studentId,
  name,
  email,
  status,
  createdAt,
  classes,
  assignedClass,
  defaults,
}: {
  studentId: string;
  name: string;
  email: string;
  status: string;
  createdAt: string | null;
  classes: { id: string; label: string }[];
  assignedClass: { name?: string; section?: string; academicYear?: string } | null;
  defaults: UpdateStudentRecordFormInput;
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
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Academic identity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Roll number:</span>{" "}
                  {defaults.rollNumber || "Not assigned"}
                </p>
                <p>
                  <span className="text-muted-foreground">Class:</span>{" "}
                  {assignedClass
                    ? `${assignedClass.name}${assignedClass.section ? ` ${assignedClass.section}` : ""}`
                    : "Unassigned"}
                </p>
                <p>
                  <span className="text-muted-foreground">Academic year:</span>{" "}
                  {assignedClass?.academicYear ?? "Not assigned"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Birthday:</span> {formatDate(defaults.birthday)}
                </p>
                <p>
                  <span className="text-muted-foreground">Gender:</span>{" "}
                  {defaults.gender
                    ? `${defaults.gender[0].toUpperCase()}${defaults.gender.slice(1)}`
                    : "Not recorded"}
                </p>
                <p>
                  <span className="text-muted-foreground">Phone:</span> {defaults.phone || "Not recorded"}
                </p>
                <p>
                  <span className="text-muted-foreground">Special needs:</span>{" "}
                  {defaults.hasSpecialNeeds ? "Yes" : "No"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Registered:</span>{" "}
                  {formatDate(defaults.registrationDate)}
                </p>
                <p>
                  <span className="text-muted-foreground">Payment type:</span>{" "}
                  {defaults.paymentType || "Not recorded"}
                </p>
                <p>
                  <span className="text-muted-foreground">Created:</span> {formatDate(createdAt)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Student record</CardTitle>
            </CardHeader>
            <CardContent>
              <StudentRecordForm studentId={studentId} classes={classes} defaults={defaults} />
            </CardContent>
          </Card>
        </div>
      </DialogPopup>
    </Dialog>
  );
}

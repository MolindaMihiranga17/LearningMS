import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";
import { ImportCsvForm } from "./import-csv-form";

const TEMPLATES = [
  {
    label: "Students",
    value: "students",
    sample:
      "name,email,phone,rollNumber,birthday,gender,guardianName,guardianPhone,guardianEmail,guardianRelation,hasSpecialNeeds,specialNeedsDetails,registrationDate,paymentType,notes\nStudent One,student@example.com,0770000000,S001,2008-05-14,female,Guardian Name,0771111111,guardian@example.com,Mother,false,,2026-08-01,cash,Transferred from paper registration",
  },
  {
    label: "Staff",
    value: "staff",
    sample: "name,email,phone,employeeCode,basicSalary\nTeacher One,teacher@example.com,0770000001,T001,50000",
  },
  {
    label: "Enrollments",
    value: "enrollments",
    sample: "studentEmail,courseTitle\nstudent@example.com,Mathematics Foundation",
  },
];

export default function ImportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader
        eyebrow="Data management"
        title="Bulk imports"
        description="Import students, staff, and enrollments from CSV using the supported templates."
        metrics={[
          { label: "Supported imports", value: TEMPLATES.length, detail: "Students, staff, and enrollments", tone: "primary" },
          { label: "Import format", value: "CSV", detail: "Use the matching column headers", tone: "info" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {TEMPLATES.map((template) => (
          <Card key={template.value}>
            <CardHeader>
              <CardTitle>{template.label} template</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                {template.sample}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Review and import CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <ImportCsvForm templates={TEMPLATES} />
        </CardContent>
      </Card>
    </div>
  );
}

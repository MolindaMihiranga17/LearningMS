import { NextResponse } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSession } from "@/lib/tenant/scope";
import { getInstituteAcademicAnalytics, getTeacherAcademicAnalytics } from "@/lib/data/academic-analytics.data";
import { toAcademicAnalyticsXlsxBuffer, AcademicAnalyticsPdfDocument } from "@/lib/reports/academic-analytics-report";
import { connectToDatabase } from "@/lib/db/connect";
import InstituteModel from "@/models/Institute";

const ALLOWED_ROLES = ["institute-admin", "institute-staff"] as const;
const RANGE_MONTHS = new Set([3, 6, 12]);

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!ALLOWED_ROLES.includes(session.role as (typeof ALLOWED_ROLES)[number])) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const url = new URL(request.url);
  const requestedMonths = Number(url.searchParams.get("months"));
  const months = RANGE_MONTHS.has(requestedMonths) ? requestedMonths : 6;
  const requestedFormat = url.searchParams.get("format");
  const format = requestedFormat === "pdf" ? "pdf" : "xlsx";

  const analytics = session.role === "institute-admin"
    ? await getInstituteAcademicAnalytics({ months })
    : await getTeacherAcademicAnalytics({ months });

  const reportData = {
    attendanceTrend: analytics.attendanceTrend,
    perClassAttendance: analytics.perClassAttendance,
    gradeDistribution: analytics.gradeDistribution,
    atRiskStudents: analytics.atRiskStudents,
  };

  const filename = `academic-analytics-${months}mo`;
  const title = `Academic analytics (last ${months} months)`;

  if (format === "pdf") {
    await connectToDatabase();
    const institute = await InstituteModel.findById(session.instituteId).select("name").lean();
    const buffer = await renderToBuffer(
      createElement(AcademicAnalyticsPdfDocument, {
        instituteName: institute?.name ?? "Institute",
        title,
        generatedDate: new Date().toLocaleDateString("en-LK", { year: "numeric", month: "long", day: "numeric" }),
        data: reportData,
      })
    );
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      },
    });
  }

  const buffer = await toAcademicAnalyticsXlsxBuffer(title, reportData);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
    },
  });
}

import { NextResponse } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSession } from "@/lib/tenant/scope";
import {
  getInstituteAcademicAnalytics,
  getStudentAcademicAnalytics,
  getTeacherAcademicAnalytics,
} from "@/lib/data/academic-analytics.data";
import {
  toAcademicAnalyticsXlsxBuffer,
  toStudentAcademicAnalyticsXlsxBuffer,
  AcademicAnalyticsPdfDocument,
  StudentAcademicAnalyticsPdfDocument,
} from "@/lib/reports/academic-analytics-report";
import { connectToDatabase } from "@/lib/db/connect";
import InstituteModel from "@/models/Institute";
import UserModel from "@/models/User";

const ALLOWED_ROLES = ["institute-admin", "institute-staff", "student"] as const;
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

  const filename = `academic-analytics-${months}mo`;
  const title = `Academic analytics (last ${months} months)`;
  const generatedDate = new Date().toLocaleDateString("en-LK", { year: "numeric", month: "long", day: "numeric" });

  if (session.role === "student") {
    const analytics = await getStudentAcademicAnalytics({ months });
    const reportData = {
      attendanceTrend: analytics.attendanceTrend,
      subjectGradeAverages: analytics.subjectGradeAverages,
      gradeDistribution: analytics.gradeDistribution,
    };

    if (format === "pdf") {
      await connectToDatabase();
      const [institute, student] = await Promise.all([
        InstituteModel.findById(session.instituteId).select("name").lean(),
        UserModel.findById(session.userId).select("name").lean(),
      ]);
      const buffer = await renderToBuffer(
        createElement(StudentAcademicAnalyticsPdfDocument, {
          instituteName: institute?.name ?? "Institute",
          studentName: student?.name ?? "Student",
          title,
          generatedDate,
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

    const buffer = await toStudentAcademicAnalyticsXlsxBuffer(title, reportData);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  const analytics = session.role === "institute-admin"
    ? await getInstituteAcademicAnalytics({ months })
    : await getTeacherAcademicAnalytics({ months });

  const reportData = {
    attendanceTrend: analytics.attendanceTrend,
    perClassAttendance: analytics.perClassAttendance,
    gradeDistribution: analytics.gradeDistribution,
    atRiskStudents: analytics.atRiskStudents,
  };

  if (format === "pdf") {
    await connectToDatabase();
    const institute = await InstituteModel.findById(session.instituteId).select("name").lean();
    const buffer = await renderToBuffer(
      createElement(AcademicAnalyticsPdfDocument, {
        instituteName: institute?.name ?? "Institute",
        title,
        generatedDate,
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

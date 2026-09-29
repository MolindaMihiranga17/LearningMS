import ExcelJS from "exceljs";
import { createElement } from "react";
import { Text, View } from "@react-pdf/renderer";
import { PdfPage, styles } from "@/lib/reports/pdf-document";
import type {
  AtRiskStudent,
  AttendanceTrendPoint,
  ClassAttendanceRow,
  GradeDistributionBucket,
  SubjectGradeAverage,
} from "@/lib/data/academic-analytics.data";

export type AcademicAnalyticsReportData = {
  attendanceTrend: AttendanceTrendPoint[];
  perClassAttendance: ClassAttendanceRow[];
  gradeDistribution: GradeDistributionBucket[];
  atRiskStudents: AtRiskStudent[];
};

export type StudentAcademicAnalyticsReportData = {
  attendanceTrend: AttendanceTrendPoint[];
  subjectGradeAverages: SubjectGradeAverage[];
  gradeDistribution: GradeDistributionBucket[];
};

const TITLE_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } } as const;
const HEADER_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } } as const;
const STRIPE_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } } as const;

function addSheet(workbook: ExcelJS.Workbook, sheetName: string, columns: { key: string; header: string }[], rows: Record<string, unknown>[]) {
  const sheet = workbook.addWorksheet(sheetName);

  sheet.mergeCells(1, 1, 1, Math.max(columns.length, 1));
  const titleCell = sheet.getCell("A1");
  titleCell.value = sheetName;
  titleCell.font = { name: "Aptos Display", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = TITLE_FILL;
  titleCell.alignment = { vertical: "middle" };
  sheet.getRow(1).height = 26;

  sheet.columns = columns.map((column) => ({
    key: column.key,
    width: Math.min(Math.max(column.header.length + 5, 15), 34),
  }));

  const headerRowNumber = 3;
  const headerRow = sheet.getRow(headerRowNumber);
  headerRow.values = columns.map((column) => column.header);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = HEADER_FILL;
  headerRow.alignment = { vertical: "middle", wrapText: true };
  headerRow.height = 20;

  if (rows.length === 0) {
    sheet.mergeCells(headerRowNumber + 1, 1, headerRowNumber + 1, Math.max(columns.length, 1));
    const emptyCell = sheet.getCell(headerRowNumber + 1, 1);
    emptyCell.value = "No data for this period.";
    emptyCell.font = { italic: true, color: { argb: "FF64748B" } };
  } else {
    for (const row of rows) {
      const added = sheet.addRow(Object.fromEntries(columns.map((column) => [column.key, row[column.key] ?? ""])));
      added.alignment = { vertical: "top", wrapText: true };
      if (added.number % 2 === 1) added.fill = STRIPE_FILL;
    }
    sheet.autoFilter = { from: { row: headerRowNumber, column: 1 }, to: { row: headerRowNumber + rows.length, column: columns.length } };
    sheet.views = [{ state: "frozen", ySplit: headerRowNumber }];
  }

  return sheet;
}

export async function toAcademicAnalyticsXlsxBuffer(title: string, data: AcademicAnalyticsReportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LearningMS";
  workbook.created = new Date();

  addSheet(
    workbook,
    "Attendance trend",
    [{ key: "month", header: "Month" }, { key: "presentPct", header: "Present %" }],
    data.attendanceTrend
  );
  addSheet(
    workbook,
    "Per-class attendance",
    [{ key: "name", header: "Class" }, { key: "percentPresent", header: "Present %" }],
    data.perClassAttendance.map((row) => ({ name: row.name, percentPresent: row.percentPresent ?? "-" }))
  );
  addSheet(
    workbook,
    "Grade distribution",
    [{ key: "label", header: "Score band" }, { key: "value", header: "Count" }],
    data.gradeDistribution
  );
  addSheet(
    workbook,
    "At-risk students",
    [
      { key: "name", header: "Student" },
      { key: "attendancePercent", header: "Attendance %" },
      { key: "gradeAveragePercent", header: "Grade average %" },
    ],
    data.atRiskStudents.map((student) => ({
      name: student.name,
      attendancePercent: student.attendancePercent ?? "-",
      gradeAveragePercent: student.gradeAveragePercent ?? "-",
    }))
  );

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export async function toStudentAcademicAnalyticsXlsxBuffer(
  title: string,
  data: StudentAcademicAnalyticsReportData
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LearningMS";
  workbook.created = new Date();

  addSheet(
    workbook,
    "Attendance trend",
    [{ key: "month", header: "Month" }, { key: "presentPct", header: "Present %" }],
    data.attendanceTrend
  );
  addSheet(
    workbook,
    "Grade average by subject",
    [{ key: "name", header: "Subject" }, { key: "averagePercent", header: "Average %" }],
    data.subjectGradeAverages
  );
  addSheet(
    workbook,
    "Grade distribution",
    [{ key: "label", header: "Score band" }, { key: "value", header: "Count" }],
    data.gradeDistribution
  );

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

function PdfMiniTable({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: { key: string; header: string; right?: boolean }[];
  rows: Record<string, unknown>[];
}) {
  return createElement(
    View,
    { style: styles.section },
    createElement(Text, { style: styles.sectionTitle }, title),
    createElement(
      View,
      { style: styles.table },
      createElement(
        View,
        { style: styles.tableHeaderRow },
        ...columns.map((column) =>
          createElement(Text, { key: column.key, style: column.right ? styles.tableCellRight : styles.tableCell }, column.header)
        )
      ),
      rows.length === 0
        ? createElement(
            View,
            { style: styles.tableRow },
            createElement(Text, { style: styles.tableCell }, "No data for this period.")
          )
        : rows.map((row, index) =>
            createElement(
              View,
              { style: styles.tableRow, key: index },
              ...columns.map((column) =>
                createElement(Text, { key: column.key, style: column.right ? styles.tableCellRight : styles.tableCell }, String(row[column.key] ?? "-"))
              )
            )
          )
    )
  );
}

export function AcademicAnalyticsPdfDocument({
  instituteName,
  title,
  generatedDate,
  data,
}: {
  instituteName: string;
  title: string;
  generatedDate: string;
  data: AcademicAnalyticsReportData;
}) {
  return createElement(
    PdfPage,
    { instituteName, docTitle: title, docMeta: generatedDate },
    createElement(PdfMiniTable, {
      title: "Attendance trend",
      columns: [
        { key: "month", header: "Month" },
        { key: "presentPct", header: "Present %", right: true },
      ],
      rows: data.attendanceTrend,
    }),
    createElement(PdfMiniTable, {
      title: "Per-class attendance",
      columns: [
        { key: "name", header: "Class" },
        { key: "percentPresent", header: "Present %", right: true },
      ],
      rows: data.perClassAttendance.map((row) => ({ name: row.name, percentPresent: row.percentPresent ?? "-" })),
    }),
    createElement(PdfMiniTable, {
      title: "Grade distribution",
      columns: [
        { key: "label", header: "Score band" },
        { key: "value", header: "Count", right: true },
      ],
      rows: data.gradeDistribution,
    }),
    createElement(PdfMiniTable, {
      title: "At-risk students",
      columns: [
        { key: "name", header: "Student" },
        { key: "attendancePercent", header: "Attendance %", right: true },
        { key: "gradeAveragePercent", header: "Grade avg %", right: true },
      ],
      rows: data.atRiskStudents.map((student) => ({
        name: student.name,
        attendancePercent: student.attendancePercent ?? "-",
        gradeAveragePercent: student.gradeAveragePercent ?? "-",
      })),
    })
  );
}

export function StudentAcademicAnalyticsPdfDocument({
  instituteName,
  studentName,
  title,
  generatedDate,
  data,
}: {
  instituteName: string;
  studentName: string;
  title: string;
  generatedDate: string;
  data: StudentAcademicAnalyticsReportData;
}) {
  return createElement(
    PdfPage,
    { instituteName, docTitle: title, docMeta: `${studentName} · ${generatedDate}` },
    createElement(PdfMiniTable, {
      title: "Attendance trend",
      columns: [
        { key: "month", header: "Month" },
        { key: "presentPct", header: "Present %", right: true },
      ],
      rows: data.attendanceTrend,
    }),
    createElement(PdfMiniTable, {
      title: "Grade average by subject",
      columns: [
        { key: "name", header: "Subject" },
        { key: "averagePercent", header: "Average %", right: true },
      ],
      rows: data.subjectGradeAverages,
    }),
    createElement(PdfMiniTable, {
      title: "Grade distribution",
      columns: [
        { key: "label", header: "Score band" },
        { key: "value", header: "Count", right: true },
      ],
      rows: data.gradeDistribution,
    })
  );
}

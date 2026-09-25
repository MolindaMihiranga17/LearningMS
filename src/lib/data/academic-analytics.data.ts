import "server-only";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { requireRole, requireSession } from "@/lib/tenant/scope";
import AttendanceModel from "@/models/Attendance";
import GradeModel from "@/models/Grade";
import ClassModel from "@/models/Class";
import SubjectModel from "@/models/Subject";
import UserModel from "@/models/User";

const ATTENDANCE_PASS_THRESHOLD = 75;
const GRADE_PASS_THRESHOLD = 50;

const GRADE_BUCKET_BOUNDARIES = [0, 60, 75, 90, 100.0001];
const GRADE_BUCKET_LABELS: Record<number, string> = {
  0: "Below 60%",
  60: "60-74%",
  75: "75-89%",
  90: "90-100%",
};

export type AttendanceTrendPoint = { month: string; presentPct: number };
export type ClassAttendanceRow = { id: string; name: string; percentPresent: number | null };
export type GradeDistributionBucket = { key: string; label: string; value: number };
export type AtRiskStudent = {
  studentId: string;
  name: string;
  attendancePercent: number | null;
  gradeAveragePercent: number | null;
};

type AttendanceScope = {
  instituteId: string;
  since: Date;
  months: number;
  classIds?: mongoose.Types.ObjectId[];
};

type GradeScope = {
  instituteId: string;
  since: Date;
  subjectIds?: mongoose.Types.ObjectId[];
};

function toObjectId(id: string) {
  return new mongoose.Types.ObjectId(id);
}

function monthsSince(months: number) {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1), 1);
  since.setHours(0, 0, 0, 0);
  return since;
}

async function getAttendanceTrend({ instituteId, since, months, classIds }: AttendanceScope): Promise<AttendanceTrendPoint[]> {
  const match: Record<string, unknown> = { instituteId: toObjectId(instituteId), date: { $gte: since } };
  if (classIds) match.classId = { $in: classIds };

  const rows = await AttendanceModel.aggregate<{ _id: string; total: number; present: number }>([
    { $match: match },
    { $unwind: "$records" },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ["$records.status", ["present", "late"]] }, 1, 0] } },
      },
    },
  ]);
  const rowMap = new Map(rows.map((row) => [row._id, row]));

  const trend: AttendanceTrendPoint[] = [];
  for (let i = 0; i < months; i++) {
    const bucketDate = new Date(since.getFullYear(), since.getMonth() + i, 1);
    const key = `${bucketDate.getFullYear()}-${String(bucketDate.getMonth() + 1).padStart(2, "0")}`;
    const label = bucketDate.toLocaleDateString("en-US", { year: "numeric", month: "short" });
    const row = rowMap.get(key);
    trend.push({ month: label, presentPct: row && row.total > 0 ? Math.round((row.present / row.total) * 100) : 0 });
  }
  return trend;
}

async function getPerClassAttendance({ instituteId, since, classIds }: AttendanceScope): Promise<ClassAttendanceRow[]> {
  const match: Record<string, unknown> = { instituteId: toObjectId(instituteId), date: { $gte: since } };
  if (classIds) match.classId = { $in: classIds };

  const rows = await AttendanceModel.aggregate<{ _id: mongoose.Types.ObjectId; total: number; present: number }>([
    { $match: match },
    { $unwind: "$records" },
    {
      $group: {
        _id: "$classId",
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ["$records.status", ["present", "late"]] }, 1, 0] } },
      },
    },
  ]);
  if (rows.length === 0) return [];

  const classes = await ClassModel.find({ _id: { $in: rows.map((row) => row._id) } }).select("name section").lean();
  const classNames = new Map(classes.map((klass) => [String(klass._id), klass.section ? `${klass.name} ${klass.section}` : klass.name]));

  return rows
    .map((row) => ({
      id: String(row._id),
      name: classNames.get(String(row._id)) ?? "Class",
      percentPresent: row.total > 0 ? Math.round((row.present / row.total) * 100) : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function getPerStudentAttendance({ instituteId, since, classIds }: AttendanceScope) {
  const match: Record<string, unknown> = { instituteId: toObjectId(instituteId), date: { $gte: since } };
  if (classIds) match.classId = { $in: classIds };

  const rows = await AttendanceModel.aggregate<{ _id: mongoose.Types.ObjectId; total: number; present: number }>([
    { $match: match },
    { $unwind: "$records" },
    {
      $group: {
        _id: "$records.studentId",
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ["$records.status", ["present", "late"]] }, 1, 0] } },
      },
    },
  ]);

  const byStudent = new Map<string, number>();
  for (const row of rows) {
    if (row.total === 0) continue;
    byStudent.set(String(row._id), Math.round((row.present / row.total) * 100));
  }
  return byStudent;
}

async function getGradeDistribution({ instituteId, since, subjectIds }: GradeScope): Promise<GradeDistributionBucket[]> {
  const match: Record<string, unknown> = { instituteId: toObjectId(instituteId), createdAt: { $gte: since } };
  if (subjectIds) match.subjectId = { $in: subjectIds };

  const rows = await GradeModel.aggregate<{ _id: number | string; count: number }>([
    { $match: match },
    { $project: { pct: { $multiply: [{ $divide: ["$score", "$maxScore"] }, 100] } } },
    { $bucket: { groupBy: "$pct", boundaries: GRADE_BUCKET_BOUNDARIES, default: "other", output: { count: { $sum: 1 } } } },
  ]);

  return GRADE_BUCKET_BOUNDARIES.slice(0, -1).map((boundary) => ({
    key: String(boundary),
    label: GRADE_BUCKET_LABELS[boundary] ?? String(boundary),
    value: rows.find((row) => row._id === boundary)?.count ?? 0,
  }));
}

async function getGradeAverageByStudent({ instituteId, since, subjectIds }: GradeScope) {
  const match: Record<string, unknown> = { instituteId: toObjectId(instituteId), createdAt: { $gte: since } };
  if (subjectIds) match.subjectId = { $in: subjectIds };

  const rows = await GradeModel.aggregate<{ _id: mongoose.Types.ObjectId; avgPct: number }>([
    { $match: match },
    { $group: { _id: "$studentId", avgPct: { $avg: { $multiply: [{ $divide: ["$score", "$maxScore"] }, 100] } } } },
  ]);

  const byStudent = new Map<string, number>();
  for (const row of rows) byStudent.set(String(row._id), Math.round(row.avgPct));
  return byStudent;
}

async function getAtRiskStudents(
  attendanceByStudent: Map<string, number>,
  gradeAverageByStudent: Map<string, number>
): Promise<AtRiskStudent[]> {
  const studentIds = new Set<string>([...attendanceByStudent.keys(), ...gradeAverageByStudent.keys()]);
  const atRiskIds = [...studentIds].filter((id) => {
    const attendancePct = attendanceByStudent.get(id);
    const gradePct = gradeAverageByStudent.get(id);
    return (attendancePct !== undefined && attendancePct < ATTENDANCE_PASS_THRESHOLD) ||
      (gradePct !== undefined && gradePct < GRADE_PASS_THRESHOLD);
  });
  if (atRiskIds.length === 0) return [];

  const students = await UserModel.find({ _id: { $in: atRiskIds } }).select("name").lean();
  const names = new Map(students.map((student) => [String(student._id), student.name]));

  return atRiskIds
    .map((id) => ({
      studentId: id,
      name: names.get(id) ?? "Student",
      attendancePercent: attendanceByStudent.get(id) ?? null,
      gradeAveragePercent: gradeAverageByStudent.get(id) ?? null,
    }))
    .sort((a, b) => (a.attendancePercent ?? 100) - (b.attendancePercent ?? 100))
    .slice(0, 20);
}

function overallPercent(byStudentOrRows: Map<string, number>) {
  if (byStudentOrRows.size === 0) return null;
  const total = [...byStudentOrRows.values()].reduce((sum, value) => sum + value, 0);
  return Math.round(total / byStudentOrRows.size);
}

/** Institute-wide academic analytics: attendance trend, per-class breakdown, grade distribution, at-risk students. */
export async function getInstituteAcademicAnalytics(opts?: { months?: number }) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);
  if (!session.instituteId) throw new Error("Academic analytics requires an institute context.");

  await connectToDatabase();

  const months = opts?.months ?? 6;
  const since = monthsSince(months);
  const instituteId = session.instituteId;

  const [trend, perClass, perStudentAttendance, gradeDistribution, gradeAverageByStudent, totalClasses] = await Promise.all([
    getAttendanceTrend({ instituteId, since, months }),
    getPerClassAttendance({ instituteId, since, months }),
    getPerStudentAttendance({ instituteId, since, months }),
    getGradeDistribution({ instituteId, since }),
    getGradeAverageByStudent({ instituteId, since }),
    ClassModel.countDocuments({ instituteId, status: "active" }),
  ]);

  const atRiskStudents = await getAtRiskStudents(perStudentAttendance, gradeAverageByStudent);

  return {
    months,
    attendanceTrend: trend,
    perClassAttendance: perClass,
    gradeDistribution,
    atRiskStudents,
    overallAttendancePercent: overallPercent(perStudentAttendance),
    overallGradeAveragePercent: overallPercent(gradeAverageByStudent),
    totalClasses,
    atRiskCount: atRiskStudents.length,
  };
}

/** Teacher-scoped academic analytics: attendance/grades limited to the teacher's own classes and subjects. */
export async function getTeacherAcademicAnalytics(opts?: { months?: number }) {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);
  if (!session.instituteId) throw new Error("Academic analytics requires an institute context.");

  await connectToDatabase();

  const months = opts?.months ?? 6;
  const since = monthsSince(months);
  const instituteId = session.instituteId;

  const [ownedClasses, taughtSubjects] = await Promise.all([
    ClassModel.find({ instituteId, classTeacherId: session.userId }).select("_id").lean(),
    SubjectModel.find({ instituteId, teacherId: session.userId }).select("_id classIds").lean(),
  ]);

  const classIdSet = new Set<string>(ownedClasses.map((klass) => String(klass._id)));
  for (const subject of taughtSubjects) {
    for (const classId of subject.classIds ?? []) classIdSet.add(String(classId));
  }
  const classIds = [...classIdSet].map(toObjectId);
  const subjectIds = taughtSubjects.map((subject) => subject._id);

  if (classIds.length === 0 && subjectIds.length === 0) {
    return {
      months,
      attendanceTrend: [],
      perClassAttendance: [],
      gradeDistribution: [],
      atRiskStudents: [],
      overallAttendancePercent: null,
      overallGradeAveragePercent: null,
      totalClasses: 0,
      atRiskCount: 0,
    };
  }

  const [trend, perClass, perStudentAttendance, gradeDistribution, gradeAverageByStudent] = await Promise.all([
    getAttendanceTrend({ instituteId, since, months, classIds }),
    getPerClassAttendance({ instituteId, since, months, classIds }),
    getPerStudentAttendance({ instituteId, since, months, classIds }),
    getGradeDistribution({ instituteId, since, subjectIds }),
    getGradeAverageByStudent({ instituteId, since, subjectIds }),
  ]);

  const atRiskStudents = await getAtRiskStudents(perStudentAttendance, gradeAverageByStudent);

  return {
    months,
    attendanceTrend: trend,
    perClassAttendance: perClass,
    gradeDistribution,
    atRiskStudents,
    overallAttendancePercent: overallPercent(perStudentAttendance),
    overallGradeAveragePercent: overallPercent(gradeAverageByStudent),
    totalClasses: classIds.length,
    atRiskCount: atRiskStudents.length,
  };
}

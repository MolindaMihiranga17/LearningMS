import "server-only";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { requireRole, requireSession, withTenantScope } from "@/lib/tenant/scope";
import AcademicTermModel from "@/models/AcademicTerm";
import AuditLogModel from "@/models/AuditLog";
import FeeConcessionModel from "@/models/FeeConcession";
import FeeModel from "@/models/Fee";
import StudentFollowUpModel from "@/models/StudentFollowUp";
import UserModel from "@/models/User";

export async function listAcademicTermsForInstitute() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();

  return AcademicTermModel.find(withTenantScope({}, session))
    .sort({ startsAt: -1 })
    .lean();
}

export async function listConcessionManagementData() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();

  const [students, fees, concessions] = await Promise.all([
    UserModel.find(withTenantScope({ role: "student" }, session))
      .select("name email studentMeta.rollNumber")
      .sort({ name: 1 })
      .lean(),
    FeeModel.find(withTenantScope({}, session)).select("title amount").sort({ title: 1 }).lean(),
    FeeConcessionModel.find(withTenantScope({}, session))
      .populate("studentId", "name studentMeta.rollNumber")
      .populate("feeId", "title")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return { students, fees, concessions };
}

export async function listTeacherFollowUpData() {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const [students, followUps] = await Promise.all([
    UserModel.find(withTenantScope({ role: "student" }, session))
      .select("name email studentMeta.rollNumber studentMeta.classId")
      .populate("studentMeta.classId", "name section")
      .sort({ name: 1 })
      .lean(),
    StudentFollowUpModel.find(withTenantScope({ createdBy: session.userId }, session))
      .populate("studentId", "name")
      .sort({ createdAt: -1 })
      .limit(40)
      .lean(),
  ]);

  return { students, followUps };
}

export type InstituteAuditLogFilters = {
  actorRole?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
};

function buildInstituteAuditLogQuery(filters: InstituteAuditLogFilters, session: Parameters<typeof withTenantScope>[1]) {
  const query: Record<string, unknown> = {};
  if (filters.actorRole) query.actorRole = filters.actorRole;
  if (filters.action) query.action = filters.action;
  if (filters.dateFrom || filters.dateTo) {
    const createdAt: Record<string, Date> = {};
    if (filters.dateFrom) createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) createdAt.$lte = new Date(`${filters.dateTo}T23:59:59.999Z`);
    query.createdAt = createdAt;
  }
  return withTenantScope(query, session);
}

export async function listInstituteAuditLogs(
  filters: InstituteAuditLogFilters = {},
  page = 1,
  pageSize = 25
) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();

  const query = buildInstituteAuditLogQuery(filters, session);
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * pageSize;

  const [logs, total] = await Promise.all([
    AuditLogModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
    AuditLogModel.countDocuments(query),
  ]);

  const now = Date.now();
  return {
    logs: logs.map((log) => ({
      ...log,
      recency:
        log.createdAt.getTime() > now - 24 * 60 * 60 * 1000
          ? "today"
          : log.createdAt.getTime() > now - 7 * 24 * 60 * 60 * 1000
            ? "week"
            : "older",
    })),
    total,
    page: safePage,
    pageSize,
  };
}

export async function getInstituteAuditLogOverview(filters: InstituteAuditLogFilters = {}) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);
  await connectToDatabase();

  const query: Record<string, unknown> = { ...buildInstituteAuditLogQuery(filters, session) };
  // .aggregate() does not auto-cast string ids the way .find() does, so instituteId
  // must be cast to ObjectId manually or every $match here would silently match nothing.
  if (typeof query.instituteId === "string") {
    query.instituteId = new mongoose.Types.ObjectId(query.instituteId);
  }

  const [overview] = await AuditLogModel.aggregate<{
    entries: number;
    systemEvents: number;
    uniqueActors: number;
  }>([
    { $match: query },
    {
      $group: {
        _id: null,
        entries: { $sum: 1 },
        systemEvents: { $sum: { $cond: [{ $eq: ["$actorRole", "system"] }, 1, 0] } },
        actors: { $addToSet: "$actorName" },
      },
    },
    { $project: { _id: 0, entries: 1, systemEvents: 1, uniqueActors: { $size: "$actors" } } },
  ]);

  return overview ?? { entries: 0, systemEvents: 0, uniqueActors: 0 };
}

export async function listDistinctInstituteAuditActions(): Promise<string[]> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);
  await connectToDatabase();

  const actions = await AuditLogModel.distinct("action", withTenantScope({}, session));
  return actions.sort();
}

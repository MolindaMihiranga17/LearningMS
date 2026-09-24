"use server";

import { connectToDatabase } from "@/lib/db/connect";
import AssignmentModel from "@/models/Assignment";
import EnrollmentModel from "@/models/Enrollment";
import ExamModel from "@/models/Exam";
import FeeModel from "@/models/Fee";
import PaymentModel from "@/models/Payment";
import StudentFollowUpModel from "@/models/StudentFollowUp";
import SubmissionModel from "@/models/Submission";
import UserModel from "@/models/User";
import { notifyOverdueInvoices, sweepTrialsExpiringSoon } from "@/lib/subscription/lifecycle";
import { notifyDelayedPayherePayments, notifyUpcomingSubscriptionRenewals } from "@/lib/payhere/notifications";
import { notifyUsers } from "@/lib/notifications/notify";

function inWindow(date: Date, now: Date, daysAhead: number) {
  const time = date.getTime();
  return time >= now.getTime() && time <= now.getTime() + daysAhead * 86_400_000;
}

export async function generateAutomaticReminders() {
  await connectToDatabase();

  const now = new Date();
  let created = 0;

  const assignments = await AssignmentModel.find({
    status: "published",
    dueAt: { $gte: now, $lte: new Date(now.getTime() + 3 * 86_400_000) },
  })
    .populate("courseId", "title")
    .lean();

  for (const assignment of assignments) {
    const enrollments = await EnrollmentModel.find({
      instituteId: assignment.instituteId,
      courseId: assignment.courseId,
      status: "active",
    }).select("studentId");

    for (const enrollment of enrollments) {
      const student = await UserModel.findOne({
        _id: enrollment.studentId,
        "notificationPreferences.academic": { $ne: false },
      }).select("_id");
      if (!student) continue;

      const { createdCount } = await notifyUsers({
        recipients: student,
        instituteId: assignment.instituteId,
        type: "academic",
        title: `Assignment due: ${assignment.title}`,
        body: `Due ${assignment.dueAt.toLocaleString()}.`,
        link: `/my-courses/${String(assignment.courseId)}/assignments/${String(assignment._id)}`,
        eventKey: `assignment-due:${String(assignment._id)}:${String(student._id)}`,
      });
      created += createdCount;
    }
  }

  const overdueAssignments = await AssignmentModel.find({
    status: "published",
    dueAt: { $gte: new Date(now.getTime() - 7 * 86_400_000), $lt: now },
  })
    .populate("courseId", "title")
    .lean();

  for (const assignment of overdueAssignments) {
    const enrollments = await EnrollmentModel.find({
      instituteId: assignment.instituteId,
      courseId: assignment.courseId,
      status: "active",
    }).select("studentId");

    const submissions = await SubmissionModel.find({
      assignmentId: assignment._id,
      studentId: { $in: enrollments.map((enrollment) => enrollment.studentId) },
    }).select("studentId");

    const submittedStudentIds = new Set(submissions.map((submission) => String(submission.studentId)));

    for (const enrollment of enrollments) {
      if (submittedStudentIds.has(String(enrollment.studentId))) continue;

      const student = await UserModel.findOne({
        _id: enrollment.studentId,
        "notificationPreferences.academic": { $ne: false },
      }).select("_id");
      if (!student) continue;

      const { createdCount } = await notifyUsers({
        recipients: student,
        instituteId: assignment.instituteId,
        type: "academic",
        title: `Assignment overdue: ${assignment.title}`,
        body: `This work was due on ${assignment.dueAt.toLocaleString()}. Submit it as soon as possible.`,
        link: `/my-courses/${String(assignment.courseId)}/assignments/${String(assignment._id)}`,
        eventKey: `assignment-overdue:${String(assignment._id)}:${String(student._id)}`,
      });
      created += createdCount;
    }
  }

  const exams = await ExamModel.find({
    examDate: { $gte: now, $lte: new Date(now.getTime() + 7 * 86_400_000) },
  }).lean();

  for (const exam of exams) {
    const students = await UserModel.find({
      instituteId: exam.instituteId,
      role: "student",
      "studentMeta.classId": exam.classId,
      "notificationPreferences.academic": { $ne: false },
    }).select("_id");

    for (const student of students) {
      const { createdCount } = await notifyUsers({
        recipients: student,
        instituteId: exam.instituteId,
        type: "academic",
        title: `Upcoming exam: ${exam.title}`,
        body: `Scheduled for ${exam.examDate.toLocaleString()}.`,
        link: "/exam-registration",
        eventKey: `exam-upcoming:${String(exam._id)}:${String(student._id)}`,
      });
      created += createdCount;
    }
  }

  const gradingQueue = await SubmissionModel.find({
    status: "submitted",
    submittedAt: { $lte: new Date(now.getTime() - 24 * 86_400_000) },
  })
    .populate("assignmentId", "title teacherId courseId")
    .lean();

  const gradingByTeacher = new Map<
    string,
    { instituteId: unknown; count: number; assignmentTitle: string; courseId: string; assignmentId: string }
  >();

  for (const submission of gradingQueue) {
    const assignment = submission.assignmentId as unknown as {
      _id?: unknown;
      title?: string;
      teacherId?: unknown;
      courseId?: unknown;
    } | null;
    const teacherId = assignment?.teacherId ? String(assignment.teacherId) : "";
    if (!teacherId) continue;
    const existing = gradingByTeacher.get(teacherId);
    gradingByTeacher.set(teacherId, {
      instituteId: submission.instituteId,
      count: (existing?.count ?? 0) + 1,
      assignmentTitle: existing?.assignmentTitle ?? assignment?.title ?? "Assignment",
      courseId: String(existing?.courseId ?? assignment?.courseId ?? ""),
      assignmentId: String(existing?.assignmentId ?? assignment?._id ?? ""),
    });
  }

  for (const [teacherId, queue] of gradingByTeacher) {
    const teacher = await UserModel.findOne({
      _id: teacherId,
      "notificationPreferences.academic": { $ne: false },
    }).select("_id");
    if (!teacher || !queue.assignmentId || !queue.courseId) continue;

    const weekBucket = Math.floor(now.getTime() / (7 * 86_400_000));
    const { createdCount } = await notifyUsers({
      recipients: teacher,
      instituteId: queue.instituteId,
      type: "academic",
      title: `Grading queue: ${queue.count} submission${queue.count === 1 ? "" : "s"} waiting`,
      body: `Oldest waiting item includes "${queue.assignmentTitle}". Review pending work and send feedback.`,
      link: `/courses/${queue.courseId}/assignments/${queue.assignmentId}/submissions`,
      eventKey: `grading-queue:${teacherId}:${queue.assignmentId}:${weekBucket}`,
    });
    created += createdCount;
  }

  const fees = await FeeModel.find({
    dueDate: { $lte: new Date(now.getTime() + 5 * 86_400_000) },
  }).lean();

  for (const fee of fees) {
    const students = fee.studentId
      ? await UserModel.find({ _id: fee.studentId, "notificationPreferences.billing": { $ne: false } }).select("_id name email phone notificationPreferences")
      : await UserModel.find({
          instituteId: fee.instituteId,
          role: "student",
          ...(fee.classId ? { "studentMeta.classId": fee.classId } : {}),
          "notificationPreferences.billing": { $ne: false },
        }).select("_id name email phone notificationPreferences");

    for (const student of students) {
      const paid = await PaymentModel.aggregate([
        { $match: { feeId: fee._id, studentId: student._id } },
        { $group: { _id: "$feeId", total: { $sum: "$amount" } } },
      ]);
      const balance = fee.amount - (paid[0]?.total ?? 0);
      if (balance <= 0 || !inWindow(fee.dueDate, new Date(now.getTime() - 3 * 86_400_000), 8)) continue;

      const { createdCount } = await notifyUsers({
        recipients: student,
        instituteId: fee.instituteId,
        type: "billing",
        title: `Fee due: ${fee.title}`,
        body: `Balance ${balance.toFixed(2)} due on ${fee.dueDate.toLocaleDateString()}.`,
        link: "/fees",
        eventKey: `fee-due:${String(fee._id)}:${String(student._id)}`,
        channels: { email: true, sms: true },
        email: { subject: `LearningMS: Fee due — ${fee.title}`, text: `Your outstanding balance is ${balance.toFixed(2)}. It is due on ${fee.dueDate.toLocaleDateString()}.` },
        sms: { message: `LearningMS: Fee due — ${fee.title}. Balance ${balance.toFixed(2)} is due on ${fee.dueDate.toLocaleDateString()}.` },
      });
      created += createdCount;
    }
  }

  const followUps = await StudentFollowUpModel.find({
    status: "open",
    nextActionAt: {
      $gte: new Date(now.getTime() - 2 * 86_400_000),
      $lte: new Date(now.getTime() + 2 * 86_400_000),
    },
  })
    .populate("studentId", "name")
    .lean();

  for (const followUp of followUps) {
    const owner = await UserModel.findOne({
      _id: followUp.createdBy,
      "notificationPreferences.academic": { $ne: false },
    }).select("_id");
    if (!owner) continue;

    const student = followUp.studentId as unknown as { name?: string } | null;
    const { createdCount } = await notifyUsers({
      recipients: owner,
      instituteId: followUp.instituteId,
      type: "academic",
      title: `Follow-up due: ${student?.name ?? "Student"}`,
      body: `Your ${followUp.type} follow-up is scheduled for ${followUp.nextActionAt?.toLocaleString()}.`,
      link: "/student-followups",
      eventKey: `followup-due:${String(followUp._id)}:${String(owner._id)}`,
    });
    created += createdCount;
  }

  const [trialReminders, overdueInvoices] = await Promise.all([
    sweepTrialsExpiringSoon(),
    notifyOverdueInvoices(),
  ]);

  const [paymentPendingReminders, subscriptionRenewalReminders] = await Promise.all([
    notifyDelayedPayherePayments(),
    notifyUpcomingSubscriptionRenewals(),
  ]);

  return { created, trialReminders, overdueInvoices, paymentPendingReminders, subscriptionRenewalReminders };
}

import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { connectToDatabase } from "@/lib/db/connect";
import PaymentModel from "@/models/Payment";
import InstituteModel from "@/models/Institute";
import UserModel from "@/models/User";
import { getSession, assertSameInstitute } from "@/lib/tenant/scope";
import { FeeReceiptDocument, type FeeReceiptData } from "@/lib/reports/fee-receipt";

async function buildReceipt(id: string, session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  const payment = await PaymentModel.findById(id).populate("feeId", "title");
  if (!payment) return null;

  assertSameInstitute(payment, session);

  if (session.role === "student" && payment.studentId.toString() !== session.userId) {
    throw new Error("Resource not found");
  }
  if (!["institute-admin", "student"].includes(session.role)) {
    throw new Error("Resource not found");
  }

  const [institute, student, recordedBy] = await Promise.all([
    InstituteModel.findById(payment.instituteId).select("name").lean(),
    UserModel.findById(payment.studentId).select("name studentMeta.rollNumber").lean(),
    UserModel.findById(payment.recordedBy).select("name").lean(),
  ]);

  const feeRef = payment.feeId as unknown as { title?: string } | null;

  const data: FeeReceiptData = {
    instituteName: institute?.name ?? "Institute",
    receiptNumber: payment.receiptNumber,
    paymentDate: new Date(payment.paymentDate).toLocaleDateString(),
    studentName: student?.name ?? "Unknown student",
    rollNumber: student?.studentMeta?.rollNumber ?? "",
    feeTitle: feeRef?.title ?? null,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    notes: payment.notes ?? null,
    recordedByName: recordedBy?.name ?? "Unknown",
  };

  return data;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { type, id } = await params;

  await connectToDatabase();

  if (type === "receipt") {
    let data: FeeReceiptData | null;
    try {
      data = await buildReceipt(id, session);
    } catch {
      return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
    }

    const buffer = await renderToBuffer(<FeeReceiptDocument data={data} />);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="receipt-${data.receiptNumber}.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: "Unknown report type." }, { status: 400 });
}

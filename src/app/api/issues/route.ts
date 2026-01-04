// import { NextRequest, NextResponse } from "next/server";
// import connectDB from "@/lib/mongoose";
// import Issue from "@/models/Issue";

// const WHATSAPP_NUMBER = "918978553778"; // support number

// // 📌 Unified 200 response helper
// function apiResponse(
//   success: boolean,
//   message: string,
//   data: Record<string, any> = {}
// ) {
//   return NextResponse.json(
//     {
//       success,
//       message,
//       data,
//     },
//     { status: 200 }
//   );
// }

// export async function POST(req: NextRequest) {
//   try {
//     await connectDB();

//     const body = await req.json();

//     const {
//       bookingId = "",
//       serviceType = "",
//       message = "",
//     } = body;

//     // -------- VALIDATION --------
//     if (!serviceType || !message) {
//       return apiResponse(false, "Service type and message are required", {});
//     }

//     // -------- SAVE ISSUE --------
//     const issue = await Issue.create({
//       bookingId,
//       serviceType,
//       message,
//       status: "pending",
//     });

//     // -------- WHATSAPP MESSAGE --------
//     const text = encodeURIComponent(
//       `🚨 New Issue Report\n\n` +
//         (bookingId ? `📘 Booking ID: ${bookingId}\n` : "") +
//         `🛠 Service Type: ${serviceType}\n\n` +
//         `📝 Message:\n${message}`
//     );

//     const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;

//     // -------- RESPONSE --------
//     return apiResponse(true, "Issue submitted successfully", {
//       issueId: issue._id?.toString() || "",
//       bookingId: issue.bookingId || "",
//       serviceType: issue.serviceType || "",
//       message: issue.message || "",
//       status: issue.status || "pending",
//       createdAt: issue.createdAt || "",
//       whatsappUrl,
//     });
//   } catch (error) {
//     console.error("Issue submit error:", error);
//     return apiResponse(false, "Server error", {});
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Issue from "@/models/Issue";
import { verifyAccessToken } from "@/lib/jwt";

const WHATSAPP_NUMBER = "918978553778"; // support number

// ✅ Extract userId from Bearer Token
function getUserIdFromToken(req: Request) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try {
    return (verifyAccessToken(h.split(" ")[1]) as any).userId;
  } catch {
    return null;
  }
}

// 📌 Unified 200 response helper
function apiResponse(
  success: boolean,
  message: string,
  data: Record<string, any> = {}
) {
  return NextResponse.json(
    { success, message, data },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // 🔐 Validate user auth
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return apiResponse(false, "Unauthorized", {});
    }

    const body = await req.json();
    const { serviceType = "", message = "" } = body;

    // -------- VALIDATION --------
    if (!serviceType || !message) {
      return apiResponse(false, "Service type and message are required", {});
    }

    // -------- SAVE ISSUE --------
    const issue = await Issue.create({
      userId,
      serviceType,
      message,
      status: "pending",
    });

    // -------- WHATSAPP MESSAGE --------
    const text = encodeURIComponent(
      `🚨 New Issue Report\n\n` +
        `👤 User ID: ${userId}\n` +
        `🛠 Service Type: ${serviceType}\n\n` +
        `📝 Message:\n${message}`
    );

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;

    // -------- RESPONSE --------
    return apiResponse(true, "Issue submitted successfully", {
      issueId: issue._id.toString(),
      userId,
      serviceType: issue.serviceType,
      message: issue.message,
      status: issue.status,
      createdAt: issue.createdAt,
      whatsappUrl,
    });

  } catch (error) {
    console.error("Issue submit error:", error);
    return apiResponse(false, "Server error", {});
  }
}

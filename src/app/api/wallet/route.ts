// import { NextRequest, NextResponse } from "next/server";
// import connectDB from "@/lib/mongoose";
// import User from "@/models/User";
// import WalletTransaction from "@/models/WalletTransaction";
// import { verifyAccessToken } from "@/lib/jwt";

// function getUserId(req: NextRequest) {
//   const h = req.headers.get("authorization");
//   if (!h?.startsWith("Bearer ")) return null;
//   try {
//     return (verifyAccessToken(h.split(" ")[1]) as any).userId;
//   } catch {
//     return null;
//   }
// }

// export async function GET(req: NextRequest) {
//   try {
//     await connectDB();

//     const userId = getUserId(req);
//     if (!userId) {
//       return NextResponse.json(
//         { success: false, message: "Unauthorized", data: {} },
//         { status: 401 }
//       );
//     }

//     const user = await User.findById(userId).lean();
//     if (!user) {
//       return NextResponse.json(
//         { success: false, message: "User not found", data: {} },
//         { status: 404 }
//       );
//     }

//     const txns = await WalletTransaction.find({ user: userId })
//       .sort({ createdAt: -1 })
//       .limit(50)
//       .lean();

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Wallet data fetched",
//         data: {
//           walletAmount: user.walletAmount || 0,
//           transactions: txns.map((t: any) => ({
//             id: t._id?.toString(),
//             amount: t.amount,
//             type: t.type,
//             referenceId: t.referenceId || "",
//             remark: t.remark || "",
//             createdAt: t.createdAt,
//           })),
//         },
//       },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("WALLET API ERROR:", err);
//     return NextResponse.json(
//       { success: false, message: "Server error", data: {} },
//       { status: 500 }
//     );
//   }
// }



import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";
import { verifyAccessToken } from "@/lib/jwt";

function getUserId(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try {
    return (verifyAccessToken(h.split(" ")[1]) as any).userId;
  } catch {
    return null;
  }
}

// Format date like "19 Nov 25, 11:30 AM"
function formatDate(dt: Date) {
  const d = new Date(dt);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

// Map DB type -> UI label
function getTxnTitle(type: string) {
  switch (type) {
    case "REFERRAL_BONUS":
      return "Referral Bonus";
    case "BOOKING_PAYMENT":
      return "Service Booked";
    case "REFUND":
      return "Refund";
    default:
      return "Wallet Transaction";
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const userId = getUserId(req);
    if (!userId)
      return NextResponse.json(
        { success: false, message: "Unauthorized", data: {} },
        { status: 401 }
      );

    const user = await User.findById(userId).lean();
    if (!user)
      return NextResponse.json(
        { success: false, message: "User not found", data: {} },
        { status: 404 }
      );

    const txns = await WalletTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const transactions = txns.map((t: any, i: number) => {
      const title = getTxnTitle(t.type);
      const isCredit = t.type === "REFERRAL_BONUS" || t.type === "REFUND";
      const signAmount = `${isCredit ? "+" : "-"}${t.amount}`;

      return {
        id: t._id?.toString(),
        refNo: `#${(t.referenceId || t._id?.toString()).slice(-4)}`,
        title,                     // e.g., Referral Bonus / Service Booked
        amount: t.amount,          // numeric
        displayAmount: signAmount, // +100 / -300
        isCredit,                  // for color in UI
        dateTime: formatDate(t.createdAt),
        rawDate: t.createdAt,
        type: t.type,
        remark: t.remark || ""
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Wallet data fetched",
        data: {
          walletAmount: user.walletAmount || 0,
          transactions
        }
      },
      { status: 200 }
    );

  } catch (err) {
    console.error("WALLET API ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error", data: {} },
      { status: 500 }
    );
  }
}

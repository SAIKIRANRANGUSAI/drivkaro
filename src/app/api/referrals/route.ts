// import { NextRequest, NextResponse } from "next/server";
// import connectDB from "@/lib/mongoose";
// import User from "@/models/User";
// import Referral from "@/models/Referral";
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

//     const referrals = await Referral.find({ referrer: userId })
//       .populate("referredUser", "fullName mobile")
//       .sort({ createdAt: -1 })
//       .lean();

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Referral data fetched",
//         data: {
//           referralCode: user.referralCode || "",
//           referrals: referrals.map((r: any) => ({
//             id: r._id?.toString(),
//             name: r.referredUser?.fullName || "User",
//             mobile: r.referredUser?.mobile || "",
//             status: r.bonusCredited ? "Claimed" : "Pending",
//             createdAt: r.createdAt,
//           })),
//         },
//       },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("REFERRAL API ERROR:", err);
//     return NextResponse.json(
//       { success: false, message: "Server error", data: {} },
//       { status: 500 }
//     );
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import User from "@/models/User";
import Referral from "@/models/Referral";
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

// Format like "19 May 2025, 10:30 AM"
function formatDate(dt: Date) {
  const d = new Date(dt);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
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

    const referrals = await Referral.find({ referrer: userId })
      .populate("referredUser", "fullName mobile")
      .sort({ createdAt: -1 })
      .lean();

    const referralList = referrals.map((r: any) => {
      const isClaimed = r.bonusCredited || r.status === "COMPLETED";

      return {
        id: r._id?.toString(),
        name: r.referredUser?.fullName || "User",
        mobile: r.referredUser?.mobile || "",
        status: isClaimed ? "Claimed" : "Pending",
        statusValue: isClaimed ? "CLAIMED" : "PENDING", // for UI color mapping
        dateTime: formatDate(r.createdAt),
        rawDate: r.createdAt
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Referral data fetched",
        data: {
          referralCode: user.referralCode || "",
          referrals: referralList
        }
      },
      { status: 200 }
    );

  } catch (err) {
    console.error("REFERRAL API ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error", data: {} },
      { status: 500 }
    );
  }
}

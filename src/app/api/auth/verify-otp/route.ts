// // src/app/api/auth/verify-otp/route.ts

// import { NextResponse } from "next/server";
// import connectDB from "@/lib/db";
// import Otp from "@/models/Otp";
// import User from "@/models/User";
// import crypto from "crypto";
// import { signAccessToken, signRefreshToken } from "@/lib/jwt";

// // --- HELPER: generate unique referral code ---
// async function generateUniqueReferralCode() {
//   while (true) {
//     const code = crypto.randomBytes(3).toString("hex").toUpperCase(); // AB12CD
//     const exists = await User.exists({ referralCode: code });
//     if (!exists) return code;
//   }
// }

// export async function POST(req: Request) {
//   try {
//     await connectDB();

//     const { mobile, otp } = await req.json();

//     // === VALIDATION ===
//     if (!mobile || !otp) {
//       return NextResponse.json(
//         { success: false, message: "Mobile and OTP are required", data: null },
//         { status: 400 }
//       );
//     }

//     if (!/^\d{10}$/.test(mobile)) {
//       return NextResponse.json(
//         { success: false, message: "Invalid mobile number", data: null },
//         { status: 422 }
//       );
//     }

//     if (!/^\d{6}$/.test(otp)) {
//       return NextResponse.json(
//         { success: false, message: "Invalid OTP format", data: null },
//         { status: 422 }
//       );
//     }

//     // === FIND OTP RECORD ===
//     const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
//     const record = await Otp.findOne({ phone: mobile, used: false });

//     if (!record) {
//       return NextResponse.json(
//         { success: false, message: "OTP expired or not found", data: null },
//         { status: 400 }
//       );
//     }

//     // === EXPIRY CHECK ===
//     if (record.expiresAt < new Date()) {
//       return NextResponse.json(
//         { success: false, message: "OTP expired", data: null },
//         { status: 400 }
//       );
//     }

//     // === HASH COMPARE ===
//     if (record.otpHash !== otpHash) {
//       return NextResponse.json(
//         { success: false, message: "Invalid OTP", data: null },
//         { status: 400 }
//       );
//     }

//     // === MARK OTP USED ===
//     record.used = true;
//     await record.save();

//     // === FIND OR CREATE USER ===
//     let user = await User.findOne({ mobile });

//     if (!user) {
//       // NEW USER → create account with referral code
//       const referralCode = await generateUniqueReferralCode();

//       user = await User.create({
//         mobile,
//         referralCode,
//         walletAmount: 0,
//       });
//     } else {
//       // EXISTING USER → make sure they have a referral code
//       if (!user.referralCode) {
//         user.referralCode = await generateUniqueReferralCode();
//         await user.save();
//       }
//     }

//     // === GET THE REFERRAL CODE I USED (if any) ===
//     let usedReferralCode = null;

//     if (user.referredBy) {
//       const referrer = await User.findById(user.referredBy).select("referralCode");
//       usedReferralCode = referrer?.referralCode || null;
//     }

//     // === TOKENS ===
//     const accessToken = signAccessToken({ userId: user._id, mobile });
//     const refreshToken = signRefreshToken({ userId: user._id, mobile });

//     // === RESPONSE ===
//     const res = NextResponse.json(
//       {
//         success: true,
//         message: "OTP verified successfully",
//         data: {
//           user: {
//             _id: user._id,
//             mobile: user.mobile,

//             // ⭐ YOUR OWN CODE TO SHARE WITH FRIENDS
//             myReferralCode: user.referralCode,

//             // ⭐ CODE OF THE PERSON WHO REFERRED YOU
//             usedReferralCode,

//             walletAmount: user.walletAmount || 0,
//           },
//           accessToken,
//         },
//       },
//       { status: 200 }
//     );

//     // === SET REFRESH COOKIE ===
//     res.cookies.set("drivkaro_refresh", refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//       path: "/api/auth/refresh-token",
//       maxAge: 60 * 60 * 24 * 7, // 7 days
//     });

//     return res;
//   } catch (error) {
//     console.error("Verify OTP Error:", error);

//     return NextResponse.json(
//       { success: false, message: "Server error", data: null },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Otp from "@/models/Otp";
import User from "@/models/User";
import crypto from "crypto";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";

// --- HELPER: generate unique referral code ---
async function generateUniqueReferralCode() {
  while (true) {
    const code = crypto.randomBytes(3).toString("hex").toUpperCase(); // AB12CD
    const exists = await User.exists({ referralCode: code });
    if (!exists) return code;
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const { mobile, otp } = await req.json();

    // =========================
    // REQUEST VALIDATION (❌ keep non-200)
    // =========================
    if (!mobile || !otp) {
      return NextResponse.json(
        { success: false, message: "Mobile and OTP are required", data: null },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(mobile)) {
      return NextResponse.json(
        { success: false, message: "Invalid mobile number", data: null },
        { status: 422 }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP format", data: null },
        { status: 422 }
      );
    }

    // =========================
    // FIND OTP RECORD
    // =========================
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const record = await Otp.findOne({ phone: mobile, used: false });

    // ⚠️ BUSINESS FAILURE → return 200
    if (!record) {
      return NextResponse.json(
        { success: false, message: "OTP expired or not found", data: null },
        { status: 200 }
      );
    }

    // =========================
    // EXPIRY CHECK
    // =========================
    if (record.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: "OTP expired", data: null },
        { status: 200 }
      );
    }

    // =========================
    // OTP MATCH CHECK
    // =========================
    if (record.otpHash !== otpHash) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP", data: null },
        { status: 200 }
      );
    }

    // =========================
    // MARK OTP USED
    // =========================
    record.used = true;
    await record.save();

    // =========================
    // FIND OR CREATE USER
    // =========================
    let user = await User.findOne({ mobile });

    if (!user) {
      const referralCode = await generateUniqueReferralCode();

      user = await User.create({
        mobile,
        referralCode,
        walletAmount: 0,
      });
    } else {
      if (!user.referralCode) {
        user.referralCode = await generateUniqueReferralCode();
        await user.save();
      }
    }

    // =========================
    // REFERRAL INFO
    // =========================
    let usedReferralCode = null;

    if (user.referredBy) {
      const referrer = await User.findById(user.referredBy).select("referralCode");
      usedReferralCode = referrer?.referralCode || null;
    }

    // =========================
    // TOKENS
    // =========================
    const accessToken = signAccessToken({ userId: user._id, mobile });
    const refreshToken = signRefreshToken({ userId: user._id, mobile });

    // =========================
    // SUCCESS RESPONSE
    // =========================
    const res = NextResponse.json(
      {
        success: true,
        message: "OTP verified successfully",
        data: {
          user: {
            _id: user._id,
            mobile: user.mobile,
            myReferralCode: user.referralCode,
            usedReferralCode,
            walletAmount: user.walletAmount || 0,
          },
          accessToken,
        },
      },
      { status: 200 }
    );

    // =========================
    // REFRESH TOKEN COOKIE
    // =========================
    res.cookies.set("drivkaro_refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/refresh-token",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (error) {
    console.error("Verify OTP Error:", error);

    return NextResponse.json(
      { success: false, message: "Server error", data: null },
      { status: 500 }
    );
  }
}


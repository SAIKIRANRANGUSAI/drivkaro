// import { NextResponse } from "next/server";
// import dbConnect from "@/lib/mongodb";
// import User from "@/models/User";
// import { verifyRefreshToken, signAccessToken } from "@/lib/jwt";

// export async function POST(req: Request) {
//   try {
//     await dbConnect();

//     // === EXTRACT COOKIE ===
//     const cookieHeader = req.headers.get("cookie") || "";
//     const refreshToken = cookieHeader
//       .split("; ")
//       .find((c) => c.startsWith("drivkaro_refresh="))
//       ?.split("=")[1];

//     // =========================
//     // VALIDATION (APP EXPECTS 200)
//     // =========================
//     if (!refreshToken) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Refresh token missing",
//           data: [],
//         },
//         { status: 200 }
//       );
//     }

//     // =========================
//     // VERIFY TOKEN
//     // =========================
//     let decoded: any;
//     try {
//       decoded = verifyRefreshToken(refreshToken);
//     } catch {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Invalid refresh token",
//           data: [],
//         },
//         { status: 200 }
//       );
//     }

//     // =========================
//     // FIND USER
//     // =========================
//     const user = await User.findById(decoded.userId);
//     if (!user) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "User not found",
//           data: [],
//         },
//         { status: 200 }
//       );
//     }

//     // =========================
//     // NEW ACCESS TOKEN
//     // =========================
//     const newAccessToken = signAccessToken({
//       userId: user._id,
//       mobile: user.mobile,
//     });

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Access token refreshed",
//         data: [
//           {
//             accessToken: newAccessToken,
//             expiresIn: 900, // 15 mins
//           },
//         ],
//       },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("Refresh token error:", err);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Server error",
//         data: [],
//       },
//       { status: 500 }
//     );
//   }
// }



import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { verifyRefreshToken, signAccessToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    await dbConnect();

    // === EXTRACT COOKIE ===
    const cookieHeader = req.headers.get("cookie") || "";
    const refreshToken = cookieHeader
      .split("; ")
      .find((c) => c.startsWith("drivkaro_refresh="))
      ?.split("=")[1];

    // =========================
    // VALIDATION (APP EXPECTS 200)
    // =========================
    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Refresh token missing",
          data: [],
        },
        { status: 200 }
      );
    }

    // =========================
    // VERIFY TOKEN
    // =========================
    let decoded: any;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid refresh token",
          data: [],
        },
        { status: 200 }
      );
    }

    // =========================
    // FIND USER
    // =========================
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
          data: [],
        },
        { status: 200 }
      );
    }

    // =========================
    // NEW ACCESS TOKEN
    // =========================
    const newAccessToken = signAccessToken({
      userId: user._id,
      mobile: user.mobile,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Access token refreshed",
        data: [
          {
            accessToken: newAccessToken,
            expiresIn: 900, // 15 mins
          },
        ],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Refresh token error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        data: [],
      },
      { status: 500 }
    );
  }
}

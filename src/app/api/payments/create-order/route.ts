// import { NextRequest, NextResponse } from "next/server";
// import connectDB from "@/lib/mongoose";
// import User from "@/models/User";
// import Payment from "@/models/Payment";
// import { razorpay } from "@/lib/razorpay";
// import { verifyAccessToken } from "@/lib/jwt";

// // 🔹 Utility: remove null / undefined
// function sanitize(obj: any) {
//   const clean: any = {};
//   Object.keys(obj).forEach((k) => {
//     clean[k] = obj[k] == null ? "" : obj[k];
//   });
//   return clean;
// }

// // 🔹 Get userId from Bearer token
// function getUserIdFromToken(req: Request) {
//   const h = req.headers.get("authorization");
//   if (!h?.startsWith("Bearer ")) return null;
//   try {
//     return (verifyAccessToken(h.split(" ")[1]) as any).userId;
//   } catch {
//     return null;
//   }
// }

// export async function POST(req: NextRequest) {
//   try {
//     await connectDB();

//     const userId = getUserIdFromToken(req);
//     if (!userId) {
//       return NextResponse.json(
//         { success: false, message: "Unauthorized", data: {} },
//         { status: 401 }
//       );
//     }

//     const body = await req.json();
//     const amount = Number(body.amount) || 0;
//     const useWallet = Boolean(body.useWallet);   // 👈 FROM APP

//     if (!amount || amount <= 0) {
//       return NextResponse.json(
//         { success: false, message: "amount is required", data: {} },
//         { status: 400 }
//       );
//     }

//     // ---------------------------------------
//     // FIND USER
//     // ---------------------------------------
//     const user = await User.findById(userId);
//     if (!user) {
//       return NextResponse.json(
//         { success: false, message: "User not found", data: {} },
//         { status: 404 }
//       );
//     }

//     // ---------------------------------------
//     // WALLET CALCULATION (ONLY IF SELECTED)
//     // ---------------------------------------
//     let walletUsed = 0;
//     let remainingAmount = amount;

//     if (useWallet && user.walletAmount > 0) {
//       walletUsed = Math.min(user.walletAmount, amount);
//       remainingAmount = amount - walletUsed;

//       // deduct wallet immediately
//       user.walletAmount -= walletUsed;
//       await user.save();
//     }

//     // ---------------------------------------
//     // RAZORPAY OR FULL WALLET
//     // ---------------------------------------
//     let razorpayOrder: any = null;
//     let paymentStatus: "SUCCESS" | "PENDING" = "SUCCESS";
//     let paidVia: "WALLET" | "RAZORPAY" = "WALLET";

//     if (remainingAmount > 0) {
//       razorpayOrder = await razorpay.orders.create({
//         amount: remainingAmount * 100,
//         currency: "INR",
//         receipt: `USR-${userId}-${Date.now()}`
//       });

//       paymentStatus = "PENDING";
//       paidVia = "RAZORPAY";
//     }

//     // ---------------------------------------
//     // SAVE PAYMENT (bookingId is null for now)
//     // ---------------------------------------
//     const payment = await Payment.create({
//       userId,
//       bookingId: null,
//       razorpayOrderId: razorpayOrder?.id || "",
//       amount: remainingAmount,
//       walletUsed,
//       status: paymentStatus,
//       paidVia,
//       rawResponse: razorpayOrder || {}
//     });

//     // ---------------------------------------
//     // RESPONSE (ALWAYS 200)
//     // ---------------------------------------
//     return NextResponse.json(
//       {
//         success: true,
//         message:
//           remainingAmount === 0
//             ? "Paid fully via wallet — no payment gateway required"
//             : "Order created successfully",

//         data: sanitize({
//           walletUsed,
//           amountToPay: remainingAmount,
//           currency: "INR",
//           orderId: razorpayOrder?.id || "",
//           paymentId: payment._id.toString(),
//           paymentStatus,
//           paidVia
//         })
//       },
//       { status: 200 }
//     );

//   } catch (err) {
//     console.error("Create Order Error:", err);
//     return NextResponse.json(
//       { success: false, message: "Order creation failed", data: {} },
//       { status: 500 }
//     );
//   }
// }



import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import User from "@/models/User";
import Payment from "@/models/Payment";
import WalletTransaction from "@/models/WalletTransaction";
import { razorpay } from "@/lib/razorpay";
import { verifyAccessToken } from "@/lib/jwt";

function sanitize(obj: any) {
  const clean: any = {};
  Object.keys(obj).forEach(k => clean[k] = obj[k] == null ? "" : obj[k]);
  return clean;
}

function getUserIdFromToken(req: Request) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try {
    return (verifyAccessToken(h.split(" ")[1]) as any).userId;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userId = getUserIdFromToken(req);
    if (!userId)
      return NextResponse.json(
        { success: false, message: "Unauthorized", data: {} },
        { status: 401 }
      );

    const body = await req.json();
    const amount = Number(body.amount) || 0;
    const useWallet = Boolean(body.useWallet);

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "amount is required", data: {} },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user)
      return NextResponse.json(
        { success: false, message: "User not found", data: {} },
        { status: 404 }
      );

    /* ---------------------------------------
       WALLET CALCULATION (only if selected)
    --------------------------------------- */
    let walletUsed = 0;
    let remainingAmount = amount;

    if (useWallet && user.walletAmount > 0) {
      walletUsed = Math.min(user.walletAmount, amount);
      remainingAmount = amount - walletUsed;

      // deduct wallet
      user.walletAmount -= walletUsed;
      await user.save();

      // 🔹 LOG WALLET DEBIT
      await WalletTransaction.create({
        user: userId,
        amount: walletUsed,
        type: "BOOKING_PAYMENT", // debit
        referenceId: null,
        remark: "Amount used for booking payment"
      });
    }

    /* ---------------------------------------
       RAZORPAY OR WALLET ONLY
    --------------------------------------- */
    let razorpayOrder: any = null;
    let paymentStatus: "SUCCESS" | "PENDING" = "SUCCESS";
    let paidVia: "WALLET" | "RAZORPAY" = "WALLET";

    if (remainingAmount > 0) {
      razorpayOrder = await razorpay.orders.create({
        amount: remainingAmount * 100,
        currency: "INR",
        receipt: `USR-${userId}-${Date.now()}`
      });

      paymentStatus = "PENDING";
      paidVia = "RAZORPAY";
    }

    /* ---------------------------------------
       SAVE PAYMENT ENTRY
    --------------------------------------- */
    const payment = await Payment.create({
      userId,
      bookingId: null,
      razorpayOrderId: razorpayOrder?.id || "",
      amount: remainingAmount,
      walletUsed,
      status: paymentStatus,
      paidVia,
      rawResponse: razorpayOrder || {}
    });

    return NextResponse.json(
      {
        success: true,
        message:
          remainingAmount === 0
            ? "Paid fully via wallet — no payment gateway required"
            : "Order created successfully",

        data: sanitize({
          walletUsed,
          amountToPay: remainingAmount,
          currency: "INR",
          orderId: razorpayOrder?.id || "",
          paymentId: payment._id.toString(),
          paymentStatus,
          paidVia
        })
      },
      { status: 200 }
    );

  } catch (err) {
    console.error("Create Order Error:", err);
    return NextResponse.json(
      { success: false, message: "Order creation failed", data: {} },
      { status: 500 }
    );
  }
}

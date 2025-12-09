import dbConnect from "@/lib/mongoose";
import Booking from "@/models/Booking";
import User from "@/models/User";
import OtherUser from "@/models/OtherUser";
import Instructor from "@/models/Instructor";

import {
  User as UserIcon,
  Car,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Ban,
  IndianRupee,
} from "lucide-react";

/* ---------------- PAGE ---------------- */

export default async function BookingView(props: any) {
  // ✅ In your Next 16 setup params is a Promise
  const { id } = await props.params;

  await dbConnect();

  // 1) Try as Mongo _id
  let booking: any = await Booking.findById(id);

  // 2) If not found, try as bookingId (e.g. BK637074)
  if (!booking) {
    booking = await Booking.findOne({ bookingId: id });
  }

  if (!booking) {
    return (
      <div className="p-8 text-center text-red-600 font-bold text-xl">
        Booking Not Found
      </div>
    );
  }

  /* ------------ CUSTOMER ------------ */

  let customer: any = null;

  // From your sample JSON:
  // - userId is always set
  // - otherUserId is used when bookedFor = "other"
  if (booking.otherUserId) {
    customer = await OtherUser.findById(booking.otherUserId);
  } else if (booking.userId) {
    customer = await User.findById(booking.userId);
  }

  /* ------------ INSTRUCTOR ------------ */

  const instructor = booking.assignedInstructorId
    ? await Instructor.findById(booking.assignedInstructorId)
    : null;

  /* ------------ STATUS COLOR ------------ */

  const statusColor =
    booking.status === "completed"
      ? "bg-green-600"
      : booking.status === "ongoing"
      ? "bg-purple-600"
      : booking.status === "rejected"
      ? "bg-red-600"
      : "bg-blue-600";

  return (
    <div className="p-8 space-y-10">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#0C1F4B]">
            Booking: {booking.bookingId}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Created at: {new Date(booking.createdAt).toLocaleString()}
          </p>
        </div>

        <span
          className={`px-4 py-2 rounded-full text-white capitalize ${statusColor}`}
        >
          {booking.status}
        </span>
      </div>

      {/* GRID: CUSTOMER + INSTRUCTOR */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* CUSTOMER INFO */}
        <div className="bg-white rounded-2xl shadow p-6 space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <UserIcon /> Customer
          </h2>

          <Detail
            label="Name"
            value={
              customer?.fullName ||
              booking.customerName ||
              booking.userName ||
              "Customer"
            }
          />
          <Detail
            label="Phone"
            value={customer?.mobile || booking.customerPhone || booking.userPhone}
          />
          <Detail label="Booked For" value={booking.bookedFor || "-"} />
        </div>

        {/* INSTRUCTOR INFO */}
        <div className="bg-white rounded-2xl shadow p-6 space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Car /> Instructor
          </h2>

          {!instructor && (
            <p className="text-gray-500 text-sm">
              No instructor assigned for this booking.
            </p>
          )}

          {instructor && (
            <>
              <Detail label="Name" value={instructor.fullName} />
              <Detail label="Phone" value={instructor.mobile} />
              <Detail label="City" value={instructor.city} />
            </>
          )}
        </div>
      </div>

      {/* BOOKING / RIDE DETAILS */}
      <div className="bg-white rounded-2xl shadow p-6 space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MapPin /> Ride Details
        </h2>

        <Detail label="Pickup" value={booking.pickupLocation?.name} />
        <Detail label="Drop" value={booking.dropLocation?.name} />
        <Detail label="Car Type" value={booking.carType} />
        <Detail label="Slot Time" value={booking.slotTime} />
        <Detail label="Days Count" value={booking.daysCount} />
        <Detail label="Preferred Gender" value={booking.preferredGender || "-"} />
        <Detail label="Assigned Gender" value={booking.assignedGender || "-"} />
      </div>

      {/* PAYMENT DETAILS */}
      <div className="bg-white rounded-2xl shadow p-6 space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <IndianRupee /> Payment
        </h2>

        <Detail label="Amount (per day)" value={`₹${booking.pricePerDay}`} />
        <Detail label="Base Amount" value={`₹${booking.amount}`} />
        <Detail label="GST" value={`₹${booking.gst}`} />
        <Detail label="Discount" value={`₹${booking.discount || 0}`} />
        <Detail label="Wallet Used" value={`₹${booking.walletUsed || 0}`} />
        <Detail label="Total Paid" value={`₹${booking.totalAmount}`} />
        <Detail label="Payment Status" value={booking.paymentStatus} />

        {booking.paymentTxnRef && (
          <Detail label="Transaction Ref" value={booking.paymentTxnRef} />
        )}
      </div>

      {/* DAY SESSIONS */}
      <div className="bg-white rounded-2xl shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Calendar /> Day Sessions
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          {booking.days.map((day: any) => {
            const dayStatusColor =
              day.status === "completed"
                ? "bg-green-100 text-green-700"
                : day.status === "started"
                ? "bg-purple-100 text-purple-700"
                : "bg-yellow-100 text-yellow-700";

            return (
              <div
                key={day.dayNo}
                className="border rounded-xl p-4 bg-gray-50 flex flex-col justify-between"
              >
                <div>
                  <p className="font-semibold text-lg">Day {day.dayNo}</p>
                  <p className="text-sm text-gray-700">
                    {new Date(day.date).toLocaleDateString()}
                  </p>

                  <p className="text-xs text-gray-600 mt-1">
                    Slot: {day.slot}
                  </p>

                  <p className="text-sm mt-2">Start OTP: {day.startOtp}</p>
                  <p className="text-sm">End OTP: {day.endOtp}</p>
                </div>

                <span
                  className={`mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs capitalize ${dayStatusColor}`}
                >
                  {day.status === "completed" && <CheckCircle2 size={12} />}
                  {day.status === "started" && <Clock size={12} />}
                  {day.status === "pending" && <Clock size={12} />}
                  {day.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* --------------- SMALL COMPONENT --------------- */

function Detail({ label, value }: { label: string; value: any }) {
  return (
    <p className="text-gray-700 text-sm">
      <span className="font-medium">{label}:</span> {value ?? "-"}
    </p>
  );
}

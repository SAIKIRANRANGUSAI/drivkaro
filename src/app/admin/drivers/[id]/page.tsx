import dbConnect from "@/lib/mongoose";
import Instructor from "@/models/Instructor";
import Booking from "@/models/Booking";
import BookingDay from "@/models/BookingDay";

import Image from "next/image";
import {
  User as UserIcon,
  Car,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Ban,
  Clock,
  FileText,
  Users,
  Eye,
} from "lucide-react";

import { redirect } from "next/navigation";

/* -------- SERVER ACTIONS -------- */

async function blockInstructor(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await dbConnect();
  await Instructor.findByIdAndUpdate(id, { status: "blocked" });
  redirect(`/admin/drivers/${id}`);
}

async function unBlockInstructor(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await dbConnect();
  await Instructor.findByIdAndUpdate(id, { status: "approved" });
  redirect(`/admin/drivers/${id}`);
}

/* -------- PAGE -------- */

export default async function InstructorDetails(props: any) {
  const params = await props.params;
  const id = params.id;

  await dbConnect();

  const instructor = await Instructor.findById(id);

  // Correct field to filter assigned bookings
  const bookings = await Booking.find({
    assignedInstructorId: id,
  }).sort({ createdAt: -1 });

  const days = await BookingDay.find({ instructorId: id }).sort({ date: -1 });

  if (!instructor) {
    return (
      <div className="p-8 text-center text-red-600 font-bold">
        Instructor Not Found
      </div>
    );
  }

  // Stats
  const total = bookings.length;
  const completed = bookings.filter((b: any) => b.status === "completed").length;
  const ongoing = bookings.filter((b: any) => b.status === "ongoing").length;
  const upcoming = bookings.filter(
    (b: any) => b.status === "pending" || b.status === "upcoming"
  ).length;
  const cancelled = bookings.filter((b: any) => b.status === "rejected").length;

  return (
    <div className="p-8 space-y-10">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#0C1F4B]">
            {instructor.fullName}
          </h1>

          <p className="text-gray-600 flex items-center gap-2 mt-1">
            <Phone size={16} /> {instructor.mobile}
          </p>
          <p className="text-gray-600 flex items-center gap-2">
            <MapPin size={16} /> {instructor.city || "-"}
          </p>
        </div>

        {/* STATUS + ACTION */}
        <div className="flex items-center gap-3">
          {instructor.status === "approved" && (
            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full flex items-center gap-1">
              <CheckCircle2 size={18} /> Approved
            </span>
          )}

          {instructor.status === "pending" && (
            <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full flex items-center gap-1">
              <Clock size={18} /> Pending
            </span>
          )}

          {instructor.status === "blocked" && (
            <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full flex items-center gap-1">
              <Ban size={18} /> Blocked
            </span>
          )}

          {/* BLOCK / UNBLOCK */}
          {instructor.status !== "blocked" && (
            <form action={blockInstructor}>
              <input type="hidden" name="id" value={String(instructor._id)} />
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
                Block
              </button>
            </form>
          )}

          {instructor.status === "blocked" && (
            <form action={unBlockInstructor}>
              <input type="hidden" name="id" value={String(instructor._id)} />
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                Unblock
              </button>
            </form>
          )}
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatCard title="Total" value={total} icon={<Users />} color="blue" />
        <StatCard
          title="Completed"
          value={completed}
          icon={<CheckCircle2 />}
          color="green"
        />
        <StatCard
          title="Ongoing"
          value={ongoing}
          icon={<Clock />}
          color="purple"
        />
        <StatCard
          title="Upcoming"
          value={upcoming}
          icon={<Calendar />}
          color="orange"
        />
        <StatCard title="Cancelled" value={cancelled} icon={<Ban />} color="red" />
      </div>

      {/* DETAILS */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* BASIC INFO */}
        <div className="bg-white rounded-2xl shadow p-8 space-y-4">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <UserIcon /> Basic Info
          </h2>
          <DetailRow label="Gender" value={instructor.gender} />
          <DetailRow
            label="DOB"
            value={
              instructor.dob
                ? new Date(instructor.dob).toLocaleDateString()
                : "-"
            }
          />
          <DetailRow
            label="Car Types"
            value={instructor.carTypes?.join(", ") || "-"}
          />
          <DetailRow label="Vehicle Number" value={instructor.vehicleNumber} />
        </div>

        {/* DOCUMENTS */}
        <div className="bg-white rounded-2xl shadow p-8 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText /> Documents
          </h2>
          <DocumentPreview title="Driving License" url={instructor.dlImageUrl} />
          <DocumentPreview title="ID Proof" url={instructor.idProofUrl} />
        </div>
      </div>

      {/* DAY SESSIONS */}
      <div className="bg-white rounded-2xl shadow p-8 space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Calendar /> Day Wise Sessions
        </h2>

        {days.length === 0 && (
          <p className="text-gray-500">No day sessions found</p>
        )}

        <div className="grid md:grid-cols-3 gap-4">
          {days.map((d: any) => (
            <div key={d._id} className="border rounded-xl p-4 bg-gray-50">
              <p className="font-semibold">
                {new Date(d.date).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                {d.startTime?.time} → {d.endTime?.time}
              </p>
              <p className="text-sm mt-2">
                OTP: {d.startSessionOTP} / {d.endSessionOTP}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* BOOKINGS */}
      <div className="bg-white rounded-2xl shadow p-8 space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Car /> Assigned Bookings
        </h2>

        {bookings.length === 0 && (
          <p className="text-gray-500">No bookings found</p>
        )}

        <div className="space-y-4">
          {bookings.map((b: any) => (
            <div key={b._id} className="border rounded-xl p-4 hover:bg-gray-50 transition">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-xl">{b.bookingId}</p>

                <span className="px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-700 capitalize">
                  {b.status}
                </span>
              </div>

              <p className="text-gray-600 text-sm">
                {new Date(b.createdAt).toLocaleString()}
              </p>

              <div className="grid grid-cols-3 gap-2 mt-3">
                {b.days.map((day: any) => (
                  <div
                    key={day.dayNo}
                    className="bg-gray-50 border rounded-lg p-2 text-xs"
                  >
                    <p className="font-medium">Day {day.dayNo}</p>
                    <p>{new Date(day.date).toLocaleDateString()}</p>
                    <p>OTP: {day.startOtp}/{day.endOtp}</p>
                    <p className="capitalize">{day.status}</p>
                  </div>
                ))}
              </div>

              {/* VIEW BUTTON */}
              <div className="mt-3 flex justify-end">
                <a
  href={`/admin/bookings/${b._id}`}
  className="px-4 py-2 flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
>
  <Eye size={16} /> View Booking
</a>

              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------- COMPONENTS ------- */

function StatCard({ title, value, icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-700",
    purple: "bg-purple-100 text-purple-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: any) {
  return (
    <p className="text-gray-700">
      <span className="font-medium">{label}:</span> {value || "-"}
    </p>
  );
}

function DocumentPreview({ title, url }: any) {
  return (
    <div>
      <p className="font-medium mb-2">{title}</p>
      <Image
        src={url}
        alt={title}
        width={350}
        height={200}
        className="rounded-xl shadow-lg border"
      />
    </div>
  );
}

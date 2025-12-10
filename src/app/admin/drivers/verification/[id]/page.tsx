import dbConnect from "@/lib/mongoose";
import Instructor from "@/models/Instructor";

import Image from "next/image";
import {
  User as UserIcon,
  Phone,
  MapPin,
  Ban,
  AlertCircle,
  Clock,
  FileText,
  Award,
  Shield,
} from "lucide-react";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/* ---------------- SERVER ACTIONS ---------------- */

async function approveInstructor(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;

  await dbConnect();
  await Instructor.findByIdAndUpdate(id, {
    status: "approved",
    rejectionMessage: "",
    approvedAt: new Date(),
  });

  revalidatePath(`/admin/drivers/verification/${id}`);
  redirect("/admin/drivers");
}

async function rejectInstructor(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const message = (formData.get("message") as string) || "";

  await dbConnect();
  await Instructor.findByIdAndUpdate(id, {
    status: "rejected",
    rejectionMessage: message,
    rejectedAt: new Date(),
  });

  revalidatePath(`/admin/drivers/verification/${id}`);
}

/* ---------------- PAGE ---------------- */

export default async function VerifyInstructorPage(props: any) {
  const { id } = await props.params;

  await dbConnect();
  const instructor = await Instructor.findById(id);

  if (!instructor) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h2 className="font-bold text-2xl text-gray-800 mb-2">
            Instructor Not Found
          </h2>
          <a
            href="/admin/drivers"
            className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Go Back
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      {/* TITLE */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0C1F4B]">
            Instructor Verification
          </h1>
          <p className="text-gray-600 mt-1">
            Review all documents and verify instructor details before approving.
          </p>
        </div>

        <a
          href="/admin/drivers"
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          ← Back to list
        </a>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-8">
          {/* PROFILE CARD */}
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <div className="flex gap-6 items-start">
              <div className="w-20 h-20 rounded-xl bg-blue-100 flex items-center justify-center">
                <UserIcon className="w-10 h-10 text-blue-700" />
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold">{instructor.fullName}</h2>

                <div className="flex flex-wrap gap-3 mt-3 text-gray-600">
                  <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg">
                    <Phone size={16} /> {instructor.mobile}
                  </span>
                  {instructor.city && (
                    <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg">
                      <MapPin size={16} /> {instructor.city}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* DETAILS */}
            <div className="grid md:grid-cols-2 gap-4">
              <Info label="Gender" value={instructor.gender} />
              <Info
                label="DOB"
                value={
                  instructor.dob
                    ? new Date(instructor.dob).toLocaleDateString()
                    : "-"
                }
              />
              <Info
                label="Car Types"
                value={instructor.carTypes?.join(", ") || "-"}
              />
              <Info label="Vehicle Number" value={instructor.vehicleNumber} />
              <Info label="DL Number" value={instructor.dlNumber} />
              <Info label="ID Proof Type" value={instructor.idProofType} />
            </div>
          </div>

          {/* DOCUMENTS */}
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <FileText className="text-blue-600" /> Documents
            </h3>

            <div className="grid md:grid-cols-2 gap-8">
              <Doc title="Driving License" url={instructor.dlImageUrl || ""} />
              <Doc title="ID Proof" url={instructor.idProofUrl || ""} />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-8">
          {/* ACTIONS */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Shield className="text-blue-600" /> Verification Review
            </h3>

            <form action={approveInstructor}>
              <input type="hidden" name="id" value={String(instructor._id)} />

              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow"
              >
                <Award size={18} /> Approve
              </button>
            </form>

            <form action={rejectInstructor} className="mt-6 space-y-4">
              <input type="hidden" name="id" value={String(instructor._id)} />

              <label className="text-sm font-semibold">
                Rejection Reason (optional)
              </label>

              <textarea
                name="message"
                rows={4}
                defaultValue={instructor.rejectionMessage || ""}
                placeholder="Eg: DL image not clear, please upload again"
                className="w-full border rounded-xl p-3 text-sm"
              />

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow"
              >
                <Ban size={18} /> Reject
              </button>
            </form>

            {instructor.rejectionMessage && (
              <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="font-semibold text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle size={16} /> Previous Rejection
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  {instructor.rejectionMessage}
                </p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Clock size={12} />{" "}
                  Last update: {(instructor as any).updatedAt
                    ? new Date((instructor as any).updatedAt).toLocaleString()
                    : "-"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------- SMALL COMPONENTS ------------------- */

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-gray-50 p-4 rounded-xl">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900 mt-1">{value || "-"}</p>
    </div>
  );
}

function Doc({ title, url }: { title: string; url: string }) {
  return (
    <div className="space-y-2">
      <p className="font-semibold text-gray-800">{title}</p>
      <div className="relative rounded-xl overflow-hidden border shadow">
        <Image
          src={url}
          alt={title}
          width={600}
          height={350}
          className="object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
    </div>
  );
}

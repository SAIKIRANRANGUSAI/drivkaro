import dbConnect from "@/lib/mongoose";
import Instructor from "@/models/Instructor";
import { redirect } from "next/navigation";

export default async function ApprovePage({ searchParams }: any) {
  const id = searchParams.id;

  await dbConnect();

  await Instructor.findByIdAndUpdate(id, {
    status: "approved",
  });

  redirect("/admin/drivers/verification");
}

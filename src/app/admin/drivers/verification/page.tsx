import dbConnect from "@/lib/mongoose";
import Instructor from "@/models/Instructor";
import Link from "next/link";
import { 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Clock,
  UserCircle,
  Car,
  FileText,
  AlertCircle,
  ChevronRight,
  Calendar,
  BadgeCheck,
  Users,
  Search,
  Filter
} from "lucide-react";

export default async function VerificationListPage() {
  await dbConnect();

  const pending = await Instructor.find({ status: "pending" }).sort({
    createdAt: -1,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Driver Verification
                </h1>
                <p className="text-gray-600 mt-1">
                  Review and approve new instructor applications
                </p>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-6 min-w-[280px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100 text-sm font-medium">PENDING REVIEW</span>
              <BadgeCheck className="w-5 h-5 text-blue-200" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{pending.length}</span>
              <span className="text-blue-200">instructors</span>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-500/30">
              <p className="text-blue-100 text-sm">
                {pending.length === 0 
                  ? "All applications processed" 
                  : "Requires immediate attention"}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search instructors by name, mobile, or city..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition">
                <Filter className="w-4 h-4" />
                <span className="font-medium text-gray-700">Filter</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition">
                <Calendar className="w-4 h-4" />
                <span className="font-medium text-gray-700">Sort</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Pending Applications
          </h2>
          <span className="text-sm text-gray-500 font-medium">
            Showing {pending.length} of {pending.length} applications
          </span>
        </div>

        {pending.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BadgeCheck className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                All Applications Processed!
              </h3>
              <p className="text-gray-600 mb-8">
                Great work! All pending instructor applications have been reviewed and processed.
              </p>
              <div className="inline-flex items-center gap-2 text-blue-600 font-medium">
                <Clock className="w-5 h-5" />
                New applications will appear here automatically
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pending.map((ins: any) => (
              <Link
                key={ins._id}
                href={`/admin/drivers/verification/${ins._id}`}
                className="group"
              >
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full">
                  {/* Card Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <UserCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">
                            {ins.fullName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Applied {new Date(ins.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">
                        PENDING
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 p-3 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">Mobile</p>
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {ins.mobile}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">Location</p>
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          {ins.city || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {/* Car Types */}
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 mb-1">Car Types</p>
                          <div className="flex flex-wrap gap-1">
                            {ins.carTypes?.slice(0, 3).map((type: string, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg"
                              >
                                {type}
                              </span>
                            ))}
                            {ins.carTypes?.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-lg">
                                +{ins.carTypes.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* DL Info */}
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 mb-1">Driving License</p>
                          <p className="font-medium text-gray-900">
                            {ins.dlNumber || "Not provided"}
                          </p>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 mb-1">Application Date</p>
                          <p className="font-medium text-gray-900">
                            {new Date(ins.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Click to review documents
                        </span>
                        <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
                          <span>Review</span>
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hover Indicator */}
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {pending.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Verification Tips</h4>
              <p className="text-sm text-gray-600">
                Review all documents thoroughly before approval. Check DL validity, ID proof authenticity, 
                and ensure all required information is complete.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
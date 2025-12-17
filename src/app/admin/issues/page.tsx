"use client";

import AdminPageWrapper from "@/components/admin/AdminPageWrapper";
import SkeletonCard from "@/components/admin/SkeletonCard";
import { useEffect, useState } from "react";
import { Trash2, RefreshCw, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Swal from "sweetalert2";

type Issue = {
  issueId: string;
  bookingId: string;
  serviceType: string;
  message: string;
  createdAt: string;
};

const ITEMS_PER_PAGE = 10; // Increased for better UX on larger screens

export  function UsersPage() {
  return (
    <AdminPageWrapper
      title="Users Management"
      description="View and manage registered users"
    >
      <SkeletonCard />
    </AdminPageWrapper>
  );
}

export default function AdminIssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  async function fetchIssues() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/issues");
      const json = await res.json();
      const data = json.data || [];
      setIssues(data);
      setFilteredIssues(data);
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch issues. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    const filtered = issues.filter(
      (issue) =>
        issue.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.message.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredIssues(filtered);
    setPage(1); // Reset to first page on search
  }, [searchTerm, issues]);

  async function deleteIssue(issueId: string) {
    const confirm = await Swal.fire({
      title: "Delete Issue?",
      text: "This action cannot be undone. Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/issues/${issueId}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Issue has been deleted successfully.",
          timer: 1500,
          showConfirmButton: false,
        });

        setIssues(prev => prev.filter(i => i.issueId !== issueId));
      } else {
        throw new Error(json.message || "Deletion failed");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to delete issue. Please try again.",
      });
    }
  }

  const totalPages = Math.ceil(filteredIssues.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedIssues = filteredIssues.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Issues Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and resolve user-reported issues & support messages
              </p>
            </div>
            <button
              onClick={fetchIssues}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 animate-spin" />
              Refresh
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by booking ID, service, or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Issues</h3>
            <p className="text-3xl font-bold text-gray-900">{filteredIssues.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500">Bookings Affected</h3>
            <p className="text-3xl font-bold text-gray-900">
              {new Set(filteredIssues.map(i => i.bookingId)).size}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500">Recent (Today)</h3>
            <p className="text-3xl font-bold text-gray-900">
              {filteredIssues.filter(i => new Date(i.createdAt).toDateString() === new Date().toDateString()).length}
            </p>
          </div>
        </div>

        {/* EMPTY STATE */}
        {!filteredIssues.length && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No issues found</h3>
            <p className="text-gray-500">
              {searchTerm ? "Try adjusting your search terms." : "No issues reported yet. Everything's running smoothly!"}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* TABLE */}
        {!!filteredIssues.length && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedIssues.map(issue => (
                    <tr
                      key={issue.issueId}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {issue.bookingId || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {issue.serviceType}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <div className="text-sm text-gray-900 line-clamp-2">{issue.message}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(issue.createdAt).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => deleteIssue(issue.issueId)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-900 transition-colors duration-150"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span>Showing</span>
                    <span className="font-medium">
                      {(startIndex + 1)}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredIssues.length)}
                    </span>
                    <span>of {filteredIssues.length} results</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Prev
                    </button>
                    <div className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700">
                      Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                    </div>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
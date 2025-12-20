"use client";
import { useEffect, useState } from "react";
import { Trash2, Plus, Image as ImageIcon, Link as LinkIcon, Layers, ExternalLink } from "lucide-react";
import Swal from "sweetalert2";
import AdminPageWrapper from "@/components/admin/AdminPageWrapper";
import SkeletonCard from "@/components/admin/SkeletonCard";

type Banner = {
  _id: string;
  index: number;
  image: string;
  link: string;
  active: boolean;
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  /* ============================
     FETCH BANNERS
  ============================ */
  async function fetchBanners() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/banners");
      const json = await res.json();
      if (res.ok && json.success) {
        setBanners(json.data || []);
      } else {
        Swal.fire({
            icon: "error",
            title: "Error",
            text: json.message || "Failed to load banners",
            confirmButtonColor: "#111827"
        });
      }
    } catch {
        Swal.fire({
            icon: "error",
            title: "Connection Error",
            text: "Failed to load banners",
            confirmButtonColor: "#111827"
        });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBanners();
  }, []);

  /* ============================
     ADD BANNER
  ============================ */
  async function addBanner() {
    const { value: form } = await Swal.fire({
      title: "Add New Banner",
      html: `
        <div class="text-left space-y-4 font-sans pt-2">
            <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Display Order (Index)</label>
                <input id="index" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" placeholder="Ex: 1" type="number" min="0">
            </div>

            <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Target URL / Deep Link</label>
                <input id="link" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" placeholder="https://...">
            </div>

            <div>
                 <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Banner Image</label>
                 <input type="file" id="image" class="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-xs file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100 transition-all
                 " accept="image/*">
            </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Upload Banner",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#9ca3af",
      customClass: {
        popup: "rounded-[2rem] p-8 shadow-2xl",
        title: "text-2xl font-bold text-gray-800",
        confirmButton: "rounded-xl px-6 py-3 font-semibold shadow-lg shadow-blue-200",
        cancelButton: "rounded-xl px-6 py-3 font-medium",
      },
      preConfirm: async () => {
        const indexInput = document.getElementById("index") as HTMLInputElement;
        const linkInput = document.getElementById("link") as HTMLInputElement;
        const fileInput = document.getElementById("image") as HTMLInputElement;

        const index = Number(indexInput.value);
        const link = linkInput.value.trim();
        const file = fileInput.files?.[0];

        if (Number.isNaN(index) || index < 0) {
          Swal.showValidationMessage("Valid index (number >= 0) required");
          return;
        }
        if (!file) {
          Swal.showValidationMessage("Image file required");
          return;
        }
        if (!file.type.startsWith('image/')) {
          Swal.showValidationMessage("Please select an image file");
          return;
        }
        if (file.size > 10 * 1024 * 1024) {  // 10MB limit
          Swal.showValidationMessage("File too large (max 10MB)");
          return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "drivkaro");

        try {
          const response = await fetch(
            "https://api.cloudinary.com/v1_1/dhuzvzyut/image/upload",
            { method: "POST", body: formData }
          );
          const upload = await response.json(); 

          if (!response.ok) {
            const errorMsg = upload.error?.message || `HTTP ${response.status}: ${response.statusText}`;
            Swal.showValidationMessage(`Upload failed: ${errorMsg}`);
            return;
          }

          if (!upload.secure_url) {
            Swal.showValidationMessage(`Upload response invalid: ${upload.error?.message || 'No secure URL returned'}`);
            return;
          }

          console.log("✅ Cloudinary upload success:", upload.secure_url); 
          return { index, link, image: upload.secure_url };
        } catch (error: any) {
          console.error("❌ Cloudinary fetch error:", error); 
          Swal.showValidationMessage(`Network error: ${error.message}`);
          return;
        }
      },
    });

    if (!form) return;

    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to add banner");
      }

      Swal.fire({
          icon: "success",
          title: "Success",
          text: "Banner uploaded successfully",
          timer: 2000,
          showConfirmButton: false
      });
      fetchBanners(); 
    } catch (error: any) {
      Swal.fire("Error", error.message || "Failed to add banner", "error");
    }
  }

  /* ============================
     DELETE BANNER
  ============================ */
  async function deleteBanner(id: string) {
    const confirm = await Swal.fire({
      title: "Remove Banner?",
      text: "This will remove the banner from the home screen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#f3f4f6",
      cancelButtonText: "<span class='text-gray-600'>Cancel</span>",
      confirmButtonText: "Yes, delete it",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl shadow-lg shadow-red-100",
        cancelButton: "rounded-xl",
      },
    });

    if (!confirm.isConfirmed) return;
    
    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        Swal.fire({
            icon: "success",
            title: "Deleted",
            text: "Banner removed successfully",
            timer: 1500,
            showConfirmButton: false
        });
        fetchBanners();
      } else {
        Swal.fire("Error", json.message || "Delete failed", "error");
      }
    } catch {
      Swal.fire("Error", "Delete failed", "error");
    }
  }

  /* ============================
     LOADING
  ============================ */
  if (loading) {
    return (
      <AdminPageWrapper title="Banner Management">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
        </div>
      </AdminPageWrapper>
    );
  }

  /* ============================
     UI
  ============================ */
  return (
    <AdminPageWrapper
      title="Banner Management"
      description="Create and organize home screen promotional banners."
    >
      {/* HEADER ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 bg-white/50 p-4 rounded-2xl border border-gray-100 backdrop-blur-sm">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            {banners.length} Active Banners
          </h2>
        </div>
        <button
          onClick={addBanner}
          className="group flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-200 active:scale-95"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          <span className="font-medium text-sm">Upload New Banner</span>
        </button>
      </div>

      {/* BANNER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
        {banners.map(banner => (
          <div
            key={banner._id}
            className="group relative bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 hover:-translate-y-1"
          >
            {/* IMAGE AREA */}
            <div className="relative aspect-video overflow-hidden bg-gray-100">
                <img
                    src={banner.image}
                    alt="Banner Preview"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-image.jpg'; 
                    }}
                />
                <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-md text-gray-900 text-xs font-bold rounded-full shadow-sm">
                        <Layers className="w-3 h-3 text-blue-600" />
                        Index: {banner.index}
                    </span>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                    <LinkIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Target Link</p>
                    <p className="text-sm text-gray-700 font-medium truncate" title={banner.link || "No Link"}>
                        {banner.link || <span className="text-gray-400 italic">No link assigned</span>}
                    </p>
                </div>
                {banner.link && (
                    <a href={banner.link} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                    </a>
                )}
              </div>

              <div className="w-full h-px bg-gray-100 mb-4" />

              <button
                onClick={() => deleteBanner(banner._id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-100 hover:bg-red-50 rounded-xl transition-all font-medium text-sm"
              >
                <Trash2 className="w-4 h-4" /> Delete Banner
              </button>
            </div>
          </div>
        ))}

        {/* EMPTY STATE */}
        {banners.length === 0 && (
          <div className="col-span-full">
            <div 
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-[2.5rem] py-16 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group" 
                onClick={addBanner}
            >
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <ImageIcon className="w-8 h-8 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No active banners</h3>
                <p className="text-sm text-gray-500 mt-1 mb-6">Upload a banner to feature content on the home screen</p>
                <button className="text-sm font-semibold text-blue-600 group-hover:underline">
                    Upload Banner &rarr;
                </button>
            </div>
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
}
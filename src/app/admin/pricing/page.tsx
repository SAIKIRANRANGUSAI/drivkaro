"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  Plus,
  IndianRupee,
  Image as ImageIcon,
  Trash2,
  Pencil,
  Car,
  Percent,
  Tag,
} from "lucide-react";
import AdminPageWrapper from "@/components/admin/AdminPageWrapper";
import SkeletonCard from "@/components/admin/SkeletonCard";

type Pricing = {
  _id: string;
  carType: string; // Changed to string to allow custom types
  pricePerDay: number;
  gstPercent: number;
  image: string;
};

export default function AdminPricingPage() {
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(true);

  /* ============================
     FETCH PRICING
  ============================ */
  async function fetchPricing() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/pricing");
      const json = await res.json();
      if (json.success) setPricing(json.data || []);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "Failed to load pricing details.",
        confirmButtonColor: "#111827",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPricing();
  }, []);

  /* ============================
     ADD / EDIT PRICING
  ============================ */
  async function addOrEditPricing(existing?: Pricing) {
    const { value: form } = await Swal.fire({
      title: existing ? "Edit Vehicle Tier" : "Add New Vehicle Tier",
      // Custom HTML to make the form look premium inside SweetAlert
      html: `
        <div class="text-left space-y-6 font-sans pt-2">
          <!-- Custom Creatable Category Input -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Vehicle Category</label>
            <div class="relative">
              <input 
                id="carTypeInput" 
                type="text" 
                list="categorySuggestions" 
                value="${existing?.carType || ''}"
                class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="Type or select a category (e.g. Hatchback, Luxury...)"
                autocomplete="off"
              />
              <datalist id="categorySuggestions">
                <option value="Hatchback">
                <option value="Sedan">
                <option value="SUV">
                <option value="Luxury">
                <option value="MUV">
                <option value="Convertible">
                <option value="Electric">
                <option value="Premium Sedan">
              </datalist>
              <div class="absolute right-3 top-3.5 pointer-events-none text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-2">You can type a new custom category!</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Daily Rate (₹)</label>
              <input id="price" type="number" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" placeholder="Ex: 2500">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">GST (%)</label>
              <input id="gst" type="number" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" placeholder="18" value="18">
            </div>
          </div>

          <div>
             <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Vehicle Image</label>
             <input type="file" id="image" class="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-xs file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100 transition-all
             " accept="image/*">
          </div>

          ${
            existing?.image
              ? `<div class="mt-4 relative rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                   <img src="${existing.image}" class="w-full h-40 object-cover" />
                   <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span class="text-white text-xs font-medium">Current Image</span>
                   </div>
                 </div>`
              : ""
          }
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: existing ? "Update Pricing" : "Create Tier",
      confirmButtonColor: "#2563eb", // blue-600
      cancelButtonColor: "#9ca3af",
      focusConfirm: false,
      customClass: {
        popup: "rounded-[2rem] p-8 shadow-2xl", // Premium popup shape
        title: "text-2xl font-bold text-gray-800",
        confirmButton: "rounded-xl px-6 py-3 font-semibold shadow-lg shadow-blue-200",
        cancelButton: "rounded-xl px-6 py-3 font-medium",
      },
      didOpen: () => {
        const input = document.getElementById("carTypeInput") as HTMLInputElement;
        if (existing) {
          input.value = existing.carType;
          (document.getElementById("price") as HTMLInputElement).value =
            String(existing.pricePerDay);
          (document.getElementById("gst") as HTMLInputElement).value =
            String(existing.gstPercent);
        }

        // Optional: Auto-focus category input
        input.focus();
      },
      preConfirm: async () => {
        const carTypeInput = (document.getElementById("carTypeInput") as HTMLInputElement).value.trim();
        const price = Number(
          (document.getElementById("price") as HTMLInputElement).value
        );
        const gst = Number(
          (document.getElementById("gst") as HTMLInputElement).value || 18
        );
        const file = (document.getElementById("image") as HTMLInputElement)
          .files?.[0];

        if (!carTypeInput) {
          Swal.showValidationMessage("Please enter a vehicle category");
          return;
        }

        if (!price || price <= 0) {
          Swal.showValidationMessage("Please enter a valid price per day");
          return;
        }

        let imageUrl = existing?.image || "";

        if (file) {
          // Show loading state inside swal
          Swal.resetValidationMessage();
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", "drivkaro");

          try {
            const upload = await fetch(
              "https://api.cloudinary.com/v1_1/dhuzvzyut/image/upload",
              { method: "POST", body: formData }
            ).then((r) => r.json());
            if (!upload.secure_url) throw new Error("Upload failed");
            imageUrl = upload.secure_url;
          } catch (error) {
            Swal.showValidationMessage("Image upload failed. Try again.");
            return;
          }
        }

        if (!imageUrl) {
          Swal.showValidationMessage("A vehicle image is required");
          return;
        }

        return { carType: carTypeInput, pricePerDay: price, gstPercent: gst, image: imageUrl };
      },
    });

    if (!form) return;

    // If editing, use PUT, else POST
    const method = existing ? "PUT" : "POST";
    const url = existing ? `/api/admin/pricing/${existing._id}` : "/api/admin/pricing";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      Swal.fire({
        icon: "success",
        title: "Saved!",
        text: existing ? "Fleet pricing updated successfully" : "New tier created",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Could not save pricing tier",
      });
      return;
    }

    fetchPricing();
  }

  /* ============================
     DELETE PRICING
  ============================ */
  async function deletePricing(item: Pricing) {
    const confirm = await Swal.fire({
      title: "Remove Tier?",
      text: `This will permanently delete the ${item.carType} pricing tier.`,
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

    await fetch(`/api/admin/pricing/${item._id}`, {
      method: "DELETE",
    });

    Swal.fire({
      icon: "success",
      title: "Deleted",
      text: "Pricing tier removed",
      timer: 1500,
      showConfirmButton: false,
    });
    fetchPricing();
  }

  /* ============================
     LOADING
  ============================ */
  if (loading) {
    return (
      <AdminPageWrapper title="Fleet Pricing">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      </AdminPageWrapper>
    );
  }

  /* ============================
     UI
  ============================ */
  return (
    <AdminPageWrapper
      title="Pricing & Fleet"
      description="Manage vehicle tiers, daily rates, and taxation rules."
    >
      {/* HEADER ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 bg-white/50 p-4 rounded-2xl border border-gray-100 backdrop-blur-sm">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            {pricing.length} Active Tiers
          </h2>
        </div>
        <button
          onClick={() => addOrEditPricing()}
          className="group flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-200 active:scale-95"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          <span className="font-medium text-sm">Add New Tier</span>
        </button>
      </div>

      {/* PRICING GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
        {pricing.map((item) => (
          <div
            key={item._id}
            className="group relative bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 hover:-translate-y-1"
          >
            {/* IMAGE SECTION */}
            <div className="relative h-56 overflow-hidden">
              <img
                src={item.image}
                alt={item.carType}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
              
              {/* Floating Badge */}
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md text-gray-900 text-xs font-bold rounded-full shadow-sm uppercase tracking-wide">
                  <Car className="w-3 h-3 text-blue-600" />
                  {item.carType}
                </span>
              </div>
            </div>

            {/* CONTENT SECTION */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                   <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Daily Rate</p>
                   <div className="flex items-baseline gap-1">
                      <IndianRupee className="w-5 h-5 text-gray-900 self-center" />
                      <span className="text-3xl font-bold text-gray-900 tracking-tight">{item.pricePerDay.toLocaleString()}</span>
                   </div>
                </div>
                
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100">
                      <Percent className="w-3 h-3" />
                      <span className="text-xs font-bold">{item.gstPercent}% GST</span>
                   </div>
                </div>
              </div>

              {/* Decorative Divider */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-5" />

              {/* ACTIONS */}
              <div className="grid grid-cols-5 gap-3">
                <button
                  onClick={() => addOrEditPricing(item)}
                  className="col-span-4 flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors shadow-md"
                >
                  <Pencil className="w-4 h-4" /> Edit Details
                </button>

                <button
                  onClick={() => deletePricing(item)}
                  className="col-span-1 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-xl transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* EMPTY STATE */}
        {!pricing.length && (
          <div className="col-span-full">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-[2.5rem] py-20 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => addOrEditPricing()}>
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <ImageIcon className="w-8 h-8 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Your fleet is empty</h3>
                <p className="text-sm text-gray-500 mt-1 mb-6">Create your first pricing tier to get started</p>
                <button className="text-sm font-semibold text-blue-600 group-hover:underline">
                    Create Pricing Tier &rarr;
                </button>
            </div>
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
}
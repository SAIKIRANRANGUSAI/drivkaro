"use client";

import { useEffect, useState, useRef } from "react";
import {
  Download,
  Upload,
  Settings,
  Image as Img,
  Plus,
  Trash2,
  Save,
  MonitorSmartphone,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";

export default function SettingsPage() {
  const [logo, setLogo] = useState("");
  const [flashScreens, setFlashScreens] = useState<any[]>([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingFlash, setSavingFlash] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==============================
  // LOAD ALL SETTINGS
  // ==============================
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();

      setLogo(data.logo || "");

      setFlashScreens(
        (data.flashScreens || []).map((fs: any) => ({
          _id: fs._id,
          image: fs.image,
          heading: fs.heading,
          description: fs.description,
          file: null,
        }))
      );

      setLogs(data.logs || []);
    } catch (error) {
      Swal.fire("Error", "Failed to load settings.", "error");
    } finally {
      setLoading(false);
    }
  }

  // ==============================
  // UPLOAD LOGO TO CLOUDINARY
  // ==============================
  async function uploadLogo(e: any) {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/admin/settings/logo", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire("Success", "Logo updated successfully!", "success");
        setLogo(data.url);
      } else {
        Swal.fire("Error", data.message || "Failed to upload logo.", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Upload failed. Please try again.", "error");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset input
      }
    }
  }

  // ==============================
  // ADD FLASH SCREEN
  // ==============================
  function addFlashScreen() {
    if (flashScreens.length >= 3) {
      Swal.fire({
        icon: "warning",
        title: "Limit Reached",
        text: "You can add a maximum of 3 flash screens.",
        confirmButtonColor: "#3B82F6",
      });
      return;
    }

    setFlashScreens([
      ...flashScreens,
      { image: "", heading: "", description: "", file: null },
    ]);
  }

  // ==============================
  // SAVE / UPDATE FLASH SCREENS
  // ==============================
  async function saveFlashScreens() {
    // Basic validation
    const hasEmptyFields = flashScreens.some(
      (fs) => !fs.heading.trim() || !fs.description.trim()
    );
    if (hasEmptyFields) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Fields",
        text: "Please fill in all headings and descriptions.",
        confirmButtonColor: "#3B82F6",
      });
      return;
    }

    setSavingFlash(true);
    const form = new FormData();
    form.append("total", flashScreens.length.toString());

    flashScreens.forEach((fs, i) => {
      form.append(`heading_${i}`, fs.heading);
      form.append(`description_${i}`, fs.description);

      if (fs.file) {
        form.append(`image_${i}`, fs.file);
      } else {
        form.append(`existing_${i}`, fs.image);
      }
    });

    try {
      const res = await fetch("/api/admin/settings/flash", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Saved!",
          text: "Flash screens updated successfully.",
          confirmButtonColor: "#10B981",
        });
        loadSettings(); // Reload to get updated data
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "Something went wrong.",
          confirmButtonColor: "#EF4444",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save flash screens. Please try again.",
        confirmButtonColor: "#EF4444",
      });
    } finally {
      setSavingFlash(false);
    }
  }

  // ==============================
  // REMOVE FLASH SCREEN
  // ==============================
  function removeFlashScreen(index: number) {
    Swal.fire({
      title: "Are you sure?",
      text: "This flash screen will be removed permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, remove it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setFlashScreens(flashScreens.filter((_, i) => i !== index));
        Swal.fire({
          icon: "success",
          title: "Removed!",
          text: "Flash screen has been removed.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  }

  // ==============================
  // DOWNLOAD DATABASE
  // ==============================
  function downloadDatabase() {
    Swal.fire({
      icon: "info",
      title: "Downloading...",
      text: "Your database is being prepared for download.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Simulate async download with timeout for loader effect
    setTimeout(() => {
      Swal.close();
      window.location.href = "/api/admin/settings/database";
    }, 1000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#0C1F4B]" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-10 space-y-12">
      {/* MAIN HEADER */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <h1 className="text-4xl font-bold text-[#0C1F4B] flex gap-3 items-center">
          <Settings size={32} />
          Settings
        </h1>
        <p className="text-gray-600 mt-2">Manage your app configuration and assets.</p>
      </div>

      {/* ==========================
           APP LOGO SECTION
      =========================== */}
      <section className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-200">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
          <MonitorSmartphone className="text-blue-600" />
          App Logo
        </h2>
        <p className="text-gray-600">Upload a high-resolution logo for your app (recommended: 512x512 PNG).</p>

        {logo && (
          <div className="flex justify-center">
            <img
              src={logo}
              alt="Current Logo"
              className="w-40 h-40 border-2 border-gray-200 rounded-xl object-contain shadow-md bg-white p-2"
            />
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingLogo}
            className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 ${
              uploadingLogo
                ? "bg-gray-400 cursor-not-allowed text-gray-600"
                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            }`}
          >
            {uploadingLogo ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload New Logo
              </>
            )}
          </button>
          <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={uploadLogo} />
        </div>
      </section>

      {/* ==========================
           FLASH SCREENS
      =========================== */}
      <section className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
            <Img className="text-indigo-600" />
            Flash Screens (Max 3)
          </h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {flashScreens.length}/3
          </span>
        </div>
        <p className="text-gray-600">Create engaging onboarding screens with images, headings, and descriptions.</p>

        <div className="space-y-4">
          {flashScreens.map((fs: any, index: number) => (
            <div
              key={index}
              className="p-6 border border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* IMAGE PREVIEW & UPLOAD */}
              <div className="flex items-center gap-4 mb-4">
                {fs.image && (
                  <img
                    src={fs.image}
                    alt={`Flash screen ${index + 1}`}
                    className="w-32 h-32 object-cover rounded-lg shadow-md flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e: any) => {
                      const file = e.target.files[0];
                      if (file) {
                        const updated = [...flashScreens];
                        updated[index].file = file;
                        updated[index].image = URL.createObjectURL(file);
                        setFlashScreens(updated);
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">Recommended: 1080x1920, JPG/PNG</p>
                </div>
              </div>

              {/* HEADING */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Heading</label>
                <input
                  value={fs.heading}
                  placeholder="Enter a catchy heading..."
                  onChange={(e) => {
                    const updated = [...flashScreens];
                    updated[index].heading = e.target.value;
                    setFlashScreens(updated);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* DESCRIPTION */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={fs.description}
                  placeholder="Enter a short description..."
                  rows={3}
                  onChange={(e) => {
                    const updated = [...flashScreens];
                    updated[index].description = e.target.value;
                    setFlashScreens(updated);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* REMOVE BUTTON */}
              <button
                onClick={() => removeFlashScreen(index)}
                className="text-red-600 hover:text-red-800 font-medium flex items-center gap-1 transition-colors text-sm"
              >
                <Trash2 size={16} />
                Remove Screen
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            onClick={addFlashScreen}
            disabled={flashScreens.length >= 3}
            className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 ${
              flashScreens.length >= 3
                ? "bg-gray-300 cursor-not-allowed text-gray-500"
                : "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            }`}
          >
            <Plus size={18} />
            Add New Screen
          </button>

          <button
            onClick={saveFlashScreens}
            disabled={savingFlash || flashScreens.length === 0}
            className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 ${
              savingFlash || flashScreens.length === 0
                ? "bg-gray-400 cursor-not-allowed text-gray-600"
                : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            }`}
          >
            {savingFlash ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save All Changes
              </>
            )}
          </button>
        </div>
      </section>

      {/* ==========================
           DATABASE DOWNLOAD
      =========================== */}
      <section className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
          <Download className="text-red-600" />
          Database Backup
        </h2>
        <p className="text-gray-600">Download a full JSON export of your database for backup purposes.</p>

        <button
          onClick={downloadDatabase}
          className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl flex gap-2 items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        >
          <Download size={18} />
          Download Full Database (JSON)
        </button>
        <p className="text-xs text-gray-500 mt-2">Note: This may take a moment for large datasets.</p>
      </section>

      {/* ==========================
           ADMIN LOGS
      =========================== */}
      <section className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Admin Login Logs</h2>
        <p className="text-gray-600">Recent admin login activity for security monitoring.</p>

        {logs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No login logs found</p>
            <p className="text-gray-400 text-sm mt-1">Activity will appear here as admins log in.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-200 border-b-2 border-gray-200">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-700">IP Address</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Browser</th>
                  <th className="p-3 text-left font-semibold text-gray-700">OS</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Login Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any, i: number) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors even:bg-gray-50/50"
                  >
                    <td className="p-3 font-mono text-gray-900">{log.ip}</td>
                    <td className="p-3 text-gray-700">{log.browser}</td>
                    <td className="p-3 text-gray-700">{log.os}</td>
                    <td className="p-3 text-gray-600">
                      {new Date(log.time).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
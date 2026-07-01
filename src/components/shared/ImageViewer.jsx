import React, { useState } from "react";

export default function ImageViewer({ url, label = "Image", thumbnail = false }) {
  const [open, setOpen] = useState(false);

  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-xs ${thumbnail ? "w-16 h-16" : "w-full h-36"}`}>
        No Image
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`relative overflow-hidden rounded-xl border border-slate-200 group transition-all hover:shadow-md ${thumbnail ? "w-16 h-16" : "w-full h-36"}`}
        title={`Click to zoom: ${label}`}
      >
        <img
          src={url}
          alt={label}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
          <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            🔍 Zoom
          </span>
        </div>
      </button>

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div className="relative max-w-2xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 text-white text-sm font-medium hover:text-slate-300"
            >
              ✕ Close
            </button>
            <img
              src={url}
              alt={label}
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            <p className="text-center text-white/60 text-xs mt-2">{label}</p>
          </div>
        </div>
      )}
    </>
  );
}

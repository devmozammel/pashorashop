"use client";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// Dynamic import with SSR disabled to prevent hydration errors
const ReactQuill = dynamic(
  () => import("react-quill-new").then((mod) => mod.default || mod),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[300px] bg-gray-50 animate-pulse rounded-xl flex items-center justify-center text-gray-400 font-medium">
        Loading Premium Editor...
      </div>
    ),
  }
);

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "clean"],
    [{ color: [] }, { background: [] }],
  ],
  clipboard: {
    matchVisual: false,
  },
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "link",
  "color",
  "background",
];

export default function RichTextEditor({ value, onChange, placeholder }) {
  return (
    <div className="rich-text-editor-wrapper bg-white rounded-xl overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-500 transition-all">
      <style jsx global>{`
        .rich-text-editor-wrapper .ql-toolbar {
          border: none !important;
          background: #f9fafb !important;
          border-bottom: 1px solid #e5e7eb !important;
          padding: 12px 16px !important;
        }
        .rich-text-editor-wrapper .ql-container {
          border: none !important;
          min-height: 250px !important;
          font-family: inherit !important;
          font-size: 14px !important;
        }
        .rich-text-editor-wrapper .ql-editor {
          padding: 16px !important;
          color: #374151 !important;
        }
        .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: #9ca3af !important;
          font-style: normal !important;
          left: 16px !important;
        }
        .rich-text-editor-wrapper .ql-snow .ql-stroke {
          stroke: #4b5563 !important;
        }
        .rich-text-editor-wrapper .ql-snow .ql-fill {
          fill: #4b5563 !important;
        }
        .rich-text-editor-wrapper .ql-snow.ql-toolbar button:hover .ql-stroke {
          stroke: #2563eb !important;
        }
        .rich-text-editor-wrapper .ql-snow.ql-toolbar button.ql-active .ql-stroke {
          stroke: #2563eb !important;
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}

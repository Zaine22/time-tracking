'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css'; // Import Quill styles

// Dynamically import react-quill-new to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => <div className="h-40 w-full bg-white/5 animate-pulse rounded-lg border border-white/10 flex items-center justify-center text-slate-500">Loading editor...</div>
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  // Simple modules configuration for standard text formatting
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list'
  ];

  return (
    <div className="rich-text-container">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || "Describe your work..."}
        className="text-white"
      />
      <style jsx global>{`
        .rich-text-container .ql-toolbar {
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background-color: rgba(255, 255, 255, 0.05);
        }
        .rich-text-container .ql-container {
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          min-height: 150px;
          background-color: rgba(255, 255, 255, 0.02);
          font-family: inherit;
        }
        .rich-text-container .ql-editor {
          min-height: 150px;
          font-size: 0.875rem;
        }
        .rich-text-container .ql-editor.ql-blank::before {
          color: rgba(148, 163, 184, 0.7); /* slate-400 equivalent */
          font-style: normal;
        }
        /* Toolbar icons styling for dark mode */
        .rich-text-container .ql-stroke {
          stroke: #cbd5e1; /* slate-300 */
        }
        .rich-text-container .ql-fill {
          fill: #cbd5e1;
        }
        .rich-text-container .ql-picker {
          color: #cbd5e1;
        }
        .rich-text-container .ql-picker-options {
          background-color: #1e293b; /* slate-800 */
          border-color: rgba(255, 255, 255, 0.1);
        }
        .rich-text-container .ql-active .ql-stroke {
          stroke: #3b82f6; /* primary color */
        }
        .rich-text-container .ql-active .ql-fill {
          fill: #3b82f6;
        }
        .rich-text-container .ql-picker-item:hover {
          color: #3b82f6 !important;
        }
      `}</style>
    </div>
  );
}

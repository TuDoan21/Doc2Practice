import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  Sparkles
} from 'lucide-react';
import { getDocuments } from '../services/storage';
import type { DocumentItem } from '../types';

export const DocumentsPage = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  useEffect(() => {
    setDocuments(getDocuments());
  }, []);

  const getFormatBadge = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.pdf')) {
      return (
        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
          PDF
        </span>
      );
    }
    if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
      return (
        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
          Word (.docx)
        </span>
      );
    }
    if (lower.endsWith('.pptx') || lower.endsWith('.ppt')) {
      return (
        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
          PowerPoint (.pptx)
        </span>
      );
    }
    return (
      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
        Tài liệu
      </span>
    );
  };

  const getUnitName = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.pptx') || lower.endsWith('.ppt')) {
      return 'slide';
    }
    return 'trang';
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tài liệu của tôi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý các tài liệu PDF, Word (.docx) và Slide PowerPoint (.pptx) đã tải lên.
          </p>
        </div>

        <Link
          to="/app/create-quiz"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all hover:scale-102 self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Tải tài liệu mới</span>
        </Link>
      </div>

      {/* Grid of Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                {getFormatBadge(doc.name)}
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-base leading-snug break-words">
                  {doc.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1.5">
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span>{doc.pageCount} {getUnitName(doc.name)}</span>
                  <span>•</span>
                  <span>{doc.uploadedAt}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Số bộ câu hỏi đã tạo:</span>
                  <span className="font-bold text-indigo-600">{doc.quizSetsGenerated}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Link
                to={`/app/create-quiz?doc=${encodeURIComponent(doc.name)}&size=${encodeURIComponent(doc.size)}`}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tạo câu hỏi từ tài liệu này</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

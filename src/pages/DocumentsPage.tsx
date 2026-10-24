import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  Sparkles,
  Search,
  Trash2,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { getDocuments, deleteDocument, addDocument } from '../services/storage';
import type { DocumentItem } from '../types';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';

export const DocumentsPage = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'pdf' | 'docx' | 'pptx'>('all');

  // Modals
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<DocumentItem | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Upload modal fields
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadPageCount, setUploadPageCount] = useState('20');
  const [uploadFormat, setUploadFormat] = useState<'pdf' | 'docx' | 'pptx'>('pdf');

  useEffect(() => {
    setDocuments(getDocuments());
  }, []);

  const refreshList = () => {
    setDocuments(getDocuments());
  };

  const handleDeleteConfirm = () => {
    if (!deletingDoc) return;
    deleteDocument(deletingDoc.id);
    setDeletingDoc(null);
    refreshList();
  };

  const handleCreateDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName.trim()) return;

    const ext = uploadFormat === 'pdf' ? '.pdf' : uploadFormat === 'docx' ? '.docx' : '.pptx';
    const fullName = uploadFileName.endsWith(ext) ? uploadFileName : `${uploadFileName}${ext}`;

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      name: fullName,
      size: `${(Math.random() * 4 + 1).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString().split('T')[0],
      pageCount: parseInt(uploadPageCount, 10) || 15,
      quizSetsGenerated: 0,
      status: 'ready',
    };

    addDocument(newDoc);
    setIsUploadModalOpen(false);
    setUploadFileName('');
    refreshList();
  };

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

  // Filter & Search
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const lower = doc.name.toLowerCase();
      let matchFormat = true;
      if (formatFilter === 'pdf') matchFormat = lower.endsWith('.pdf');
      if (formatFilter === 'docx') matchFormat = lower.endsWith('.docx') || lower.endsWith('.doc');
      if (formatFilter === 'pptx') matchFormat = lower.endsWith('.pptx') || lower.endsWith('.ppt');

      return matchSearch && matchFormat;
    });
  }, [documents, searchQuery, formatFilter]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tài liệu của tôi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý kho tài liệu học tập, giáo trình PDF, Word (.docx) và Slide PowerPoint (.pptx).
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-sm transition-all"
          >
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            <span>Thêm tài liệu</span>
          </button>
          <Link
            to="/app/create-quiz"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all hover:scale-102"
          >
            <Sparkles className="w-4 h-4" />
            <span>Tạo đề trắc nghiệm</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tài liệu theo tên file..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Format Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium">Định dạng:</span>
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value as any)}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Tất cả định dạng</option>
            <option value="pdf">Chỉ PDF</option>
            <option value="docx">Chỉ Word (.docx)</option>
            <option value="pptx">Chỉ PowerPoint (.pptx)</option>
          </select>
        </div>
      </div>

      {/* Grid of Documents */}
      {filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {getFormatBadge(doc.name)}
                    <button
                      type="button"
                      onClick={() => setDeletingDoc(doc)}
                      className="p-1 text-slate-300 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                      title="Xóa tài liệu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug break-words group-hover:text-indigo-600 transition-colors">
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
                    <span className="font-bold text-indigo-600">{doc.quizSetsGenerated} bộ đề</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setViewingDoc(doc)}
                  className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Chi tiết</span>
                </button>

                <Link
                  to={`/app/create-quiz?doc=${encodeURIComponent(doc.name)}&size=${encodeURIComponent(doc.size)}`}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tạo bài thi</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Không tìm thấy tài liệu phù hợp"
          description="Thử thay đổi từ khóa tìm kiếm hoặc bấm Thêm tài liệu mới để nạp vào hệ thống."
          actionText="Thêm tài liệu mới"
          onAction={() => setIsUploadModalOpen(true)}
        />
      )}

      {/* Modal Xem chi tiết tài liệu */}
      <Modal
        isOpen={Boolean(viewingDoc)}
        onClose={() => setViewingDoc(null)}
        title={viewingDoc ? `Thông tin tài liệu: ${viewingDoc.name}` : ''}
        maxWidth="md"
      >
        {viewingDoc && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-800">Tên tệp:</span>
                <span className="font-bold text-slate-900">{viewingDoc.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-800">Dung lượng tệp:</span>
                <span>{viewingDoc.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-800">Độ dài ước tính:</span>
                <span>{viewingDoc.pageCount} {getUnitName(viewingDoc.name)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-800">Ngày lưu trữ:</span>
                <span>{viewingDoc.uploadedAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-800">Trạng thái:</span>
                <span className="text-emerald-600 font-bold">Đã phân tích cấu trúc</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Tài liệu này đã sẵn sàng để AI trích xuất các ý tưởng, sinh câu hỏi trắc nghiệm hoặc tạo thẻ Flashcard bất kỳ lúc nào.
            </p>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Đóng
              </button>
              <Link
                to={`/app/create-quiz?doc=${encodeURIComponent(viewingDoc.name)}&size=${encodeURIComponent(viewingDoc.size)}`}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sinh câu hỏi từ tệp này</span>
              </Link>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Thêm tài liệu mới */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Thêm tài liệu vào kho học tập"
        maxWidth="md"
      >
        <form onSubmit={handleCreateDocumentSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Tên tài liệu
            </label>
            <input
              type="text"
              required
              value={uploadFileName}
              onChange={(e) => setUploadFileName(e.target.value)}
              placeholder="VD: Giao_trinh_Co_so_Du_lieu_2026"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Định dạng tệp
              </label>
              <select
                value={uploadFormat}
                onChange={(e) => setUploadFormat(e.target.value as any)}
                className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="pdf">Tài liệu PDF (.pdf)</option>
                <option value="docx">Văn bản Word (.docx)</option>
                <option value="pptx">Slide PowerPoint (.pptx)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Số trang / slide
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={uploadPageCount}
                onChange={(e) => setUploadPageCount(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
            >
              Lưu tài liệu
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Xác nhận Xóa tài liệu */}
      <Modal
        isOpen={Boolean(deletingDoc)}
        onClose={() => setDeletingDoc(null)}
        title="Xác nhận xóa tài liệu"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Xóa tài liệu khỏi hệ thống?</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tệp <span className="font-semibold text-slate-800">{deletingDoc?.name}</span> sẽ bị xóa khỏi danh sách. Các bộ câu hỏi đã tạo từ tệp này vẫn sẽ được giữ lại an toàn.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDeletingDoc(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
            >
              Xóa tài liệu
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  Search,
  Trash2,
  Eye,
  Download,
  Share2,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  FolderOpen,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { getCurrentUser, type UserProfile } from '../services/auth';
import {
  getMaterials,
  uploadMaterial,
  updateMaterial,
  deleteMaterial,
  shareMaterialWithClasses,
  getAuthorizedDownload,
  ALLOWED_EXTENSIONS,
  formatFileSize,
  type MaterialFilter,
} from '../services/materialService';
import { getSubjects } from '../services/subjectService';
import { getClassrooms } from '../services/classService';
import type { LearningMaterial, MaterialFileType, MaterialStatus, Subject, Classroom } from '../types';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';

export const DocumentsPage = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(getCurrentUser());
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedFileType, setSelectedFileType] = useState<MaterialFileType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<MaterialStatus | 'all'>('all');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<LearningMaterial | null>(null);
  const [sharingMaterial, setSharingMaterial] = useState<LearningMaterial | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<LearningMaterial | null>(null);

  // Upload Form Fields
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadSubjectId, setUploadSubjectId] = useState('');
  const [uploadTopic, setUploadTopic] = useState('');
  const [uploadStatus, setUploadStatus] = useState<MaterialStatus>('published');
  const [uploadSharedClasses, setUploadSharedClasses] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Share Modal Selected Classes
  const [shareClassIds, setShareClassIds] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleAuth = () => setCurrentUser(getCurrentUser());
    window.addEventListener('auth_state_changed', handleAuth);
    return () => window.removeEventListener('auth_state_changed', handleAuth);
  }, []);

  const refreshData = () => {
    setLoading(true);
    const filter: MaterialFilter = {
      subjectId: selectedSubject,
      classId: selectedClass,
      fileType: selectedFileType,
      status: selectedStatus,
      search: searchQuery,
    };
    const res = getMaterials(filter);
    if (res.success) {
      setMaterials(res.data);
    }

    const subList = getSubjects();
    setSubjects(subList.filter((s) => s.status === 'active'));

    const clsRes = getClassrooms();
    setClasses(clsRes);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, [selectedSubject, selectedClass, selectedFileType, selectedStatus, searchQuery]);

  // Flash success message
  const showSuccess = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  // Filter available classes for teacher upload
  const assignableClasses = useMemo(() => {
    if (currentUser.role === 'teacher') {
      return classes.filter(
        (c) => c.teacherId === currentUser.id || c.secondaryTeacherIds?.includes(currentUser.id)
      );
    }
    return classes;
  }, [classes, currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadError(null);
      if (!uploadTitle.trim()) {
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setUploadTitle(baseName.replace(/[_-]/g, ' '));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!selectedFile) {
      setUploadError('Vui lòng chọn một tệp tài liệu để tải lên.');
      return;
    }

    if (!uploadTitle.trim()) {
      setUploadError('Tiêu đề tài liệu không được để trống.');
      return;
    }

    setIsSubmitting(true);

    const selectedSubjectObj = subjects.find((s) => s.id === uploadSubjectId);

    const res = uploadMaterial({
      title: uploadTitle,
      description: uploadDescription,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      contentType: selectedFile.type,
      subjectId: uploadSubjectId || undefined,
      subjectName: selectedSubjectObj ? selectedSubjectObj.name : undefined,
      topic: uploadTopic,
      status: uploadStatus,
      sharedClassIds: uploadSharedClasses,
      schoolId: currentUser.schoolId,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setUploadError(res.error.message);
      return;
    }

    setIsUploadModalOpen(false);
    resetUploadForm();
    refreshData();
    showSuccess(`Đã tải lên tài liệu "${res.data.title}" thành công.`);
  };

  const resetUploadForm = () => {
    setUploadTitle('');
    setUploadDescription('');
    setUploadSubjectId('');
    setUploadTopic('');
    setUploadStatus('published');
    setUploadSharedClasses([]);
    setSelectedFile(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = (material: LearningMaterial) => {
    const res = getAuthorizedDownload(material.id);
    if (!res.success) {
      alert(`Không thể tải tệp: ${res.error.message}`);
      return;
    }

    // Tạo blob tải xuống
    const blob = new Blob([res.data.content], { type: res.data.contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res.data.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess(`Đang tải xuống "${res.data.fileName}"...`);
    refreshData();
  };

  const handleSaveShareClasses = () => {
    if (!sharingMaterial) return;
    const res = shareMaterialWithClasses(sharingMaterial.id, shareClassIds);
    if (!res.success) {
      alert(`Lỗi chia sẻ: ${res.error.message}`);
      return;
    }
    setSharingMaterial(null);
    refreshData();
    showSuccess('Đã cập nhật danh sách lớp được chia sẻ tài liệu.');
  };

  const handleDeleteConfirm = () => {
    if (!deletingMaterial) return;
    const res = deleteMaterial(deletingMaterial.id);
    if (!res.success) {
      alert(`Lỗi: ${res.error.message}`);
      return;
    }
    setDeletingMaterial(null);
    refreshData();
    showSuccess('Đã xóa tài liệu khỏi hệ thống.');
  };

  const handleToggleArchive = (mat: LearningMaterial) => {
    const nextStatus = mat.status === 'archived' ? 'published' : 'archived';
    const res = updateMaterial(mat.id, { status: nextStatus });
    if (!res.success) {
      alert(`Lỗi: ${res.error.message}`);
      return;
    }
    refreshData();
    showSuccess(`Đã chuyển trạng thái sang "${nextStatus === 'archived' ? 'Lưu trữ' : 'Công bố'}".`);
  };

  const getFormatBadge = (type: MaterialFileType) => {
    switch (type) {
      case 'pdf':
        return (
          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            PDF
          </span>
        );
      case 'docx':
        return (
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Word (.docx)
          </span>
        );
      case 'pptx':
        return (
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            PowerPoint (.pptx)
          </span>
        );
      case 'txt':
        return (
          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            Text (.txt)
          </span>
        );
      case 'image':
        return (
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Hình ảnh
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            Tài liệu
          </span>
        );
    }
  };

  const getStatusBadge = (status: MaterialStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Công bố
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            <AlertCircle className="w-3 h-3" /> Bản nháp
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300">
            Lưu trữ
          </span>
        );
    }
  };

  const isTeacherOrAdmin = currentUser.role !== 'student';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FolderOpen className="w-7 h-7 text-indigo-600" />
            {currentUser.role === 'student' ? 'Tài liệu học tập của tôi' : 'Quản lý Tài liệu học tập'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {currentUser.role === 'student'
              ? 'Tài liệu, bài giảng và đề cương ôn tập được giáo viên chia sẻ cho lớp của bạn.'
              : 'Kho học liệu số phân phối tài liệu, đề cương bài giảng và bài tập theo lớp học.'}
          </p>
        </div>

        {isTeacherOrAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/app/ai-generate"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Tạo câu hỏi AI
            </Link>
            <button
              onClick={() => {
                resetUploadForm();
                setIsUploadModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-xs shadow-sm transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              Tải tài liệu mới
            </button>
          </div>
        )}
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm font-medium animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu theo tiêu đề, chuyên đề hoặc tên file..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả môn học</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả lớp học</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>

            {/* File Type Filter */}
            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tất cả định dạng</option>
              <option value="pdf">PDF (.pdf)</option>
              <option value="docx">Word (.docx)</option>
              <option value="pptx">PowerPoint (.pptx)</option>
              <option value="txt">Text (.txt)</option>
              <option value="image">Hình ảnh</option>
            </select>

            {/* Status Filter (for teachers/admins) */}
            {isTeacherOrAdmin && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Mọi trạng thái</option>
                <option value="published">Công bố</option>
                <option value="draft">Bản nháp</option>
                <option value="archived">Lưu trữ</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Materials List */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Đang tải danh sách tài liệu...</div>
      ) : materials.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Chưa có tài liệu nào"
          description={
            currentUser.role === 'student'
              ? 'Hiện chưa có tài liệu nào được giáo viên chia sẻ cho lớp học của bạn.'
              : 'Hãy tải lên tài liệu học tập đầu tiên để chia sẻ với học sinh của bạn.'
          }
          actionText={isTeacherOrAdmin ? 'Tải tài liệu ngay' : undefined}
          onAction={isTeacherOrAdmin ? () => setIsUploadModalOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((mat) => {
            const isOwner = mat.uploadedBy === currentUser.id;
            const canManage = isOwner || currentUser.role === 'school_admin' || currentUser.role === 'system_admin';

            return (
              <div
                key={mat.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {getFormatBadge(mat.fileType)}
                      {getStatusBadge(mat.status)}
                    </div>
                  </div>

                  <h3
                    className="font-bold text-slate-900 text-base leading-snug line-clamp-2 hover:text-indigo-600 cursor-pointer"
                    onClick={() => setViewingMaterial(mat)}
                  >
                    {mat.title}
                  </h3>

                  {mat.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {mat.description}
                    </p>
                  )}

                  <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    {mat.subjectName && (
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-700">{mat.subjectName}</span>
                        {mat.topic && <span className="text-slate-400">• {mat.topic}</span>}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {mat.createdAt.split('T')[0]}
                      </span>
                      <span className="font-medium text-slate-700">{mat.fileSizeFormatted}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Người đăng: <strong className="text-slate-700">{mat.uploadedByName}</strong></span>
                      <span className="text-indigo-600 font-medium">{mat.downloadCount || 0} lượt tải</span>
                    </div>

                    {/* Shared classes tags */}
                    <div className="flex items-center gap-1 pt-1 flex-wrap">
                      <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="text-[11px] text-slate-500">
                        Lớp: {mat.sharedClassIds && mat.sharedClassIds.length > 0 ? (
                          mat.sharedClassIds.map((cid) => {
                            const cls = classes.find((c) => c.id === cid);
                            return (
                              <span
                                key={cid}
                                className="inline-block bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px] font-semibold mr-1"
                              >
                                {cls ? cls.name : cid}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-slate-400 italic">Chưa chia sẻ</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewingMaterial(mat)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {canManage && (
                      <>
                        <Link
                          to={`/app/ai-generate?materialId=${mat.id}`}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Tạo câu hỏi AI từ tài liệu này"
                        >
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                        </Link>
                        <button
                          onClick={() => {
                            setSharingMaterial(mat);
                            setShareClassIds(mat.sharedClassIds || []);
                          }}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Chia sẻ với các lớp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleArchive(mat)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title={mat.status === 'archived' ? 'Mở lại công bố' : 'Lưu trữ tài liệu'}
                        >
                          <Filter className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingMaterial(mat)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa tài liệu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handleDownload(mat)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Tải về
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Material Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Tải lên tài liệu học tập"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* File Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Chọn tệp đính kèm <span className="text-rose-500">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-indigo-50/20"
            >
              <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-800">
                {selectedFile ? selectedFile.name : 'Nhấp để chọn tệp từ máy tính'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {selectedFile
                  ? `Dung lượng: ${formatFileSize(selectedFile.size)}`
                  : `Hỗ trợ: ${ALLOWED_EXTENSIONS.join(', ')} (Tối đa 25 MB)`}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept={ALLOWED_EXTENSIONS.join(',')}
              className="hidden"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tiêu đề tài liệu <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Chuyên đề 01: Khảo sát hàm số & Ứng dụng..."
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mô tả tóm tắt nội dung
            </label>
            <textarea
              rows={2}
              placeholder="Tóm tắt lý thuyết trọng tâm, bài tập có giải chi tiết..."
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
            />
          </div>

          {/* Subject & Topic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Môn học liên quan</label>
              <select
                value={uploadSubjectId}
                onChange={(e) => setUploadSubjectId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Chọn môn học --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Chuyên đề / Bài học</label>
              <input
                type="text"
                placeholder="VD: Chương 1 - Giải tích"
                value={uploadTopic}
                onChange={(e) => setUploadTopic(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Trạng thái phát hành</label>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={uploadStatus === 'published'}
                  onChange={() => setUploadStatus('published')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                Công bố ngay cho học sinh
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={uploadStatus === 'draft'}
                  onChange={() => setUploadStatus('draft')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                Lưu bản nháp (chưa xem được)
              </label>
            </div>
          </div>

          {/* Share with classes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Chia sẻ cho lớp học phụ trách
            </label>
            {assignableClasses.length === 0 ? (
              <div className="text-xs text-slate-500 italic">Bạn chưa phụ trách lớp học nào.</div>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                {assignableClasses.map((cls) => {
                  const checked = uploadSharedClasses.includes(cls.id);
                  return (
                    <label
                      key={cls.id}
                      className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer hover:bg-white p-1 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          if (checked) {
                            setUploadSharedClasses(uploadSharedClasses.filter((id) => id !== cls.id));
                          } else {
                            setUploadSharedClasses([...uploadSharedClasses, cls.id]);
                          }
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>
                        <strong>{cls.name}</strong> ({cls.code}) - {cls.studentCount || 0} học sinh
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu tài liệu'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={Boolean(sharingMaterial)}
        onClose={() => setSharingMaterial(null)}
        title={`Chia sẻ tài liệu: ${sharingMaterial?.title}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Chọn các lớp học được phép xem và tải tài liệu này. Học sinh thuộc các lớp được chọn sẽ thấy tài liệu trong danh sách của mình.
          </p>

          <div className="max-h-60 overflow-y-auto space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            {assignableClasses.map((cls) => {
              const checked = shareClassIds.includes(cls.id);
              return (
                <label
                  key={cls.id}
                  className="flex items-center gap-3 p-2 bg-white border border-slate-100 rounded-lg cursor-pointer hover:border-indigo-200 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (checked) {
                        setShareClassIds(shareClassIds.filter((id) => id !== cls.id));
                      } else {
                        setShareClassIds([...shareClassIds, cls.id]);
                      }
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">{cls.name}</div>
                    <div className="text-[11px] text-slate-500">Mã: {cls.code} • Sĩ số: {cls.studentCount || 0}</div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setSharingMaterial(null)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveShareClasses}
              className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
            >
              Lưu phân quyền lớp
            </button>
          </div>
        </div>
      </Modal>

      {/* Preview Detail Modal */}
      <Modal
        isOpen={Boolean(viewingMaterial)}
        onClose={() => setViewingMaterial(null)}
        title="Thông tin chi tiết tài liệu"
      >
        {viewingMaterial && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {getFormatBadge(viewingMaterial.fileType)}
                {getStatusBadge(viewingMaterial.status)}
              </div>
              <span className="text-xs text-slate-500">{viewingMaterial.fileSizeFormatted}</span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">{viewingMaterial.title}</h2>
              {viewingMaterial.description && (
                <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {viewingMaterial.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Tên tệp gốc</span>
                <span className="font-semibold text-slate-800 break-all">{viewingMaterial.originalFileName}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Môn học</span>
                <span className="font-semibold text-slate-800">{viewingMaterial.subjectName || 'Chung'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Chuyên đề</span>
                <span className="font-semibold text-slate-800">{viewingMaterial.topic || 'Không có'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Người đăng</span>
                <span className="font-semibold text-slate-800">{viewingMaterial.uploadedByName}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setViewingMaterial(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                onClick={() => handleDownload(viewingMaterial)}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Tải về máy ({viewingMaterial.fileSizeFormatted})
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingMaterial)}
        onClose={() => setDeletingMaterial(null)}
        title="Xác nhận xóa tài liệu"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Bạn có chắc chắn muốn xóa tài liệu <strong>"{deletingMaterial?.title}"</strong>? Học sinh sẽ không thể tiếp tục truy cập tài liệu này. Thao tác này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeletingMaterial(null)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
            >
              Xác nhận xóa
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Award,
  ArrowLeft,
  FileText,
  AlertCircle,
  Check,
  MessageSquare,
  Lock
} from 'lucide-react';
import { getCurrentUser, type UserProfile } from '../services/auth';
import {
  getStudentAttemptResult,
  getAllAttemptsRaw,
} from '../services/assessmentService';
import type { AssessmentAttempt } from '../types';

export const AssessmentResultPage = () => {
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [currentUser] = useState<UserProfile>(getCurrentUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [resultData, setResultData] = useState<{
    attempt: AssessmentAttempt;
    assessmentTitle: string;
    maxScore: number;
    canViewAnswersAndExplanations: boolean;
    questionDetails?: any[];
  } | null>(null);

  useEffect(() => {
    if (!routeId) return;

    // Check if routeId is an attemptId or an assessmentId
    let targetAttemptId = routeId;
    if (routeId.startsWith('asm-')) {
      // Find latest attempt for this assessment
      const allAttempts = getAllAttemptsRaw();
      const userAttempt = allAttempts.find(
        (a) => a.assessmentId === routeId && a.studentId === currentUser.id
      );
      if (userAttempt) {
        targetAttemptId = userAttempt.id;
      }
    }

    const res = getStudentAttemptResult(targetAttemptId);
    setLoading(false);

    if (!res.success) {
      setError(res.error.message);
      return;
    }

    setResultData(res.data);
  }, [routeId, currentUser]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 text-sm">
        Đang tải kết quả bài kiểm tra...
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white border border-rose-200 rounded-3xl shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Không thể xem kết quả</h2>
        <p className="text-xs text-slate-600">{error || 'Chưa tìm thấy kết quả bài làm của bạn.'}</p>
        <button
          onClick={() => navigate('/app/classes')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
        >
          Quay lại lớp học
        </button>
      </div>
    );
  }

  const { attempt, assessmentTitle, maxScore, canViewAnswersAndExplanations, questionDetails } = resultData;
  const percentage = maxScore > 0 ? Math.round((attempt.score / maxScore) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(`/app/classes?classId=${attempt.classId}`)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại lớp học</span>
        </button>
      </div>

      {/* Hero Score Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-950 text-white rounded-3xl p-8 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold backdrop-blur-xs">
            <Award className="w-3.5 h-3.5" />
            <span>KẾT QUẢ BÀI LÀM TRỰC TUYẾN</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">{assessmentTitle}</h1>
          <p className="text-xs text-indigo-200">
            Lớp: <strong>{attempt.className}</strong> • Thí sinh: <strong>{attempt.studentName}</strong> • Nộp lúc: {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString('vi-VN') : 'Đang xử lý'}
          </p>
          {attempt.needsManualGrading && (
            <div className="text-xs text-amber-300 font-semibold bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-400/30 inline-block">
              ⏳ Điểm trắc nghiệm đã được ghi nhận. Câu hỏi tự luận đang chờ giáo viên chấm điểm.
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center p-6 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-xs shrink-0 z-10 min-w-44 text-center">
          <div className="text-xs text-indigo-200 font-bold uppercase tracking-wider mb-1">Tổng điểm đạt được</div>
          <div className="text-4xl font-black text-white">
            {attempt.score} <span className="text-lg text-indigo-300 font-semibold">/ {maxScore}</span>
          </div>
          <div className="mt-2 text-xs font-bold text-indigo-200 bg-white/15 px-2.5 py-0.5 rounded-full">
            Đạt {percentage}%
          </div>
        </div>
      </div>

      {/* Policy Notice if explanations are locked */}
      {!canViewAnswersAndExplanations && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 text-xs leading-relaxed">
          <Lock className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>Chính sách bảo mật:</strong> Theo cấu hình của giáo viên, đáp án chuẩn và lời giải chi tiết sẽ chỉ được hiển thị sau khi toàn bộ bài thi của lớp kết thúc.
          </span>
        </div>
      )}

      {/* Question Details List */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          Chi tiết từng câu hỏi & Bài làm
        </h2>

        {questionDetails?.map((q, idx) => {
          const studentAns = q.studentAnswer;
          const isFullPoint = studentAns.earnedPoints === q.points && q.points > 0;
          const isPartialPoint = studentAns.earnedPoints > 0 && studentAns.earnedPoints < q.points;

          return (
            <div
              key={q.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-sm">CÂU {idx + 1}</span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500">
                    {q.type === 'single_choice' && 'Trắc nghiệm đơn'}
                    {q.type === 'multiple_choice' && 'Nhiều đáp án'}
                    {q.type === 'true_false' && 'Đúng / Sai'}
                    {q.type === 'essay' && 'Tự luận'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {studentAns.gradingStatus === 'pending' ? (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Chờ giáo viên chấm ({q.points}đ)
                    </span>
                  ) : (
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        isFullPoint
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : isPartialPoint
                          ? 'text-amber-700 bg-amber-50 border-amber-200'
                          : 'text-rose-700 bg-rose-50 border-rose-200'
                      }`}
                    >
                      {studentAns.earnedPoints} / {q.points} điểm
                    </span>
                  )}
                </div>
              </div>

              {/* Question text */}
              <p className="text-sm font-bold text-slate-900 leading-relaxed whitespace-pre-wrap">
                {q.content}
              </p>

              {/* Single / Multiple / True-False choices */}
              {q.options && q.type !== 'essay' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt: string, optIdx: number) => {
                    const isSelected =
                      q.type === 'multiple_choice'
                        ? studentAns.selectedAnswers?.includes(optIdx)
                        : studentAns.selectedAnswer === optIdx;

                    const isCorrectAnswer =
                      canViewAnswersAndExplanations &&
                      (q.type === 'multiple_choice'
                        ? q.correctAnswers?.includes(optIdx)
                        : q.correctAnswer === optIdx);

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                          isCorrectAnswer
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                            : isSelected
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                              isCorrectAnswer
                                ? 'bg-emerald-600 text-white'
                                : isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>

                        {isSelected && !isCorrectAnswer && (
                          <span className="text-indigo-600 font-bold text-[10px]">Lựa chọn của bạn</span>
                        )}
                        {isCorrectAnswer && (
                          <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Đáp án đúng
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Essay answer presentation */}
              {q.type === 'essay' && (
                <div className="space-y-3 pt-1 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">
                      Bài làm của bạn:
                    </span>
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {studentAns.essayAnswer || <em className="text-slate-400">Không có câu trả lời</em>}
                    </p>
                  </div>

                  {studentAns.teacherFeedback && (
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-950">
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <MessageSquare className="w-4 h-4 text-indigo-600" />
                        <span>Nhận xét của giáo viên:</span>
                      </div>
                      <p className="leading-relaxed">{studentAns.teacherFeedback}</p>
                    </div>
                  )}

                  {canViewAnswersAndExplanations && q.sampleAnswer && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
                      <span className="font-bold block mb-1">Đáp án mẫu / Gợi ý chấm:</span>
                      <p className="whitespace-pre-wrap">{q.sampleAnswer}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation */}
              {canViewAnswersAndExplanations && q.explanation && (
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-950">
                  <strong>Lời giải thích chi tiết: </strong>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

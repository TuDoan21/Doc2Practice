import { BookOpen, Heart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Doc<span className="text-indigo-400">2</span>Practice
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Từ tài liệu đến thành thạo. Nền tảng ôn luyện thông minh biến mọi tài liệu PDF thành bài trắc nghiệm và flashcard tương tác.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>MVP Preview Release</span>
            </div>
          </div>

          {/* Nav Links 1 */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Ứng dụng</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/app/dashboard" className="hover:text-white transition-colors">
                  Bảng tổng quan
                </Link>
              </li>
              <li>
                <Link to="/app/create-quiz" className="hover:text-white transition-colors">
                  Tạo bộ câu hỏi mới
                </Link>
              </li>
              <li>
                <Link to="/app/quiz-sets" className="hover:text-white transition-colors">
                  Kho bộ câu hỏi
                </Link>
              </li>
              <li>
                <Link to="/app/flashcards" className="hover:text-white transition-colors">
                  Thẻ Flashcard
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav Links 2 */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Lộ trình tương lai</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span>Google Gemini API</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">Sắp ra mắt</span>
              </li>
              <li className="flex items-center gap-2">
                <span>Supabase Backend & Auth</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">Sắp ra mắt</span>
              </li>
              <li>Xuất file PDF & Anki</li>
              <li>Chế độ thi tính giờ theo nhóm</li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Dự án</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Xây dựng cho sinh viên, học sinh và cộng đồng người tự học suốt đời. Thiết kế tối giản, trực quan và tối ưu cho việc ghi nhớ sâu.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/TuDoan21/Doc2Practice"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                aria-label="GitHub Repository"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Doc2Practice. Mọi quyền được bảo lưu.</p>
          <p className="flex items-center gap-1">
            Thiết kế với <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> cho sinh viên Việt Nam.
          </p>
        </div>
      </div>
    </footer>
  );
};


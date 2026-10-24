import { useState, useEffect } from 'react';
import {
  RotateCw,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  Play,
  Pause,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  Search
} from 'lucide-react';
import {
  getFlashcardDecks,
  updateCardStatus,
  addCardToDeck,
  deleteCardFromDeck,
  resetDeckProgress
} from '../services/storage';
import type { FlashcardDeck, Flashcard } from '../types';
import { Modal } from '../components/common/Modal';

export const FlashcardPage = () => {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string>('');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Auto-play state
  const [isAutoPlay, setIsAutoPlay] = useState(false);

  // Add Card Modal
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newExample, setNewExample] = useState('');

  // Table search
  const [searchWord, setSearchWord] = useState('');

  const refreshDecks = () => {
    const loaded = getFlashcardDecks();
    setDecks(loaded);
    if (loaded.length > 0 && !activeDeckId) {
      setActiveDeckId(loaded[0].id);
    }
  };

  useEffect(() => {
    refreshDecks();
  }, []);

  const currentDeck = decks.find((d) => d.id === activeDeckId) || decks[0];
  const cards = currentDeck?.cards || [];
  const currentCard: Flashcard | undefined = cards[currentCardIndex];

  // Auto-play timer
  useEffect(() => {
    let timer: any;
    if (isAutoPlay && cards.length > 0) {
      timer = setInterval(() => {
        setIsFlipped((f) => {
          if (!f) return true; // Lật mặt sau
          // Chuyển thẻ tiếp theo
          setCurrentCardIndex((prev) => (prev < cards.length - 1 ? prev + 1 : 0));
          return false; // Trả về mặt trước
        });
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isAutoPlay, cards.length]);

  // Count statuses
  const masteredCount = cards.filter((c) => c.status === 'mastered').length;
  const learningCount = cards.filter((c) => c.status === 'learning').length;
  const newCount = cards.filter((c) => c.status === 'new').length;
  const progressPercent = cards.length ? Math.round((masteredCount / cards.length) * 100) : 0;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      setCurrentCardIndex(0);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
    } else {
      setCurrentCardIndex(cards.length - 1);
    }
  };

  const handleMarkStatus = (status: 'mastered' | 'learning') => {
    if (!currentCard || !currentDeck) return;
    updateCardStatus(currentDeck.id, currentCard.id, status);
    refreshDecks();
    handleNext();
  };

  // Xáo trộn thẻ
  const handleShuffle = () => {
    if (!currentDeck) return;
    currentDeck.cards = [...currentDeck.cards].sort(() => Math.random() - 0.5);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  // Đặt lại tiến độ nhớ
  const handleReset = () => {
    if (!currentDeck) return;
    if (window.confirm('Đặt lại tất cả các thẻ trong bộ này về trạng thái "Chưa học"?')) {
      resetDeckProgress(currentDeck.id);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      refreshDecks();
    }
  };

  // Thêm thẻ mới
  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim() || !currentDeck) return;

    addCardToDeck(currentDeck.id, {
      front: newFront.trim(),
      back: newBack.trim(),
      example: newExample.trim() || undefined,
    });

    setNewFront('');
    setNewBack('');
    setNewExample('');
    setIsAddCardOpen(false);
    refreshDecks();
  };

  // Xóa thẻ
  const handleDeleteCard = (cardId: string) => {
    if (!currentDeck) return;
    deleteCardFromDeck(currentDeck.id, cardId);
    if (currentCardIndex >= cards.length - 1) {
      setCurrentCardIndex(Math.max(0, cards.length - 2));
    }
    refreshDecks();
  };

  // Phím tắt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAddCardOpen) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cards.length, currentCardIndex, isAddCardOpen]);

  if (!currentDeck || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <p className="text-slate-500">Chưa có thẻ Flashcard nào trong hệ thống.</p>
        <button
          type="button"
          onClick={() => setIsAddCardOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Thêm thẻ đầu tiên
        </button>
      </div>
    );
  }

  // Danh sách thẻ lọc
  const filteredCardsList = cards.filter(
    (c) =>
      c.front.toLowerCase().includes(searchWord.toLowerCase()) ||
      c.back.toLowerCase().includes(searchWord.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Flashcard ghi nhớ
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ứng dụng phương pháp lặp lại ngắt quãng (Spaced Repetition) để ghi nhớ sâu.
          </p>
        </div>

        {/* Deck Selector & Add button */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <select
            value={activeDeckId}
            onChange={(e) => {
              setActiveDeckId(e.target.value);
              setCurrentCardIndex(0);
              setIsFlipped(false);
              setIsAutoPlay(false);
            }}
            className="py-2.5 px-3.5 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.title} ({deck.cards.length} thẻ)
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsAddCardOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm thẻ</span>
          </button>
        </div>
      </div>

      {/* Progress & Deck Status Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-4">
            <span className="font-bold text-slate-800 text-sm">
              Thẻ {currentCardIndex + 1} / {cards.length}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 truncate max-w-xs">{currentDeck.sourceDocumentName}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Đã thành thạo: {masteredCount} ({progressPercent}%)
            </span>
            <span className="text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              Đang ôn: {learningCount + newCount}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="h-full bg-amber-400 transition-all duration-300"
            style={{ width: `${(learningCount / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div className="perspective-1000 w-full min-h-[360px] sm:min-h-[380px]">
        <div
          onClick={handleFlip}
          className={`relative w-full h-full min-h-[360px] sm:min-h-[380px] cursor-pointer rounded-3xl transition-transform duration-500 transform-style-preserve-3d shadow-lg hover:shadow-xl ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front Face (Mặt trước - Khái niệm / Câu hỏi) */}
          <div className="absolute inset-0 w-full h-full backface-hidden bg-white border-2 border-indigo-100 rounded-3xl p-8 sm:p-10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Mặt trước: Khái niệm / Thuật ngữ</span>
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Nhấn để xem lời giải (hoặc Space)</span>
              </span>
            </div>

            <div className="my-auto text-center py-6 px-4">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                {currentCard?.front}
              </h2>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Trạng thái: {currentCard?.status === 'mastered' ? '✅ Đã nhớ' : '⏳ Cần ôn'}</span>
              <span>Nhấn vào thẻ để lật</span>
            </div>
          </div>

          {/* Back Face (Mặt sau - Lời giải) */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 border-2 border-indigo-700 rounded-3xl p-8 sm:p-10 flex flex-col justify-between text-white shadow-2xl">
            <div className="flex items-center justify-between text-xs">
              <span className="px-3 py-1 rounded-full bg-indigo-800 text-indigo-200 font-bold border border-indigo-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mặt sau: Định nghĩa & Giải thích</span>
              </span>
              <span className="text-indigo-300 flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Nhấn để quay lại</span>
              </span>
            </div>

            <div className="my-auto py-4 space-y-4 px-2">
              <p className="text-base sm:text-lg font-medium text-indigo-50 leading-relaxed text-center whitespace-pre-line">
                {currentCard?.back}
              </p>

              {currentCard?.example && (
                <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 text-xs text-indigo-200">
                  <span className="font-bold text-amber-300">Ví dụ thực tế: </span>
                  <span>{currentCard.example}</span>
                </div>
              )}
            </div>

            <div className="text-center text-xs text-indigo-300">
              Hãy đánh giá mức độ ghi nhớ của bạn phía dưới
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        {/* Navigation & utility buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="p-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            title="Thẻ trước (←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleShuffle}
            className="p-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            title="Xáo trộn ngẫu nhiên"
          >
            <Shuffle className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`p-3 rounded-xl border shadow-sm transition-colors ${
              isAutoPlay ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title={isAutoPlay ? 'Tạm dừng tự động' : 'Tự động chạy thẻ'}
          >
            {isAutoPlay ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            title="Đặt lại tiến độ học"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="p-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            title="Thẻ sau (→)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Evaluation Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleMarkStatus('learning')}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-sm shadow-sm transition-all hover:scale-102"
          >
            <X className="w-4 h-4 text-amber-600" />
            <span>Chưa nhớ</span>
          </button>

          <button
            type="button"
            onClick={() => handleMarkStatus('mastered')}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 transition-all hover:scale-102"
          >
            <Check className="w-4 h-4" />
            <span>Đã nhớ</span>
          </button>
        </div>
      </div>

      {/* Tất cả thẻ trong bộ (Quick list view) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">Danh sách tất cả các thẻ trong bộ</h3>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
              {cards.length} thẻ
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
              placeholder="Tìm kiếm từ khóa..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {filteredCardsList.map((c, idx) => (
            <div key={c.id} className="py-3 flex items-start justify-between gap-4 group">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                  <span className="text-xs font-bold text-slate-800">{c.front}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      c.status === 'mastered'
                        ? 'bg-emerald-50 text-emerald-700'
                        : c.status === 'learning'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {c.status === 'mastered' ? 'Đã nhớ' : c.status === 'learning' ? 'Đang học' : 'Mới'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{c.back}</p>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteCard(c.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all shrink-0"
                title="Xóa thẻ này"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Thêm thẻ Flashcard */}
      <Modal
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        title="Thêm thẻ Flashcard mới"
        maxWidth="md"
      >
        <form onSubmit={handleAddCardSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Mặt trước (Khái niệm / Câu hỏi)
            </label>
            <input
              type="text"
              required
              value={newFront}
              onChange={(e) => setNewFront(e.target.value)}
              placeholder="VD: Paging trong hệ điều hành"
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Mặt sau (Định nghĩa / Lời giải)
            </label>
            <textarea
              required
              rows={3}
              value={newBack}
              onChange={(e) => setNewBack(e.target.value)}
              placeholder="VD: Cơ chế quản lý bộ nhớ chia bộ nhớ vật lý thành các khung trang cố định..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Ví dụ thực tế (Tùy chọn)
            </label>
            <input
              type="text"
              value={newExample}
              onChange={(e) => setNewExample(e.target.value)}
              placeholder="VD: Kích thước trang chuẩn thường là 4KB"
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddCardOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
            >
              Thêm thẻ
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

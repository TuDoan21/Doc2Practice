import { useState, useEffect } from 'react';
import {
  RotateCw,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { getFlashcardDecks, updateCardStatus } from '../services/storage';
import type { FlashcardDeck, Flashcard } from '../types';

export const FlashcardPage = () => {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string>('');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const loaded = getFlashcardDecks();
    setDecks(loaded);
    if (loaded.length > 0 && !activeDeckId) {
      setActiveDeckId(loaded[0].id);
    }
  }, []);

  const currentDeck = decks.find((d) => d.id === activeDeckId) || decks[0];

  const cards = currentDeck?.cards || [];
  const currentCard: Flashcard | undefined = cards[currentCardIndex];

  // Count statuses
  const masteredCount = cards.filter((c) => c.status === 'mastered').length;
  const learningCount = cards.filter((c) => c.status === 'learning').length;
  const newCount = cards.filter((c) => c.status === 'new').length;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      setCurrentCardIndex(0); // Vòng lặp
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

    // Refresh state
    setDecks(getFlashcardDecks());
    handleNext();
  };

  const handleRestartDeck = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  // Keyboard shortcut listener: Space -> Flip, Left/Right -> Nav
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [cards.length, currentCardIndex]);

  if (!currentDeck || cards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center text-slate-500">Đang tải bộ Flashcard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Flashcard ghi nhớ
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Luyện tập truy hồi chủ động (Active Recall) để khắc sâu kiến thức.
          </p>
        </div>

        {/* Deck Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Chọn bộ thẻ:</span>
          <select
            value={activeDeckId}
            onChange={(e) => {
              setActiveDeckId(e.target.value);
              setCurrentCardIndex(0);
              setIsFlipped(false);
            }}
            className="py-2 px-3 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.title} ({deck.cards.length} thẻ)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress & Deck Status Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="font-bold text-slate-700">
              Thẻ {currentCardIndex + 1} / {cards.length}
            </span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-500 hidden sm:inline">Nguồn: {currentDeck.sourceDocumentName}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Đã nhớ: {masteredCount}
            </span>
            <span className="text-amber-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Cần ôn: {learningCount + newCount}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(masteredCount / cards.length) * 100}%` }}
          />
          <div
            className="h-full bg-amber-400 transition-all duration-300"
            style={{ width: `${(learningCount / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div className="perspective-1000 w-full min-h-[360px] sm:min-h-[400px]">
        <div
          onClick={handleFlip}
          className={`relative w-full h-full min-h-[360px] sm:min-h-[400px] cursor-pointer rounded-3xl transition-transform duration-500 transform-style-preserve-3d shadow-lg hover:shadow-xl ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front Face (Mặt trước - Câu hỏi / Thuật ngữ) */}
          <div className="absolute inset-0 w-full h-full backface-hidden bg-white border-2 border-indigo-100 rounded-3xl p-8 sm:p-10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                Mặt trước: Khái niệm / Câu hỏi
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Nhấn để xem lời giải (hoặc Space)</span>
              </span>
            </div>

            <div className="my-auto text-center py-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                {currentCard?.front}
              </h2>
            </div>

            <div className="text-center text-xs text-slate-400">
              Nhấn vào thẻ để lật sang mặt sau
            </div>
          </div>

          {/* Back Face (Mặt sau - Định nghĩa / Lời giải) */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-indigo-900 via-indigo-850 to-slate-900 border-2 border-indigo-700 rounded-3xl p-8 sm:p-10 flex flex-col justify-between text-white shadow-2xl">
            <div className="flex items-center justify-between text-xs">
              <span className="px-3 py-1 rounded-full bg-indigo-800 text-indigo-200 font-bold border border-indigo-600">
                Mặt sau: Định nghĩa & Lời giải
              </span>
              <span className="text-indigo-300 flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Nhấn để quay lại mặt trước</span>
              </span>
            </div>

            <div className="my-auto py-4 space-y-4">
              <p className="text-base sm:text-lg font-medium text-indigo-50 leading-relaxed text-center whitespace-pre-line">
                {currentCard?.back}
              </p>

              {currentCard?.example && (
                <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 text-xs text-indigo-200">
                  <span className="font-bold text-amber-300">Ví dụ minh họa: </span>
                  <span>{currentCard.example}</span>
                </div>
              )}
            </div>

            <div className="text-center text-xs text-indigo-300">
              Hãy tự đánh giá mức độ ghi nhớ của bạn bên dưới
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            title="Thẻ trước (Mũi tên trái)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleRestartDeck}
            className="p-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            title="Học lại từ đầu"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="p-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            title="Thẻ sau (Mũi tên phải)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Evaluation Buttons: Chưa nhớ vs Đã nhớ */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => handleMarkStatus('learning')}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-sm shadow-sm transition-all hover:scale-102"
          >
            <X className="w-4 h-4 text-amber-600" />
            <span>Chưa nhớ</span>
          </button>

          <button
            onClick={() => handleMarkStatus('mastered')}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 transition-all hover:scale-102"
          >
            <Check className="w-4 h-4" />
            <span>Đã nhớ</span>
          </button>
        </div>
      </div>

      {/* Helpful Hint */}
      <div className="text-center text-xs text-slate-400 pt-2">
        💡 Mẹo: Nhấn phím <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px]">Space</kbd> để lật thẻ, phím <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px]">←</kbd> và <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px]">→</kbd> để chuyển thẻ nhanh.
      </div>
    </div>
  );
};


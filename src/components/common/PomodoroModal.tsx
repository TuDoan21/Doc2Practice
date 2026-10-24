import { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, Coffee, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';

interface PomodoroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PomodoroModal: React.FC<PomodoroModalProps> = ({ isOpen, onClose }) => {
  // Mode: 'focus' (25 mins) vs 'break' (5 mins)
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<number>(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const saved = localStorage.getItem(`d2p_pomo_${today}`);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const timerRef = useRef<any>(null);

  // Phát âm thanh beep nhẹ bằng Web Audio API
  const playAlertBeep = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            playAlertBeep();

            if (mode === 'focus') {
              // Hoàn thành 1 session học
              const newCount = completedSessions + 1;
              setCompletedSessions(newCount);
              const today = new Date().toISOString().split('T')[0];
              localStorage.setItem(`d2p_pomo_${today}`, newCount.toString());
              setMode('break');
              return 5 * 60;
            } else {
              setMode('focus');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, mode, completedSessions]);

  const switchMode = (newMode: 'focus' | 'break') => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const totalTime = mode === 'focus' ? 25 * 60 : 5 * 60;
  const progressPercent = Math.round(((totalTime - timeLeft) / totalTime) * 100);

  const formatMinutes = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đồng hồ tập trung Pomodoro" maxWidth="md">
      <div className="space-y-6 text-center py-2">
        {/* Mode Selector */}
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => switchMode('focus')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              mode === 'focus'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Timer className="w-4 h-4 text-indigo-600" />
            <span>25 Phút Tập Trung</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('break')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              mode === 'break'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Coffee className="w-4 h-4 text-emerald-600" />
            <span>5 Phút Nghỉ Ngơi</span>
          </button>
        </div>

        {/* Circular Display Card */}
        <div className="py-6 px-4 rounded-3xl bg-slate-50/70 border border-slate-200/80 max-w-xs mx-auto relative overflow-hidden">
          <div
            className="absolute bottom-0 left-0 right-0 bg-indigo-500/10 transition-all duration-1000 ease-linear"
            style={{ height: `${progressPercent}%` }}
          />

          <div className="relative z-10 space-y-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
              {mode === 'focus' ? '🎯 Phiên học tập' : '☕ Giờ nghỉ ngơi'}
            </span>
            <div className="text-5xl font-black text-slate-900 tracking-tight font-mono">
              {formatMinutes(timeLeft)}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Đã trôi qua: {progressPercent}%
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-md transition-all hover:scale-105 active:scale-95 ${
              isRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Bắt đầu học</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Đặt lại đồng hồ"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Today's Streak / Stats */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Hôm nay đã hoàn thành:</span>
          </div>
          <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
            {completedSessions} chu kỳ (Pomodoros)
          </span>
        </div>
      </div>
    </Modal>
  );
};

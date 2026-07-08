import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  FileText,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface CustomVideoPlayerProps {
  src: string;
  nextLessonName?: string;
  onEnded?: () => void;
  onNextLesson?: () => void;
  onPrevLesson?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
const COUNTDOWN_SECONDS = 5;
const CIRCLE_RADIUS = 44;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

// ─── Component ──────────────────────────────────────────────────────────────
export default function CustomVideoPlayer({
  src,
  nextLessonName,
  onEnded,
  onNextLesson,
  onPrevLesson,
  hasPrev = false,
  hasNext = true,
}: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speedMenuRef = useRef<HTMLDivElement>(null);

  // Player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // UI states
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showNavArrows, setShowNavArrows] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  // Auto-play overlay
  const [showAutoPlayOverlay, setShowAutoPlayOverlay] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [strokeOffset, setStrokeOffset] = useState(0);

  // ── Reset on src change ──────────────────────────────────────────────────
  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setShowAutoPlayOverlay(false);
    setCountdown(COUNTDOWN_SECONDS);
    setStrokeOffset(0);
    clearCountdown();
  }, [src, clearCountdown]);

  useEffect(() => () => { clearCountdown(); }, [clearCountdown]);

  // ── Countdown ───────────────────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    clearCountdown();
    let remaining = COUNTDOWN_SECONDS;
    setCountdown(remaining);
    setStrokeOffset(0);

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      setStrokeOffset(CIRCLE_CIRCUMFERENCE * ((COUNTDOWN_SECONDS - remaining) / COUNTDOWN_SECONDS));
      if (remaining <= 0) {
        clearCountdown();
        setShowAutoPlayOverlay(false);
        onNextLesson?.();
      }
    }, 1000);
  }, [clearCountdown, onNextLesson]);

  const handleCancelAutoPlay = useCallback(() => {
    clearCountdown();
    setShowAutoPlayOverlay(false);
    setCountdown(COUNTDOWN_SECONDS);
    setStrokeOffset(0);
  }, [clearCountdown]);

  // ── Video events ─────────────────────────────────────────────────────────
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleWaiting = () => setIsBuffering(true);
  const handleCanPlay = () => setIsBuffering(false);

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
    setCurrentTime(v.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    onEnded?.();
    if (hasNext) {
      setShowAutoPlayOverlay(true);
      startCountdown();
    }
  };

  // ── Controls ─────────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (showAutoPlayOverlay) { handleCancelAutoPlay(); return; }
    v.paused ? void v.play() : v.pause();
  }, [showAutoPlayOverlay, handleCancelAutoPlay]);

  const skip = useCallback((seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + seconds));
  }, []);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    v.currentTime = (Number(e.target.value) / 100) * v.duration;
    setProgress(Number(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (videoRef.current) videoRef.current.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const changeRate = (rate: number) => {
    if (videoRef.current) videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  // ── Fullscreen change ────────────────────────────────────────────────────
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // ── Controls auto-hide ───────────────────────────────────────────────────
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  }, []);

  // ── Close speed menu on outside click ───────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      else if (e.code === 'ArrowLeft') skip(-10);
      else if (e.code === 'ArrowRight') skip(10);
      else if (e.code === 'KeyF') toggleFullscreen();
      else if (e.code === 'KeyM') toggleMute();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [togglePlay, skip, toggleFullscreen, toggleMute]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden select-none"
      onMouseMove={() => { resetControlsTimeout(); setShowNavArrows(true); }}
      onMouseLeave={() => { setShowNavArrows(false); setShowControls(false); }}
      onMouseEnter={() => { setShowControls(true); setShowNavArrows(true); }}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnded}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onDoubleClick={toggleFullscreen}
        onClick={togglePlay}
      />

      {/* Buffering spinner */}
      {isBuffering && !showAutoPlayOverlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Center play button (when paused, not buffering) */}
      {!isPlaying && !showAutoPlayOverlay && !isBuffering && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
          aria-label="Phát video"
        >
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-black/50 hover:bg-black/70 transition-all duration-150 hover:scale-110">
            <Play size={36} className="text-white ml-1" fill="white" />
          </div>
        </button>
      )}

      {/* ── Auto-play Overlay ────────────────────────────────────────────── */}
      {showAutoPlayOverlay && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <p className="text-slate-400 text-xs font-semibold mb-2 tracking-widest uppercase">
            Tiếp theo
          </p>
          {nextLessonName && (
            <p className="text-white text-xl font-bold mb-8 text-center max-w-lg px-8 leading-snug">
              {nextLessonName}
            </p>
          )}

          {/* SVG countdown ring */}
          <div className="relative flex items-center justify-center mb-5">
            <svg width="110" height="110" viewBox="0 0 110 110" className="-rotate-90">
              <circle
                cx="55" cy="55" r={CIRCLE_RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="4"
              />
              <circle
                cx="55" cy="55" r={CIRCLE_RADIUS}
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={CIRCLE_CIRCUMFERENCE}
                strokeDashoffset={strokeOffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            {/* Play button + number inside circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={() => { handleCancelAutoPlay(); onNextLesson?.(); }}
                className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Chuyển bài ngay"
              >
                <Play size={26} className="text-white ml-1" fill="white" />
                <span className="text-white text-xs font-bold mt-0.5">{countdown}</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleCancelAutoPlay}
            className="text-white text-sm font-semibold px-6 py-2 rounded-full border border-white/30 hover:bg-white/10 transition-colors"
          >
            Hủy
          </button>
        </div>
      )}

      {/* ── Prev arrow ─────────────────────────────────────────────────────── */}
      <div
        className={`absolute left-0 top-0 bottom-16 flex items-center z-20 transition-opacity duration-200 ${
          showNavArrows && hasPrev ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onPrevLesson?.(); }}
          className="ml-3 flex items-center justify-center w-11 h-11 rounded-full bg-black/55 hover:bg-black/80 text-white transition-all duration-150 hover:scale-110 border border-white/10"
          aria-label="Bài trước"
          title="Bài trước"
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      {/* ── Next arrow ─────────────────────────────────────────────────────── */}
      <div
        className={`absolute right-0 top-0 bottom-16 flex items-center z-20 transition-opacity duration-200 ${
          showNavArrows && hasNext ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onNextLesson?.(); }}
          className="mr-3 flex items-center justify-center w-11 h-11 rounded-full bg-black/55 hover:bg-black/80 text-white transition-all duration-150 hover:scale-110 border border-white/10"
          aria-label="Bài tiếp theo"
          title="Bài tiếp theo"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* ── Control bar ────────────────────────────────────────────────────── */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient */}
        <div className="h-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

        {/* Controls wrapper */}
        <div className="bg-black/90 px-4 pb-3 pt-1">
          {/* Timeline */}
          <div className="flex items-center mb-2">
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progress}
              onChange={handleSeek}
              className="cvp-range w-full h-1 appearance-none cursor-pointer rounded-full outline-none"
              style={{
                background: `linear-gradient(to right, #7c3aed ${progress}%, rgba(255,255,255,0.2) ${progress}%)`,
              }}
              aria-label="Thanh thời gian"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-1">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="flex items-center justify-center w-9 h-9 text-white hover:text-violet-400 transition-colors rounded-lg hover:bg-white/10"
              aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
            >
              {isPlaying
                ? <Pause size={18} fill="currentColor" />
                : <Play size={18} fill="currentColor" />}
            </button>

            {/* Rewind */}
            <button
              onClick={() => skip(-10)}
              className="flex items-center justify-center w-9 h-9 text-white hover:text-violet-400 transition-colors rounded-lg hover:bg-white/10"
              aria-label="Tua lùi 10s"
              title="Tua lùi 10s (←)"
            >
              <RotateCcw size={16} />
            </button>

            {/* Fast-forward */}
            <button
              onClick={() => skip(10)}
              className="flex items-center justify-center w-9 h-9 text-white hover:text-violet-400 transition-colors rounded-lg hover:bg-white/10"
              aria-label="Tua tới 10s"
              title="Tua tới 10s (→)"
            >
              <RotateCw size={16} />
            </button>

            {/* Volume */}
            <div
              className="relative flex items-center"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={toggleMute}
                className="flex items-center justify-center w-9 h-9 text-white hover:text-violet-400 transition-colors rounded-lg hover:bg-white/10"
                aria-label={isMuted ? 'Bật âm' : 'Tắt âm'}
                title="Tắt/bật âm (M)"
              >
                {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              {/* Vertical volume slider */}
              <div
                className={`absolute left-0 bottom-full mb-2 flex flex-col items-center py-3 px-2.5 rounded-xl bg-black/90 border border-white/10 transition-all duration-150 ${
                  showVolumeSlider ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
              >
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="cvp-range appearance-none cursor-pointer rounded-full"
                  style={{
                    writingMode: 'vertical-lr' as React.CSSProperties['writingMode'],
                    direction: 'rtl',
                    height: 80,
                    width: 4,
                    background: `linear-gradient(to top, #7c3aed ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%)`,
                  }}
                  aria-label="Âm lượng"
                />
              </div>
            </div>

            {/* Time */}
            <span className="text-white text-xs font-mono ml-1 select-none whitespace-nowrap tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Playback speed */}
            <div className="relative" ref={speedMenuRef}>
              <button
                onClick={() => setShowSpeedMenu(p => !p)}
                className="flex items-center justify-center h-9 px-2.5 text-white text-sm font-bold hover:text-violet-400 transition-colors rounded-lg hover:bg-white/10 min-w-[40px]"
                aria-label="Tốc độ phát"
                title="Tốc độ phát"
              >
                {playbackRate === 1 ? '1x' : `${playbackRate}x`}
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-[9rem] bg-zinc-900/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 backdrop-blur-sm">
                  <p className="text-slate-400 text-[10px] font-semibold px-3 py-2 border-b border-white/10 uppercase tracking-widest">
                    Tốc độ phát
                  </p>
                  {PLAYBACK_RATES.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changeRate(rate)}
                      className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors flex items-center justify-between ${
                        playbackRate === rate
                          ? 'text-violet-400 bg-violet-500/15'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{rate === 1 ? 'Bình thường' : `${rate}x`}</span>
                      {playbackRate === rate && (
                        <span className="text-violet-400 text-xs">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center justify-center w-9 h-9 text-white hover:text-violet-400 transition-colors rounded-lg hover:bg-white/10"
              aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
              title="Toàn màn hình (F)"
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Range input custom styles */}
      <style>{`
        .cvp-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #7c3aed;
          cursor: pointer;
          box-shadow: 0 0 0 2px rgba(124,58,237,0.35);
          transition: transform 0.1s;
        }
        .cvp-range::-webkit-slider-thumb:hover {
          transform: scale(1.3);
        }
        .cvp-range::-moz-range-thumb {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: #7c3aed;
          border: none;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

// ─── Placeholder for non-video lessons ──────────────────────────────────────
export function VideoPlaceholder({ message }: { message: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-800">
      <FileText size={64} className="mb-4 text-slate-600" />
      <h3 className="text-xl font-medium text-slate-300">{message}</h3>
    </div>
  );
}

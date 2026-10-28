import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Upload, Trash2, Check, X, RotateCcw, ShieldCheck } from 'lucide-react';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSignature?: string;
  onSaveSignature: (signatureDataUrl: string) => void;
  firmName: string;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  currentSignature,
  onSaveSignature,
  firmName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<'draw' | 'upload'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState<string>('#0f2b5c'); // Default to royal ink blue
  const [penWidth, setPenWidth] = useState<number>(2.5);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  // Initialize Canvas
  useEffect(() => {
    if (isOpen && activeTab === 'draw') {
      const timer = setTimeout(() => {
        initCanvas();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set resolution according to device pixel ratio for super-crisp lines
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;

    // Draw light baseline guide
    drawBaselineGuide(ctx, rect.width, rect.height);
    setHasDrawn(false);
  };

  const drawBaselineGuide = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(20, height - 35);
    ctx.lineTo(width - 20, height - 35);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.fillText('Sign on or above this line', width - 140, height - 20);
    ctx.restore();
  };

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setHasDrawn(true);

    const { x, y } = getCanvasCoords(e);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y); // allows dotting
    ctx.stroke();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    }
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    initCanvas();
  };

  const handleSaveDrawn = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      alert('Please draw your signature before saving.');
      return;
    }

    // Export with transparent background
    const dataUrl = canvas.toDataURL('image/png');
    onSaveSignature(dataUrl);
    onClose();
  };

  // Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, or SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUploaded = () => {
    if (!uploadedPreview) {
      alert('Please select an image file first.');
      return;
    }
    onSaveSignature(uploadedPreview);
    onClose();
  };

  const handleRemoveExisting = () => {
    if (confirm('Are you sure you want to remove the current signature from invoices and PDF?')) {
      onSaveSignature('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <PenTool className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Digital Signature Pad
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                  PDF & Print Ready
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Authorised signatory for <b className="text-slate-200">{firmName}</b>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'draw'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <PenTool className="h-3.5 w-3.5" /> Draw Signature
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'upload'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Upload className="h-3.5 w-3.5" /> Upload File / Stamp
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {activeTab === 'draw' ? (
            <div>
              {/* Controls Toolbar: Pen Colors & Stroke */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">Ink Color:</span>
                  <div className="flex items-center gap-1.5">
                    {[
                      { name: 'Navy Blue', color: '#0f2b5c' },
                      { name: 'Pure Black', color: '#111827' },
                      { name: 'Emerald', color: '#047857' },
                    ].map((c) => (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => setPenColor(c.color)}
                        style={{ backgroundColor: c.color }}
                        title={c.name}
                        className={`h-6 w-6 rounded-full border-2 transition ${
                          penColor === c.color ? 'border-amber-400 scale-110 shadow-sm' : 'border-slate-600 opacity-70'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">Stroke:</span>
                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                    {[
                      { label: 'Fine', width: 1.8 },
                      { label: 'Normal', width: 2.8 },
                      { label: 'Thick', width: 4.0 },
                    ].map((w) => (
                      <button
                        key={w.width}
                        type="button"
                        onClick={() => setPenWidth(w.width)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                          penWidth === w.width
                            ? 'bg-amber-500/20 text-amber-300 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleClearCanvas}
                    className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                    title="Clear pad"
                  >
                    <RotateCcw className="h-3 w-3" /> Clear
                  </button>
                </div>
              </div>

              {/* Drawing Pad Canvas */}
              <div className="relative rounded-xl border-2 border-dashed border-slate-600 bg-white shadow-inner overflow-hidden cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="h-44 w-full touch-none block"
                />
              </div>
              <p className="mt-1.5 text-center text-[10px] text-slate-400 italic">
                Draw your signature above using mouse, stylus, or finger (touch-friendly).
              </p>
            </div>
          ) : (
            /* Upload Signature / Stamp */
            <div className="space-y-3">
              <div className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-950 p-6 text-center hover:border-amber-400/50 transition">
                {uploadedPreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-lg bg-white p-3 border border-slate-300 shadow-md max-h-36 max-w-full flex items-center justify-center">
                      <img
                        src={uploadedPreview}
                        alt="Signature Preview"
                        className="max-h-28 max-w-[240px] object-contain"
                      />
                    </div>
                    <label className="cursor-pointer rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-slate-700 transition">
                      Change File
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="text-xs font-bold text-slate-200">
                      Click to upload Signature / Stamp
                    </div>
                    <div className="text-[11px] text-slate-400">
                      PNG (transparent recommended), JPG, or SVG
                    </div>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Current Signature Status Bar */}
          {currentSignature && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] text-emerald-300 font-medium">
                  Active signature is enabled on Invoices, Quotations & WCC
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveExisting}
                className="flex items-center gap-1 rounded bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300 hover:bg-rose-900/60 transition"
              >
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-950 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          {activeTab === 'draw' ? (
            <button
              type="button"
              onClick={handleSaveDrawn}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/25 hover:brightness-110 transition"
            >
              <Check className="h-4 w-4" /> Save Signature
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveUploaded}
              disabled={!uploadedPreview}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/25 hover:brightness-110 transition disabled:opacity-40"
            >
              <Check className="h-4 w-4" /> Apply Uploaded Signature
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

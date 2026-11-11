import React, { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Link2, Star, Trash2, ChevronLeft, ChevronRight, Loader2, X, SwitchCamera, Aperture, Scissors, Check, RotateCcw } from 'lucide-react';
import { compressImage, dataUrlKB } from '../lib/image';
import { removeBackground } from '../lib/removeBackground';
import { isCutout } from '../lib/image';
import { Modal } from '../components/ui';

const isTouchDevice = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

// Desktop/laptop webcam capture (phones use the native camera via <input capture>)
function WebcamModal({ open, onClose, onCapture, notify }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facing, setFacing] = useState('environment');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setReady(false);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      .then((stream) => {
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setReady(true);
      })
      .catch(() => {
        notify('ไม่สามารถเปิดกล้องได้ — กรุณาอนุญาตการใช้กล้อง หรือเลือกรูปจากไฟล์แทน', 'error');
        onClose();
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, facing]); // eslint-disable-line react-hooks/exhaustive-deps

  const snap = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const scale = Math.min(1, 1000 / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(v.videoWidth * scale);
    c.height = Math.round(v.videoHeight * scale);
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    onCapture(c.toDataURL('image/jpeg', 0.72));
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-xl" z="z-[60]">
      <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
        <h4 className="text-sm font-bold text-white flex items-center gap-2"><Camera className="w-4 h-4 text-yellow-400" /> ถ่ายรูปรถด้วยกล้อง</h4>
        <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="ปิดกล้อง"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-5 space-y-4">
        <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3]">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          {!ready && <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs gap-2"><Loader2 className="w-4 h-4 animate-spin" /> กำลังเปิดกล้อง…</div>}
          <div className="absolute inset-6 border-2 border-dashed border-white/30 rounded-xl pointer-events-none" />
        </div>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setFacing(facing === 'environment' ? 'user' : 'environment')} className="w-11 h-11 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center" aria-label="สลับกล้อง">
            <SwitchCamera className="w-5 h-5" />
          </button>
          <button disabled={!ready} onClick={snap} className="w-16 h-16 rounded-full bg-yellow-400 disabled:opacity-40 text-slate-950 flex items-center justify-center ring-4 ring-yellow-400/30" aria-label="ถ่ายรูป">
            <Aperture className="w-8 h-8" />
          </button>
          <span className="w-11" />
        </div>
        <p className="text-[11px] text-slate-500 text-center">ถ่ายได้หลายรูปต่อเนื่อง กดปิดเมื่อเสร็จ</p>
      </div>
    </Modal>
  );
}

// Tap the vehicle → model cuts it out of the background (runs in this browser, free)
function BackgroundRemoverModal({ src, onClose, onApply, notify }) {
  const [point, setPoint] = useState({ x: 0.5, y: 0.55 });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  const run = async (p) => {
    setPoint(p);
    setBusy(true);
    setResult(null);
    try {
      setResult(await removeBackground(src, p));
    } catch (err) {
      const msg = err?.message === 'nothing_found'
        ? 'หาตัวรถตรงจุดที่แตะไม่เจอ — ลองแตะกลางตัวรถอีกครั้ง'
        : err?.message === 'image_load_failed'
          ? 'เปิดรูปนี้ไม่ได้ (รูปจากลิงก์ภายนอกบางแห่งไม่อนุญาต) — ลองอัปโหลดรูปจากเครื่องแทน'
          : 'ตัดพื้นหลังไม่สำเร็จ — ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่';
      notify(msg, 'error');
    } finally {
      setBusy(false);
      setFirstLoad(false);
    }
  };

  // Auto-run once with the centre of the photo (vehicles are usually centred)
  useEffect(() => {
    if (src) run({ x: 0.5, y: 0.55 });
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTap = (e) => {
    if (busy) return;
    const r = e.currentTarget.getBoundingClientRect();
    run({ x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) });
  };

  const checker = 'bg-[length:20px_20px] bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[position:0_0,0_10px,10px_-10px,-10px_0] bg-slate-900';

  return (
    <Modal open={!!src} onClose={onClose} maxWidth="max-w-3xl" z="z-[60]">
      <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
        <h4 className="text-sm font-bold text-white flex items-center gap-2"><Scissors className="w-4 h-4 text-yellow-400" /> ตัดพื้นหลังรูปรถ</h4>
        <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="ปิดหน้าตัดพื้นหลัง"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="space-y-2">
          <div className="text-slate-400 font-bold">1. แตะที่ตัวรถในรูป</div>
          <div className="relative rounded-xl overflow-hidden border border-slate-700 cursor-crosshair select-none" onClick={onTap} role="button" aria-label="แตะตำแหน่งตัวรถ">
            <img src={src} alt="รูปต้นฉบับ" className="w-full h-auto block" draggable={false} />
            <span className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-yellow-400 bg-yellow-400/30 shadow-lg pointer-events-none" style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }} />
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-slate-400 font-bold">2. ผลลัพธ์ (พื้นหลังโปร่งใส)</div>
          <div className={`rounded-xl border border-slate-700 min-h-[180px] flex items-center justify-center p-3 ${checker}`}>
            {busy ? (
              <div className="text-slate-300 flex flex-col items-center gap-2 py-8">
                <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
                {firstLoad ? 'กำลังโหลดตัวตัดพื้นหลัง (ครั้งแรกประมาณ 6 MB)…' : 'กำลังตัดพื้นหลัง…'}
              </div>
            ) : result ? (
              <img src={result.dataUrl} alt="รูปที่ตัดพื้นหลังแล้ว" className="max-h-72 w-auto" />
            ) : (
              <span className="text-slate-500 py-8">ยังไม่มีผลลัพธ์</span>
            )}
          </div>
          <p className="text-[10px] text-slate-500">ถ้าตัดไม่ครบหรือเกิน ให้แตะตรงกลางตัวรถใหม่อีกครั้ง • รูปที่ดีที่สุด: ถ่ายรถทั้งคันเต็มเฟรม พื้นหลังโล่ง</p>
        </div>
      </div>
      <div className="px-5 pb-5 flex flex-wrap justify-end gap-2 text-xs">
        <button onClick={() => run({ x: 0.5, y: 0.55 })} disabled={busy} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-bold flex items-center gap-1.5 disabled:opacity-50">
          <RotateCcw className="w-4 h-4" /> ลองใหม่จากกลางรูป
        </button>
        <button onClick={() => result && onApply(result.dataUrl)} disabled={!result || busy} className="px-5 py-2.5 rounded-xl bg-yellow-400 text-slate-950 font-black flex items-center gap-1.5 disabled:opacity-40">
          <Check className="w-4 h-4" /> ใช้รูปนี้
        </button>
      </div>
    </Modal>
  );
}

export default function PhotoManager({ photos, onChange, notify, max = 8 }) {
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const [busy, setBusy] = useState(0);
  const [drag, setDrag] = useState(false);
  const [url, setUrl] = useState('');
  const [webcam, setWebcam] = useState(false);

  // Always read the latest photos inside async handlers
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const push = (items) => {
    const room = max - photosRef.current.length;
    if (room <= 0) return notify(`เพิ่มได้สูงสุด ${max} รูปต่อคัน`, 'error');
    if (items.length > room) notify(`เพิ่มได้อีก ${room} รูป — ข้ามรูปที่เกิน`, 'info');
    onChange([...photosRef.current, ...items.slice(0, room)]);
  };

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return notify('กรุณาเลือกไฟล์รูปภาพ (JPG / PNG / HEIC ที่เบราว์เซอร์รองรับ)', 'error');
    setBusy((n) => n + files.length);
    const out = [];
    for (const f of files) {
      try {
        out.push(await compressImage(f));
      } catch {
        notify(`อ่านไฟล์ ${f.name} ไม่ได้`, 'error');
      }
      setBusy((n) => n - 1);
    }
    if (out.length) push(out);
  };

  const openCamera = () => {
    // Phones/tablets: native camera app via capture attribute. Desktop: in-page webcam.
    if (!isTouchDevice() && navigator.mediaDevices?.getUserMedia) setWebcam(true);
    else cameraRef.current?.click();
  };

  const addUrl = () => {
    const u = url.trim();
    if (!/^https?:\/\/\S+$/i.test(u)) return notify('URL รูปไม่ถูกต้อง (ต้องขึ้นต้นด้วย http:// หรือ https://)', 'error');
    push([u]);
    setUrl('');
  };

  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const makeMain = (i) => onChange([photos[i], ...photos.filter((_, k) => k !== i)]);
  const remove = (i) => onChange(photos.filter((_, k) => k !== i));
  const [cutIndex, setCutIndex] = useState(null);
  const applyCut = (dataUrl) => {
    onChange(photos.map((p, k) => (k === cutIndex ? dataUrl : p)));
    setCutIndex(null);
    notify('ตัดพื้นหลังแล้ว — กดบันทึกเพื่ออัปโหลดรูปใหม่');
  };

  const totalKB = photos.reduce((s, p) => s + dataUrlKB(p), 0);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-slate-400">รูปรถเช่า ({photos.length}/{max}) — รูปแรกคือรูปหลักที่แสดงบนการ์ด</span>
        {totalKB > 0 && <span className={`text-[10px] ${totalKB > 2500 ? 'text-amber-400' : 'text-slate-500'}`}>ขนาดรวม ~{totalKB.toLocaleString()} KB</span>}
      </div>

      {/* Hidden inputs */}
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />

      {/* Drop zone + actions */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-2xl p-4 transition ${drag ? 'border-yellow-400 bg-yellow-400/5' : 'border-slate-700'}`}
      >
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="flex flex-col sm:flex-row items-center justify-center gap-2 py-3 rounded-xl bg-blue-700 hover:bg-blue-600 text-yellow-300 font-bold border border-yellow-400/30">
            <ImagePlus className="w-5 h-5" /> เลือกจากไฟล์ / คลังภาพ
          </button>
          <button type="button" onClick={openCamera} className="flex flex-col sm:flex-row items-center justify-center gap-2 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black">
            <Camera className="w-5 h-5" /> ถ่ายรูปด้วยกล้อง
          </button>
        </div>
        <p className="text-[10px] text-slate-500 text-center mt-2 hidden sm:block">หรือลากไฟล์รูปมาวางที่นี่ • เลือกได้หลายรูปพร้อมกัน • ระบบย่อขนาดรูปให้อัตโนมัติ</p>
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <Link2 className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
              placeholder="หรือวาง URL รูปภาพ https://…"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-yellow-400 focus:outline-none"
            />
          </div>
          <button type="button" onClick={addUrl} className="px-3 rounded-xl bg-slate-800 text-slate-200 font-bold">เพิ่ม</button>
        </div>
      </div>

      {/* Thumbnails */}
      {(photos.length > 0 || busy > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((src, i) => (
            <div key={`${i}-${src.slice(-24)}`} className={`relative group rounded-xl overflow-hidden border-2 aspect-[4/3] bg-slate-950 ${i === 0 ? 'border-yellow-400' : 'border-slate-800'}`}>
              <img src={src} alt={`รูปที่ ${i + 1}`} className={`w-full h-full ${isCutout(src) ? 'object-contain p-1 bg-gradient-to-b from-slate-700 to-slate-900' : 'object-cover'}`} />
              {i === 0 && <span className="absolute top-1 left-1 bg-yellow-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded">รูปหลัก</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between items-center bg-slate-950/85 px-1 py-1 sm:opacity-0 sm:group-hover:opacity-100 transition">
                <div className="flex">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-slate-300 disabled:opacity-30" aria-label="เลื่อนซ้าย"><ChevronLeft className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === photos.length - 1} className="p-1 text-slate-300 disabled:opacity-30" aria-label="เลื่อนขวา"><ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
                <div className="flex">
                  {i !== 0 && <button type="button" onClick={() => makeMain(i)} className="p-1 text-yellow-300" aria-label="ตั้งเป็นรูปหลัก" title="ตั้งเป็นรูปหลัก"><Star className="w-3.5 h-3.5" /></button>}
                  <button type="button" onClick={() => setCutIndex(i)} className="p-1 text-sky-300" aria-label="ตัดพื้นหลัง" title="ตัดพื้นหลัง"><Scissors className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => remove(i)} className="p-1 text-rose-400" aria-label="ลบรูป"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
          {Array.from({ length: busy }).map((_, i) => (
            <div key={`busy-${i}`} className="rounded-xl border-2 border-slate-800 aspect-[4/3] bg-slate-950 flex items-center justify-center text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ))}
        </div>
      )}

      <BackgroundRemoverModal src={cutIndex === null ? null : photos[cutIndex]} onClose={() => setCutIndex(null)} onApply={applyCut} notify={notify} />
      <WebcamModal open={webcam} onClose={() => setWebcam(false)} onCapture={(d) => push([d])} notify={notify} />
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Download, FileArchive, Printer, Eye, AlertTriangle, Loader2 } from 'lucide-react';
import { baht } from '../data';
import { inputCls, btnGhost, btnPrimary } from '../components/ui';
import { api } from '../lib/api';
import { errorMessage } from '../lib/errors';

const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const MONTHS_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const be = (y) => y + 543; // Thai Buddhist year

// Revenue is counted on the day the payment was approved (Thailand time)
const revenueDate = (p) => p.decidedAt || p.createdAt;

function download(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const csvBlob = (rows) => {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return new Blob(['﻿' + rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
};

const itemRows = (list) => [
  ['ลำดับ', 'วันที่รับชำระ (อนุมัติ)', 'เลขที่รายการ', 'ชื่อลูกค้า', 'เบอร์โทร', 'แพ็กเกจ', 'จำนวนวัน', 'จำนวนเงิน (บาท)', 'ไฟล์สลิป'],
  ...list.map((p, i) => [i + 1, revenueDate(p), p.id, p.account?.name, p.account?.phone, p.planName, p.days, p.amount, p.hasSlip ? slipFileName(p) : 'ไม่มีสลิป']),
  ['', '', '', '', '', '', 'รวม', list.reduce((s, p) => s + p.amount, 0), ''],
];

const slipFileName = (p) => `${revenueDate(p).slice(0, 10)}_${p.id}.jpg`;

function printReport({ shopName, year, month, list }) {
  const total = list.reduce((s, p) => s + p.amount, 0);
  const title = `รายงานรายรับประจำเดือน${MONTHS_FULL[month]} ${be(year)}`;
  const rows = list
    .map((p, i) => `<tr><td>${i + 1}</td><td>${revenueDate(p)}</td><td>${p.id}</td><td>${esc(p.account?.name)}</td><td>${esc(p.planName)}</td><td class="r">${p.amount.toLocaleString('th-TH')}</td><td>${p.hasSlip ? 'มี' : '<b>ไม่มี</b>'}</td></tr>`)
    .join('');
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;600&display=swap" rel="stylesheet">
    <style>body{font-family:Prompt,sans-serif;padding:32px;color:#1c1917}h1{font-size:20px;margin:0}p{margin:4px 0;color:#57534e;font-size:13px}
    table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}th,td{border:1px solid #d6d3d1;padding:6px 8px;text-align:left}th{background:#f5f5f4}
    .r{text-align:right}tfoot td{font-weight:600}.sign{margin-top:48px;display:flex;justify-content:space-between;font-size:13px}</style></head><body>
    <h1>${esc(shopName)} — ${title}</h1>
    <p>ค่าบริการใช้งานเว็บออกแบบจัดวางเฟอร์นิเจอร์ · นับตามวันที่ร้านยืนยันการชำระเงิน · ชำระผ่าน PromptPay</p>
    <p>จำนวน ${list.length} รายการ · รวม ${total.toLocaleString('th-TH')} บาท · พิมพ์เมื่อ ${new Date().toLocaleString('th-TH')}</p>
    <table><thead><tr><th>#</th><th>วันที่รับชำระ</th><th>เลขที่</th><th>ลูกค้า</th><th>แพ็กเกจ</th><th class="r">จำนวนเงิน (บาท)</th><th>สลิป</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="7">ไม่มีรายการ</td></tr>'}</tbody>
    <tfoot><tr><td colspan="5">รวมทั้งเดือน</td><td class="r">${total.toLocaleString('th-TH')}</td><td></td></tr></tfoot></table>
    <div class="sign"><span>ผู้จัดทำ ........................................</span><span>วันที่ ........................................</span></div>
    <script>document.fonts.ready.then(()=>setTimeout(()=>print(),300))</script></body></html>`);
  w.document.close();
  return true;
}

function esc(s) {
  return String(s ?? '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]);
}

export default function Revenue({ payments, shopName, notify }) {
  const approved = useMemo(() => payments.filter((p) => p.status === 'Approved').sort((a, b) => revenueDate(a).localeCompare(revenueDate(b))), [payments]);
  const nowY = Number(new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 4));
  const nowM = Number(new Date(Date.now() + 7 * 3600e3).toISOString().slice(5, 7)) - 1;
  const years = useMemo(() => {
    const set = new Set([nowY, ...approved.map((p) => Number(revenueDate(p).slice(0, 4)))]);
    return [...set].sort((a, b) => b - a);
  }, [approved, nowY]);
  const [year, setYear] = useState(nowY);
  const [month, setMonth] = useState(nowM);
  const [busy, setBusy] = useState('');

  const byMonth = useMemo(
    () => MONTHS.map((_, m) => approved.filter((p) => revenueDate(p).startsWith(`${year}-${String(m + 1).padStart(2, '0')}`))),
    [approved, year]
  );
  const prevYearTotal = approved.filter((p) => revenueDate(p).startsWith(String(year - 1))).reduce((s, p) => s + p.amount, 0);
  const sum = (l) => l.reduce((s, p) => s + p.amount, 0);
  const totals = byMonth.map(sum);
  const yearTotal = sum(totals.map((t) => ({ amount: t })));
  const yearCount = byMonth.reduce((s, l) => s + l.length, 0);
  const max = Math.max(1, ...totals);
  const best = totals.indexOf(Math.max(...totals));
  const planNames = useMemo(() => [...new Set(approved.map((p) => p.planName))], [approved]);
  const missingSlips = byMonth.map((l) => l.filter((p) => !p.hasSlip).length);
  const list = byMonth[month];

  const fileBase = (m) => `furniture-revenue-${year}-${String(m + 1).padStart(2, '0')}`;

  const yearCsv = () => {
    const rows = [
      ['เดือน', 'จำนวนรายการ', ...planNames.map((n) => `แพ็กเกจ ${n} (บาท)`), 'รวม (บาท)', 'รายการที่ไม่มีสลิป'],
      ...byMonth.map((l, m) => [`${MONTHS_FULL[m]} ${be(year)}`, l.length, ...planNames.map((n) => sum(l.filter((p) => p.planName === n))), sum(l), missingSlips[m]]),
      ['รวมทั้งปี', yearCount, ...planNames.map((n) => sum(approved.filter((p) => p.planName === n && revenueDate(p).startsWith(String(year))))), yearTotal, missingSlips.reduce((a, b) => a + b, 0)],
    ];
    download(`furniture-revenue-${year}.csv`, csvBlob(rows));
  };

  const viewSlip = async (p) => {
    const url = await api.getSlipUrl(p);
    if (url) window.open(url, '_blank', 'noopener');
    else notify('เปิดสลิปไม่ได้', 'error');
  };

  // CSV + every slip of the month in one ZIP — ready to hand to the accountant
  const zipMonth = async () => {
    setBusy('zip');
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      zip.file(`${fileBase(month)}.csv`, csvBlob(itemRows(list)));
      const withSlip = list.filter((p) => p.hasSlip);
      const urls = await api.getSlipUrls(withSlip.map((p) => p.slipPath));
      let failed = 0;
      for (const p of withSlip) {
        try {
          const res = await fetch(urls[p.slipPath]);
          if (!res.ok) throw new Error();
          zip.file(`slips/${slipFileName(p)}`, await res.blob());
        } catch {
          failed += 1;
        }
      }
      download(`${fileBase(month)}.zip`, await zip.generateAsync({ type: 'blob' }));
      notify(failed ? `ดาวน์โหลดแล้ว แต่มีสลิป ${failed} ไฟล์ที่โหลดไม่ได้` : `ดาวน์โหลดแล้ว — ${withSlip.length} สลิป + ไฟล์ CSV`, failed ? 'error' : 'success');
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold mr-auto">รายรับรายเดือน</h2>
        <select className={`${inputCls} !w-auto py-2`} value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="ปี">
          {years.map((y) => (
            <option key={y} value={y}>
              ปี {be(y)} ({y})
            </option>
          ))}
        </select>
        <button onClick={yearCsv} className={`${btnGhost} py-2`}>
          <Download className="w-4 h-4" /> สรุปทั้งปี (CSV)
        </button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white border border-stone-200 p-5">
          <p className="text-sm text-stone-500">รายรับทั้งปี {be(year)}</p>
          <p className="text-2xl font-semibold mt-1">{baht(yearTotal)}</p>
          <p className="text-xs text-stone-500 mt-1">
            {prevYearTotal ? `ปีก่อน ${baht(prevYearTotal)} (${yearTotal >= prevYearTotal ? '+' : ''}${Math.round(((yearTotal - prevYearTotal) / prevYearTotal) * 100)}%)` : `${yearCount} รายการ`}
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-stone-200 p-5">
          <p className="text-sm text-stone-500">เฉลี่ยต่อเดือน</p>
          <p className="text-2xl font-semibold mt-1">{baht(Math.round(yearTotal / (year === nowY ? nowM + 1 : 12)))}</p>
          <p className="text-xs text-stone-500 mt-1">{year === nowY ? `${nowM + 1} เดือนที่ผ่านมา` : '12 เดือน'}</p>
        </div>
        <div className="rounded-2xl bg-white border border-stone-200 p-5">
          <p className="text-sm text-stone-500">เดือนที่รายรับสูงสุด</p>
          <p className="text-2xl font-semibold mt-1">{totals[best] ? MONTHS_FULL[best] : '-'}</p>
          <p className="text-xs text-stone-500 mt-1">{totals[best] ? baht(totals[best]) : 'ยังไม่มีรายรับ'}</p>
        </div>
        <div className="rounded-2xl bg-white border border-stone-200 p-5">
          <p className="text-sm text-stone-500">รายการทั้งปี</p>
          <p className="text-2xl font-semibold mt-1">{yearCount}</p>
          <p className={`text-xs mt-1 ${missingSlips.some(Boolean) ? 'text-rose-600' : 'text-stone-500'}`}>
            {missingSlips.some(Boolean) ? `ไม่มีสลิป ${missingSlips.reduce((a, b) => a + b, 0)} รายการ` : 'มีสลิปครบทุกรายการ'}
          </p>
        </div>
      </div>

      <section className="rounded-2xl bg-white border border-stone-200 p-5">
        <p className="text-sm text-stone-500 mb-4">แตะแท่งเพื่อดูรายละเอียดเดือนนั้น</p>
        <div className="flex items-end gap-1 sm:gap-2 h-56">
          {totals.map((v, m) => (
            <button key={m} onClick={() => setMonth(m)} className="flex-1 h-full flex flex-col items-center justify-end gap-1 group" title={`${MONTHS_FULL[m]}: ${baht(v)}`}>
              <span className="text-[10px] text-stone-500 hidden sm:block">{v ? (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : v) : ''}</span>
              <div
                className={`w-full max-w-12 rounded-t-md transition ${m === month ? 'bg-amber-600' : 'bg-amber-300 group-hover:bg-amber-400'}`}
                style={{ height: `${v ? Math.max(3, (v / max) * 85) : 1}%`, opacity: v ? 1 : 0.3 }}
              />
              <span className={`text-[11px] ${m === month ? 'font-semibold text-stone-900' : 'text-stone-500'}`}>{MONTHS[m]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-stone-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-stone-50 text-stone-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">เดือน</th>
              <th className="px-4 py-3 font-medium text-right">รายการ</th>
              {planNames.map((n) => (
                <th key={n} className="px-4 py-3 font-medium text-right">
                  {n}
                </th>
              ))}
              <th className="px-4 py-3 font-medium text-right">รวม</th>
              <th className="px-4 py-3 font-medium">หลักฐาน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {byMonth.map((l, m) => (
              <tr key={m} onClick={() => setMonth(m)} className={`cursor-pointer ${m === month ? 'bg-amber-50' : 'hover:bg-stone-50'}`}>
                <td className="px-4 py-2.5">{MONTHS_FULL[m]}</td>
                <td className="px-4 py-2.5 text-right">{l.length || '-'}</td>
                {planNames.map((n) => {
                  const v = sum(l.filter((p) => p.planName === n));
                  return (
                    <td key={n} className="px-4 py-2.5 text-right text-stone-600">
                      {v ? baht(v) : '-'}
                    </td>
                  );
                })}
                <td className="px-4 py-2.5 text-right font-medium">{totals[m] ? baht(totals[m]) : '-'}</td>
                <td className="px-4 py-2.5 text-xs">
                  {!l.length ? '' : missingSlips[m] ? <span className="text-rose-600">ไม่มีสลิป {missingSlips[m]}</span> : <span className="text-emerald-700">สลิปครบ</span>}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-stone-50 font-semibold">
            <tr>
              <td className="px-4 py-3">รวมทั้งปี</td>
              <td className="px-4 py-3 text-right">{yearCount}</td>
              {planNames.map((n) => (
                <td key={n} className="px-4 py-3 text-right">
                  {baht(sum(byMonth.flat().filter((p) => p.planName === n)))}
                </td>
              ))}
              <td className="px-4 py-3 text-right">{baht(yearTotal)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="rounded-2xl bg-white border border-stone-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold mr-auto">
            {MONTHS_FULL[month]} {be(year)} · {list.length} รายการ · {baht(totals[month])}
          </h3>
          <button disabled={!list.length} onClick={() => download(`${fileBase(month)}.csv`, csvBlob(itemRows(list)))} className={`${btnGhost} py-2`}>
            <Download className="w-4 h-4" /> CSV
          </button>
          <button disabled={!list.length || busy === 'zip'} onClick={zipMonth} className={`${btnGhost} py-2`}>
            {busy === 'zip' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileArchive className="w-4 h-4" />} สลิปทั้งเดือน (ZIP)
          </button>
          <button disabled={!list.length} onClick={() => printReport({ shopName, year, month, list }) || notify('เบราว์เซอร์บล็อกหน้าต่างใหม่ กรุณาอนุญาต pop-up', 'error')} className={`${btnPrimary} py-2`}>
            <Printer className="w-4 h-4" /> พิมพ์รายงาน
          </button>
        </div>
        {list.length === 0 ? (
          <p className="text-sm text-stone-500 py-6 text-center">ไม่มีรายรับในเดือนนี้</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="text-stone-500 text-left border-b border-stone-200">
                <tr>
                  <th className="py-2 pr-3 font-medium">วันที่รับชำระ</th>
                  <th className="py-2 pr-3 font-medium">เลขที่</th>
                  <th className="py-2 pr-3 font-medium">ลูกค้า</th>
                  <th className="py-2 pr-3 font-medium">แพ็กเกจ</th>
                  <th className="py-2 pr-3 font-medium text-right">จำนวนเงิน</th>
                  <th className="py-2 font-medium">สลิป</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {list.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-3 text-stone-600">{revenueDate(p)}</td>
                    <td className="py-2 pr-3 font-medium">{p.id}</td>
                    <td className="py-2 pr-3">{p.account?.name}</td>
                    <td className="py-2 pr-3">{p.planName}</td>
                    <td className="py-2 pr-3 text-right">{baht(p.amount)}</td>
                    <td className="py-2">
                      {p.hasSlip ? (
                        <button onClick={() => viewSlip(p)} className="inline-flex items-center gap-1 text-amber-700 hover:underline">
                          <Eye className="w-4 h-4" /> ดู
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 text-xs">
                          <AlertTriangle className="w-3.5 h-3.5" /> ไม่มีสลิป
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-stone-500">
          นับรายรับตามวันที่ร้านกดอนุมัติ (เวลาประเทศไทย) · สลิปและรายการชำระเงินถูกเก็บถาวรในระบบ ลบจากหน้าเว็บไม่ได้ · ไฟล์ ZIP มี CSV รายการทั้งเดือนและสลิปทุกใบ (ชื่อไฟล์ = วันที่_เลขที่รายการ)
        </p>
      </section>
    </div>
  );
}

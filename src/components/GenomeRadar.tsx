import type { AppData } from '../types';
import { businessGenome } from '../lib/businessGenome';

/** Business Genome radar (Phase C) — แกนที่ยังไม่มีข้อมูลแสดงเป็น 0 + ป้าย "ยังไม่พอ" (ไม่แต่งตัวเลข) */
export default function GenomeRadar({ data }: { data: AppData }) {
  const { axes, overall } = businessGenome(data);
  const cx = 110, cy = 100, R = 70, n = axes.length;
  const pt = (i: number, r: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  };
  const ring = (f: number) => axes.map((_, i) => pt(i, R * f).join(',')).join(' ');
  const poly = axes.map((a, i) => pt(i, R * ((a.score ?? 0) / 100)).join(',')).join(' ');
  return (
    <section className="gn-card" aria-label="Business Genome">
      <div className="gn-hd"><b>Business Genome</b><span>{overall === null ? 'ข้อมูลยังไม่พอสรุปภาพรวม' : `ภาพรวม ${overall}/100 · DERIVED`}</span></div>
      <div className="gn-body">
        <svg viewBox="0 0 220 200" className="gn-svg" role="img" aria-label="กราฟเรดาร์ 5 แกน">
          {[0.25, 0.5, 0.75, 1].map(f => <polygon key={f} points={ring(f)} className="gn-ring" />)}
          {axes.map((_, i) => <line key={i} x1={cx} y1={cy} x2={pt(i, R)[0]} y2={pt(i, R)[1]} className="gn-ring" />)}
          <polygon points={poly} className="gn-area" />
          {axes.map((a, i) => <text key={a.id} x={pt(i, R + 14)[0]} y={pt(i, R + 14)[1]} className="gn-lbl" textAnchor="middle" dominantBaseline="middle">{a.label.split(' ')[0]}</text>)}
        </svg>
        <ul className="gn-list">
          {axes.map(a => (
            <li key={a.id}>
              <b>{a.label}</b> <em>{a.score === null ? 'ยังไม่พอ' : `${a.score}`}</em>
              <span>{a.basis}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

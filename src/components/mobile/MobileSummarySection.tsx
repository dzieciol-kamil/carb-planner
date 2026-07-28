import { absCap, fmtHM, planExtras, planSummary, rateStats } from '../../domain/fuel';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';

export function MobileSummarySection() {
  const route = useAppStore((s) => s.route);
  const mix = useAppStore((s) => s.mix);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const foods = useAppStore((s) => s.foods);
  const foodLib = useAppStore((s) => s.foodLib);
  const lang = useAppStore((s) => s.ui.lang);
  const strings = t(lang);

  const planState = { route, mix, gear, fills, foods, foodLib };
  const summary = planSummary(planState);
  const extras = planExtras(planState);
  const dryStretch = rateStats(planState).dryStretch;
  const cap = absCap(mix);
  const gap = summary.totalCarbs - summary.target;

  const rows: { label: string; value: string }[] = [
    { label: strings.tTarget, value: `${summary.target.toFixed(0)} g` },
    { label: strings.tCarbs, value: `${summary.totalCarbs.toFixed(0)} g` },
    { label: strings.tAbsorbed, value: `${summary.absorbedTotal.toFixed(0)} g` },
    { label: strings.tCap, value: `${cap} g/h` },
    { label: strings.tGutPeak, value: `${extras.gutPeak.g.toFixed(0)} g` },
    { label: strings.tDry, value: dryStretch.len > 0.05 ? `${fmtHM(dryStretch.len)} h` : '—' },
    { label: strings.tGap, value: `${gap >= 0 ? '+' : ''}${gap.toFixed(0)} g` },
    { label: strings.tDrink, value: `${(summary.izoCarbs + summary.gelCarbs).toFixed(0)} g` },
    { label: strings.tSolid, value: `${summary.foodCarbs.toFixed(0)} g` },
    { label: strings.tPortions, value: `${extras.gelPortions}` },
    { label: strings.tRefills, value: `${extras.refillTotal}×` },
    { label: strings.tKcal, value: `${(summary.totalCarbs * 4).toFixed(0)} kcal` },
  ];

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 16, padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{strings.summary}</div>
      {rows.map((r) => (
        <div key={r.label} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F0F1ED' }}>
          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{r.label}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600 }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

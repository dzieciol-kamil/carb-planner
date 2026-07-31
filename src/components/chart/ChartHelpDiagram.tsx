import type { CSSProperties, ReactNode } from 'react';
import type { YMode } from '../../store/appStore';
import type { StringTable } from '../../i18n/strings';
import { CHART_COLORS } from './theme';

interface ChartHelpDiagramProps {
  mode: YMode;
  strings: StringTable;
}

interface Callout {
  n: number;
  x: number;
  y: number;
  color: string;
  label: string;
  body: string;
}

const VIEW_W = 400;
const VIEW_H = 230;

// Fixed, hand-authored demo shapes — deliberately not derived from any live or store
// data (see the "Why a static diagram" note in the plan's Global Constraints).
const NEED_PTS: [number, number][] = [
  [30, 200], [80, 150], [130, 120], [180, 105], [230, 98], [280, 95], [330, 93], [380, 91],
];
const ABSORBED_PTS: [number, number][] = [
  [30, 200], [55, 185], [80, 195], [105, 175], [130, 190], [155, 165], [180, 180],
  [205, 150], [230, 145], [255, 115], [280, 100], [330, 90], [380, 80],
];
const GUT_PTS: [number, number][] = [
  [30, 40], [70, 30], [110, 38], [150, 34], [190, 26], [230, 32], [270, 28], [310, 20], [350, 24], [380, 22],
];
const SUM_ABSORBED_PTS: [number, number][] = [
  [30, 200], [80, 175], [130, 155], [180, 140], [230, 125], [280, 105], [330, 85], [380, 60],
];
const SUM_NEED_PTS: [number, number][] = [
  [30, 200], [80, 165], [130, 135], [180, 110], [230, 90], [280, 72], [330, 58], [380, 45],
];
const SUM_INTAKE_PTS: [number, number][] = [
  [30, 200], [80, 170], [130, 145], [180, 120], [230, 95], [280, 75], [330, 55], [380, 35],
];
const CAP_Y = 70;
const GUT_LIMIT_Y = 14;
const GUT_BASE_Y = 48;
const DEFICIT_FILL = 'M30,200 L80,150 L130,120 L180,105 L230,98 L230,145 L205,150 L180,180 L155,165 L130,190 L105,175 L80,195 L55,185 L30,200 Z';

function pathFrom(pts: [number, number][]): string {
  return pts.map(([x, y], i) => (i ? 'L' : 'M') + x + ',' + y).join(' ');
}

function marker(n: number, x: number, y: number, color: string) {
  return (
    <g key={'m' + n}>
      <circle cx={x} cy={y} r={9} fill="#fff" stroke={color} strokeWidth={1.6} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily="'JetBrains Mono', monospace" fill={color}>
        {n}
      </text>
    </g>
  );
}

function frame(children: ReactNode) {
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {children}
    </svg>
  );
}

function rateDiagram(strings: StringTable) {
  const callouts: Callout[] = [
    { n: 1, x: 255, y: 115, color: CHART_COLORS.carb, label: strings.absorbed, body: strings.chartHelpAbsorbedBody },
    { n: 2, x: 330, y: 93, color: CHART_COLORS.neutralLine, label: strings.need, body: strings.chartHelpNeedBody },
    { n: 3, x: 110, y: 178, color: CHART_COLORS.climb, label: strings.chartHelpDeficitLabel, body: strings.chartHelpDeficitBody },
    { n: 4, x: 350, y: 70, color: CHART_COLORS.carb, label: strings.legCap, body: strings.chartHelpCapBody },
    { n: 5, x: 200, y: 34, color: '#B08E1E', label: strings.gutLane, body: strings.chartHelpGutBody },
  ];
  const svg = frame(
    <>
      <path d={pathFrom(GUT_PTS) + ` L${GUT_PTS[GUT_PTS.length - 1][0]},${GUT_BASE_Y} L${GUT_PTS[0][0]},${GUT_BASE_Y} Z`} fill="#C9A227" opacity={0.18} />
      <path d={pathFrom(GUT_PTS)} fill="none" stroke="#B08E1E" strokeWidth={1.6} />
      <line x1={30} x2={380} y1={GUT_LIMIT_Y} y2={GUT_LIMIT_Y} stroke={CHART_COLORS.climb} strokeWidth={1} strokeDasharray="4 4" opacity={0.7} />
      <line x1={30} x2={380} y1={GUT_BASE_Y} y2={GUT_BASE_Y} stroke="#E3E5E0" strokeWidth={1} />
      <path d={DEFICIT_FILL} fill={CHART_COLORS.climb} opacity={0.16} />
      <line x1={30} x2={380} y1={CAP_Y} y2={CAP_Y} stroke={CHART_COLORS.carb} strokeWidth={1} strokeDasharray="3 5" opacity={0.8} />
      <path d={pathFrom(NEED_PTS)} fill="none" stroke="#A8AEA9" strokeWidth={2} strokeDasharray="6 5" />
      <path d={pathFrom(ABSORBED_PTS)} fill="none" stroke={CHART_COLORS.carb} strokeWidth={2.8} />
      {callouts.map((c) => marker(c.n, c.x, c.y, c.color))}
    </>,
  );
  return { svg, callouts };
}

function fluidDiagram(strings: StringTable) {
  const callouts: Callout[] = [
    { n: 1, x: 255, y: 115, color: CHART_COLORS.water, label: strings.legFluid, body: strings.chartHelpFluidAbsorbedBody },
    { n: 2, x: 330, y: 93, color: CHART_COLORS.neutralLine, label: strings.legSweat, body: strings.chartHelpSweatBody },
    { n: 3, x: 350, y: 70, color: CHART_COLORS.water, label: strings.legCap, body: strings.chartHelpCapBody },
  ];
  const svg = frame(
    <>
      <line x1={30} x2={380} y1={CAP_Y} y2={CAP_Y} stroke={CHART_COLORS.water} strokeWidth={1} strokeDasharray="3 5" opacity={0.8} />
      <path d={pathFrom(NEED_PTS)} fill="none" stroke="#A8AEA9" strokeWidth={2} strokeDasharray="6 5" />
      <path d={pathFrom(ABSORBED_PTS)} fill="none" stroke={CHART_COLORS.water} strokeWidth={2.8} />
      {callouts.map((c) => marker(c.n, c.x, c.y, c.color))}
    </>,
  );
  return { svg, callouts };
}

function sumDiagram(strings: StringTable) {
  const callouts: Callout[] = [
    { n: 1, x: 280, y: 105, color: CHART_COLORS.carb, label: strings.absorbed, body: strings.chartHelpSumAbsorbedBody },
    { n: 2, x: 330, y: 58, color: CHART_COLORS.neutralLine, label: strings.need, body: strings.chartHelpSumNeedBody },
    { n: 3, x: 230, y: 95, color: CHART_COLORS.gel, label: strings.intake, body: strings.chartHelpSumIntakeBody },
  ];
  const svg = frame(
    <>
      <path d={pathFrom(SUM_NEED_PTS)} fill="none" stroke="#A8AEA9" strokeWidth={2} strokeDasharray="6 5" />
      <path d={pathFrom(SUM_INTAKE_PTS)} fill="none" stroke={CHART_COLORS.gel} strokeWidth={1.2} strokeDasharray="2 4" opacity={0.7} />
      <path d={pathFrom(SUM_ABSORBED_PTS)} fill="none" stroke={CHART_COLORS.carb} strokeWidth={2.8} />
      {callouts.map((c) => marker(c.n, c.x, c.y, c.color))}
    </>,
  );
  return { svg, callouts };
}

const listItemStyle: CSSProperties = { display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink-soft)' };
const badgeStyle = (color: string): CSSProperties => ({
  flexShrink: 0,
  width: 18,
  height: 18,
  borderRadius: '50%',
  border: `1.6px solid ${color}`,
  color,
  fontSize: 10,
  fontWeight: 700,
  fontFamily: "'JetBrains Mono', monospace",
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export function ChartHelpDiagram({ mode, strings }: ChartHelpDiagramProps) {
  const { svg, callouts } = mode === 'fluid' ? fluidDiagram(strings) : mode === 'sum' ? sumDiagram(strings) : rateDiagram(strings);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {svg}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {callouts.map((c) => (
          <div key={c.n} style={listItemStyle}>
            <span style={badgeStyle(c.color)}>{c.n}</span>
            <span>
              <b>{c.label}</b> — {c.body}
            </span>
          </div>
        ))}
      </div>
      <span style={{ fontSize: 11.5, lineHeight: 1.5, color: 'var(--muted)' }}>{strings.chartHelpScrubNote}</span>
    </div>
  );
}

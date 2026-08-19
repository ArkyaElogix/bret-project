import { View, Svg, Rect, Text as PdfText, Line } from '@react-pdf/renderer';
import { colors, barColors } from './reportPDFStyles';
import React from 'react';
type BarDatum = {
  label: string;
  score: number;
  color?: string | null;
};

const CHART_HEIGHT = 130;
const CHART_WIDTH = 190;
const BAR_GAP = 8;
const AXIS_LABEL_WIDTH = 16;

export function PdfBarChart({ data }: { data: BarDatum[] }) {
  const barAreaWidth = CHART_WIDTH - AXIS_LABEL_WIDTH;
  const barWidth = (barAreaWidth - BAR_GAP * Math.max(0, data.length - 1)) / Math.max(1, data.length);

  return (
    <View>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 14}>
        {[0, 1, 2, 3, 4, 5].map((tick) => {
          const y = CHART_HEIGHT - (tick / 5) * CHART_HEIGHT;
          return (
            <PdfText
              key={`tick-${tick}`}
              x={0}
              y={y + 3}
              style={{ fontSize: 6.5, fill: '#41474e' }}
            >
              {tick}
            </PdfText>
          );
        })}

        <Line
          x1={AXIS_LABEL_WIDTH}
          y1={0}
          x2={AXIS_LABEL_WIDTH}
          y2={CHART_HEIGHT}
          stroke={colors.border}
          strokeWidth={1}
        />

        {data.map((d, i) => {
          const barHeight = Math.max(10, Math.round((d.score / 5) * CHART_HEIGHT));
          const x = AXIS_LABEL_WIDTH + i * (barWidth + BAR_GAP);
          const y = CHART_HEIGHT - barHeight;
          const fill = d.color ?? barColors[i % barColors.length];

          return (
            <React.Fragment key={d.label}>
              <Rect x={x} y={y} width={barWidth} height={barHeight} fill={fill} rx={3} ry={3} />
              <PdfText
                x={x + barWidth / 2}
                y={CHART_HEIGHT + 11}
                style={{ fontSize: 6.5, fill: colors.slate600, fontWeight: 700, textAnchor: 'middle' }}
              >
                {d.label.length > 12 ? `${d.label.slice(0, 11)}…` : d.label}
              </PdfText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
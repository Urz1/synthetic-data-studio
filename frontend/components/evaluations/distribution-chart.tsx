"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Info } from "lucide-react"

interface DistributionChartProps {
  data: {
    labels: string[]
    real: number[]
    synth: number[]
  }
  height?: number
  columnName?: string
}

function isLikelyIdentifier(columnName?: string): boolean {
  if (!columnName) return false
  const name = columnName.toLowerCase()
  const patterns = [
    /^id$/i, /_id$/i, /^uuid$/i, /email/i, /phone/i, /^ssn$/i,
    /^name$/i, /first.*name/i, /last.*name/i, /full.*name/i,
    /customer/i, /user/i, /account/i, /transaction/i,
  ]
  return patterns.some(p => p.test(name))
}

export function DistributionChart({ data, height = 300, columnName }: DistributionChartProps) {
  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground h-full min-h-[200px] border rounded bg-muted/20">
        No distribution data available
      </div>
    )
  }

  const isHighCardinality = data.labels.length > 20
  const isIdentifier = isLikelyIdentifier(columnName)

  const chartData = data.labels.map((label, i) => ({
    name: label,
    Real: data.real[i] || 0,
    Synthetic: data.synth[i] || 0,
  }))

  // High-contrast colors that work in BOTH light and dark mode
  const REAL_COLOR = "#3b82f6"      // Blue-500 - visible on both
  const SYNTHETIC_COLOR = "#10b981" // Emerald-500 - visible on both
  const AXIS_COLOR = "#94a3b8"      // Slate-400 - good contrast both modes
  const GRID_COLOR = "#475569"      // Slate-600 - subtle grid

  return (
    <div className="w-full" style={{ minHeight: height }}>
      {columnName && (
        <h4 className="text-sm font-medium mb-2 text-center truncate" title={columnName}>
          {columnName}
        </h4>
      )}
      
      {(isHighCardinality || isIdentifier) && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground mb-3 bg-muted p-2 rounded mx-2">
          <Info className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
          <span>
            {isIdentifier 
              ? "Identifier column — synthetic values intentionally differ for privacy."
              : "High-cardinality — many unique values, distribution differences expected."}
          </span>
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height - (isHighCardinality || isIdentifier ? 60 : 30)}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={GRID_COLOR}
            strokeOpacity={0.3} 
          />
          <XAxis 
            dataKey="name" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            tick={{ fill: AXIS_COLOR }}
            tickFormatter={(value) => value.length > 8 ? `${value.substring(0, 6)}…` : value}
            angle={-45}
            textAnchor="end"
            height={50}
            interval={isHighCardinality ? "preserveStartEnd" : 0}
          />
          <YAxis 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            tick={{ fill: AXIS_COLOR }}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            width={35}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [`${(value * 100).toFixed(1)}%`, name]}
            contentStyle={{ 
              backgroundColor: '#1e293b',  // Slate-800 - dark tooltip
              borderColor: '#334155',       // Slate-700
              color: '#f1f5f9',             // Slate-100
              fontSize: '12px',
              borderRadius: '6px',
            }}
            labelStyle={{ color: '#f1f5f9' }}
            cursor={{ fill: '#334155', opacity: 0.5 }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) => <span className="text-foreground">{value}</span>}
          />
          <Bar 
            dataKey="Real" 
            fill={REAL_COLOR}
            radius={[3, 3, 0, 0]} 
            maxBarSize={isHighCardinality ? 8 : 40}
          />
          <Bar 
            dataKey="Synthetic" 
            fill={SYNTHETIC_COLOR}
            radius={[3, 3, 0, 0]} 
            maxBarSize={isHighCardinality ? 8 : 40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

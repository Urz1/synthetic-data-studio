"use client"

import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts"

interface ScoreGaugeProps {
  score: number // 0-100
  size?: number
  label?: string
}

function getQualityLevel(score: number): { text: string; color: string } {
  if (score >= 85) return { text: "EXCELLENT", color: "#10b981" } // Emerald
  if (score >= 70) return { text: "GOOD", color: "#3b82f6" }      // Blue
  if (score >= 50) return { text: "FAIR", color: "#f59e0b" }      // Amber
  return { text: "POOR", color: "#ef4444" }                       // Red
}

export function ScoreGauge({ score, size = 140, label = "Overall Quality" }: ScoreGaugeProps) {
  const quality = getQualityLevel(score)
  
  const data = [
    {
      name: "score",
      value: score,
      fill: quality.color,
    },
  ]

  return (
    <div className="flex flex-col items-center" style={{ width: size, height: size + 50 }}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background ring */}
        <div 
          className="absolute inset-0 rounded-full border-[10px] border-muted/30"
          style={{ width: size, height: size }}
        />
        
        {/* Chart */}
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            barSize={10}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: "transparent" }}
              dataKey="value"
              cornerRadius={5}
              angleAxisId={0}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span 
            className="text-3xl font-bold"
            style={{ color: quality.color }}
          >
            {score.toFixed(0)}%
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Score
          </span>
        </div>
      </div>
      
      {/* Label below */}
      <div className="text-center mt-2">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <span 
          className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full mt-1"
          style={{ 
            backgroundColor: `${quality.color}20`,
            color: quality.color,
          }}
        >
          {quality.text}
        </span>
      </div>
    </div>
  )
}

'use client';
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

interface RadarDataPoint {
  metric: string;
  player1: number;
  player2: number;
  fullMark: number;
}

interface Props {
  player1Name: string;
  player2Name: string;
  data: RadarDataPoint[];
}

export default function PlayerRadarChart({ player1Name, player2Name, data }: Props) {
  return (
    <div className="my-4 p-4 rounded-2xl bg-[#141618] border border-emerald-500/30 shadow-xl font-sans text-center">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-800">
        <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
          <span>🕸️</span>
          <span>مخطط الرادار الإحصائي (DataMB Radar Style)</span>
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/40">
          AiFBall Pro
        </span>
      </div>

      <div className="w-full h-[320px] sm:h-[380px] flex justify-center items-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="metric" stroke="#9CA3AF" tick={{ fill: '#E5E7EB', fontSize: 11, fontWeight: 'bold' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#4B5563" />
            <Radar name={player1Name} dataKey="player1" stroke="#10B981" fill="#10B981" fillOpacity={0.5} />
            <Radar name={player2Name} dataKey="player2" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.4} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

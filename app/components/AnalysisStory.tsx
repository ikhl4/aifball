'use client';
import React from 'react';
import type { AnalysisStoryData } from '../../lib/analysis-story';
import AnalysisPitch from './AnalysisPitch';
const paragraphs=(text:string)=>text.split(/\n+/).filter(Boolean).map((p,i)=><p key={i} className="leading-8 mb-3 whitespace-pre-wrap">{p}</p>);
export default function AnalysisStory({data,isDark=true}:{data:AnalysisStoryData;isDark?:boolean}) {
  return <article dir="rtl" aria-label="تحليل تكتيكي متسلسل" className={`w-full min-w-0 text-sm ${isDark?'text-gray-200':'text-gray-800'}`}>
    <header className="mb-5"><p className="text-xs text-emerald-500 font-bold mb-2">{data.mode==='sourced'?'تحليل مع مراجع':'شرح تكتيكي تعليمي'}</p><h2 className={`text-xl font-black mb-3 ${isDark?'text-white':'text-gray-900'}`}>{data.title}</h2><p className={`text-xs border-r-2 border-emerald-500 pr-3 mb-4 leading-7 ${isDark?'text-gray-400':'text-gray-600'}`}>{data.scope}</p>{paragraphs(data.intro)}</header>
    {data.sections.map((section,i)=><section key={i} aria-label={section.title} className="mt-6 border-t border-emerald-500/20 pt-4"><h3 className="text-lg font-bold text-emerald-500 mb-3">{i+1}. {section.title}</h3>{paragraphs(section.explanation)}{section.board && <AnalysisPitch key={`${i}-${section.board.caption}`} {...section.board} isDark={isDark}/>}<div className="mt-3">{paragraphs(section.after)}</div></section>)}
    {data.sources.length>0 && <footer className="mt-6 border-t border-emerald-500/20 pt-4"><h3 className="font-bold mb-2">مراجع الرد</h3><ul className="space-y-2">{data.sources.map((s,i)=><li key={i}><a href={s.url} target="_blank" rel="noopener noreferrer" className="text-emerald-500 underline break-words">{s.title} ↗</a></li>)}</ul></footer>}
  </article>;
}

'use client';
import React,{useEffect,useRef,useState} from 'react';
import AppIcon from './AppIcon';
import {splitAnalysisStory} from '../../lib/analysis-story';
export default function ReadAloudButton({content}:{content:string}){
 const [supported,setSupported]=useState(false),[reading,setReading]=useState(false),[notice,setNotice]=useState('');const own=useRef<SpeechSynthesisUtterance|null>(null);
 useEffect(()=>{setSupported('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);return()=>{if(own.current){own.current.onend=null;own.current.onerror=null;window.speechSynthesis?.cancel();}};},[]);
 const speak=()=>{if(!supported)return;if(reading){window.speechSynthesis.cancel();own.current=null;setReading(false);return;}
 const text=splitAnalysisStory(content).map(p=>p.kind==='story'?[p.data.title,p.data.intro,...p.data.sections.flatMap(s=>[s.title,s.explanation,s.after])].join('\n'):p.kind==='text'?p.text:'').join('\n').replace(/```[\s\S]*?(?:```|$)/g,'').replace(/<[^>]*>/g,'').replace(/[*#_]/g,'').trim().slice(0,20000);
 if(!text){setNotice('لا يتوفر نص مناسب للقراءة');return;}
 window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang=/[\u0600-\u06ff]/.test(text)?'ar-SA':'en-US';utterance.onend=()=>{own.current=null;setReading(false);};utterance.onerror=e=>{own.current=null;setReading(false);if(e.error!=='canceled'&&e.error!=='interrupted')setNotice('تعذر تشغيل القراءة على هذا الجهاز');};own.current=utterance;setNotice('');setReading(true);window.speechSynthesis.speak(utterance);};
 return <span className="inline-flex items-center"><button type="button" onClick={speak} disabled={!supported} aria-label={reading?'إيقاف القراءة':'قراءة الرد صوتياً'} aria-pressed={reading} title={!supported?'القراءة الصوتية غير متاحة في هذا المتصفح':reading?'إيقاف القراءة':'قراءة الرد صوتياً'} className="p-2 rounded-lg hover:bg-emerald-500/10 text-gray-400 disabled:opacity-40"><AppIcon name={reading?'stop':'volume'}/></button>{notice&&<span role="status" className="text-xs text-amber-500">{notice}</span>}</span>;
}

import { completedAnalysisFields } from './analysis-partial';
export type StoryPlayer = { id: string; number: string; side: 'team' | 'opponent'; x: number; y: number; role: string };
export type StoryFrame = { title: string; note: string; players: StoryPlayer[]; ball: [number, number]; arrows: { from: string; to: string | [number, number]; kind: 'pass' | 'run' | 'shot' }[] };
export type AnalysisStoryData = { title: string; scope: string; mode: 'sourced' | 'illustrative'; intro: string; sections: { title: string; explanation: string; after: string; board?: { caption: string; frames: StoryFrame[] } }[]; sources: { title: string; url: string }[] };
const record = (v: unknown): v is Record<string, any> => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const coordinate = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max;
function source(v: unknown): v is {title:string;url:string} {
  if (!record(v) || !text(v.title,200) || typeof v.url !== 'string' || v.url.length > 2000) return false;
  try { const u=new URL(v.url); return u.protocol==='https:' && !u.username && !u.password && u.hostname.includes('.') && !/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.)/.test(u.hostname); } catch { return false; }
}
export function validateAnalysisStory(v: unknown): AnalysisStoryData | null {
  try { const encoded=JSON.stringify(v); if(!encoded || encoded.length>100000) return null; v=JSON.parse(encoded); } catch { return null; }
  if (!record(v) || !text(v.title,160) || !text(v.scope,400) || !['sourced','illustrative'].includes(v.mode) || !text(v.intro,3000) || !Array.isArray(v.sections) || v.sections.length<1 || v.sections.length>6 || !Array.isArray(v.sources) || v.sources.length>10 || !v.sources.every(source) || (v.mode==='sourced' && !v.sources.length)) return null;
  for (const s of v.sections) {
    if (!record(s) || !text(s.title,160) || !text(s.explanation,4000) || !text(s.after,3000)) return null;
    if (s.board !== undefined) {
      const b=s.board;
      if (!record(b) || !text(b.caption,500) || !Array.isArray(b.frames) || b.frames.length<1 || b.frames.length>4) return null;
      for (const f of b.frames) {
        if (!record(f) || !text(f.title,140) || !text(f.note,700) || !Array.isArray(f.players) || f.players.length<1 || f.players.length>22 || !Array.isArray(f.ball) || f.ball.length!==2 || !coordinate(f.ball[0],105) || !coordinate(f.ball[1],68) || !Array.isArray(f.arrows) || f.arrows.length>24) return null;
        const ids=new Set<string>(); const sides={team:0,opponent:0};
        for (const p of f.players) {
          if (!record(p) || !text(p.id,40) || ids.has(p.id) || !text(p.number,40) || !text(p.role,80) || !['team','opponent'].includes(p.side) || !coordinate(p.x,105) || !coordinate(p.y,68)) return null;
          ids.add(p.id); sides[p.side as 'team'|'opponent']++;
        }
        if (sides.team>11 || sides.opponent>11) return null;
        for (const a of f.arrows) {
          if (!record(a) || !ids.has(a.from) || !['pass','run','shot'].includes(a.kind)) return null;
          if (typeof a.to === 'string' && !ids.has(a.to)) {
            const point=a.to.match(/^(\d{1,3}(?:\.\d+)?)\s*,\s*(\d{1,3}(?:\.\d+)?)$/);
            if (point) a.to=[Number(point[1]),Number(point[2])];
          }
          if (Array.isArray(a.to)) { if(a.to.length!==2 || !coordinate(a.to[0],105) || !coordinate(a.to[1],68)) return null; }
          else if(!ids.has(a.to)) return null;
        }
      }
    }
  }
  return v as AnalysisStoryData;
}
export type StoryPart = { kind:'text'; text:string } | {kind:'story'; data:AnalysisStoryData} | {kind:'pending'; data?:AnalysisStoryData; text?:string} | {kind:'invalid'; text?:string};
export function splitAnalysisStory(answer: string): StoryPart[] {
  const parts: StoryPart[]=[]; const opening=/(?:^|\n)```aifball-analysis[ \t]*\r?\n/g;
  let cursor=0, match:RegExpExecArray|null;
  while ((match=opening.exec(answer))) {
    if (match.index>cursor) parts.push({kind:'text',text:answer.slice(cursor,match.index)});
    const start=opening.lastIndex; const ending=/\r?\n```[ \t]*(?=\r?\n|$)/g; ending.lastIndex=start; const close=ending.exec(answer);
    if (!close) {
      const raw=answer.slice(start);const fields=raw.length<=100000?completedAnalysisFields(raw):{};
      let full:AnalysisStoryData|null=null;
      try { full=validateAnalysisStory(JSON.parse(raw)); } catch {}
      if(full){parts.push({kind:'story',data:full});return parts;}
      const partial=validateAnalysisStory(fields);
      const prose:string[]=[];
      for(const key of ['title','scope','intro'])if(text(fields[key],4000))prose.push(fields[key] as string);
      if(Array.isArray(fields.sections))for(const section of fields.sections)if(record(section))for(const key of ['title','explanation','after'])if(text(section[key],4000))prose.push(section[key]);
      parts.push({kind:'pending',...(partial?{data:partial}:{text:prose.join('\n\n')})});return parts;
    }
    const raw=answer.slice(start,close.index);
    let data:AnalysisStoryData|null=null; let fallback='';
    if(raw.length<=100000) { try {
      const parsed=JSON.parse(raw); data=validateAnalysisStory(parsed);
      if(!data && record(parsed)) {
        const lines:string[]=[];
        for(const key of ['title','scope','intro']) if(text(parsed[key],4000)) lines.push(parsed[key]);
        if(Array.isArray(parsed.sections)) for(const section of parsed.sections.slice(0,6)) if(record(section)) for(const key of ['title','explanation','after']) if(text(section[key],4000)) lines.push(section[key]);
        fallback=lines.join('\n\n');
      }
    } catch {} }
    parts.push(data?{kind:'story',data}:{kind:'invalid',text:fallback});
    cursor=ending.lastIndex; opening.lastIndex=cursor;
  }
  if(cursor<answer.length)parts.push({kind:'text',text:answer.slice(cursor)});
  return parts;
}
export function isAnalysisRequest(query:string):boolean {
  const q=query.normalize('NFD').replace(/[\u064b-\u065f]/g,'').toLowerCase();
  return /حلل|تحليل|اسلوب|تكتيك|طريقة لعب|طريقه لعب|حالة دفاع|حاله دفاع|الكرات الثابتة|كيف.*(?:يضغط|يدافع|يبني|يلعب)|tactical|analyse|analyze|playing style/.test(q);
}
export function analysisModeForQuery(query:string, previousAnswer=''):boolean {
  if (isAnalysisRequest(query)) return true;
  if (!previousAnswer.includes('```aifball-analysis')) return false;
  const q=query.normalize('NFD').replace(/[\u064b-\u065f]/g,'');
  if (/ترتيب|جدول|احصائيات|نتيجة|تمرين|مكتبة|هداف|من فاز/.test(q)) return false;
  return /دفاع|هجوم|ضغط|بناء|ثابت|تحول|اشرح|وضح|لماذا|ليش|كيف|واذا/.test(q);
}

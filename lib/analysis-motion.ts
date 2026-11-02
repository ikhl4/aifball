import type { StoryFrame } from './analysis-story';
// Interpolate only matching identities. New/removed players are never assigned invented paths.
export function interpolateAnalysisFrame(from: StoryFrame, to: StoryFrame, progress: number): StoryFrame {
  const t=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0));
  const mix=(a:number,b:number)=>a+(b-a)*t;
  return {...to, players:to.players.map(p=>{const old=from.players.find(x=>x.id===p.id && x.side===p.side);return old?{...p,x:mix(old.x,p.x),y:mix(old.y,p.y)}:p;}),ball:[mix(from.ball[0],to.ball[0]),mix(from.ball[1],to.ball[1])]};
}
export function analysisStep(current:number, action:'next'|'previous'|'restart', length:number):number {
  const last=Math.max(0,length-1);
  return action==='restart'?0:Math.max(0,Math.min(last,current+(action==='next'?1:-1)));
}

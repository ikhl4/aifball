// Reads only completed JSON values. Unfinished strings/objects never become diagram data.
function valueEnd(raw:string,start:number):number|null {
  let quote=false,escape=false; const stack:string[]=[];
  for(let i=start;i<raw.length;i++){
    const c=raw[i];
    if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"'){quote=false;if(!stack.length)return i+1;}continue;}
    if(c==='"'){quote=true;continue;}
    if(c==='{'||c==='['){stack.push(c);continue;}
    if(c==='}'||c===']'){if(!stack.length)return i;stack.pop();if(!stack.length)return i+1;}
    if(!stack.length&&(c===','||/\s/.test(c)))return i;
  }
  return null;
}
const skip=(s:string,i:number)=>{while(i<s.length&&/\s/.test(s[i]))i++;return i;};
export function completedAnalysisFields(raw:string):Record<string,unknown> {
  const fields:Record<string,unknown>={}; let i=skip(raw,0);
  if(raw[i++]!=='{')return fields;
  while(i<raw.length){
    i=skip(raw,i); if(raw[i]===',')i=skip(raw,i+1); if(raw[i]!== '"')break;
    const keyEnd=valueEnd(raw,i);if(keyEnd===null)break;
    let key:string;try{key=JSON.parse(raw.slice(i,keyEnd));}catch{break;}
    i=skip(raw,keyEnd);if(raw[i++]!==':')break;i=skip(raw,i);
    if(key==='sections'&&raw[i]==='['){
      const sections:unknown[]=[];let j=skip(raw,i+1);
      while(j<raw.length&&sections.length<6){
        if(raw[j]===']')break;if(raw[j]!== '{')break;
        const end=valueEnd(raw,j);if(end===null)break;
        try{sections.push(JSON.parse(raw.slice(j,end)));}catch{break;}
        j=skip(raw,end);if(raw[j]===',')j=skip(raw,j+1);else break;
      }
      fields.sections=sections;
    }
    const end=valueEnd(raw,i);if(end===null)break;
    if(['title','scope','mode','intro','sources','sections'].includes(key)){
      try{fields[key]=JSON.parse(raw.slice(i,end));}catch{break;}
    }
    i=skip(raw,end);if(raw[i]!==',')break;
  }
  return fields;
}

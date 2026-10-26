import {SchemeTonalSpot,Hct,argbFromHex,hexFromArgb,MaterialDynamicColors} from '@material/material-color-utilities';
window.SkyThemeColors=(hex,dark,contrast)=>{
 const scheme=new SchemeTonalSpot(Hct.fromInt(argbFromHex(hex)),dark,contrast);
 return Object.fromEntries(['primary','onPrimary','primaryContainer','onPrimaryContainer','secondary','secondaryContainer','onSecondaryContainer','tertiary','tertiaryContainer','onTertiaryContainer','surface','surfaceContainerLowest','surfaceContainerLow','surfaceContainer','surfaceContainerHigh','surfaceContainerHighest','onSurface','onSurfaceVariant','outline','outlineVariant','error','onError','errorContainer','onErrorContainer'].map(k=>[k,hexFromArgb(MaterialDynamicColors[k].getArgb(scheme))]));
};
// Shared contrast adaptation preserves hue; scientific values and geometry are untouched.
const inkCache=new Map();
const luminance=hex=>{const channels=hex.slice(1,7).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
window.SkyThemePaint={
 foreground:bg=>contrast('#000000',bg)>=contrast('#ffffff',bg)?'#000000':'#ffffff',
 mix:(a,b,amount)=>'#'+[0,1,2].map(i=>Math.round(parseInt(a.slice(1+i*2,3+i*2),16)*(1-amount)+parseInt(b.slice(1+i*2,3+i*2),16)*amount).toString(16).padStart(2,'0')).join(''),
 readable(color,bg,minimum=4.5){
  if(!/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(color))return color;
  const key=color+bg+minimum;if(inkCache.has(key))return inkCache.get(key);
  const base=color.slice(0,7);let result=base;
  if(contrast(base,bg)<minimum){
   const original=Hct.fromInt(argbFromHex(base));let distance=Infinity;
   for(let tone=0;tone<=100;tone++){const candidate=hexFromArgb(Hct.from(original.hue,original.chroma,tone).toInt());if(contrast(candidate,bg)>=minimum&&Math.abs(tone-original.tone)<distance){result=candidate;distance=Math.abs(tone-original.tone);}}
  }
  if(color.length===9&&minimum<4.5)result+=color.slice(7);
  if(inkCache.size>512)inkCache.clear();inkCache.set(key,result);return result;
 }
};

import {SchemeTonalSpot,Hct,argbFromHex,hexFromArgb,MaterialDynamicColors} from '@material/material-color-utilities';
window.SkyThemeColors=(hex,dark,contrast)=>{
 const scheme=new SchemeTonalSpot(Hct.fromInt(argbFromHex(hex)),dark,contrast);
 return Object.fromEntries(['primary','onPrimary','primaryContainer','onPrimaryContainer','secondary','secondaryContainer','onSecondaryContainer','tertiary','tertiaryContainer','onTertiaryContainer','surface','surfaceContainerLowest','surfaceContainerLow','surfaceContainer','surfaceContainerHigh','surfaceContainerHighest','onSurface','onSurfaceVariant','outline','outlineVariant','error','onError','errorContainer','onErrorContainer'].map(k=>[k,hexFromArgb(MaterialDynamicColors[k].getArgb(scheme))]));
};

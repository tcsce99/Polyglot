// Minimal PNG writer + flat "globe" icon generator.
const zlib = require("zlib"), fs = require("fs");
function crc32(buf){let c,t=[];for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c;}let r=0xFFFFFFFF;for(const b of buf)r=t[(r^b)&0xFF]^(r>>>8);return (r^0xFFFFFFFF)>>>0;}
function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const td=Buffer.concat([Buffer.from(type),data]);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(td));return Buffer.concat([len,td,crc]);}
function png(w,h,px){const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;const raw=Buffer.alloc(h*(1+w*4));for(let y=0;y<h;y++){raw[y*(1+w*4)]=0;px.copy(raw,y*(1+w*4)+1,y*w*4,(y+1)*w*4);}return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ihdr),chunk("IDAT",zlib.deflateSync(raw,{level:9})),chunk("IEND",Buffer.alloc(0))]);}
function make(size,file){
  const px=Buffer.alloc(size*size*4);
  const bg=[13,17,23],fg=[76,195,138],hi=[110,231,168];
  const set=(x,y,c,a)=>{if(x<0||y<0||x>=size||y>=size)return;const i=(y*size+x)*4;const al=a==null?1:a;px[i]=Math.round(px[i]*(1-al)+c[0]*al);px[i+1]=Math.round(px[i+1]*(1-al)+c[1]*al);px[i+2]=Math.round(px[i+2]*(1-al)+c[2]*al);px[i+3]=255;};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4;px[i]=bg[0];px[i+1]=bg[1];px[i+2]=bg[2];px[i+3]=255;}
  const cx=size/2,cy=size/2,R=size*0.34,T=size*0.028;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const dx=x-cx,dy=y-cy,d=Math.sqrt(dx*dx+dy*dy);
    // outer ring
    if(Math.abs(d-R)<T)set(x,y,fg,Math.min(1,(T-Math.abs(d-R))/(T*0.4)));
    if(d<R){
      // equator + tropics
      for(const fy of [0,-0.5,0.5]){
        const ly=cy+fy*R;const halfw=Math.sqrt(Math.max(0,R*R-(ly-cy)*(ly-cy)));
        if(Math.abs(y-ly)<T*0.7&&Math.abs(dx)<halfw)set(x,y,fg,0.9);
      }
      // meridians (ellipses)
      for(const fx of [0.45,1]){
        const a=R*fx,b=R;const v=(dx*dx)/(a*a)+(dy*dy)/(b*b);
        if(Math.abs(v-1)<0.09*(0.5/fx))set(x,y,fx===1?fg:hi,0.85);
      }
      if(Math.abs(dx)<T*0.7)set(x,y,hi,0.85); // central meridian
    }
  }
  // speech-dot accent bottom-right
  const bx=cx+R*0.95,by=cy+R*0.95,br=size*0.09;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const dx=x-bx,dy=y-by;const d=Math.sqrt(dx*dx+dy*dy);if(d<br)set(x,y,fg,1);if(Math.abs(d-br)<1.5)set(x,y,fg,0.5);}
  fs.writeFileSync(file,png(size,size,px));
}
make(512,"icon-512.png");make(192,"icon-192.png");
console.log("icons written");

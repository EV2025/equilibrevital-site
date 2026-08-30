const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const COLORS = {
  ink:'#24112f', body:'#4d315e', muted:'#6a5575', primary:'#b71968',
  secondary:'#5b21b6', border:'#d9c7ef', soft:'#f5ecff', pink:'#fff1f8',
  green:'#28764a', amber:'#96620a', white:'#ffffff'
};

function roundedRect(ctx,x,y,width,height,radius=18){
  const r=Math.min(radius,width/2,height/2);
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+width-r,y);ctx.quadraticCurveTo(x+width,y,x+width,y+r);
  ctx.lineTo(x+width,y+height-r);ctx.quadraticCurveTo(x+width,y+height,x+width-r,y+height);
  ctx.lineTo(x+r,y+height);ctx.quadraticCurveTo(x,y+height,x,y+height-r);
  ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
}

function fitText(ctx,value,x,y,maxWidth,weight=600,startSize=20,minSize=12){
  let text=String(value||'À compléter').replace(/\s+/g,' ').trim()||'À compléter';
  let size=startSize;ctx.font=`${weight} ${size}px Arial`;
  while(size>minSize&&ctx.measureText(text).width>maxWidth){size-=1;ctx.font=`${weight} ${size}px Arial`;}
  if(ctx.measureText(text).width>maxWidth){
    while(text.length>1&&ctx.measureText(`${text}…`).width>maxWidth)text=text.slice(0,-1);
    text+='…';
  }
  ctx.fillText(text,x,y);
}

function textLines(ctx,value,maxWidth,maxLines=2){
  const words=String(value||'À compléter').replace(/\s+/g,' ').trim().split(' ');
  const lines=[];let line='';
  for(const word of words){
    const candidate=line?`${line} ${word}`:word;
    if(ctx.measureText(candidate).width<=maxWidth)line=candidate;
    else{if(line)lines.push(line);line=word;if(lines.length===maxLines-1)break;}
  }
  if(line&&lines.length<maxLines)lines.push(line);
  if(lines.length===maxLines&&lines.join(' ').length<words.join(' ').length){
    while(lines[maxLines-1].length>1&&ctx.measureText(`${lines[maxLines-1]}…`).width>maxWidth)lines[maxLines-1]=lines[maxLines-1].slice(0,-1);
    lines[maxLines-1]+='…';
  }
  return lines.length?lines:['À compléter'];
}

function drawLines(ctx,value,x,y,maxWidth,lineHeight,maxLines=2){
  const lines=textLines(ctx,value,maxWidth,maxLines);
  lines.forEach((line,index)=>ctx.fillText(line,x,y+index*lineHeight));
}

function formatDate(value){
  if(!value)return 'À compléter';
  let date=value;
  if(typeof value?.toDate==='function')date=value.toDate();
  else if(typeof value?.seconds==='number')date=new Date(value.seconds*1000);
  else if(!(value instanceof Date))date=new Date(value);
  if(Number.isNaN(date?.getTime?.()))return String(value);
  return new Intl.DateTimeFormat('fr-BE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(date);
}

function safeFilename(value){
  return String(value||'membre').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,55)||'membre';
}

function loadLogo(){
  return new Promise(resolve=>{
    const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);
    image.src=new URL('../wp-content/uploads/2025/09/equilibre-vital-logo-transparent.png',document.baseURI).href;
  });
}

function infoBox(ctx,x,y,width,title,entries){
  const height=58+entries.length*39+22;
  ctx.fillStyle=COLORS.white;ctx.strokeStyle=COLORS.border;ctx.lineWidth=2;
  roundedRect(ctx,x,y,width,height,20);ctx.fill();ctx.stroke();
  ctx.fillStyle=COLORS.soft;roundedRect(ctx,x+2,y+2,width-4,54,18);ctx.fill();
  ctx.fillStyle=COLORS.secondary;ctx.font='800 20px Arial';ctx.fillText(title.toUpperCase(),x+22,y+36);
  let lineY=y+86;
  for(const [label,value] of entries){
    ctx.fillStyle=COLORS.muted;ctx.font='700 15px Arial';ctx.fillText(label,x+22,lineY);
    ctx.fillStyle=COLORS.ink;fitText(ctx,value,x+150,lineY,width-174,650,18,12);lineY+=39;
  }
  return height;
}

function stepState(profile,step,currentIndex,index){
  const dates=profile?.journeyDates?.[step.key]||{};
  const done=dates.done||dates.completedAt||dates.realizedAt;
  if(done)return {label:'Réalisée',date:formatDate(done),color:COLORS.green};
  if(index===currentIndex)return {label:'En cours',date:formatDate(dates.startedAt||dates.startDate||dates.start),color:COLORS.secondary};
  const planned=dates.planned||dates.plannedAt;
  if(planned)return {label:'Prévue',date:formatDate(planned),color:COLORS.amber};
  return {label:'À venir',date:'—',color:COLORS.muted};
}

function drawStep(ctx,step,state,index,y){
  const x=68,width=1104,height=68;
  ctx.fillStyle=index%2===0?'#fbf8fe':COLORS.white;ctx.strokeStyle=COLORS.border;ctx.lineWidth=1.5;
  roundedRect(ctx,x,y,width,height,15);ctx.fill();ctx.stroke();
  ctx.fillStyle=state.color;ctx.beginPath();ctx.arc(x+34,y+34,16,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=COLORS.white;ctx.font='800 14px Arial';ctx.textAlign='center';ctx.fillText(String(index+1),x+34,y+39);ctx.textAlign='left';
  ctx.fillStyle=COLORS.ink;ctx.font='800 18px Arial';fitText(ctx,`${step.key} — ${step.short||step.title}`,x+66,y+29,570,800,18,12);
  ctx.fillStyle=COLORS.muted;ctx.font='600 15px Arial';fitText(ctx,step.title,x+66,y+52,570,600,15,11);
  ctx.fillStyle=state.color;ctx.font='800 17px Arial';fitText(ctx,state.label,x+690,y+31,180,800,17,12);
  ctx.fillStyle=COLORS.body;ctx.font='650 16px Arial';ctx.textAlign='right';ctx.fillText(state.date,x+1074,y+32);ctx.textAlign='left';
}

function base64ToBytes(value){
  const binary=atob(value),bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i+=1)bytes[i]=binary.charCodeAt(i);
  return bytes;
}

function singlePagePdf(jpegBytes,imageWidth,imageHeight){
  const encoder=new TextEncoder(),chunks=[],offsets=[0];let length=0;
  const push=value=>{const bytes=typeof value==='string'?encoder.encode(value):value;chunks.push(bytes);length+=bytes.length;};
  const object=(number,value)=>{offsets[number]=length;push(`${number} 0 obj\n`);push(value);push('\nendobj\n');};
  push('%PDF-1.4\n');object(1,'<< /Type /Catalog /Pages 2 0 R >>');object(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
  offsets[4]=length;push('4 0 obj\n');push(`<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);push(jpegBytes);push('\nendstream\nendobj\n');
  const content='q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ';object(5,`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  const xref=length;push('xref\n0 6\n0000000000 65535 f \n');
  for(let i=1;i<=5;i+=1)push(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(chunks,{type:'application/pdf'});
}

export async function downloadMemberPassport({profile,user,steps,currentStep,levelLabel}){
  const canvas=document.createElement('canvas');canvas.width=PAGE_WIDTH;canvas.height=PAGE_HEIGHT;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas indisponible');
  const logo=await loadLogo();
  const name=String(profile?.displayName||user?.displayName||'').includes('@')?'À compléter':(profile?.displayName||user?.displayName||'À compléter');
  const code=profile?.memberCode&&profile.memberCode!=='—'?profile.memberCode:'À compléter';
  const currentIndex=Math.max(0,steps.findIndex(step=>step.key===currentStep));
  const currentDates=profile?.journeyDates?.[currentStep]||{};
  const journeyStart=profile?.journeyStartedAt||profile?.journeyStartDate||profile?.startDate||profile?.createdAt;
  const levelStart=currentDates.startedAt||currentDates.startDate||currentDates.start;
  const issueDate=new Intl.DateTimeFormat('fr-BE',{dateStyle:'long'}).format(new Date());
  const documentRef=`PSSR-${code==='À compléter'?'MEMBRE':code}`;

  ctx.fillStyle=COLORS.white;ctx.fillRect(0,0,PAGE_WIDTH,PAGE_HEIGHT);
  const gradient=ctx.createLinearGradient(68,60,1172,280);gradient.addColorStop(0,COLORS.pink);gradient.addColorStop(1,'#eee7ff');
  ctx.fillStyle=gradient;roundedRect(ctx,68,60,1104,220,28);ctx.fill();
  ctx.fillStyle=COLORS.white;roundedRect(ctx,92,84,300,172,22);ctx.fill();
  if(logo){
    const scale=Math.min(254/logo.naturalWidth,126/logo.naturalHeight),w=logo.naturalWidth*scale,h=logo.naturalHeight*scale;
    ctx.drawImage(logo,92+(300-w)/2,84+(172-h)/2,w,h);
  }else{ctx.fillStyle=COLORS.primary;ctx.font='800 29px Arial';ctx.fillText('ÉQUILIBRE VITAL',116,177);}
  ctx.fillStyle=COLORS.primary;ctx.font='800 35px Arial';ctx.fillText('PASSEPORT SOCIO-SPORTIF',432,124);
  ctx.fillStyle=COLORS.ink;ctx.font='750 25px Arial';ctx.fillText('Parcours personnel PSSR',432,164);
  ctx.fillStyle=COLORS.muted;ctx.font='600 17px Arial';ctx.fillText(`Généré le ${issueDate}`,432,205);
  fitText(ctx,`Référence : ${documentRef}`,432,238,690,650,17,12);

  infoBox(ctx,68,310,540,'Identité du membre',[
    ['Nom',name],['Code membre',code],['Session',profile?.session||'À compléter']
  ]);
  infoBox(ctx,632,310,540,'Situation PSSR',[
    ['Niveau actuel',levelLabel(currentStep)||currentStep],['Début parcours',formatDate(journeyStart)],
    ['Début niveau',formatDate(levelStart)],['Présences',String(profile?.attendanceCount||0)],['Statut',profile?.status||'Inscrit']
  ]);

  ctx.fillStyle=COLORS.ink;ctx.font='800 25px Arial';ctx.fillText('ÉTAPES DU PARCOURS',68,646);
  ctx.fillStyle=COLORS.muted;ctx.font='600 16px Arial';ctx.fillText('Seules les dates enregistrées dans le dossier sécurisé sont reprises.',68,674);
  let stepY=698;
  steps.forEach((step,index)=>{drawStep(ctx,step,stepState(profile,step,currentIndex,index),index,stepY);stepY+=76;});

  ctx.fillStyle='#fff7fb';ctx.strokeStyle='#e8b6cf';ctx.lineWidth=2;roundedRect(ctx,68,1246,1104,160,20);ctx.fill();ctx.stroke();
  ctx.fillStyle=COLORS.primary;ctx.font='800 20px Arial';ctx.fillText('SYNTHÈSE DU PARCOURS',92,1286);
  ctx.fillStyle=COLORS.body;ctx.font='600 17px Arial';
  drawLines(ctx,`Modules souhaités : ${Array.isArray(profile?.modules)?profile.modules.join(', '):(profile?.modules||'À compléter')}`,92,1322,1030,24,2);
  drawLines(ctx,`Référent·e social·e : ${profile?.referent||profile?.socialReferent||'À compléter'}`,92,1380,1030,24,1);

  ctx.fillStyle=COLORS.soft;roundedRect(ctx,68,1430,1104,142,18);ctx.fill();
  ctx.fillStyle=COLORS.secondary;ctx.font='800 18px Arial';ctx.fillText('INFORMATION',92,1468);
  ctx.fillStyle=COLORS.body;ctx.font='600 16px Arial';
  drawLines(ctx,'Ce passeport est un document personnel de suivi généré depuis l’espace sécurisé du membre. Il ne constitue pas une attestation officielle de présence ni un certificat médical.',92,1500,1035,23,3);

  ctx.strokeStyle=COLORS.border;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(68,1612);ctx.lineTo(1172,1612);ctx.stroke();
  ctx.fillStyle=COLORS.muted;ctx.font='600 16px Arial';ctx.fillText('Équilibre Vital ASBL · Méthode PSSR · 1080 Bruxelles',68,1650);
  ctx.textAlign='right';ctx.fillText('equilibrevital.be',1172,1650);ctx.textAlign='left';
  ctx.fillStyle='#8a7495';ctx.font='500 14px Arial';ctx.fillText('Document confidentiel destiné au membre et aux professionnel·les autorisé·es.',68,1684);

  const jpeg=canvas.toDataURL('image/jpeg',0.94).split(',')[1];
  const pdf=singlePagePdf(base64ToBytes(jpeg),canvas.width,canvas.height);
  const url=URL.createObjectURL(pdf),link=document.createElement('a');
  link.href=url;link.download=`passeport-pssr-${safeFilename(code==='À compléter'?name:code)}.pdf`;
  document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1500);
}

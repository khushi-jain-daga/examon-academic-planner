(()=>{'use strict';
const KEY='examonPlannerStableV2';
const FAC=[
 ['f-gaurav','Gaurav Sir','Mechanical • Quantitative Aptitude'],['f-shivam','Shivam Sir','Mechanical • Reasoning'],['f-amrit','Amrit Sir','Non-Technical'],['f-anjna',"Anjna Ma'am",'General Awareness • Science'],['f-vivek','Vivek Sir','Mechanical'],['f-rakhi',"Rakhi Ma'am",'English'],['f-joshit','Joshit Sir','Physics']
].map(x=>({id:x[0],name:x[1],domain:x[2]}));
const fid=n=>({'Gaurav Sir':'f-gaurav','Shivam Sir':'f-shivam','Amrit Sir':'f-amrit',"Anjna Ma'am":'f-anjna','Anjana Ma\'am':'f-anjna','Vivek Sir':'f-vivek','Rakhi Ma\'am':'f-rakhi','Joshit Sir':'f-joshit','—':'f-rakhi'}[n]||String(n).toLowerCase().includes('gaurav')?'f-gaurav':String(n).toLowerCase().includes('shivam')?'f-shivam':String(n).toLowerCase().includes('amrit')?'f-amrit':String(n).toLowerCase().includes('anj')?'f-anjna':String(n).toLowerCase().includes('vivek')?'f-vivek':String(n).toLowerCase().includes('rakhi')?'f-rakhi':String(n).toLowerCase().includes('joshit')?'f-joshit':'f-gaurav');
const ids=names=>names.split('&').map(s=>fid(s.trim())).filter(Boolean);
const id=s=>'s-'+String(s).toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const iso=s=>{if(/^\d{4}-/.test(s))return s;const m={jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};let a=s.trim().split(/\s+/);return `2026-${m[a[1].slice(0,3).toLowerCase()]}-${a[0].padStart(2,'0')}`};
const startTime=t=>{let x=t.split('-')[0].trim().replace(/\s+/g,' ');let m=x.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);if(!m)return x;let h=+m[1],min=m[2]||'00',ap=(m[3]||'').toUpperCase();if(ap==='PM'&&h<12)h+=12;if(ap==='AM'&&h===12)h=0;return String(h).padStart(2,'0')+':'+min};
const dstr=d=>d.toISOString().slice(0,10);const add=(date,n)=>{let d=new Date(date+'T00:00:00');d.setDate(d.getDate()+n);return dstr(d)};const dow=date=>new Date(date+'T00:00:00').toLocaleDateString('en-GB',{weekday:'short'});
function datesBetween(start,end,count){let a=[],c=start,guard=0;while(a.length<count&&c<=end&&guard++<500){if(new Date(c+'T00:00:00').getDay()!==0)a.push(c);c=add(c,1)}while(a.length<count){a.push(a.length?add(a[a.length-1],1):start)}if(count&&end)a[count-1]=end;return a.slice(0,count)}
const M=(name,cat,faculty,classes,start,end,time,track)=>({id:'m-'+id(name+'-'+cat),subjectId:id(name),subjectName:name,category:cat,facultyIds:ids(faculty),classes,startDate:iso(start),endDate:iso(end),customStart:iso(start),startTime:startTime(time),time:startTime(time),timeLabel:time,track:track||cat,duration:60,priority:0});
const rajModules=[
 M('Machine Design','Technical Theory','Gaurav Sir',28,'21 Jul','21 Aug','1:00 PM - 2:00 PM','Technical Gaurav'),
 M('Production Engg','Technical Theory','Gaurav Sir',50,'24 Aug','20 Oct','2:00 PM - 3:00 PM','Technical Gaurav'),
 M('Engineering Mechanics','Technical Theory','Gaurav Sir',25,'21 Sep','19 Oct','12:00 PM - 1:00 PM','Technical Gaurav'),
 M('Fluid Mechanics','Technical Theory','Shivam Sir',36,'21 Jul','31 Aug','3:00 PM - 4:00 PM','Technical Shivam'),
 M('Hydraulic Machine','Technical Theory','Shivam Sir',8,'01 Sep','09 Sep','3:00 PM - 4:00 PM','Technical Shivam'),
 M('Thermodynamics','Technical Theory','Shivam Sir',24,'17 Aug','12 Sep','6:00 PM - 7:00 PM','Technical Shivam'),
 M('Strength of Material','Technical Theory','Shivam Sir',30,'14 Sep','17 Oct','6:00 PM - 7:00 PM','Technical Shivam'),
 M('Industrial Engineering','Technical Theory','Vivek Sir',30,'10 Aug','12 Sep','10:00 AM - 11:00 AM','Technical Vivek'),
 M('RAC','Technical Theory','Vivek Sir',23,'14 Sep','09 Oct','10:00 AM - 11:00 AM','Technical Vivek'),
 M('Power Plant','Technical Theory','Vivek Sir',22,'05 Oct','29 Oct','5:00 PM - 6:00 PM','Technical Vivek'),
 M('Polity','Non-Technical Theory','Amrit Sir',19,'21 Jul','11 Aug','7:00 PM-8:00 PM','Non-Tech Amrit'),
 M('History','Non-Technical Theory','Amrit Sir',19,'12 Aug','02 Sep','7:00 PM-8:00 PM','Non-Tech Amrit'),
 M('Geography','Non-Technical Theory','Amrit Sir',18,'03 Sep','23 Sep','7:00 PM-8:00 PM','Non-Tech Amrit'),
 M('Biology','Non-Technical Theory',"Anjna Ma'am",23,'21 Jul','15 Aug','8:45 AM - 9:45 AM','Non-Tech Anjna'),
 M('Chemistry','Non-Technical Theory',"Anjna Ma'am",16,'17 Aug','03 Sep','8:45 AM - 9:45 AM','Non-Tech Anjna'),
 M('Physics','Non-Technical Theory','Shivam Sir',21,'04 Sep','28 Sep','11:00 AM - 11:59 AM','Non-Tech Shivam'),
 M('Reasoning','Non-Technical Theory','Shivam Sir',30,'04 Sep','07 Oct','9:00 PM 10:00 PM','Non-Tech Shivam'),
 M('Aptitude','Non-Technical Theory','Gaurav Sir',27,'04 Sep','05 Oct','8:00 PM 9:00 PM','Non-Tech Gaurav')
].map((m,i)=>({...m,priority:i+1}));
const qpModules=[
 M('Technical Question Practice','Technical Practice','Gaurav Sir & Shivam Sir',25,'24 Aug','21 Sep','5:00 PM - 5:59 PM','Technical Practice'),
 M('Polity','Non-Technical Theory',"Anjna Ma'am",10,'20 Aug','02 Sep','10:00 AM','Non-Tech Anjna'),
 M('History','Non-Technical Theory','Amrit Sir',10,'24 Aug','03 Sep','9:30 PM','Non-Tech Amrit'),
 M('Geography','Non-Technical Theory',"Anjna Ma'am",10,'03 Sep','16 Sep','10:00 AM','Non-Tech Anjna'),
 M('Quantitative Aptitude','Non-Technical Theory','Gaurav Sir & Shivam Sir',10,'31 Aug','11 Sep','12:00 PM','Non-Tech Quant'),
 M('Reasoning','Non-Technical Theory','Gaurav Sir & Shivam Sir',10,'12 Sep','23 Sep','2:00 PM','Non-Tech Reasoning'),
 M('Current Affairs','Non-Technical Theory',"Anjna Ma'am",10,'03 Sep','16 Sep','11:00 AM','Non-Tech GA'),
 M('English','Non-Technical Theory','Rakhi Ma\'am',10,'12 Sep','23 Sep','3:00 PM','Non-Tech English')
].map((m,i)=>({...m,priority:i+1}));
const ongcModules=[
 M('Thermo + RAC + IC Engine + Power Plant','Technical Practice','Gaurav Sir & Shivam Sir',5,'20 Aug','27 Aug','4:00 PM - 4:59 PM','Technical Practice'),
 M('Miscellaneous','Technical Practice','Gaurav Sir & Shivam Sir',5,'29 Aug','03 Sep','4:00 PM - 4:59 PM','Technical Practice'),
 M('Geography','Non-Technical Practice','Amrit Sir',10,'11 Aug','21 Aug','-','Non-Tech Practice'),
 M('History','Non-Technical Practice','Amrit Sir',10,'20 Aug','02 Sep','-','Non-Tech Practice'),
 M('Polity','Non-Technical Practice','Amrit Sir',10,'20 Aug','02 Sep','-','Non-Tech Practice')
].map((m,i)=>({...m,priority:i+1,startTime:m.timeLabel==='-'?'':m.startTime,time:m.timeLabel==='-'?'':m.time}));
const isroModules=[
 M('Thermodynamics','Technical Theory','Shivam Sir',24,'07 Sep','05 Oct','5:15 PM - 6:16 PM','Technical Shivam'),
 M('Production Engg','Technical Theory','Gaurav Sir',42,'08 Sep','25 Oct','2:00 PM - 2:59 PM','Technical Gaurav'),
 M('Fluid Mechanics','Technical Theory','Shivam Sir',36,'05 Oct','11 Nov','4:00 PM - 4:59 PM','Technical Shivam'),
 M('Hydraulic Machine','Technical Theory','Shivam Sir',8,'05 Oct','13 Oct','3:00 PM - 3:59 PM','Technical Shivam'),
 M('Strength of Materials','Technical Theory','Shivam Sir',30,'05 Oct','07 Nov','5:15 PM - 6:14 PM','Technical Shivam'),
 M('Engineering Mechanics','Technical Theory','Gaurav Sir',25,'06 Oct','03 Nov','12:00 PM - 12:59 PM','Technical Gaurav'),
 M('RAC','Technical Theory','Vivek Sir',23,'29 Sep','24 Oct','5:00 PM - 6:14 PM','Technical Vivek'),
 M('Power Plant Engineering','Technical Theory','Vivek Sir',22,'20 Oct','13 Nov','6:00 PM - 6:59 PM','Technical Vivek'),
 M('Machine Design','Technical Theory','Gaurav Sir',28,'28 Oct','28 Nov','1:00 PM - 1:59 PM','Technical Gaurav'),
 M('Industrial Engineering','Technical Theory','Vivek Sir',30,'14 Nov','18 Dec','10:00 AM - 10:59 AM','Technical Vivek'),
 M('Quantitative Aptitude','Non-Technical Theory','Gaurav Sir',27,'19 Sep','20 Oct','5:15 PM - 6:14 PM','Non-Tech Quant'),
 M('Reasoning','Non-Technical Theory','Shivam Sir',30,'19 Sep','23 Oct','7:00 PM - 7:59 PM','Non-Tech Reasoning')
].map((m,i)=>({...m,priority:i+1}));
function topic(m,i){if(m.subjectName==='Technical Question Practice'){const arr=['Thermo+RAC+IC Engine+Power Plant','Miscellaneous','SOM+FM+Hydraulic','Metal Cutting+Workshop Technology+Metrology','Metal Casting+Forming+Welding+Material Science'];return 'Technical Practice - '+i+' · '+arr[Math.min(4,Math.floor((i-1)/5))]+' - '+(((i-1)%5)+1)}return m.subjectName+' - '+i}
function sessionRows(mods){let out=[];mods.forEach(m=>datesBetween(m.startDate,m.endDate,m.classes).forEach((date,i)=>out.push({n:i+1,date,day:dow(date),category:m.category,subjectName:m.subjectName,topic:topic(m,i+1),facultyIds:[...m.facultyIds],time:m.startTime||'',duration:m.duration,moduleId:m.id,subjectId:m.subjectId})));return out.sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||'')||a.subjectName.localeCompare(b.subjectName))}
function plan(id,exam,batch,branch,type,modules,start,end,total,tech,non){let sessions=sessionRows(modules);return{id,examName:exam,batchName:batch,branch,planType:type,startDate:iso(start),endDate:iso(end),status:'Published',modules:modules.map(m=>({...m})),sessions,sourceTotals:{total,tech,non,subjects:modules.length},createdAt:new Date().toISOString()}}
const seeded=[
 plan('plan-rrb-raj','RRB JE 2026','RRB JE (Rajdhani Batch) Mechanical Engineering 2026-27 | CBT 1 + CBT 2 Foundation Batch','Mechanical Engineering','CBT 1 + CBT 2 Foundation Batch',rajModules,'21 Jul','29 Oct',449,276,173),
 plan('plan-qp-95','Question Practice Batch','Technical + Non-Technical Study Plan','Mechanical + Non-Tech','Question Practice Batch',qpModules,'20 Aug','23 Sep',95,25,70),
 plan('plan-ongc-40','ONGC 2026','ONGC 2026 | Technical + Non-Technical Question Practice','Mechanical + Non-Tech','Question Practice Batch',ongcModules,'11 Aug','03 Sep',40,10,30),
 plan('plan-isro-complete','ISRO Scientist/Engineer 2026','BRAHMOS - Mechanical Engineering Complete Batch','Mechanical Engineering','Complete Batch',isroModules,'07 Sep','18 Dec',325,268,57)
];
const subjects=[];const seen=new Set();[...rajModules,...qpModules,...ongcModules,...isroModules].forEach((m,i)=>{const key=m.subjectId+'|'+m.category+'|'+m.track;if(seen.has(key))return;seen.add(key);subjects.push({id:m.subjectId,name:m.subjectName,branch:m.category.includes('Non')?'Non-Tech':'Mechanical',category:m.category,facultyIds:[...m.facultyIds],classes:m.classes,startDate:m.startDate,endDate:m.endDate,time:m.startTime,track:m.track,duration:60,order:i+1})});
let old={};try{old=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){}
const seededIds=new Set(seeded.map(p=>p.id));
const customPlans=Array.isArray(old.plans)?old.plans.filter(p=>p&&p.id&&!seededIds.has(p.id)&&!String(p.id).startsWith('plan-default')&&!String(p.id).startsWith('plan-rrb-cbt')&&!String(p.id).startsWith('plan-ssc')&&!String(p.id).startsWith('plan-combo')&&!String(p.id).startsWith('plan-isro')):[];
const state={version:2,faculty:FAC,subjects,plans:[...seeded,...customPlans],sourceAudit:{updatedAt:new Date().toISOString(),notes:'Seeded from source PDFs only. Rajdhani 18/449/276/173. QP 8/95/25/70. ONGC 5 modules/40. ISRO 12/325/268/57.'}};
localStorage.setItem(KEY,JSON.stringify(state));
})();
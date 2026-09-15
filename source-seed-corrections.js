(()=>{'use strict';
const KEY='examonPlannerStableV2';
const map={
 'Machine Design|Technical Theory':['f-gaurav'],'Production Engg|Technical Theory':['f-gaurav'],'Engineering Mechanics|Technical Theory':['f-gaurav'],'Fluid Mechanics|Technical Theory':['f-shivam'],'Hydraulic Machine|Technical Theory':['f-shivam'],'Thermodynamics|Technical Theory':['f-shivam'],'Strength of Material|Technical Theory':['f-shivam'],'Industrial Engineering|Technical Theory':['f-vivek'],'RAC|Technical Theory':['f-vivek'],'Power Plant|Technical Theory':['f-vivek'],'Polity|Non-Technical Theory':['f-amrit'],'History|Non-Technical Theory':['f-amrit'],'Geography|Non-Technical Theory':['f-amrit'],'Biology|Non-Technical Theory':['f-anjna'],'Chemistry|Non-Technical Theory':['f-anjna'],'Physics|Non-Technical Theory':['f-shivam'],'Reasoning|Non-Technical Theory':['f-shivam'],'Aptitude|Non-Technical Theory':['f-gaurav'],
 'Technical Question Practice|Technical Practice':['f-gaurav','f-shivam'],'Quantitative Aptitude|Non-Technical Theory':['f-gaurav','f-shivam'],'Current Affairs|Non-Technical Theory':['f-anjna'],'English|Non-Technical Theory':['f-rakhi'],
 'Thermo + RAC + IC Engine + Power Plant|Technical Practice':['f-gaurav','f-shivam'],'Miscellaneous|Technical Practice':['f-gaurav','f-shivam'],'Geography|Non-Technical Practice':['f-amrit'],'History|Non-Technical Practice':['f-amrit'],'Polity|Non-Technical Practice':['f-amrit'],
 'Strength of Materials|Technical Theory':['f-shivam'],'Power Plant Engineering|Technical Theory':['f-vivek']
};
const names={'f-gaurav':'Gaurav Sir','f-shivam':'Shivam Sir','f-amrit':'Amrit Sir','f-anjna':"Anjna Ma'am",'f-vivek':'Vivek Sir','f-rakhi':"Rakhi Ma'am",'f-joshit':'Joshit Sir'};
function applyFaculty(obj){if(!obj)return;const key=(obj.subjectName||obj.name)+'|'+obj.category;if(map[key])obj.facultyIds=[...map[key]];}
try{const state=JSON.parse(localStorage.getItem(KEY)||'{}');if(!state||state.version!==2)return;
 (state.subjects||[]).forEach(s=>applyFaculty(s));
 (state.plans||[]).forEach(p=>{(p.modules||[]).forEach(m=>applyFaculty(m));(p.sessions||[]).forEach(s=>applyFaculty(s));
   if(p.id==='plan-rrb-raj'){p.examName='RRB JE 2026';p.batchName='RRB JE (Rajdhani Batch) Mechanical Engineering 2026-27 | CBT 1 + CBT 2 Foundation Batch';p.startDate='2026-07-21';p.endDate='2026-10-29';p.sourceTotals={subjects:18,total:449,tech:276,non:173};}
   if(p.id==='plan-qp-95'){p.startDate='2026-08-20';p.endDate='2026-09-23';p.sourceTotals={subjects:8,total:95,tech:25,non:70};}
   if(p.id==='plan-ongc-40'){p.startDate='2026-08-11';p.endDate='2026-09-03';p.sourceTotals={sections:4,total:40,tech:10,non:30};}
   if(p.id==='plan-isro-complete'){p.startDate='2026-09-07';p.endDate='2026-12-18';p.sourceTotals={subjects:12,total:325,tech:268,non:57};}
 });
 state.sourceAudit={updatedAt:new Date().toISOString(),verified:'faculty/date/class/time totals corrected from source PDFs',facultyNames:names};
 localStorage.setItem(KEY,JSON.stringify(state));
}catch(e){console.error('source seed correction failed',e)}
})();
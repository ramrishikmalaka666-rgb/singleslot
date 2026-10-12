/* Single Slot — local-first student workspace. No login/account screen. */
const $ = id => document.getElementById(id);
const views = ["overview","formulas","materials","jarvis","progress","timetable"];

const startButton = document.getElementById('get-started-button');
if (startButton) startButton.addEventListener('click', () => { const intro = document.getElementById('get-started-screen'); const app = document.getElementById('app-screen'); if (intro) intro.classList.add('hidden'); if (app) app.classList.remove('hidden'); window.scrollTo({top:0,behavior:'smooth'}); });

const read = (key, fallback) => { try { const v=localStorage.getItem('single-slot-'+key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const write = (key, value) => { try { localStorage.setItem('single-slot-'+key, JSON.stringify(value)); } catch {} };
let localProgress = read('progress',{sessions:0,tasks:[],bookmarks:[]});
let timetable = read('timetable',[]);
function showToast(msg){const t=$('toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
function updateStats(){ $('stat-sessions').textContent=localProgress.sessions;$('stat-tasks').textContent=localProgress.tasks.length;$('stat-bookmarks').textContent=localProgress.bookmarks.length;const p=Math.round(localProgress.tasks.length/3*100);$('progress-percent').textContent=p+'%';document.querySelector('.progress-ring').style.setProperty('--progress',p+'%');$('progress-copy').textContent=localProgress.tasks.length+' of 3 focus tasks completed today. Keep building your habit.';renderActivity(); }
function showView(name){if(!views.includes(name))return;views.forEach(v=>{const el=$('view-'+v);if(el)el.classList.toggle('hidden',v!==name)});document.querySelectorAll('.side-link').forEach(b=>b.classList.toggle('active',b.dataset.view===name));if(name==='formulas')renderFormulas($('formula-search').value);if(name==='timetable')renderTimetable()}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
document.querySelectorAll('[data-subject]').forEach(b=>b.addEventListener('click',()=>{showView('subjects');renderSubject(b.dataset.subject)}));
function renderSubject(subject){const descriptions={Maths:['Sets and Relations','Functions','Trigonometry','Coordinate Geometry','Differentiation','Integration'],Physics:['Units and Measurements','Kinematics','Laws of Motion','Work, Energy and Power','Waves','Current Electricity'],Chemistry:['Atomic Structure','Chemical Bonding','States of Matter','Equilibrium','Thermodynamics','Organic Chemistry'],Biology:['Cell: The Unit of Life','Biomolecules','Cell Cycle','Plant Physiology','Human Physiology','Ecology'],Botany:['Plant Kingdom','Morphology of Flowering Plants','Anatomy of Flowering Plants','Photosynthesis','Plant Growth and Development','Ecology'],Zoology:['Animal Kingdom','Structural Organisation in Animals','Human Physiology','Reproduction','Genetics','Evolution']};$('subject-detail').innerHTML='<div class="chapter-list">'+descriptions[subject].map((c,i)=>`<div class="chapter-card subject-${subject.toLowerCase()}"><span>${subject.toUpperCase()} · CHAPTER ${i+1}</span><p><b>${c}</b></p><p>Plan a study slot for this chapter using the timetable maker.</p><button class="mini-action" data-plan="${c}" data-plan-subject="${subject}">＋ Add to timetable</button></div>`).join('')+'</div>';document.querySelectorAll('[data-plan]').forEach(b=>b.addEventListener('click',()=>{ $('slot-task').value=b.dataset.plan;$('slot-subject').value=b.dataset.planSubject;$('slot-day').value='Monday';showView('timetable');$('slot-task').focus()}));}

let formulaSubject = 'All';
function normalizeLatex(s){return s.replace(/\\\\/g,'\\');}
function formulaContentToHtml(content){
  const lines=normalizeLatex(content).split(/\r?\n/); let out=[], paragraph=[], list=[], math=[], table=[];
  const flushP=()=>{if(paragraph.length){out.push('<p>'+paragraph.join(' ')+'</p>');paragraph=[]}};
  const flushL=()=>{if(list.length){out.push('<ul>'+list.map(x=>'<li>'+x+'</li>').join('')+'</ul>');list=[]}};
  const flushM=()=>{if(math.length){out.push('<div class="equation-block">\\['+math.join('\n')+'\\]</div>');math=[]}};
  const flushT=()=>{if(table.length){const rows=table.filter(r=>!/\s*\|?\s*:?-{2,}/.test(r));if(rows.length){out.push('<div class="formula-table-wrap"><table class="formula-table">'+rows.map((r,i)=>'<tr>'+r.trim().replace(/^\||\|$/g,'').split('|').map(cell=>'<'+(i===0?'th':'td')+'>'+escapeHtml(cell.trim())+'</'+(i===0?'th':'td')+'>').join('')+'</tr>').join('')+'</table></div>')}table=[]}};
  for(let raw of lines){
    const line=raw.trim();
    if(!line){if(!math.length){flushP();flushL();flushT()}continue;}
    if(math.length){const close=line.indexOf('\\]');if(close>=0){const before=line.slice(0,close).trim();if(before)math.push(before);flushM();const after=line.slice(close+2).trim();if(after){paragraph.push(escapeHtml(after))}}else math.push(line);continue;}
    if(line.startsWith('|')){flushP();flushL();flushT();table.push(line);continue}else flushT();
    const open=line.indexOf('\\[');
    if(open>=0){flushP();flushL();const before=line.slice(0,open).trim();if(before)paragraph.push(escapeHtml(before));const rest=line.slice(open+2);const close=rest.indexOf('\\]');if(close>=0){const body=rest.slice(0,close).trim();if(body)math.push(body);flushM();const after=rest.slice(close+2).trim();if(after)paragraph.push(escapeHtml(after))}else{if(rest.trim())math.push(rest.trim());}continue;}
    if(line.startsWith('### ')){flushP();flushL();out.push('<h4>'+escapeHtml(line.slice(4))+'</h4>');continue;}
    if(line.startsWith('## ')){flushP();flushL();out.push('<h4>'+escapeHtml(line.slice(3))+'</h4>');continue;}
    if(/^[-*] /.test(line)){flushP();list.push(escapeHtml(line.slice(2)).replace(/\\\((.*?)\\\)/g,'<span class="inline-math">\\($1\\)</span>').replace(/\*\*(.*?)\*\*/g,'<b>$1</b>'));continue;}
    if(/^\d+\. /.test(line)){flushP();list.push(escapeHtml(line.replace(/^\d+\. /,'')).replace(/\\\((.*?)\\\)/g,'<span class="inline-math">\\($1\\)</span>'));continue;}
    flushL();
    paragraph.push(escapeHtml(line).replace(/\\\((.*?)\\\)/g,'<span class="inline-math">\\($1\\)</span>').replace(/\*\*(.*?)\*\*/g,'<b>$1</b>'));
  }
  flushP();flushL();flushM();flushT();return out.join('');
}
function renderFormulas(filter=''){
 const list=$('formula-list');if(!list)return;
 const q=filter.toLowerCase().trim();
 const data=formulaChapters.filter(c=>(formulaSubject==='All'||c.subject===formulaSubject)&&(!q||(c.title+' '+c.subject+' '+c.content).toLowerCase().includes(q)));
 $('formula-count').textContent=`${data.length} chapters · ${formulaSubject==='All'?'all subjects':formulaSubject}`;
 list.innerHTML=data.map((c,i)=>`<details class="formula-chapter subject-${c.subject.toLowerCase()}" ${q?'open':''}><summary><span class="chapter-subject">${c.subject}</span><span class="chapter-title">${escapeHtml(c.title)}</span><span class="chapter-chevron">＋</span></summary><div class="chapter-formulas">${formulaContentToHtml(c.content)}<button class="chapter-bookmark ${localProgress.bookmarks.includes(c.subject+' — '+c.title)?'saved':''}" data-bookmark-chapter="${escapeHtml(c.subject+' — '+c.title)}">${localProgress.bookmarks.includes(c.subject+' — '+c.title)?'★ Saved chapter':'☆ Bookmark chapter'}</button></div></details>`).join('')||'<p class="empty-state">No matching chapters. Try a shorter search term.</p>';
 if(window.MathJax?.typesetPromise)window.MathJax.typesetPromise([list]).catch(()=>{});
 list.querySelectorAll('[data-bookmark-chapter]').forEach(b=>b.addEventListener('click',()=>{const title=b.dataset.bookmarkChapter;localProgress.bookmarks=localProgress.bookmarks.includes(title)?localProgress.bookmarks.filter(x=>x!==title):[...localProgress.bookmarks,title];write('progress',localProgress);renderFormulas($('formula-search').value);updateStats()}));
}
document.querySelectorAll('[data-formula-subject]').forEach(b=>b.addEventListener('click',()=>{formulaSubject=b.dataset.formulaSubject;document.querySelectorAll('[data-formula-subject]').forEach(x=>x.classList.toggle('active',x===b));renderFormulas($('formula-search').value)}));
$('formula-search').addEventListener('input',e=>renderFormulas(e.target.value));
$('save-tasks').addEventListener('click',()=>{localProgress.tasks=[...document.querySelectorAll('[data-task]:checked')].map(c=>c.dataset.task);write('progress',localProgress);updateStats();$('task-message').textContent='Progress saved on this device ✓';showToast('Today’s progress saved!')});
$('record-session').addEventListener('click',()=>{localProgress.sessions++;write('progress',localProgress);updateStats();showToast('Study session recorded!')});
function renderActivity(){const chart=$('activity-chart');if(!chart)return;const labels=['M','T','W','T','F','S','S'];chart.innerHTML=labels.map((d,i)=>`<div class="activity-bar" style="height:${15+Math.min(75,localProgress.sessions*8+i*3)}%"><span>${d}</span></div>`).join('')}
const dayOrder=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const subjectColors={'Maths':'maths','Physics':'physics','Chemistry':'chemistry','JEE Practice':'jee','Revision':'revision','Break':'break','College':'college','Other':'other'};
$('slot-form').addEventListener('submit',e=>{e.preventDefault();const day=$('slot-day').value,start=$('slot-start').value,end=$('slot-end').value,subject=$('slot-subject').value,task=$('slot-task').value.trim();if(!task)return;if(start>=end){showToast('End time should be later than start time.');return}const conflict=timetable.find(t=>t.day===day&&start<t.end&&end>t.start);if(conflict){showToast('Time overlap with “'+conflict.task+'”. Choose another slot.');return}timetable.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),day,start,end,subject,task});timetable.sort((a,b)=>dayOrder.indexOf(a.day)-dayOrder.indexOf(b.day)||a.start.localeCompare(b.start));write('timetable',timetable);renderTimetable();$('slot-task').value='';showToast('Added to your timetable!')});
function timeLabel(t){const [h,m]=t.split(':').map(Number);return `${(h%12)||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`}
function renderTimetable(){const grid=$('timetable-grid');if(!grid)return;$('slot-count').textContent=timetable.length+' '+(timetable.length===1?'slot':'slots');grid.innerHTML=dayOrder.map((day,i)=>{const items=timetable.filter(t=>t.day===day);return `<section class="day-column"><div class="day-heading"><span class="day-dot dot-${i}"></span><b>${day}</b><small>${items.length} ${items.length===1?'task':'tasks'}</small></div><div class="day-slots">${items.length?items.map(t=>`<article class="time-slot slot-${subjectColors[t.subject]||'other'}"><div class="time-range">${timeLabel(t.start)} – ${timeLabel(t.end)}</div><b>${escapeHtml(t.task)}</b><span>${escapeHtml(t.subject)}</span><button class="delete-slot" data-delete-slot="${t.id}" aria-label="Delete ${escapeHtml(t.task)}">×</button></article>`).join(''):'<p class="empty-day">Nothing planned yet</p>'}</div></section>`}).join('');grid.querySelectorAll('[data-delete-slot]').forEach(b=>b.addEventListener('click',()=>{timetable=timetable.filter(t=>t.id!==b.dataset.deleteSlot);write('timetable',timetable);renderTimetable();showToast('Study slot removed.')}));}
$('sample-timetable').addEventListener('click',()=>{if(timetable.length&&!confirm('Add the sample plan alongside your current slots?'))return;const sample=[['Monday','17:00','18:00','Maths','Functions practice'],['Monday','18:15','19:00','Physics','Kinematics numericals'],['Tuesday','17:00','18:00','Chemistry','Atomic structure'],['Wednesday','17:00','18:00','JEE Practice','Timed question practice'],['Thursday','17:00','18:00','Maths','Revise formulas'],['Friday','17:00','18:00','Physics','Review mistakes'],['Saturday','09:00','10:30','JEE Practice','Weekly mock test'],['Sunday','10:00','11:00','Revision','Weekly recap']];let added=0;sample.forEach(([day,start,end,subject,task])=>{if(!timetable.some(t=>t.day===day&&start<t.end&&end>t.start)){timetable.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),day,start,end,subject,task});added++}});timetable.sort((a,b)=>dayOrder.indexOf(a.day)-dayOrder.indexOf(b.day)||a.start.localeCompare(b.start));write('timetable',timetable);renderTimetable();showToast(added+' sample slots added.')});
$('clear-timetable').addEventListener('click',()=>{if(!timetable.length)return;if(confirm('Clear all timetable slots?')){timetable=[];write('timetable',timetable);renderTimetable();showToast('Timetable cleared.')}});

function downloadBlob(filename,content,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
$('download-timetable').addEventListener('click',()=>{if(!timetable.length){showToast('Add at least one study slot first.');return}const rows=[['Day','Start','End','Subject','Task / Chapter'],...dayOrder.flatMap(day=>timetable.filter(t=>t.day===day).map(t=>[day,t.start,t.end,t.subject,t.task]))];const csv=rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');downloadBlob('single-slot-study-timetable.csv','\ufeff'+csv,'text/csv;charset=utf-8');showToast('Timetable CSV downloaded.')});
$('download-ics').addEventListener('click',()=>{if(!timetable.length){showToast('Add at least one study slot first.');return}const dayNums={Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6,Sunday:7};const now=new Date();const monday=new Date(now);const diff=(now.getDay()+6)%7;monday.setDate(now.getDate()-diff);monday.setHours(0,0,0,0);const fmtDate=d=>d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');const fmtTime=(d,t)=>{const [h,m]=t.split(':').map(Number);d.setHours(h,m,0,0);return fmtDate(d)+'T'+String(h).padStart(2,'0')+String(m).padStart(2,'0')+'00'};const events=timetable.map(t=>{const d=new Date(monday);d.setDate(monday.getDate()+dayNums[t.day]-1);const start=fmtTime(new Date(d),t.start),end=fmtTime(new Date(d),t.end);return ['BEGIN:VEVENT','UID:'+t.id+'@singleslot','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'').replace('Z','Z'),'DTSTART:'+start,'DTEND:'+end,'SUMMARY:'+(`${t.subject}: ${t.task}`).replace(/[,;]/g,' '),'END:VEVENT'].join('\r\n')});downloadBlob('single-slot-study-timetable.ics',['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Single Slot//Study Timetable//EN','CALSCALE:GREGORIAN',...events,'END:VCALENDAR'].join('\r\n'),'text/calendar;charset=utf-8');showToast('Calendar file downloaded.')});
$('print-timetable').addEventListener('click',()=>window.print());
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function updateLiveDateTime(){const now=new Date();$('today-label').innerHTML='<span class="live-date">'+new Intl.DateTimeFormat(undefined,{weekday:'short',year:'numeric',month:'short',day:'numeric'}).format(now)+'</span><span class="live-time">'+new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(now)+'</span>'; }
document.querySelectorAll('[data-material]').forEach(b=>b.addEventListener('click',()=>{const sub=b.dataset.material;$('materials-detail').innerHTML='<h3>'+escapeHtml(sub)+' Materials</h3><p class="materials-empty-note">This space is intentionally empty. Upload your '+escapeHtml(sub)+' notes or files when you are ready, and they can be organized here.</p>'; }));
$('jarvis-ask').addEventListener('click',async()=>{
 const q=$('jarvis-question').value.trim(), sub=$('jarvis-subject').value, answer=$('jarvis-answer'), btn=$('jarvis-ask');
 if(!q){answer.innerHTML='<p>Please type your question first.</p>';return;}
 btn.disabled=true;btn.textContent='Thinking…';answer.innerHTML='<p>JARVIS is thinking. Please wait…</p>';
 try{
  const response=await fetch('/.netlify/functions/jarvis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q,subject:sub})});
  const data=await response.json();
  if(!response.ok) throw new Error(data?.error||`JARVIS request failed (HTTP ${response.status})`);
  const text=String(data?.answer||'').trim();
  if(!text) throw new Error('No answer was returned. Please try again.');
  answer.innerHTML='<h3>JARVIS · Answer</h3><div class="jarvis-response-text">'+escapeHtml(text).replace(/\n/g,'<br>')+'</div><p class="jarvis-disclaimer">AI can make mistakes. Verify important facts and exam answers.</p>';
 }catch(err){answer.innerHTML='<h3>JARVIS is not connected yet</h3><p>'+escapeHtml(err.message||'Connection failed')+'</p><p>Deploy this site on Netlify and set the server environment variable <b>OPENAI_API_KEY</b> to enable ChatGPT-powered answers.</p>'}
 finally{btn.disabled=false;btn.textContent='✦ Ask JARVIS';}
});
function init(){ updateLiveDateTime();setInterval(updateLiveDateTime,1000);const tasks=localProgress.tasks||[];document.querySelectorAll('[data-task]').forEach(c=>c.checked=tasks.includes(c.dataset.task));updateStats();renderFormulas();renderTimetable();showView('overview');}
init();

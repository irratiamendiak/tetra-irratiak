import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL="https://hsbreiibrllvbpbwfcoa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_CFBQFi5SCMTLBSCvAWh7yw_pz0E1Kb3";
const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const $=s=>document.querySelector(s);
let radios=[]; let allMovements=[]; let latestByRadio=new Map(); let currentRadio=null; let currentRadioData=null; let currentMovements=[]; let editingMovement=null; let currentPage=1; const PAGE_SIZE=8;

function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));}
function fmtDate(v){return v?new Date(v+"T00:00:00").toLocaleDateString("eu-ES"):"—";}
function today(){return new Date().toISOString().slice(0,10);}
function showMsg(t,ok=true){const e=$("#mezua"); if(!e)return; e.textContent=t; e.className=ok?"ondo":"errorea"; setTimeout(()=>{if(e.textContent===t)e.textContent=""},3500);}
function statusOf(r){return r.baja_definitiva?{cls:"retired",text:"Baja"}:r.sustituido?{cls:"replaced",text:"Ordezkatua"}:{cls:"active",text:"Aktibo"};}
function normalizaModelo(v){return String(v||"").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Z0-9]/g,"");}
function imageFor(r){
  const m=normalizaModelo(r.modelo);
  if(m === "MTP3550") return "data/mtp3550.png";
  if(m === "HTT500") return "data/htt500.png";
  if(m === "MDT400") return "https://static-data2.manualslib.com/product-images/135/13465/1346499/raw.jpg";
  if(m === "DT410") return "data/dt410.png";
  return "";
}

function locationOf(r){return r.kokapena||"—";}
function dash(v){return v===null||v===undefined||v===""?"-":String(v);}
function sailaOf(r){return r.mota||"—";}
function latest(r){return latestByRadio.get(r.id)||{};}

async function loadData(){
  const {data,error}=await supabase.from("irratia").select("*").order("alias");
  if(error){showMsg(error.message,false);return;}
  const {data:mov,error:me}=await supabase.from("mugimenduak").select("*").order("noiztik",{ascending:false}).order("id",{ascending:false});
  if(me){showMsg(me.message,false);return;}
  radios=data||[]; allMovements=mov||[]; latestByRadio=new Map();
  for(const m of allMovements){if(m.radio_id!=null&&!latestByRadio.has(m.radio_id))latestByRadio.set(m.radio_id,m);}
  populateFilters(); renderRows();
  if(!currentRadio&&radios.length) selectRadio(radios[0].id,false);
  else if(currentRadio) selectRadio(currentRadio,false);
}
function populateFilters(){
  const s=$("#motaFilter"); const vals=[...new Set(radios.map(r=>r.mota).filter(Boolean))].sort(); s.innerHTML='<option value="">Saila: Guztiak</option>'+vals.map(v=>`<option value="${esc(v)}">Saila: ${esc(v)}</option>`).join("");
}
function filtered(){const q=$("#bilaketa").value.trim().toLowerCase();const ef=$("#egoeraFilter").value;const mf=$("#motaFilter").value;return radios.filter(r=>{const st=statusOf(r);const m=latest(r);const text=[r.zka,r.alias,r.marka,r.modelo,r.tei,r.mota,r.kokapena].join(" ").toLowerCase();return(!q||text.includes(q))&&(!ef||({active:"aktibo",replaced:"ordezkatua",retired:"baja"}[st.cls]===ef))&&(!mf||(r.mota||"")===mf);});}
function renderRows(){
  const list=filtered();
  const totalPages=Math.max(1,Math.ceil(list.length/PAGE_SIZE));
  if(currentPage>totalPages) currentPage=totalPages;
  const start=(currentPage-1)*PAGE_SIZE;
  const pageRows=list.slice(start,start+PAGE_SIZE);
  $("#irratiaKop").textContent=`(${list.length})`;
  $("#irratiaRows").innerHTML=pageRows.length?pageRows.map(r=>{
    const m=latest(r); const st=statusOf(r);
    return `<tr class="radio-row ${currentRadio===r.id?"selected":""}" data-id="${r.id}"><td>${esc(r.alias||r.zka||"")}</td><td>${esc(r.marka||"")}</td><td>${esc(r.modelo||"")}</td><td>${esc(r.tei??"")}</td><td>${esc(r.zka??"")}</td><td>${esc(sailaOf(r))}</td><td><span class="status ${st.cls}">${st.text}</span></td><td>${esc(locationOf(r))}</td></tr>`;
  }).join(""):`<tr><td colspan="8" style="padding:30px;text-align:center;color:#718096">Ez da irratirik aurkitu.</td></tr>`;
  renderPagination(totalPages);
}
function renderPagination(totalPages){
  const box=$("#radioPagination"); if(!box)return;
  if(totalPages<=1){box.innerHTML="";return;}
  const nums=[];
  for(let i=1;i<=totalPages;i++) nums.push(`<button class="pageBtn ${i===currentPage?"active":""}" data-page="${i}">${i}</button>`);
  box.innerHTML=`<button class="pageBtn" data-page="prev" ${currentPage===1?"disabled":""}>‹</button>${nums.join("")}<button class="pageBtn" data-page="next" ${currentPage===totalPages?"disabled":""}>›</button>`;
  box.querySelectorAll(".pageBtn").forEach(b=>b.addEventListener("click",()=>{
    const v=b.dataset.page;
    if(v==="prev") currentPage=Math.max(1,currentPage-1);
    else if(v==="next") currentPage=Math.min(totalPages,currentPage+1);
    else currentPage=Number(v);
    renderRows();
    $("#radioList").scrollIntoView({behavior:"smooth",block:"start"});
  }));
}

async function selectRadio(id,scroll=true){
  const r=radios.find(x=>x.id===Number(id)); if(!r)return; currentRadio=r.id; currentRadioData=r; renderRows(); $("#detailCard").hidden=false; $("#movementSection").hidden=false; $("#editPanela").hidden=true; $("#mugimenduEditPanela").hidden=true;
  const m=latest(r); const st=statusOf(r); $("#izenburua").textContent=r.alias||r.zka||"Irratia"; $("#statusBurua").className=`status ${st.cls}`; $("#statusBurua").textContent=st.text;
  const photo=$("#radioPhoto"); const src=imageFor(r); photo.alt=`${r.marka||""} ${r.modelo||""}`; photo.referrerPolicy="no-referrer"; photo.onerror=()=>{photo.onerror=null; photo.src="data/talkie.png"; photo.alt=`${r.marka||""} ${r.modelo||""}`;}; photo.src=src||"data/talkie.png";
  $("#datuak").innerHTML=`<div><span>Marka:</span><strong>${esc(r.marka??"")}</strong></div><div><span>Modeloa:</span><strong>${esc(r.modelo??"")}</strong></div><div><span>TEI:</span><strong>${esc(r.tei??"")}</strong></div><div><span>ZKA:</span><strong>${esc(r.zka??"")}</strong></div><div><span>Saila:</span><strong>${esc(sailaOf(r))}</strong></div><div><span>Egoera:</span><strong>${esc(st.text)}</strong></div><div><span>Azken mugimendua:</span><strong>${esc(fmtDate(m.noiztik))}</strong></div><div><span>Kokapena:</span><strong>${esc(locationOf(r))}</strong></div>`;
  await loadMovements(r.id); $("#movementTitle").textContent=`(${esc(r.alias||r.zka||"")})`; if(scroll)setTimeout(()=>$("#detailCard").scrollIntoView({behavior:"smooth",block:"nearest"}),40);
}
function movementNotes(x){return [x?.funda?"Funda":"",x?.micro?"Mikroa":"",x?.karga?"Karga":"",x?.kablea_12v?"12V":""].filter(Boolean).join(" · ")||"—";}
async function loadMovements(id){const {data,error}=await supabase.from("mugimenduak").select("*").eq("radio_id",id).order("noiztik",{ascending:false}).order("id",{ascending:false});if(error){showMsg(error.message,false);return;}currentMovements=data||[];$("#mugimenduKop").textContent=`${currentMovements.length} erregistro`;$("#mugimenduRows").innerHTML=currentMovements.length?currentMovements.map(x=>`<tr><td>${esc(fmtDate(x.noiztik))}</td><td>${esc(x.zergatia||"—")}</td><td>${esc(x.nork||"—")}</td><td>${esc(dash(x.arreta))}</td><td>${esc(dash(x.teltronic))}</td><td>${esc(movementNotes(x))}</td><td class="movementActions"><button class="smallEdit" data-id="${x.id}">Editatu</button> <button class="smallDelete" data-id="${x.id}">Ezabatu</button></td></tr>`).join(""):`<tr><td colspan="7" style="padding:28px;text-align:center;color:#718096">Ez dago mugimendurik.</td></tr>`;document.querySelectorAll(".smallDelete").forEach(b=>b.onclick=async()=>{if(!confirm("Mugimendu hau ezabatu nahi duzu?"))return;const {error}=await supabase.from("mugimenduak").delete().eq("id",Number(b.dataset.id));if(error)showMsg(error.message,false);else await loadData();});document.querySelectorAll(".smallEdit").forEach(b=>b.onclick=()=>openMovementForm(currentMovements.find(x=>x.id===Number(b.dataset.id))));}

$("#irratiaRows").addEventListener("click",e=>{const row=e.target.closest("tr.radio-row");if(row)selectRadio(Number(row.dataset.id),true);});
$("#bilaketa").addEventListener("input",()=>{currentPage=1;renderRows();});$("#egoeraFilter").addEventListener("change",()=>{currentPage=1;renderRows();});$("#motaFilter").addEventListener("change",()=>{currentPage=1;renderRows();});
$("#irratiBerria").onclick=()=>openRadioForm(null);$("#editIrratia").onclick=()=>openRadioForm(currentRadioData);$("#cancelEdit").onclick=()=>$("#editPanela").hidden=true;
function openRadioForm(d){$("#editPanela").hidden=false;$("#id").value=d?.id??"";$("#zka").value=d?.zka??"";$("#alias").value=d?.alias??"";$("#marka").value=d?.marka??"";$("#modelo").value=d?.modelo??"";$("#tei").value=d?.tei??"";$("#mota").value=d?.mota??"";["gps","gateway","baja_definitiva","sustituido"].forEach(k=>$("#"+k).checked=!!d?.[k]);$("#editPanela").scrollIntoView({behavior:"smooth",block:"center"});}
$("#irratiForm").addEventListener("submit",async e=>{e.preventDefault();const obj={zka:$("#zka").value?Number($("#zka").value):null,alias:$("#alias").value.trim()||null,mota:$("#mota").value.trim()||null,marka:$("#marka").value.trim()||null,modelo:$("#modelo").value.trim()||null,tei:$("#tei").value?Number($("#tei").value):null,gps:$("#gps").checked,gateway:$("#gateway").checked,baja_definitiva:$("#baja_definitiva").checked,sustituido:$("#sustituido").checked};const id=$("#id").value;const result=id?await supabase.from("irratia").update(obj).eq("id",Number(id)):await supabase.from("irratia").insert(obj);if(result.error){showMsg(result.error.message,false);return;}$("#editPanela").hidden=true;await loadData();showMsg("Irratia gordeta");});

function openMovementForm(m=null){if(!currentRadio)return;editingMovement=m;$("#mugimenduEditPanela").hidden=false;$("#mugimenduFormTitle").textContent=m?"Mugimendua editatu":"Mugimendu berria";$("#mugimenduId").value=m?.id??"";$("#m_nork").value=m?.nork??"";$("#m_noiztik").value=m?.noiztik??today();$("#m_noizarte").value=m?.noizarte??"";$("#m_zergatia").value=m?.zergatia??"";$("#m_bateria").value=m?.bateria??"";$("#m_arreta").value=m?.arreta??"";$("#m_teltronic").value=m?.teltronic??"";["funda","micro","karga"].forEach(k=>$("#m_"+k).checked=!!m?.[k]);$("#m_kablea").checked=!!m?.kablea_12v;$("#mugimenduEditPanela").scrollIntoView({behavior:"smooth",block:"center"});}
$("#mugimenduBerria").onclick=()=>openMovementForm();$("#cancelMugimendu").onclick=()=>$("#mugimenduEditPanela").hidden=true;
$("#mugimenduForm").addEventListener("submit",async e=>{e.preventDefault();const obj={radio_id:currentRadio,nork:$("#m_nork").value.trim()||null,noiztik:$("#m_noiztik").value||null,noizarte:$("#m_noizarte").value||null,zergatia:$("#m_zergatia").value.trim()||null,bateria:$("#m_bateria").value===""?null:Number($("#m_bateria").value),arreta:$("#m_arreta").value===""?null:Number($("#m_arreta").value),teltronic:$("#m_teltronic").value.trim()||null,funda:$("#m_funda").checked,micro:$("#m_micro").checked,karga:$("#m_karga").checked,kablea_12v:$("#m_kablea").checked};const id=$("#mugimenduId").value;const result=id?await supabase.from("mugimenduak").update(obj).eq("id",Number(id)):await supabase.from("mugimenduak").insert(obj);if(result.error){showMsg(result.error.message,false);return;}$("#mugimenduEditPanela").hidden=true;await loadData();showMsg("Mugimendua gordeta");});

function openHistory(){if(!currentRadioData)return;$("#histTitle").textContent=`Historia — ${currentRadioData.alias||currentRadioData.zka||"Irratia"}`;$("#histContent").innerHTML=`<div class="historytable"><table><thead><tr><th>Data</th><th>Mugimendua</th><th>Nork</th><th>Arreta Zb.</th><th>RMA</th><th>Oharrak</th></tr></thead><tbody>${currentMovements.map(x=>`<tr><td>${esc(fmtDate(x.noiztik))}</td><td>${esc(x.zergatia||"—")}</td><td>${esc(x.nork||"—")}</td><td>${esc(dash(x.arreta))}</td><td>${esc(dash(x.teltronic))}</td><td>${esc(movementNotes(x))}</td></tr>`).join("")}</tbody></table></div>`;$("#histModal").hidden=false;}
$("#historiala").onclick=openHistory;$("#navHist").onclick=openHistory;$("#closeHist").onclick=()=>$("#histModal").hidden=true;$("#histModal").addEventListener("click",e=>{if(e.target.id==="histModal")$("#histModal").hidden=true;});document.addEventListener("keydown",e=>{if(e.key==="Escape")$("#histModal").hidden=true;});
$("#navMov").onclick=()=>$("#movementSection").scrollIntoView({behavior:"smooth",block:"start"});
function exportExcel(){if(!currentRadioData)return showMsg("Lehenengo hautatu irrati bat.",false);const rows=currentMovements.map(x=>({Data:fmtDate(x.noiztik),Mugimendua:x.zergatia||"",Nork:x.nork||"",Arreta_Zb:dash(x.arreta),RMA:dash(x.teltronic),Oharrak:movementNotes(x)}));const blob=new Blob(["\ufeff"+['Data;Mugimendua;Nork;Arreta Zb.;RMA;Oharrak',...rows.map(r=>Object.values(r).map(v=>`"${String(v).replaceAll('"','""')}"`).join(';'))].join('\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`TETRA_${currentRadioData.alias||currentRadioData.id}.csv`;a.click();URL.revokeObjectURL(a.href);}
function exportPDF(){if(!currentRadioData)return showMsg("Lehenengo hautatu irrati bat.",false);const w=window.open("","_blank");if(!w)return;w.document.write(`<html><head><title>TETRA ${esc(currentRadioData.alias||"")}</title><style>body{font-family:Arial;padding:24px;color:#17283e}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:7px;text-align:left;font-size:11px}th{background:#edf2f6}</style></head><body><h1>TETRA IRRATIAK — ${esc(currentRadioData.alias||"")}</h1><p>Marka: ${esc(currentRadioData.marka||"")} · Modeloa: ${esc(currentRadioData.modelo||"")} · TEI: ${esc(currentRadioData.tei??"")} · ZKA: ${esc(currentRadioData.zka??"")}</p><table><thead><tr><th>Data</th><th>Mugimendua</th><th>Nork</th><th>Arreta Zb.</th><th>RMA</th><th>Oharrak</th></tr></thead><tbody>${currentMovements.map(x=>`<tr><td>${esc(fmtDate(x.noiztik))}</td><td>${esc(x.zergatia||"")}</td><td>${esc(x.nork||"")}</td><td>${esc(dash(x.arreta))}</td><td>${esc(dash(x.teltronic))}</td><td>${esc(movementNotes(x))}</td></tr>`).join("")}</tbody></table><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close();}
$("#navExp").onclick=exportExcel;

function setNav(on){$("#navMov").disabled=!on;$("#navHist").disabled=!on;$("#navExp").disabled=!on;$("#logout").disabled=!on;}
async function saioa(){const {data:{session}}=await supabase.auth.getSession();if(!session){$("#app").hidden=true;$("#login").hidden=false;setNav(false);return;}$("#login").hidden=true;$("#app").hidden=false;setNav(true);await loadData();}
$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();const {error}=await supabase.auth.signInWithPassword({email:$("#email").value.trim(),password:$("#password").value});if(error)showMsg(error.message,false);else await saioa();});
$("#logout").onclick=async()=>{await supabase.auth.signOut();currentRadio=null;currentRadioData=null;await saioa();};
saioa();

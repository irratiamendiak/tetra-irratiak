import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://hsbreiibrllvbpbwfcoa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_CFBQFi5SCMTLBSCvAWh7yw_pz0E1Kb3";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const $ = (s) => document.querySelector(s);
let currentRadio = null;
let currentRadioData = null;
let currentMovements = [];
let editingMovement = null;

function esc(v=""){ return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }
function mezua(t,ok=true){ const e=$("#mezua"); e.textContent=t; e.className=ok?"mezua ondo":"mezua errorea"; setTimeout(()=>e.textContent="",3500); }
function fmtDate(v){ return v ? new Date(v+"T00:00:00").toLocaleDateString("eu-ES") : ""; }
function today(){ return new Date().toISOString().slice(0,10); }

function closeHistory(){
  $("#histModal").hidden=true;
}
function setNavEnabled(enabled){
  ["navMov","navHist","navExp","logout"].forEach(id=>{
    const el=$("#"+id);
    if(el) el.disabled=!enabled;
  });
}
async function saioa(){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){
    $("#app").hidden=true;
    $("#login").hidden=false;
    currentRadio=null;
    currentRadioData=null;
    closeHistory();
    setNavEnabled(false);
    return;
  }
  $("#login").hidden=true;
  $("#app").hidden=false;
  setNavEnabled(true);
  closeHistory();
  kargatuIrratiak();
}
$("#loginForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const {error}=await supabase.auth.signInWithPassword({email:$("#email").value.trim(),password:$("#password").value});
  if(error) mezua(error.message,false); else saioa();
});
$("#logout").onclick=async()=>{closeHistory(); await supabase.auth.signOut(); await saioa();};

async function kargatuIrratiak(){
  const q=$("#bilaketa").value.trim();
  let query=supabase.from("irratia").select("*").order("alias");
  if(q){
    const n=Number(q);
    query=query.or(`alias.ilike.%${q}%,marka.ilike.%${q}%,modelo.ilike.%${q}%${Number.isFinite(n)?`,zka.eq.${n}`:""}`);
  }
  const [{data,error},{data:movData,error:movError}]=await Promise.all([
    query,
    supabase.from("mugimenduak").select("radio_id,arreta,teltronic,noiztik,id").order("noiztik",{ascending:false}).order("id",{ascending:false})
  ]);
  if(error){mezua(error.message,false);return;}
  if(movError){mezua(movError.message,false);return;}
  const motaSel=$("#motaFilter"), markaSel=$("#markaFilter");
  if(motaSel && motaSel.options.length===1){[...new Set((data||[]).map(r=>r.mota).filter(Boolean))].sort().forEach(v=>motaSel.add(new Option(v,v)));}
  if(markaSel && markaSel.options.length===1){[...new Set((data||[]).map(r=>r.marka).filter(Boolean))].sort().forEach(v=>markaSel.add(new Option(v,v)));}
  const azkenMugimendua=new Map();
  (movData||[]).forEach(m=>{ if(m.radio_id!=null && !azkenMugimendua.has(m.radio_id)) azkenMugimendua.set(m.radio_id,m); });
  const egoeraF = $("#egoeraFilter")?.value || "";
  const motaF = $("#motaFilter")?.value || "";
  const markaF = $("#markaFilter")?.value || "";
  let radios = (data||[]).filter(r=>{
    const egoera=r.baja_definitiva?"baja":r.sustituido?"ordezkatua":"aktibo";
    return (!egoeraF || egoera===egoeraF) && (!motaF || (r.mota||"")===motaF) && (!markaF || (r.marka||"")===markaF);
  });
  $("#irratiaKop").textContent=`${radios.length} irrati`;
  const egoeraText=r=>r.baja_definitiva?"Behin betiko baja":r.sustituido?"Ordezkatua":"Aktiboa";
  const egoeraClass=r=>r.baja_definitiva?"retired":r.sustituido?"replaced":"active";
  $("#irratiaRows").innerHTML=radios.map(r=>{
    const m=azkenMugimendua.get(r.id)||{};
    return `<tr class="radio-row ${currentRadio===r.id?"selected":""}" data-radio-row="${r.id}">
      <td><strong>${esc(r.alias||r.zka||"")}</strong></td><td>${esc(r.tei??"")}</td><td>${esc(m.arreta??"")}</td><td>${esc(m.teltronic??"")}</td><td>${esc(r.mota??"")}</td>
      <td><span class="status ${egoeraClass(r)}">${egoeraText(r)}</span></td><td style="text-align:center;font-size:24px;color:#6b7d91">›</td></tr>`;
  }).join("") || `<tr><td colspan="7" style="padding:35px;text-align:center;color:#68788d">Ez da irratirik aurkitu.</td></tr>`;
  const rows=$("#irratiaRows");
  rows.onclick=(e)=>{ const row=e.target.closest("tr.radio-row"); if(!row)return; const id=Number(row.dataset.radioRow); if(Number.isFinite(id)) irekiIrratia(id,true); };
}

$("#bilaketa").addEventListener("input",kargatuIrratiak);
["egoeraFilter","motaFilter","markaFilter"].forEach(id=>$("#"+id)?.addEventListener("change",kargatuIrratiak));
$("#irratiBerria").onclick=()=>irekiIrratia(null);
$("#itxiIrratia").onclick=()=>itxiIrratia();

async function irekiIrratia(id,fromRow=false){
  currentRadio=id;
  $("#irratiXehetasuna").hidden=false;
  if(id===null){
    currentRadioData=null; currentMovements=[];
    $("#irratiForm").reset(); $("#id").value=""; $("#izenburua").textContent="Irrati berria";
    $("#mugimenduEditPanela").hidden=true; return;
  }
  const {data,error}=await supabase.from("irratia").select("*").eq("id",id).single();
  if(error){mezua(error.message,false);return;}
  currentRadioData=data;
  $("#izenburua").textContent=data.alias||data.zka||"Irratia";
  const st=$("#statusBurua"); st.className=`status ${data.baja_definitiva?"retired":data.sustituido?"replaced":"active"}`; st.textContent=data.baja_definitiva?"Behin betiko baja":data.sustituido?"Ordezkatua":"Aktiboa";
  $("#editatzeko").value=JSON.stringify(data);
  $("#mugimenduEditPanela").hidden=true;
  await kargatuMugimenduak(id);
  const azken=currentMovements[0]||{};
  $("#datuak").innerHTML=`
    <div><span>TEI:</span><strong>${esc(data.tei??"")}</strong></div>
    <div><span>Arreta Zb.:</span><strong>${esc(azken.arreta??"")}</strong></div>
    <div><span>RMA:</span><strong>${esc(azken.teltronic??"")}</strong></div>
    <div><span>Saila:</span><strong>${esc(data.mota??"")}</strong></div>
    <div><span>Kokapena:</span><strong>—</strong></div>
    <div><span>Marka:</span><strong>${esc(data.marka??"")}</strong></div>
    <div><span>Modeloa:</span><strong>${esc(data.modelo??"")}</strong></div>
    <div><span>GPS:</span><strong>${data.gps?"Bai":"Ez"}</strong></div>
    <div><span>Gateway:</span><strong>${data.gateway?"Bai":"Ez"}</strong></div>
    <div><span>Oharrak:</span><strong>—</strong></div>`;
  if(fromRow) setTimeout(()=>$("#irratiXehetasuna").scrollIntoView({behavior:"smooth",block:"start"}),30);
}
function itxiIrratia(){ $("#irratiXehetasuna").hidden=true; currentRadio=null; currentRadioData=null; }

$("#editIrratia").onclick=()=>{
  if(!currentRadio)return;
  const d=JSON.parse($("#editatzeko").value);
  $("#id").value=d.id; $("#zka").value=d.zka??""; $("#alias").value=d.alias??""; $("#mota").value=d.mota??"";
  $("#marka").value=d.marka??""; $("#modelo").value=d.modelo??""; $("#tei").value=d.tei??"";
  ["gps","gateway","baja_definitiva","sustituido"].forEach(k=>$("#"+k).checked=!!d[k]);
  $("#editPanela").hidden=false;
};
$("#cancelEdit").onclick=()=>$("#editPanela").hidden=true;
$("#irratiForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const obj={zka:$("#zka").value?Number($("#zka").value):null,alias:$("#alias").value.trim()||null,mota:$("#mota").value.trim()||null,
    marka:$("#marka").value.trim()||null,modelo:$("#modelo").value.trim()||null,tei:$("#tei").value?Number($("#tei").value):null,
    gps:$("#gps").checked,gateway:$("#gateway").checked,baja_definitiva:$("#baja_definitiva").checked,sustituido:$("#sustituido").checked};
  const result=currentRadio?await supabase.from("irratia").update(obj).eq("id",currentRadio):await supabase.from("irratia").insert(obj);
  if(result.error){mezua(result.error.message,false);return;}
  $("#editPanela").hidden=true; mezua("Irratia gordeta"); if(currentRadio) irekiIrratia(currentRadio); else kargatuIrratiak();
});

async function kargatuMugimenduak(id){
  const {data,error}=await supabase.from("mugimenduak").select("*").eq("radio_id",id).order("noiztik",{ascending:false}).order("id",{ascending:false});
  if(error){mezua(error.message,false);return;}
  currentMovements=data||[];
  $("#mugimenduKop").textContent=`${currentMovements.length} erregistro`;
  $("#mugimenduRows").innerHTML=currentMovements.length?currentMovements.map(x=>`
  <tr><td>${esc(fmtDate(x.noiztik))}</td><td>${esc(x.zergatia||"—")}</td><td>—</td><td>${esc(x.arreta??"")}</td><td>${esc(x.teltronic??"")}</td><td>${esc(x.nork||"")}</td><td>${esc([x.bateria!=null?`Bateria ${x.bateria}`:"",x.funda?"Funda":"",x.micro?"Mikroa":"",x.karga?"Karga":"",x.kablea_12v?"12V":""].filter(Boolean).join(" · ")||"—")}</td>
  <td><button class="smallBtn edit-mov" data-id="${x.id}">Editatu</button> <button class="smallBtn ezabatu" data-id="${x.id}">Ezabatu</button></td></tr>`).join("") :
  `<tr><td colspan="8" style="padding:35px;text-align:center;color:#68788d">Ez dago mugimendurik.</td></tr>`;
  document.querySelectorAll(".ezabatu").forEach(b=>b.onclick=async()=>{
    if(!confirm("Mugimendu hau ezabatu nahi duzu?"))return;
    const {error}=await supabase.from("mugimenduak").delete().eq("id",Number(b.dataset.id));
    if(error)mezua(error.message,false);else kargatuMugimenduak(id);
  });
  document.querySelectorAll(".edit-mov").forEach(b=>b.onclick=()=>irekiMugimenduForm(currentMovements.find(x=>x.id===Number(b.dataset.id))));
}

function irekiMugimenduForm(m=null){
  editingMovement=m;
  $("#mugimenduFormTitle").textContent=m?"Mugimendua editatu":"Mugimendu berria";
  $("#mugimenduId").value=m?.id??"";
  $("#m_nork").value=m?.nork??"";
  $("#m_noiztik").value=m?.noiztik??today();
  $("#m_noizarte").value=m?.noizarte??"";
  $("#m_zergatia").value=m?.zergatia??"";
  $("#m_bateria").value=m?.bateria??"";
  $("#m_arreta").value=m?.arreta??"";
  $("#m_teltronic").value=m?.teltronic??"";
  ["funda","micro","karga"].forEach(k=>$("#m_"+k).checked=!!m?.[k]);
  $("#m_kablea").checked=!!m?.kablea_12v;
  $("#mugimenduEditPanela").hidden=false;
  $("#mugimenduEditPanela").scrollIntoView({behavior:"smooth",block:"start"});
}
$("#mugimenduBerria").onclick=()=>irekiMugimenduForm();
$("#cancelMugimendu").onclick=()=>{$("#mugimenduEditPanela").hidden=true;editingMovement=null;};
$("#mugimenduForm").addEventListener("submit",async e=>{
  e.preventDefault();
  if(!currentRadio)return;
  const obj={
    radio_id:currentRadio,
    nork:$("#m_nork").value.trim()||null,
    noiztik:$("#m_noiztik").value||null,
    noizarte:$("#m_noizarte").value||null,
    zergatia:$("#m_zergatia").value.trim()||null,
    bateria:$("#m_bateria").value===""?null:Number($("#m_bateria").value),
    arreta:$("#m_arreta").value===""?null:Number($("#m_arreta").value),
    teltronic:$("#m_teltronic").value.trim()||null,
    funda:$("#m_funda").checked,micro:$("#m_micro").checked,karga:$("#m_karga").checked,kablea_12v:$("#m_kablea").checked
  };
  const result=editingMovement
    ? await supabase.from("mugimenduak").update(obj).eq("id",editingMovement.id)
    : await supabase.from("mugimenduak").insert(obj);
  if(result.error){mezua(result.error.message,false);return;}
  $("#mugimenduEditPanela").hidden=true; editingMovement=null; mezua("Mugimendua gordeta"); kargatuMugimenduak(currentRadio);
});

function openHistory(){
  if(!currentRadio || !currentRadioData){ closeHistory(); mezua("Lehenengo hautatu irrati bat.",false); return; }
  $("#histTitle").textContent=`Historia — ${currentRadioData.alias||currentRadioData.zka||""}`;
  $("#histContent").innerHTML=currentMovements.length ? `
    <p>${currentMovements.length} erregistro historiko.</p>
    <div class="historytable"><table><thead><tr><th>Hasiera</th><th>Amaiera</th><th>Nork</th><th>Arrazoia</th><th>Bateria</th><th>Arreta Zb.</th><th>RMA</th><th>Osagarriak</th></tr></thead>
    <tbody>${currentMovements.map(x=>`<tr><td>${esc(fmtDate(x.noiztik))}</td><td>${esc(fmtDate(x.noizarte))}</td><td>${esc(x.nork||"")}</td><td>${esc(x.zergatia||"")}</td><td>${esc(x.bateria??"")}</td><td>${esc(x.arreta??"")}</td><td>${esc(x.teltronic??"")}</td><td>${[x.funda?"Funda":"",x.micro?"Mikroa":"",x.karga?"Karga":"",x.kablea_12v?"12V":""] .filter(Boolean).join(", ")}</td></tr>`).join("")}</tbody></table></div>` :
    `<p class="hutsunea">Ez dago mugimendurik.</p>`;
  $("#histModal").hidden=false;
}
$("#historiala").onclick=openHistory;
$("#histBottom").onclick=openHistory;
$("#closeHist").addEventListener("click",closeHistory);
$("#histModal").addEventListener("click",e=>{if(e.target.id==="histModal")closeHistory();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeHistory();});

async function loadSheetJS(){
  if(window.XLSX)return window.XLSX;
  await new Promise((resolve,reject)=>{
    const s=document.createElement("script");
    s.src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
    s.onload=resolve; s.onerror=reject; document.head.appendChild(s);
  });
  return window.XLSX;
}
async function exportExcel(){
  if(!currentRadioData)return;
  try{
    const XLSX=await loadSheetJS();
    const rows=currentMovements.map(x=>({
      ZKA:currentRadioData.zka??"", Alias:currentRadioData.alias??"", TEI:currentRadioData.tei??"",
      Hasiera:x.noiztik??"", Amaiera:x.noizarte??"", Nork:x.nork??"", Arrazoia:x.zergatia??"",
      Bateria:x.bateria??"", "Arreta Zb.":x.arreta??"", RMA:x.teltronic??"",
      Funda:x.funda?"Bai":"Ez", Mikroa:x.micro?"Bai":"Ez", Karga:x.karga?"Bai":"Ez", "12V kablea":x.kablea_12v?"Bai":"Ez"
    }));
    const wb=XLSX.utils.book_new();
    const ws=XLSX.utils.json_to_sheet(rows.length?rows:[{ZKA:currentRadioData.zka??"",Alias:currentRadioData.alias??"",TEI:currentRadioData.tei??""}]);
    XLSX.utils.book_append_sheet(wb,ws,"Historia");
    XLSX.writeFile(wb,`TETRA_${currentRadioData.alias||currentRadioData.zka}_historia.xlsx`);
    mezua("Excel fitxategia sortu da.");
  }catch(e){
    console.error(e);
    mezua("Excel esportazioa ezin izan da egin.",false);
  }
}
$("#excel").onclick=exportExcel; $("#excelBottom").onclick=exportExcel;

function exportPDF(){
  if(!currentRadioData)return;
  const w=window.open("","_blank");
  if(!w){mezua("Nabigatzaileak leihoa blokeatu du.",false);return;}
  const rows=currentMovements.map(x=>`<tr><td>${esc(fmtDate(x.noiztik))}</td><td>${esc(fmtDate(x.noizarte))}</td><td>${esc(x.nork||"")}</td><td>${esc(x.zergatia||"")}</td><td>${esc(x.bateria??"")}</td><td>${esc(x.arreta??"")}</td><td>${esc(x.teltronic??"")}</td></tr>`).join("");
  w.document.write(`<html><head><title>TETRA ${esc(currentRadioData.alias||"")}</title><style>
  body{font-family:Arial,sans-serif;padding:28px;color:#18253d}h1{margin:0 0 6px}small{color:#68748a}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:7px;text-align:left;font-size:11px}th{background:#eef3f8}@media print{button{display:none}}
  </style></head><body><h1>TETRA — ${esc(currentRadioData.alias||"Irratia")}</h1><small>ZKA: ${esc(currentRadioData.zka??"")} · TEI: ${esc(currentRadioData.tei??"")} · Marka: ${esc(currentRadioData.marka??"")} · Modeloa: ${esc(currentRadioData.modelo??"")} · Arreta Zb.: ${esc(currentMovements[0]?.arreta??"")} · RMA: ${esc(currentMovements[0]?.teltronic??"")}</small>
  <h2>Historia (${currentMovements.length})</h2><table><thead><tr><th>Hasiera</th><th>Amaiera</th><th>Nork</th><th>Arrazoia</th><th>Bateria</th><th>Arreta Zb.</th><th>RMA</th></tr></thead><tbody>${rows}</tbody></table>
  <script>window.onload=()=>window.print();</script></body></html>`);
  w.document.close();
}
$("#pdf").onclick=exportPDF; $("#pdfBottom").onclick=exportPDF;

$("#navMov").onclick=()=>{ if(currentRadio) document.querySelector(".txartela:last-of-type")?.scrollIntoView({behavior:"smooth"}); };
$("#navHist").onclick=()=>{ if(currentRadio&&currentRadioData) openHistory(); else mezua("Lehenengo hautatu irrati bat.",false); };
$("#navExp").onclick=()=>currentRadio?exportExcel():mezua("Lehenengo hautatu irrati bat.",false);

saioa();

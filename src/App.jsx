import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { db } from "./supabase.js";
import { DEPTS, WEEKS, SEED_GROUPS, SEED_UNITS } from "./data.js";

const C = {
  bg:"#F0F6FC",surface:"#FFFFFF",card:"#FFFFFF",border:"#C3DCF0",
  accent:"#1B8FD8",accent2:"#1470B0",accentLight:"#D6EBF8",
  green:"#1E9E5B",greenLight:"#D4F0E2",red:"#D63B3B",redLight:"#FADADD",
  amber:"#E07B00",amberLight:"#FFF0D6",text:"#1A2B3C",muted:"#5A7A96",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${C.bg};color:${C.text};font-family:'Nunito',sans-serif;min-height:100vh}
  ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
  input,select,textarea{background:${C.surface};border:1.5px solid ${C.border};color:${C.text};border-radius:8px;padding:10px 14px;width:100%;font-family:'Nunito',sans-serif;font-size:14px;outline:none;transition:border .2s}
  input:focus,select:focus,textarea:focus{border-color:${C.accent};box-shadow:0 0 0 3px rgba(27,143,216,0.12)}
  button{cursor:pointer;font-family:'Nunito',sans-serif;border:none;border-radius:8px;font-size:14px;font-weight:700;transition:all .18s}
  .btn-primary{background:${C.accent};color:#fff;padding:10px 20px}.btn-primary:hover{background:${C.accent2}}
  .btn-primary:disabled{opacity:.6;cursor:not-allowed}
  .btn-danger{background:${C.red};color:#fff;padding:8px 14px}.btn-danger:hover{background:#b52f2f}
  .btn-ghost{background:${C.accentLight};color:${C.accent};padding:8px 14px;border:1.5px solid ${C.border}}.btn-ghost:hover{background:${C.border}}
  .btn-green{background:${C.green};color:#fff;padding:8px 14px}.btn-green:hover{background:#187a47}
  .btn-sm{padding:6px 12px;font-size:12px}
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
  .badge-green{background:${C.greenLight};color:${C.green}}.badge-red{background:${C.redLight};color:${C.red}}
  .badge-blue{background:${C.accentLight};color:${C.accent}}.badge-amber{background:${C.amberLight};color:${C.amber}}
  .card{background:${C.card};border:1.5px solid ${C.border};border-radius:14px;padding:20px}
  .tab{padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;color:${C.muted};transition:all .2s;white-space:nowrap}
  .tab.active{background:${C.accent};color:#fff}.tab:hover:not(.active){background:${C.accentLight};color:${C.accent2}}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;padding:10px 14px;color:${C.muted};font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid ${C.border};background:${C.bg}}
  td{padding:10px 14px;border-bottom:1px solid ${C.border};vertical-align:middle}
  tr:last-child td{border-bottom:none}tr:hover td{background:${C.accentLight}}
  .modal-bg{position:fixed;inset:0;background:rgba(26,43,60,0.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px}
  .modal{background:${C.card};border:1.5px solid ${C.border};border-radius:16px;padding:28px;width:540px;max-width:100%;max-height:90vh;overflow-y:auto}
  .toggle{width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0}
  .toggle-on{background:${C.green}}.toggle-off{background:${C.border}}
  .toggle::after{content:'';position:absolute;top:3px;width:16px;height:16px;background:#fff;border-radius:50%;transition:left .2s;box-shadow:0 1px 4px rgba(0,0,0,.2)}
  .toggle-on::after{left:21px}.toggle-off::after{left:3px}
  .spin{animation:spin 1s linear infinite;display:inline-block}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

const todayStr = () => new Date().toISOString().split("T")[0];
const pct = (p,t) => t===0?0:Math.round((p/t)*100);
const pctColor = p => p>=75?C.green:p>=50?C.amber:C.red;
const getWeek = (date, start) => { if(!start) return null; const d=Math.floor((new Date(date)-new Date(start))/(7*86400000)); return d>=0&&d<WEEKS?d+1:null; };

function Spinner(){ return <span className="spin">⟳</span>; }
function Label({children}){ return <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:6,fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>{children}</label>; }
function Flash({msg}){ if(!msg) return null; const e=msg.type==="error"; return <div style={{background:e?C.redLight:C.greenLight,border:`1px solid ${e?C.red:C.green}`,color:e?C.red:C.green,padding:"10px 16px",borderRadius:8,marginBottom:16,fontSize:13,fontWeight:600}}>{msg.text}</div>; }

function Header({user, onLogout}){
  return(
    <div style={{background:C.accent,padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:62,boxShadow:"0 2px 12px rgba(27,143,216,0.2)",position:"sticky",top:0,zIndex:50}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <img src="/logo.png" alt="BIFA" style={{height:42,filter:"brightness(0) invert(1)"}} onError={e=>e.target.style.display='none'}/>
        <div style={{width:1,height:34,background:"rgba(255,255,255,0.3)"}}/>
        <div>
          <div style={{color:"#fff",fontSize:13,fontWeight:800}}>Attendance Portal</div>
          <div style={{color:"rgba(255,255,255,0.75)",fontSize:11}}>Buruburu Institute of Fine Arts</div>
        </div>
        <span className="badge" style={{background:"rgba(255,255,255,0.2)",color:"#fff",marginLeft:4}}>{user.role==="admin"?"Administrator":"Lecturer"}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:13,color:"rgba(255,255,255,0.9)",fontWeight:600}}>👋 {user.name}</span>
        <button style={{background:"rgba(255,255,255,0.15)",color:"#fff",padding:"7px 16px",borderRadius:8,fontSize:13,fontWeight:600,border:"1px solid rgba(255,255,255,0.3)"}} onClick={onLogout}>Sign Out</button>
      </div>
    </div>
  );
}

function LoginScreen({onLogin}){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  const login = async () => {
    setLoading(true); setError("");
    try {
      const rows = await db.get("users", `email=eq.${encodeURIComponent(email.trim().toLowerCase())}&active=eq.true&select=*`);
      if(!rows.length || rows[0].password !== password){ setError("Invalid email or password."); return; }
      onLogin(rows[0]);
    } catch(e){ setError("Connection error: "+e.message); }
    finally{ setLoading(false); }
  };

  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${C.accentLight} 0%,#fff 60%,${C.accentLight} 100%)`}}>
      <div style={{width:400,maxWidth:"95vw"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <img src="/logo.png" alt="BIFA" style={{width:150}} onError={e=>e.target.style.display='none'}/>
          <div style={{marginTop:10,fontSize:12,color:C.muted,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>Attendance Portal</div>
          <div style={{width:40,height:3,background:C.accent,margin:"10px auto 0",borderRadius:2}}/>
        </div>
        <div className="card" style={{boxShadow:"0 8px 32px rgba(27,143,216,0.12)"}}>
          <h2 style={{marginBottom:20,fontSize:17,color:C.accent,textAlign:"center"}}>Staff Sign In</h2>
          <div style={{marginBottom:16}}><Label>Email</Label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@gmail.com" onKeyDown={e=>e.key==="Enter"&&login()}/></div>
          <div style={{marginBottom:22}}><Label>Password</Label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&login()}/></div>
          {error&&<div style={{background:C.redLight,border:`1px solid ${C.red}`,color:C.red,padding:"10px 14px",borderRadius:8,fontSize:13,marginBottom:16}}>{error}</div>}
          <button className="btn-primary" style={{width:"100%",padding:13,fontSize:15}} onClick={login} disabled={loading}>{loading?<><Spinner/> Signing in…</>:"Sign In →"}</button>
        </div>
        <p style={{textAlign:"center",color:C.muted,fontSize:12,marginTop:14}}>Contact admin to reset your password</p>
      </div>
    </div>
  );
}

function MarkAttendance({unit,students,user,semStart}){
  const [date,setDate]=useState(todayStr());
  const [session,setSession]=useState(1);
  const [marks,setMarks]=useState({});
  const [saving,setSaving]=useState(false);
  const [msg,setMsg]=useState(null);
  const flash=(t,type="success")=>{setMsg({text:t,type});setTimeout(()=>setMsg(null),3000);};
  const weekNum=getWeek(date,semStart);

  useEffect(()=>{
    if(!unit) return;
    db.get("attendance",`unit_id=eq.${unit.id}&date=eq.${date}&session=eq.${session}&select=student_id,present`)
      .then(rows=>{ const m={}; rows.forEach(r=>m[r.student_id]=r.present); setMarks(m); })
      .catch(()=>{});
  },[unit?.id,date,session]);

  const save = async () => {
    if(!students.length){ flash("No students enrolled.","error"); return; }
    setSaving(true);
    try {
      const rows = students.map(s=>({ student_id:s.id, unit_id:unit.id, date, session, week_num:weekNum, present:marks[s.id]===true, marked_by:user.id }));
      await db.upsert("attendance", rows);
      flash(`✓ Saved! Week ${weekNum||"?"}, Session ${session}`);
    } catch(e){ flash("Failed to save: "+e.message,"error"); }
    setSaving(false);
  };

  const markAll = val => { const m={}; students.forEach(s=>m[s.id]=val); setMarks(m); };
  const present = students.filter(s=>marks[s.id]===true).length;
  const marked = Object.keys(marks).length;

  return(
    <div>
      <Flash msg={msg}/>
      {semStart&&<div style={{background:weekNum?C.accentLight:C.amberLight,border:`1px solid ${weekNum?C.accent:C.amber}`,borderRadius:8,padding:"8px 14px",marginBottom:14,fontSize:13,fontWeight:600,color:weekNum?C.accent:C.amber}}>
        {weekNum?`📅 Week ${weekNum} of ${WEEKS}`:"⚠️ Date is outside the 9-week semester range"}
      </div>}
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{flex:2,minWidth:150}}><Label>Date</Label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div style={{flex:1,minWidth:120}}><Label>Session</Label>
          <select value={session} onChange={e=>setSession(Number(e.target.value))}>
            {Array.from({length:unit?.sessions_per_day||1},(_,i)=><option key={i+1} value={i+1}>Session {i+1}{unit?.sessions_per_day>1?` of ${unit.sessions_per_day}`:""}</option>)}
          </select>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div style={{fontSize:13,color:C.muted}}><b style={{color:C.accent}}>{marked}</b>/{students.length} marked · <b style={{color:C.green}}>{present}</b> present · <b style={{color:C.red}}>{marked-present}</b> absent</div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn-green btn-sm" onClick={()=>markAll(true)}>✓ All Present</button>
          <button className="btn-danger btn-sm" onClick={()=>markAll(false)}>✗ All Absent</button>
          <button className="btn-primary btn-sm" onClick={save} disabled={saving}>{saving?<><Spinner/> Saving…</>:"💾 Save"}</button>
        </div>
      </div>
      <div style={{display:"grid",gap:8}}>
        {students.length===0&&<div className="card" style={{textAlign:"center",color:C.muted,padding:40}}>No students enrolled in this unit yet.</div>}
        {students.map(stu=>{
          const s=marks[stu.id];
          return(
            <div key={stu.id} className="card" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",borderLeft:`4px solid ${s===true?C.green:s===false?C.red:C.border}`}}>
              <div><div style={{fontWeight:700}}>{stu.name}</div><div style={{fontSize:11,color:C.muted}}>{stu.reg_no}</div></div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setMarks(p=>({...p,[stu.id]:true}))} style={{background:s===true?C.green:C.accentLight,color:s===true?"#fff":C.accent,padding:"7px 16px",borderRadius:8,fontSize:13,fontWeight:700,border:`1.5px solid ${s===true?C.green:C.border}`,minWidth:95}}>✓ Present</button>
                <button onClick={()=>setMarks(p=>({...p,[stu.id]:false}))} style={{background:s===false?C.red:C.accentLight,color:s===false?"#fff":C.accent,padding:"7px 16px",borderRadius:8,fontSize:13,fontWeight:700,border:`1.5px solid ${s===false?C.red:C.border}`,minWidth:95}}>✗ Absent</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AttendanceReport({unit,students}){
  const [records,setRecords]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filterWeek,setFilterWeek]=useState("all");

  useEffect(()=>{
    if(!unit) return;
    setLoading(true);
    db.get("attendance",`unit_id=eq.${unit.id}&select=*`)
      .then(setRecords).catch(()=>{}).finally(()=>setLoading(false));
  },[unit?.id]);

  if(loading) return <div style={{textAlign:"center",padding:40,color:C.muted}}><Spinner/> Loading…</div>;

  const recs = filterWeek==="all" ? records : records.filter(r=>r.week_num===Number(filterWeek));
  const sessions = [...new Set(records.map(r=>`${r.date}_${r.session}`))].sort();
  const weeks = [...new Set(records.filter(r=>r.week_num).map(r=>r.week_num))].sort((a,b)=>a-b);

  return(
    <div>
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:11,color:C.muted,fontWeight:700}}>WEEK:</span>
        <button className={`btn-sm ${filterWeek==="all"?"btn-primary":"btn-ghost"}`} onClick={()=>setFilterWeek("all")}>All</button>
        {Array.from({length:WEEKS},(_,i)=>i+1).map(w=>(
          <button key={w} className={`btn-sm ${filterWeek===w?"btn-primary":"btn-ghost"}`} onClick={()=>setFilterWeek(w)} style={{opacity:weeks.includes(w)?1:0.4}}>Wk {w}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:12,marginBottom:14}}>
        {[{l:"Sessions",v:sessions.length,c:C.accent},{l:"Students",v:students.length,c:C.green},{l:"Max Sessions",v:WEEKS*(unit?.sessions_per_day||1),c:C.amber}].map(s=>(
          <div key={s.l} className="card" style={{flex:1,padding:"10px 14px",borderLeft:`4px solid ${s.c}`}}>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase"}}>{s.l}</div>
            <div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{padding:0,overflow:"hidden"}}>
        <table>
          <thead><tr><th>Reg No</th><th>Name</th><th>Present</th><th>Absent</th><th>Attendance %</th><th>Status</th></tr></thead>
          <tbody>
            {students.length===0&&<tr><td colSpan={6} style={{textAlign:"center",color:C.muted,padding:32}}>No students enrolled</td></tr>}
            {students.map(stu=>{
              const r=recs.filter(x=>x.student_id===stu.id);
              const p=r.filter(x=>x.present).length, ab=r.filter(x=>!x.present).length;
              const pc=pct(p,p+ab);
              return(
                <tr key={stu.id}>
                  <td style={{fontFamily:"monospace",fontSize:11,color:C.muted}}>{stu.reg_no}</td>
                  <td style={{fontWeight:600}}>{stu.name}</td>
                  <td style={{color:C.green,fontWeight:700}}>{p}</td>
                  <td style={{color:C.red,fontWeight:700}}>{ab}</td>
                  <td><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:7,background:C.accentLight,borderRadius:4,overflow:"hidden"}}><div style={{width:`${pc}%`,height:"100%",background:pctColor(pc),borderRadius:4}}/></div><span style={{color:pctColor(pc),fontWeight:800,minWidth:36}}>{pc}%</span></div></td>
                  <td><span className={`badge ${pc>=75?"badge-green":pc>=50?"badge-amber":"badge-red"}`}>{pc>=75?"Good":pc>=50?"At Risk":"Critical"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LecturerDashboard({user,onLogout}){
  const [units,setUnits]=useState([]);
  const [groups,setGroups]=useState([]);
  const [students,setStudents]=useState([]);
  const [selected,setSelected]=useState(null);
  const [tab,setTab]=useState("mark");
  const [semStart,setSemStart]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    Promise.all([
      db.get("units",`lecturer_id=eq.${user.id}&select=*&order=name`),
      db.get("groups","select=*"),
      db.get("settings","key=eq.sem_start&select=*"),
    ]).then(([u,g,s])=>{
      setUnits(u); setGroups(g);
      if(s.length) setSemStart(s[0].value);
      if(u.length) setSelected(u[0]);
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    if(!selected) return;
    db.get("students",`group_id=eq.${selected.group_id}&select=*&order=name`).then(setStudents).catch(()=>{});
  },[selected?.id]);

  if(loading) return <div style={{minHeight:"100vh",background:C.bg}}><Header user={user} onLogout={onLogout}/><div style={{textAlign:"center",padding:60,color:C.muted}}><Spinner/><div style={{marginTop:10}}>Loading your units…</div></div></div>;

  const grouped = units.reduce((a,u)=>{ const g=groups.find(x=>x.id===u.group_id); const k=g?.name||"Other"; if(!a[k])a[k]=[]; a[k].push(u); return a; },{});

  return(
    <div style={{minHeight:"100vh",background:C.bg}}>
      <Header user={user} onLogout={onLogout}/>
      <div style={{maxWidth:920,margin:"0 auto",padding:"24px 16px"}}>
        {units.length===0?(
          <div className="card" style={{textAlign:"center",padding:60,color:C.muted}}>
            <div style={{fontSize:40,marginBottom:12}}>📚</div>
            <div style={{fontWeight:700,marginBottom:6}}>No units assigned yet</div>
            <div style={{fontSize:13}}>Contact admin to assign units to your account.</div>
          </div>
        ):(
          <>
            <div style={{marginBottom:20}}>
              <Label>Select Unit / Subject</Label>
              {Object.entries(grouped).map(([gn,us])=>(
                <div key={gn} style={{marginBottom:10}}>
                  <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",marginBottom:6}}>{gn}</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {us.map(u=>(
                      <button key={u.id} onClick={()=>{setSelected(u);setTab("mark");}}
                        style={{background:selected?.id===u.id?C.accent:C.surface,color:selected?.id===u.id?"#fff":C.accent,padding:"8px 16px",borderRadius:10,border:`1.5px solid ${selected?.id===u.id?C.accent:C.border}`,fontWeight:700,fontSize:13}}>
                        {u.name}{u.sessions_per_day>1&&<span style={{fontSize:10,marginLeft:5,opacity:.75}}>{u.sessions_per_day}x/day</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {selected&&(
              <>
                <div style={{display:"flex",gap:8,marginBottom:20,background:C.surface,padding:8,borderRadius:12,border:`1.5px solid ${C.border}`,width:"fit-content"}}>
                  <div className={`tab${tab==="mark"?" active":""}`} onClick={()=>setTab("mark")}>📋 Mark Attendance</div>
                  <div className={`tab${tab==="report"?" active":""}`} onClick={()=>setTab("report")}>📊 View Report</div>
                </div>
                {tab==="mark"&&<MarkAttendance unit={selected} students={students} user={user} semStart={semStart}/>}
                {tab==="report"&&<AttendanceReport unit={selected} students={students}/>}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AdminDashboard({user,onLogout}){
  const [tab,setTab]=useState("overview");
  const [users,setUsers]=useState([]);
  const [groups]=useState(SEED_GROUPS);
  const [units,setUnits]=useState(SEED_UNITS);
  const [students,setStudents]=useState([]);
  const [semStart,setSemStart]=useState("");
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const [msg,setMsg]=useState(null);
  const [importText,setImportText]=useState("");
  const [importFile,setImportFile]=useState(null);
  const [importPreview,setImportPreview]=useState([]);
  const [importStatus,setImportStatus]=useState("");
  const [importing,setImporting]=useState(false);
  const [selectedUnit,setSelectedUnit]=useState(null);
  const [unitStudents,setUnitStudents]=useState([]);

  const flash=(t,type="success")=>{setMsg({text:t,type});setTimeout(()=>setMsg(null),3500);};

  const load = useCallback(async()=>{
    try {
      const [u,un,s,st] = await Promise.all([
        db.get("users","select=*&order=name"),
        db.get("units","select=*&order=name"),
        db.get("students","select=*&order=name"),
        db.get("settings","key=eq.sem_start&select=*"),
      ]);
      setUsers(u); setUnits(un); setStudents(s);
      if(st.length) setSemStart(st[0].value);
    } catch(e){ flash("Load error: "+e.message,"error"); }
    setLoading(false);
  },[]);

  useEffect(()=>{ load(); },[]);
  useEffect(()=>{ if(selectedUnit) setUnitStudents(students.filter(s=>s.group_id===selectedUnit.group_id)); },[selectedUnit,students]);

  const lecturers = users.filter(u=>u.role==="lecturer");

  const addLecturer = async () => {
    const {name,email,password,department}=form;
    if(!name||!email||!password||!department) return flash("All fields required.","error");
    try { await db.post("users",{name,email:email.toLowerCase(),password,role:"lecturer",department,active:true}); flash("Lecturer added!"); setModal(null); setForm({}); load(); }
    catch(e){ flash(e.message||"Failed.","error"); }
  };

  const toggleLecturer = async u => {
    try { await db.patch("users",`id=eq.${u.id}`,{active:!u.active}); load(); }
    catch{ flash("Failed.","error"); }
  };

  const deleteLecturer = async id => {
    if(!confirm("Remove this lecturer?")) return;
    try { await db.delete("users",`id=eq.${id}`); load(); flash("Removed."); }
    catch{ flash("Failed.","error"); }
  };

  const assignLecturer = async () => {
    const {unit_id,lecturer_id}=form;
    if(!unit_id||!lecturer_id) return flash("Select both unit and lecturer.","error");
    try { await db.patch("units",`id=eq.${unit_id}`,{lecturer_id}); flash("Assigned!"); setModal(null); setForm({}); load(); }
    catch{ flash("Failed.","error"); }
  };

  const addStudent = async () => {
    const {reg_no,name,group_id}=form;
    if(!reg_no||!name||!group_id) return flash("Reg no, name and group required.","error");
    const grp=groups.find(g=>g.id===group_id);
    try { await db.post("students",{reg_no:reg_no.trim(),name:name.trim(),group_id,department:grp?.department||"",year:grp?.year||1,term:grp?.term||1}); flash("Student added!"); setModal(null); setForm({}); load(); }
    catch(e){ flash(e.message||"Reg no may exist.","error"); }
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFile(file);
    setImportStatus("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        // Filter out empty rows, take first 3 columns
        const data = rows
          .filter(r => r[0] && r[1] && r[2])
          .map(r => ({ reg_no: String(r[0]).trim(), name: String(r[1]).trim(), groupName: String(r[2]).trim() }));
        setImportPreview(data);
        setImportStatus(`Found ${data.length} students in file`);
      } catch(err) {
        setImportStatus("Error reading file: " + err.message);
        setImportPreview([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const bulkImport = async () => {
    // Support both Excel preview and manual text
    let rows = importPreview;
    if (!rows.length && importText.trim()) {
      rows = importText.trim().split("\n").filter(l=>l.trim()).map(line => {
        const [reg_no, name, groupName] = line.split(",").map(p=>p.trim());
        return { reg_no, name, groupName };
      });
    }
    if (!rows.length) { flash("No data to import.","error"); return; }
    setImporting(true);
    let added=0, skipped=0, errors=[];
    for(const row of rows){
      const { reg_no, name, groupName } = row;
      if(!reg_no||!name||!groupName){ skipped++; continue; }
      const grp = SEED_GROUPS.find(g=>g.name.toLowerCase()===groupName.toLowerCase());
      if(!grp){ errors.push(`Group not found: "${groupName}"`); skipped++; continue; }
      try {
        await db.upsert("students",[{ reg_no, name, group_id:grp.id, department:grp.department, year:grp.year, term:grp.term }]);
        added++;
      } catch { skipped++; }
    }
    const errMsg = errors.length ? ` (${errors[0]})` : "";
    flash(`✓ Imported ${added} students. Skipped ${skipped}.${errMsg}`);
    setImportText(""); setImportFile(null); setImportPreview([]); setImportStatus("");
    setImporting(false); setModal(null); load();
  };

  const saveSemStart = async () => {
    if(!semStart) return flash("Enter a date.","error");
    try { await db.upsert("settings",[{key:"sem_start",value:semStart}]); flash("Semester date saved!"); }
    catch{ flash("Failed.","error"); }
  };

  if(loading) return <div style={{minHeight:"100vh",background:C.bg}}><Header user={user} onLogout={onLogout}/><div style={{textAlign:"center",padding:60,color:C.muted}}><Spinner/><div style={{marginTop:10}}>Loading…</div></div></div>;

  return(
    <div style={{minHeight:"100vh",background:C.bg}}>
      <Header user={user} onLogout={onLogout}/>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 16px"}}>
        <Flash msg={msg}/>
        <div style={{display:"flex",gap:6,marginBottom:24,background:C.surface,padding:8,borderRadius:12,border:`1.5px solid ${C.border}`,flexWrap:"wrap"}}>
          {[["overview","📊 Overview"],["lecturers","👩‍🏫 Lecturers"],["units","📚 Units"],["students","🎓 Students"],["attendance","📋 Attendance"],["settings","⚙️ Settings"]].map(([k,l])=>(
            <div key={k} className={`tab${tab===k?" active":""}`} onClick={()=>setTab(k)}>{l}</div>
          ))}
        </div>

        {tab==="overview"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:14,marginBottom:24}}>
              {[{l:"Students",v:students.length,i:"🎓",c:C.accent},{l:"Lecturers",v:`${lecturers.filter(l=>l.active).length}/${lecturers.length}`,i:"👩‍🏫",c:C.green},{l:"Groups",v:groups.length,i:"🗂️",c:"#8B4FCC"},{l:"Units",v:units.length,i:"📚",c:C.amber}].map(s=>(
                <div key={s.l} className="card" style={{borderTop:`4px solid ${s.c}`}}>
                  <div style={{fontSize:24,marginBottom:6}}>{s.i}</div>
                  <div style={{fontSize:28,fontWeight:800,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:2,fontWeight:600}}>{s.l}</div>
                </div>
              ))}
            </div>
            {semStart&&<div className="card" style={{marginBottom:16,borderLeft:`4px solid ${C.accent}`,padding:"12px 16px"}}>
              <span style={{fontWeight:700,color:C.accent}}>📅 Semester: </span>
              <span style={{color:C.muted}}>Started {semStart} · {WEEKS} weeks · Ends {new Date(new Date(semStart).getTime()+WEEKS*7*86400000).toISOString().split("T")[0]}</span>
            </div>}
            <div className="card">
              <h3 style={{marginBottom:14,fontSize:14,color:C.accent}}>Department Breakdown</h3>
              <table>
                <thead><tr><th>Department</th><th>Groups</th><th>Students</th><th>Units</th></tr></thead>
                <tbody>{DEPTS.map(d=>(
                  <tr key={d}><td style={{fontWeight:600}}>{d}</td>
                  <td>{groups.filter(g=>g.department===d).length}</td>
                  <td>{students.filter(s=>s.department===d).length}</td>
                  <td>{units.filter(u=>groups.find(g=>g.id===u.group_id&&g.department===d)).length}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab==="lecturers"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h2 style={{fontSize:17,color:C.accent}}>Lecturers ({lecturers.length})</h2>
              <div style={{display:"flex",gap:8}}>
                <button className="btn-ghost btn-sm" onClick={()=>{setForm({});setModal("assign");}}>🔗 Assign to Unit</button>
                <button className="btn-primary btn-sm" onClick={()=>{setForm({});setModal("addLec");}}>+ Add Lecturer</button>
              </div>
            </div>
            <div className="card" style={{padding:0,overflow:"hidden"}}>
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Units</th><th>Status</th><th>Access</th><th></th></tr></thead>
                <tbody>
                  {lecturers.map(l=>(
                    <tr key={l.id}>
                      <td style={{fontWeight:600}}>{l.name}</td>
                      <td style={{color:C.muted,fontSize:12}}>{l.email}</td>
                      <td><span className="badge badge-blue">{l.department}</span></td>
                      <td style={{color:C.accent,fontWeight:700}}>{units.filter(u=>u.lecturer_id===l.id).length}</td>
                      <td><span className={`badge ${l.active?"badge-green":"badge-red"}`}>{l.active?"Active":"Suspended"}</span></td>
                      <td><button className={`toggle ${l.active?"toggle-on":"toggle-off"}`} onClick={()=>toggleLecturer(l)}/></td>
                      <td><button className="btn-danger btn-sm" onClick={()=>deleteLecturer(l.id)}>Remove</button></td>
                    </tr>
                  ))}
                  {!lecturers.length&&<tr><td colSpan={7} style={{textAlign:"center",color:C.muted,padding:32}}>No lecturers yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab==="units"&&(
          <div>
            <h2 style={{fontSize:17,color:C.accent,marginBottom:16}}>Units ({units.length})</h2>
            {DEPTS.map(dept=>{
              const du=units.filter(u=>groups.find(g=>g.id===u.group_id&&g.department===dept));
              if(!du.length) return null;
              return(
                <div key={dept} style={{marginBottom:20}}>
                  <h3 style={{fontSize:13,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10,paddingBottom:6,borderBottom:`2px solid ${C.border}`}}>{dept}</h3>
                  <div className="card" style={{padding:0,overflow:"hidden"}}>
                    <table>
                      <thead><tr><th>Unit</th><th>Group</th><th>Sessions/Day</th><th>Lecturer</th></tr></thead>
                      <tbody>{du.map(u=>{
                        const grp=groups.find(g=>g.id===u.group_id);
                        const lec=users.find(l=>l.id===u.lecturer_id);
                        return(<tr key={u.id}>
                          <td style={{fontWeight:600}}>{u.name}</td>
                          <td><span className="badge badge-blue">{grp?.name||"—"}</span></td>
                          <td><span className="badge badge-amber">{u.sessions_per_day||1}x/day</span></td>
                          <td>{lec?lec.name:<span style={{color:C.red,fontSize:12}}>⚠ Unassigned</span>}</td>
                        </tr>);
                      })}</tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab==="students"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
              <h2 style={{fontSize:17,color:C.accent}}>Students ({students.length})</h2>
              <div style={{display:"flex",gap:8}}>
                <button className="btn-ghost btn-sm" onClick={()=>{setImportText("");setModal("import");}}>📥 Bulk Import</button>
                <button className="btn-primary btn-sm" onClick={()=>{setForm({});setModal("addStu");}}>+ Add Student</button>
              </div>
            </div>
            {DEPTS.map(dept=>{
              const ds=students.filter(s=>s.department===dept);
              if(!ds.length) return null;
              return(
                <div key={dept} style={{marginBottom:20}}>
                  <h3 style={{fontSize:13,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10,paddingBottom:6,borderBottom:`2px solid ${C.border}`}}>{dept} ({ds.length})</h3>
                  <div className="card" style={{padding:0,overflow:"hidden"}}>
                    <table>
                      <thead><tr><th>Reg No</th><th>Name</th><th>Group</th><th>Year</th><th>Term</th></tr></thead>
                      <tbody>{ds.map(s=>{
                        const grp=groups.find(g=>g.id===s.group_id);
                        return(<tr key={s.id}><td style={{fontFamily:"monospace",fontSize:11,color:C.muted}}>{s.reg_no}</td><td style={{fontWeight:600}}>{s.name}</td><td><span className="badge badge-blue">{grp?.name||"—"}</span></td><td>Year {s.year}</td><td>Term {s.term}</td></tr>);
                      })}</tbody>
                    </table>
                  </div>
                </div>
              );
            })}
            {!students.length&&<div className="card" style={{textAlign:"center",color:C.muted,padding:40}}>No students yet. Use Bulk Import or Add Student.</div>}
          </div>
        )}

        {tab==="attendance"&&(
          <div>
            <h2 style={{fontSize:17,color:C.accent,marginBottom:16}}>Attendance Reports</h2>
            <div style={{marginBottom:20}}>
              <Label>Select Unit</Label>
              <select value={selectedUnit?.id||""} onChange={e=>setSelectedUnit(units.find(u=>u.id===e.target.value)||null)} style={{maxWidth:420}}>
                <option value="">— Select a unit —</option>
                {DEPTS.map(dept=>{
                  const du=units.filter(u=>groups.find(g=>g.id===u.group_id&&g.department===dept));
                  if(!du.length) return null;
                  return(<optgroup key={dept} label={dept}>{du.map(u=>{const g=groups.find(x=>x.id===u.group_id);return<option key={u.id} value={u.id}>{u.name} — {g?.name}</option>;})}</optgroup>);
                })}
              </select>
            </div>
            {selectedUnit&&<AttendanceReport unit={selectedUnit} students={unitStudents}/>}
          </div>
        )}

        {tab==="settings"&&(
          <div>
            <h2 style={{fontSize:17,color:C.accent,marginBottom:20}}>Settings</h2>
            <div className="card" style={{maxWidth:420}}>
              <h3 style={{fontSize:15,marginBottom:6}}>📅 Semester Start Date</h3>
              <p style={{fontSize:13,color:C.muted,marginBottom:14}}>Set this so the portal calculates which week (1–9) each session falls in.</p>
              <Label>Start Date</Label>
              <input type="date" value={semStart} onChange={e=>setSemStart(e.target.value)} style={{marginBottom:12}}/>
              {semStart&&<div style={{fontSize:12,color:C.muted,marginBottom:14}}>Ends: {new Date(new Date(semStart).getTime()+WEEKS*7*86400000).toISOString().split("T")[0]}</div>}
              <button className="btn-primary" onClick={saveSemStart}>Save Date</button>
            </div>
          </div>
        )}
      </div>

      {modal==="addLec"&&(
        <div className="modal-bg" onClick={()=>setModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
          <h3 style={{marginBottom:20,color:C.accent}}>Add Lecturer</h3>
          {[["name","Full Name","text"],["email","Email","email"],["password","Password","text"]].map(([k,l,t])=>(
            <div key={k} style={{marginBottom:14}}><Label>{l}</Label><input type={t} value={form[k]||""} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/></div>
          ))}
          <div style={{marginBottom:20}}><Label>Department</Label>
            <select value={form.department||""} onChange={e=>setForm(p=>({...p,department:e.target.value}))}>
              <option value="">Select</option>{DEPTS.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div style={{display:"flex",gap:10}}><button className="btn-primary" style={{flex:1}} onClick={addLecturer}>Add</button><button className="btn-ghost" onClick={()=>setModal(null)}>Cancel</button></div>
        </div></div>
      )}

      {modal==="assign"&&(
        <div className="modal-bg" onClick={()=>setModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
          <h3 style={{marginBottom:20,color:C.accent}}>Assign Lecturer to Unit</h3>
          <div style={{marginBottom:14}}><Label>Unit</Label>
            <select value={form.unit_id||""} onChange={e=>setForm(p=>({...p,unit_id:e.target.value}))}>
              <option value="">Select unit</option>
              {DEPTS.map(dept=>{const du=units.filter(u=>groups.find(g=>g.id===u.group_id&&g.department===dept));if(!du.length)return null;return<optgroup key={dept} label={dept}>{du.map(u=>{const g=groups.find(x=>x.id===u.group_id);return<option key={u.id} value={u.id}>{u.name} — {g?.name}</option>;})}</optgroup>;})}
            </select>
          </div>
          <div style={{marginBottom:20}}><Label>Lecturer</Label>
            <select value={form.lecturer_id||""} onChange={e=>setForm(p=>({...p,lecturer_id:e.target.value}))}>
              <option value="">Select lecturer</option>
              {lecturers.filter(l=>l.active).map(l=><option key={l.id} value={l.id}>{l.name} ({l.department})</option>)}
            </select>
          </div>
          <div style={{display:"flex",gap:10}}><button className="btn-primary" style={{flex:1}} onClick={assignLecturer}>Assign</button><button className="btn-ghost" onClick={()=>setModal(null)}>Cancel</button></div>
        </div></div>
      )}

      {modal==="addStu"&&(
        <div className="modal-bg" onClick={()=>setModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
          <h3 style={{marginBottom:20,color:C.accent}}>Add Student</h3>
          <div style={{marginBottom:14}}><Label>Registration Number</Label><input value={form.reg_no||""} onChange={e=>setForm(p=>({...p,reg_no:e.target.value}))} placeholder="e.g. BD3179/GD/MAY/25"/></div>
          <div style={{marginBottom:14}}><Label>Full Name</Label><input value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
          <div style={{marginBottom:20}}><Label>Group</Label>
            <select value={form.group_id||""} onChange={e=>setForm(p=>({...p,group_id:e.target.value}))}>
              <option value="">Select group</option>
              {DEPTS.map(dept=>{const dg=groups.filter(g=>g.department===dept);if(!dg.length)return null;return<optgroup key={dept} label={dept}>{dg.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</optgroup>;})}
            </select>
          </div>
          <div style={{display:"flex",gap:10}}><button className="btn-primary" style={{flex:1}} onClick={addStudent}>Add</button><button className="btn-ghost" onClick={()=>setModal(null)}>Cancel</button></div>
        </div></div>
      )}

      {modal==="import"&&(
        <div className="modal-bg" onClick={()=>setModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
          <h3 style={{marginBottom:6,color:C.accent}}>📥 Import Students from Excel</h3>
          <p style={{fontSize:12,color:C.muted,marginBottom:16}}>Your Excel sheet must have 3 columns — no headers needed:</p>

          {/* Column guide */}
          <div style={{background:C.accentLight,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 2fr",gap:8,fontWeight:700,color:C.accent,marginBottom:6}}>
              <span>Column A</span><span>Column B</span><span>Column C</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 2fr",gap:8,color:C.text}}>
              <span>Reg Number</span><span>Full Name</span><span>Exact Group Name</span>
            </div>
          </div>

          {/* File upload */}
          <div style={{border:`2px dashed ${C.border}`,borderRadius:10,padding:20,textAlign:"center",marginBottom:14,background:importFile?C.greenLight:C.bg}}>
            {!importFile ? (
              <>
                <div style={{fontSize:32,marginBottom:8}}>📂</div>
                <div style={{fontSize:13,color:C.muted,marginBottom:10}}>Click to select your Excel file (.xlsx or .xls)</div>
                <label style={{background:C.accent,color:"#fff",padding:"8px 20px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700}}>
                  Choose Excel File
                  <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} style={{display:"none"}}/>
                </label>
              </>
            ) : (
              <>
                <div style={{fontSize:32,marginBottom:6}}>✅</div>
                <div style={{fontSize:13,fontWeight:700,color:C.green,marginBottom:4}}>{importFile.name}</div>
                <div style={{fontSize:12,color:C.muted,marginBottom:8}}>{importStatus}</div>
                <label style={{background:C.border,color:C.text,padding:"6px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700}}>
                  Change File
                  <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} style={{display:"none"}}/>
                </label>
              </>
            )}
          </div>

          {/* Preview */}
          {importPreview.length>0&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Preview (first 5 rows)</div>
              <div style={{background:C.bg,borderRadius:8,padding:10,maxHeight:130,overflowY:"auto"}}>
                {importPreview.slice(0,5).map((r,i)=>(
                  <div key={i} style={{fontSize:11,fontFamily:"monospace",padding:"3px 0",borderBottom:`1px solid ${C.border}`,color:SEED_GROUPS.find(g=>g.name.toLowerCase()===r.groupName.toLowerCase())?C.text:C.red}}>
                    {r.reg_no} | {r.name} | {r.groupName}
                    {!SEED_GROUPS.find(g=>g.name.toLowerCase()===r.groupName.toLowerCase())&&<span style={{color:C.red}}> ⚠ Group not found</span>}
                  </div>
                ))}
                {importPreview.length>5&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>...and {importPreview.length-5} more rows</div>}
              </div>
            </div>
          )}

          {/* Group name reference */}
          <details style={{marginBottom:14}}>
            <summary style={{fontSize:12,color:C.accent,cursor:"pointer",fontWeight:700}}>📋 View all valid group names</summary>
            <div style={{fontSize:11,color:C.muted,marginTop:8,maxHeight:120,overflowY:"auto",lineHeight:1.8}}>
              {SEED_GROUPS.map(g=><div key={g.id}>• {g.name}</div>)}
            </div>
          </details>

          <div style={{display:"flex",gap:10}}>
            <button className="btn-primary" style={{flex:1}} onClick={bulkImport} disabled={importing||(!importPreview.length&&!importText.trim())}>
              {importing?<><Spinner/> Importing…</>:`Import ${importPreview.length||""} Students`}
            </button>
            <button className="btn-ghost" onClick={()=>{setModal(null);setImportFile(null);setImportPreview([]);setImportStatus("");}}>Cancel</button>
          </div>
        </div></div>
      )}
    </div>
  );
}

export default function App(){
  const [user,setUser]=useState(null);
  const [checking,setChecking]=useState(true);
  const [dbError,setDbError]=useState("");

  useEffect(()=>{
    db.get("users","limit=1")
      .then(()=>setChecking(false))
      .catch(e=>{ setDbError(e.message); setChecking(false); });
  },[]);

  if(checking) return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:C.bg}}>
      <style>{css}</style>
      <img src="/logo.png" alt="BIFA" style={{width:120,marginBottom:20}} onError={e=>e.target.style.display='none'}/>
      <span className="spin" style={{fontSize:24,color:C.accent}}>⟳</span>
      <div style={{color:C.muted,marginTop:8}}>Connecting to database…</div>
    </div>
  );

  if(dbError) return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:C.bg,padding:20}}>
      <style>{css}</style>
      <div style={{background:"#fff",border:`1.5px solid ${C.red}`,borderRadius:14,padding:32,maxWidth:500,textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:12}}>⚠️</div>
        <h2 style={{color:C.red,marginBottom:10}}>Database Connection Error</h2>
        <p style={{color:C.muted,fontSize:13,marginBottom:16}}>Could not connect to Supabase. Make sure you have run the SETUP_DATABASE.sql script and disabled Row Level Security.</p>
        <code style={{background:C.bg,padding:"8px 12px",borderRadius:6,fontSize:11,display:"block",marginBottom:16}}>{dbError}</code>
        <button className="btn-primary" onClick={()=>window.location.reload()}>Retry</button>
      </div>
    </div>
  );

  return(
    <>
      <style>{css}</style>
      {!user&&<LoginScreen onLogin={setUser}/>}
      {user?.role==="admin"&&<AdminDashboard user={user} onLogout={()=>setUser(null)}/>}
      {user?.role==="lecturer"&&<LecturerDashboard user={user} onLogout={()=>setUser(null)}/>}
    </>
  );
}

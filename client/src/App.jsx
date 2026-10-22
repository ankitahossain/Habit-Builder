import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlarmClock, ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays,
  Check, CheckCheck, ChevronDown, CircleHelp, Flame, LayoutDashboard, LogOut,
  Menu, Plus, Settings2, Sparkles, Target, Trash2, TrendingUp, Trophy, X, Zap
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, getToken } from './api';
import { completionPercent, daysForHeatmap, todayISO } from './utils';

const palette = ['#eee9ff','#e3dcff','#d1c6ff','#b7a6ff','#9279f2','#6d55df'];
const icons = ['📚','💧','🏃','🧘','✍️','🌱','💻','🎯'];
const initialHabits = [
  { id:'demo-1', name:'Read for 20 minutes', description:'A little progress every day', frequency:'daily', target_time:'20:00', color:'#8a70ec', logs:[] },
  { id:'demo-2', name:'Drink 8 glasses of water', description:'Keep your energy up', frequency:'daily', target_time:'10:00', color:'#57b7ce', logs:[] },
  { id:'demo-3', name:'Morning movement', description:'Stretch or take a short walk', frequency:'weekdays', target_time:'07:30', color:'#f0a35a', logs:[] },
];

function Auth({ onAuth }) {
  const [mode,setMode]=useState('login'), [name,setName]=useState(''), [email,setEmail]=useState(''), [password,setPassword]=useState(''), [error,setError]=useState(''), [busy,setBusy]=useState(false);
  async function submit(e){e.preventDefault();setError('');setBusy(true);try{const data=await api(`/auth/${mode}`,{method:'POST',body:JSON.stringify({name,email,password})});localStorage.setItem('hb_token',data.token);localStorage.setItem('hb_user',JSON.stringify(data.user));onAuth(data.user)}catch(err){setError(err.message)}finally{setBusy(false)}}
  return <div className="auth-wrap"><div className="auth-card">
    <div className="brand" style={{padding:0,marginBottom:30}}><span className="brand-mark"><Sparkles size={19}/></span> habit builder</div>
    <div className="eyebrow">YOUR ROUTINE, REIMAGINED</div><h1 style={{fontSize:29,marginBottom:9}}>{mode==='login'?'Welcome back.':'Start small. Grow daily.'}</h1>
    <p className="muted" style={{fontSize:13,lineHeight:1.7,marginBottom:24}}>{mode==='login'?'Sign in to keep your momentum going.':'Create an account and make consistency feel rewarding.'}</p>
    {error&&<div className="notice">{error}</div>}
    <form onSubmit={submit}>
      {mode==='register'&&<div className="field"><label>Your name</label><input required minLength="2" maxLength="80" value={name} onChange={e=>setName(e.target.value)} placeholder="Alex Morgan"/></div>}
      <div className="field"><label>Email address</label><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div>
      <div className="field"><label>Password</label><input required minLength="8" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></div>
      <button className="primary" style={{width:'100%',justifyContent:'center',padding:13,marginTop:5}} disabled={busy}>{busy?'Please wait…':mode==='login'?'Sign in':'Create account'} <ArrowUpRight size={15}/></button>
    </form>
    <p className="muted" style={{textAlign:'center',marginTop:20}}>{mode==='login'?'New here?':'Already have an account?'} <button className="icon-btn" style={{color:'#6d55df',fontWeight:700}} onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode==='login'?'Create an account':'Sign in'}</button></p>
    <p className="muted" style={{fontSize:10,lineHeight:1.6,textAlign:'center'}}>Your progress belongs to you. Keep your password private.</p>
  </div></div>
}

function HabitModal({ habit, onClose, onSave }) {
  const [name,setName]=useState(habit?.name||''),[description,setDescription]=useState(habit?.description||''),[frequency,setFrequency]=useState(habit?.frequency||'daily'),[target_time,setTarget]=useState(habit?.target_time?.slice(0,5)||'08:00'),[color,setColor]=useState(habit?.color||'#6D5CE8'),[error,setError]=useState('');
  async function submit(e){e.preventDefault();if(!name.trim()){setError('Please give your habit a name.');return}try{await onSave({name:name.trim(),description,frequency,target_time:target_time||null,color});onClose()}catch(err){setError(err.message)}}
  return <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal">
    <div className="panel-head"><div><div className="eyebrow">{habit?'MAKE IT FIT':'ONE SMALL STEP'}</div><h2 style={{fontSize:21,marginTop:6}}>{habit?'Edit habit':'Create a habit'}</h2></div><button className="icon-btn" onClick={onClose}><X size={19}/></button></div>
    {error&&<div className="notice">{error}</div>}
    <form onSubmit={submit}>
      <div className="field"><label>Habit name *</label><input autoFocus required maxLength="100" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Read 10 pages"/></div>
      <div className="field"><label>Why does it matter? (optional)</label><input maxLength="300" value={description} onChange={e=>setDescription(e.target.value)} placeholder="A small note to encourage yourself"/></div>
      <div className="form-row"><div className="field"><label>Schedule</label><select value={frequency} onChange={e=>setFrequency(e.target.value)}><option value="daily">Every day</option><option value="weekdays">Weekdays</option><option value="weekly">Once a week (Monday)</option></select></div><div className="field"><label>Target time</label><input type="time" value={target_time} onChange={e=>setTarget(e.target.value)}/></div></div>
      <div className="field"><label>Accent colour</label><div style={{display:'flex',gap:10}}>{['#8a70ec','#57b7ce','#f0a35a','#58b88a','#e9789c'].map(c=><button type="button" key={c} onClick={()=>setColor(c)} style={{width:27,height:27,borderRadius:9,background:c,border:color===c?'3px solid #28223d':'2px solid transparent',outline:color===c?'2px solid white':'none'}} aria-label={`Select ${c}`}/>)}</div></div>
      <div style={{display:'flex',gap:9,justifyContent:'flex-end',marginTop:10}}><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" type="submit"><Check size={15}/>{habit?'Save changes':'Create habit'}</button></div>
    </form>
  </div></div>
}

function App() {
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('hb_user')||'null')}catch{return null}});
  const [habits,setHabits]=useState([]),[demo,setDemo]=useState(!getToken()),[view,setView]=useState('Overview'),[modal,setModal]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[weekly,setWeekly]=useState([]),[summary,setSummary]=useState({habitCount:0,currentStreakSum:0,longestStreak:0}),[authOpen,setAuthOpen]=useState(false),[showAuth,setShowAuth]=useState(false);
  const today=todayISO();
  async function load(){
    if(!getToken()){setHabits(initialHabits.map(h=>({...h,logs:[]})));setDemo(true);return}
    setBusy(true);setError('');
    try{const [hs,w,s]=await Promise.all([api('/habits'),api('/analytics/weekly'),api('/analytics/summary')]);setHabits(hs.map(h=>({...h,logs:(h.logs||[]).map(l=>({...l,date:String(l.date).slice(0,10)}))})));setWeekly(w);setSummary(s);setDemo(false)}
    catch(e){setError(e.message);if(e.message.includes('Session expired'))logout()}
    finally{setBusy(false)}
  }
  useEffect(()=>{if(getToken())load();else setHabits(initialHabits.map(h=>({...h,logs:[]})))},[]);
  function logout(){localStorage.removeItem('hb_token');localStorage.removeItem('hb_user');setUser(null);setDemo(true);setHabits(initialHabits.map(h=>({...h,logs:[]})))}
  async function saveHabit(data){
    if(demo){const id=modal?.habit?.id||`demo-${Date.now()}`;setHabits(old=>modal?.habit?old.map(h=>h.id===id?{...h,...data}:h):[{...data,id,logs:[]},...old]);return}
    if(modal?.habit)await api(`/habits/${modal.habit.id}`,{method:'PATCH',body:JSON.stringify(data)});else await api('/habits',{method:'POST',body:JSON.stringify(data)});
    await load();
  }
  async function toggle(habit){
    const wasDone=(habit.logs||[]).some(l=>l.date===today&&l.done),done=!wasDone;
    setHabits(old=>old.map(h=>h.id===habit.id?{...h,logs:done?[...(h.logs||[]).filter(l=>l.date!==today),{date:today,done:true}]:(h.logs||[]).filter(l=>l.date!==today)}:h));
    if(!demo){try{await api(`/habits/${habit.id}/logs/${today}`,{method:'PUT',body:JSON.stringify({done})});const [w,s]=await Promise.all([api('/analytics/weekly'),api('/analytics/summary')]);setWeekly(w);setSummary(s)}catch(e){setError(e.message);load()}}
  }
  async function removeHabit(h){
    if(!confirm(`Delete "${h.name}" and its logs?`))return;
    setHabits(old=>old.filter(x=>x.id!==h.id));
    if(!demo){try{await api(`/habits/${h.id}`,{method:'DELETE'})}catch(e){setError(e.message);load()}}
  }
  const completed=habits.filter(h=>(h.logs||[]).some(l=>l.date===today&&l.done)).length;
  const percent=completionPercent(habits,today);
  const allLogs=habits.flatMap(h=>h.logs||[]);
  const heatDays=daysForHeatmap(allLogs);
  const longest=demo?Math.max(0,...habits.map(h=>h.logs?.filter(l=>l.done).length||0)):summary.longestStreak;
  const weekData=weekly.length?weekly.map(d=>({day:d.day,completed:Number(d.completed),planned:Number(d.planned)})):[{day:'Mon',completed:0,planned:0},{day:'Tue',completed:0,planned:0},{day:'Wed',completed:0,planned:0},{day:'Thu',completed:0,planned:0},{day:'Fri',completed:0,planned:0},{day:'Sat',completed:0,planned:0},{day:'Sun',completed:0,planned:0}];
  const nav=[['Overview',LayoutDashboard],['My Habits',CheckCheck],['Progress',TrendingUp],['Analytics',BarChart3]];
  const activeHabits=habits.filter(h=>!h.archived);
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Sparkles size={19}/></span> habit builder</div>
      <div><div className="nav-label">WORKSPACE</div>{nav.map(([label,Icon])=><button key={label} className={`nav-item ${view===label?'active':''}`} style={{width:'100%',border:0,background:view===label?'#f1edff':'transparent',textAlign:'left'}} onClick={()=>setView(label)}><Icon size={17}/>{label}{label==='My Habits'&&<span style={{marginLeft:'auto',fontSize:10}}>{habits.length}</span>}</button>)}</div>
      <div><div className="nav-label">PREFERENCES</div><button className="nav-item" style={{border:0,background:'transparent',width:'100%',textAlign:'left'}} onClick={()=>setError('Reminders are currently scheduled as a backend integration scaffold. Configure Web Push and a service worker before relying on delivery.')}><AlarmClock size={17}/>Reminders</button><button className="nav-item" style={{border:0,background:'transparent',width:'100%',textAlign:'left'}} onClick={()=>setError('Settings: use your browser timezone for this local demo. Production timezone preferences can be stored in your profile.')}><Settings2 size={17}/>Settings</button></div>
      <div className="sidebar-bottom"><div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}><span style={{color:'#7058df'}}><Zap size={17}/></span><b style={{fontSize:12}}>Small steps count</b></div><p className="muted" style={{lineHeight:1.6,marginBottom:12}}>You don't have to be perfect. Just keep showing up.</p><div className="progress-track"><div className="progress-fill" style={{width:`${percent}%`}}/></div><div className="muted" style={{marginTop:7}}>{percent}% of today's habits done</div></div>
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'0 8px'}}><div className="habit-symbol" style={{background:'#f0ebff',color:'#7058df',fontWeight:800}}>{user?.name?.[0]?.toUpperCase()||'G'}</div><div style={{minWidth:0,flex:1}}><div className="habit-title">{user?.name||'Guest explorer'}</div><div className="muted">{demo?'Preview mode':'Your personal space'}</div></div>{!demo&&<button className="icon-btn" title="Sign out" onClick={logout}><LogOut size={15}/></button>}</div>
    </aside>
    <main className="main">
      <header className="topbar"><div><div className="eyebrow">{new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</div><h1>{view==='Overview'?'Your daily rhythm':view==='My Habits'?'Your habits':view==='Progress'?'Look how far you’ve come':'Your weekly insights'}</h1><div className="muted">{view==='Overview'?'A little consistency goes a long way.':view==='My Habits'?'Make your routines work for real life.':view==='Progress'?'Every checkmark is proof you showed up.':'Notice patterns, celebrate progress, adjust gently.'}</div></div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}><button className="secondary hide-mobile" onClick={()=>setView('Progress')}><CalendarDays size={14} style={{verticalAlign:'middle',marginRight:5}}/>View progress</button><button className="primary" onClick={()=>setModal({habit:null})}><Plus size={16}/> <span className="hide-mobile">New habit</span><span className="mobile-menu">New</span></button></div></header>
      {demo&&<div style={{padding:'11px 14px',borderRadius:12,background:'#f0ebff',color:'#6850d3',fontSize:12,marginBottom:18,display:'flex',alignItems:'center',gap:8}}><Sparkles size={16}/><span><b>Interactive preview:</b> try checking off habits and adding your own. Create an account to save progress to the database.</span><button className="icon-btn" style={{marginLeft:'auto',color:'#6850d3',fontWeight:700}} onClick={()=>{setUser(null);setDemo(true);setAuthOpen(true)}}>Sign up</button></div>}
      {error&&<div className="notice" style={{display:'flex',justifyContent:'space-between',gap:12}}><span>{error}</span><button className="icon-btn" onClick={()=>setError('')}><X size={14}/></button></div>}
      {view==='Overview'&&<>
        <section className="grid-stats">
          <div className="stat-card"><div className="stat-top">Today's progress <span className="stat-icon"><Target size={17}/></span></div><div className="stat-value">{percent}%</div><div className="muted">{completed} of {habits.length} habits completed</div></div>
          <div className="stat-card"><div className="stat-top">Habits in routine <span className="stat-icon" style={{background:'#e8f8f4',color:'#39a68a'}}><Activity size={17}/></span></div><div className="stat-value">{habits.length}</div><div className="muted">Small actions, big change</div></div>
          <div className="stat-card"><div className="stat-top">Longest streak <span className="stat-icon" style={{background:'#fff2e7',color:'#ed9952'}}><Flame size={17}/></span></div><div className="stat-value">{longest}<span style={{fontSize:13,color:'#a19bb3',marginLeft:5}}>days</span></div><div className="muted">Your personal best</div></div>
          <div className="stat-card"><div className="stat-top">Weekly momentum <span className="stat-icon" style={{background:'#eaf2ff',color:'#5d8fe0'}}><TrendingUp size={17}/></span></div><div className="stat-value">{weekData.reduce((a,d)=>a+d.completed,0)}</div><div className="muted">Completed check-ins this week</div></div>
        </section>
        <section className="content-grid">
          <div className="panel"><div className="panel-head"><div><h2>Today's habits</h2><p className="muted" style={{marginTop:6}}>One tick at a time. You've got this.</p></div><button className="secondary" onClick={()=>setView('My Habits')}>See all <ArrowUpRight size={13} style={{verticalAlign:'middle'}}/></button></div>
            {busy?<p className="muted">Loading your habits…</p>:habits.length===0?<div style={{textAlign:'center',padding:'30px 10px'}}><div style={{fontSize:30,marginBottom:12}}>🌱</div><h3>Your first habit starts here</h3><p className="muted">Choose one small thing you want to do consistently.</p><button className="primary" onClick={()=>setModal({habit:null})}><Plus size={15}/> Add a habit</button></div>:habits.map((h,i)=>{const done=(h.logs||[]).some(l=>l.date===today&&l.done);return <div className="habit-row" key={h.id}><button className={`check ${done?'done':''}`} onClick={()=>toggle(h)} aria-label={done?'Mark incomplete':'Mark complete'}>{done&&<Check size={15}/>}</button><div className="habit-symbol" style={{background:`${h.color||palette[i%palette.length]}20`}}>{icons[i%icons.length]}</div><div style={{minWidth:0}}><div className="habit-title" style={{textDecoration:done?'line-through':'none',color:done?'#a5a0b5':'#302b43'}}>{h.name}</div><div className="habit-sub">{h.target_time?.slice(0,5)||'Flexible time'} · {h.frequency==='weekdays'?'Weekdays':h.frequency==='weekly'?'Weekly':'Every day'}</div></div><div className="habit-actions"><span className="muted hide-mobile">{done?'Done':'To do'}</span><button className="icon-btn" title="Edit habit" onClick={()=>setModal({habit:h})}><Settings2 size={15}/></button></div></div>})}
            <div style={{marginTop:18,padding:'13px 14px',background:'#f8f6ff',borderRadius:12,display:'flex',gap:10,alignItems:'center'}}><span style={{color:'#7058df'}}><Sparkles size={17}/></span><span style={{fontSize:12,color:'#77718f'}}>Tip: start small enough that you can do it even on a busy day.</span></div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:18}}>
            <div className="panel"><div className="panel-head"><div><h2>Weekly activity</h2><p className="muted" style={{marginTop:6}}>Your check-ins, day by day</p></div><span className="tag">7 days</span></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><BarChart data={weekData} margin={{top:4,right:0,left:-25,bottom:0}}><CartesianGrid stroke="#f1eff7" vertical={false}/><XAxis dataKey="day" tick={{fontSize:10,fill:'#aaa5b9'}} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{fontSize:10,fill:'#aaa5b9'}} axisLine={false} tickLine={false}/><Tooltip cursor={{fill:'#f8f6ff'}} contentStyle={{borderRadius:12,border:'1px solid #eeeaf7',fontSize:12}}/><Bar dataKey="completed" name="Completed" fill="#7a63e7" radius={[5,5,0,0]} maxBarSize={25}/></BarChart></ResponsiveContainer></div></div>
            <div className="panel"><div className="panel-head"><div><h2>Consistency map</h2><p className="muted" style={{marginTop:6}}>Your last 12 weeks at a glance</p></div><CalendarDays size={17} color="#928ba8"/></div><div className="heatmap">{heatDays.map(d=><div key={d.date} className={`heat-cell ${d.done?'on':''}`} title={`${d.date}: ${d.done?'completed a habit':'no completion recorded'}`}/>)}</div><div style={{display:'flex',justifyContent:'space-between',marginTop:13}}><span className="muted">Less</span><div className="legend">{palette.slice(0,5).map(c=><span key={c} className="heat-cell" style={{background:c}}/>)}</div><span className="muted">More</span></div></div>
          </div>
        </section>
      </>}
      {view==='My Habits'&&<section className="panel"><div className="panel-head"><div><h2>All habits</h2><p className="muted" style={{marginTop:6}}>Your routine, built around your life.</p></div><button className="primary" onClick={()=>setModal({habit:null})}><Plus size={15}/> New habit</button></div>{habits.length===0?<p className="muted">No habits yet. Add your first habit to get started.</p>:habits.map((h,i)=>{const done=(h.logs||[]).some(l=>l.date===today&&l.done);return <div className="habit-row" key={h.id}><button className={`check ${done?'done':''}`} onClick={()=>toggle(h)}>{done&&<Check size={15}/>}</button><div className="habit-symbol" style={{background:`${h.color||palette[i%palette.length]}20`}}>{icons[i%icons.length]}</div><div style={{flex:1,minWidth:0}}><div className="habit-title">{h.name}</div><div className="habit-sub">{h.description||'A small step toward your goal'} · {h.frequency}</div></div><button className="icon-btn" title="Edit" onClick={()=>setModal({habit:h})}><Settings2 size={16}/></button><button className="icon-btn" title="Delete" onClick={()=>removeHabit(h)}><Trash2 size={16}/></button></div>})}</section>}
      {view==='Progress'&&<section style={{display:'grid',gap:18}}><div className="panel"><div className="panel-head"><div><h2>12-week consistency map</h2><p className="muted" style={{marginTop:6}}>Every coloured square means you completed at least one habit.</p></div><span className="tag">{allLogs.filter(l=>l.done).length} check-ins</span></div><div className="heatmap" style={{gridTemplateColumns:'repeat(14,minmax(0,1fr))',gap:7}}>{heatDays.map(d=><div key={d.date} className={`heat-cell ${d.done?'on':''}`} title={`${d.date}: ${d.done?'completed':'no completion'}`} style={{borderRadius:5}}/>)}</div><div className="muted" style={{marginTop:15}}>Consistency is about returning, not being perfect.</div></div><div className="grid-stats" style={{margin:0}}><div className="stat-card"><div className="stat-top">Habits created <span className="stat-icon"><Target size={17}/></span></div><div className="stat-value">{habits.length}</div></div><div className="stat-card"><div className="stat-top">Total check-ins <span className="stat-icon"><CheckCheck size={17}/></span></div><div className="stat-value">{allLogs.filter(l=>l.done).length}</div></div><div className="stat-card"><div className="stat-top">Longest streak <span className="stat-icon"><Trophy size={17}/></span></div><div className="stat-value">{longest}</div></div><div className="stat-card"><div className="stat-top">Today's progress <span className="stat-icon"><TrendingUp size={17}/></span></div><div className="stat-value">{percent}%</div></div></div></section>}
      {view==='Analytics'&&<section style={{display:'grid',gap:18}}><div className="panel"><div className="panel-head"><div><h2>Weekly completion</h2><p className="muted" style={{marginTop:6}}>Compare completed habits across the last seven days.</p></div><span className="tag">This week</span></div><div style={{height:300}}><ResponsiveContainer width="100%" height="100%"><BarChart data={weekData} margin={{top:12,right:10,left:0,bottom:5}}><CartesianGrid stroke="#f1eff7" vertical={false}/><XAxis dataKey="day" tick={{fontSize:12,fill:'#9691a9'}} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{fontSize:12,fill:'#9691a9'}} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="planned" name="Planned" fill="#e5e0f4" radius={[5,5,0,0]}/><Bar dataKey="completed" name="Completed" fill="#7a63e7" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></div><div className="panel"><h2>How to read your data</h2><p className="muted" style={{lineHeight:1.8,marginTop:10}}>Use planned vs completed check-ins to spot patterns, not to judge yourself. If completion drops on busy days, try moving a habit to a more realistic time or reducing its size. The weekly chart updates from your saved check-ins when signed in.</p></div></section>}
      <footer style={{display:'flex',justifyContent:'space-between',gap:12,marginTop:24,padding:'15px 2px',borderTop:'1px solid #ece9f3'}}><span className="muted">Made for progress, not perfection.</span><span className="muted">Habit Builder · {new Date().getFullYear()}</span></footer>
    </main>
    {modal&&<HabitModal habit={modal.habit} onClose={()=>setModal(null)} onSave={saveHabit}/>}
    {authOpen&&<div className="overlay"><div className="modal"><div className="panel-head"><h2>Create your account</h2><button className="icon-btn" onClick={()=>setAuthOpen(false)}><X size={18}/></button></div><p className="muted">Sign up or sign in to save your habits to your own database.</p><button className="primary" onClick={()=>{setAuthOpen(false);setUser(null);setShowAuth(true)}}>Continue to sign in / sign up <ArrowUpRight size={15}/></button></div></div>}
    {showAuth&&<div style={{position:'fixed',inset:0,zIndex:20}}><Auth onAuth={u=>{setUser(u);setShowAuth(false);setDemo(false);load()}}/></div>}
  </div>;
}
export default App;

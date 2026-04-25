import { useState, useEffect, useRef } from 'react'
import { sbRegister, sbLogin, sbLoadState, sbSaveState } from './supabase.js'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const LEVELS = [
  { min: 0,    level: 1,  title: 'Aprendiz',     color: '#6B7280' },
  { min: 100,  level: 2,  title: 'Aventurero',   color: '#3B82F6' },
  { min: 300,  level: 3,  title: 'Guerrero',     color: '#8B5CF6' },
  { min: 600,  level: 4,  title: 'Campeón',      color: '#EC4899' },
  { min: 1000, level: 5,  title: 'Héroe',        color: '#F59E0B' },
  { min: 1500, level: 6,  title: 'Leyenda',      color: '#EF4444' },
  { min: 2500, level: 7,  title: 'Maestro',      color: '#10B981' },
  { min: 5000, level: 10, title: 'Gran Maestro', color: '#F97316' },
]

const SEED_MISSIONS = [
  { id: 'm1', name: 'Completar 1 sala de TryHackMe', xp: 10,  type: 'Diaria',    area: 'Aprendizaje' },
  { id: 'm2', name: 'Leer writeup de un CTF',         xp: 10,  type: 'Diaria',    area: 'Aprendizaje' },
  { id: 'm3', name: 'Registrar gastos de hoy',        xp: 5,   type: 'Diaria',    area: 'Finanzas'    },
  { id: 'm4', name: 'Máquina en Hack The Box',        xp: 100, type: 'Semanal',   area: 'Aprendizaje' },
  { id: 'm5', name: 'Aplicar a 3 trabajos remotos',  xp: 75,  type: 'Semanal',   area: 'Carrera'     },
  { id: 'm6', name: 'Revisar presupuesto de viaje',  xp: 50,  type: 'Semanal',   area: 'Finanzas'    },
  { id: 'm7', name: 'Obtener CompTIA Security+',     xp: 500, type: 'Gran Meta', area: 'Aprendizaje' },
  { id: 'm8', name: 'Construir portafolio en GitHub',xp: 400, type: 'Gran Meta', area: 'Carrera'     },
  { id: 'm9', name: 'Definir presupuesto nómada',    xp: 150, type: 'Gran Meta', area: 'Finanzas'    },
]

const HABITS = [
  { id: 'h1', name: 'Estudiar ciberseguridad',    sub: 'TryHackMe / HTB / curso',   xp: 10, area: 'Aprendizaje' },
  { id: 'h2', name: 'Registrar gastos del día',   sub: 'Fondo nómada',              xp: 5,  area: 'Finanzas'    },
  { id: 'h3', name: 'Practicar inglés técnico',   sub: 'Docs / videos en inglés',   xp: 5,  area: 'Aprendizaje' },
  { id: 'h4', name: 'Networking en cyber',        sub: 'LinkedIn / Discord',        xp: 10, area: 'Relaciones',  weekly: true },
  { id: 'h5', name: 'Revisar ofertas remotas',    sub: 'Cybersec jobs',             xp: 10, area: 'Carrera',     weekly: true },
  { id: 'h6', name: 'Apuntes de la licenciatura', sub: 'FADENA / UNDEF',           xp: 10, area: 'Aprendizaje' },
]

const ACHIEVEMENTS = [
  { id: 'a1', name: 'Primera Misión',   desc: 'Completá tu primera misión',         xp: 50,   rarity: 'Común',      icon: '⚔️' },
  { id: 'a2', name: 'Racha de 7 días', desc: '7 hábitos seguidos sin romper',      xp: 100,  rarity: 'Poco común',  icon: '🔥' },
  { id: 'a3', name: 'Lector Voraz',    desc: '5 misiones de Aprendizaje',          xp: 150,  rarity: 'Poco común',  icon: '📚' },
  { id: 'a4', name: 'Primer Ahorro',   desc: 'Alcanzá tu primera meta financiera', xp: 200,  rarity: 'Raro',        icon: '💰' },
  { id: 'a5', name: 'Networker',       desc: '10 misiones de Relaciones',          xp: 200,  rarity: 'Raro',        icon: '🤝' },
  { id: 'a6', name: 'Semana Perfecta', desc: 'Todos los hábitos por 7 días',       xp: 500,  rarity: 'Épico',       icon: '⭐' },
  { id: 'a7', name: 'Certified',       desc: 'Obtené el CompTIA Security+',        xp: 1000, rarity: 'Épico',       icon: '🏅' },
  { id: 'a8', name: 'Primera Clase',   desc: 'Primera semana en FADENA/UNDEF',     xp: 300,  rarity: 'Épico',       icon: '🎓' },
  { id: 'a9', name: 'Gran Maestro',    desc: 'Alcanzá el nivel 10',                xp: 1000, rarity: 'Legendario',  icon: '👑' },
]

const RARITY_COLORS = {
  'Común':      { bg: '#1F2937', border: '#374151', text: '#9CA3AF' },
  'Poco común': { bg: '#1E3A5F', border: '#2563EB', text: '#60A5FA' },
  'Raro':       { bg: '#2D1B69', border: '#7C3AED', text: '#A78BFA' },
  'Épico':      { bg: '#3B1F00', border: '#D97706', text: '#FCD34D' },
  'Legendario': { bg: '#3B0A0A', border: '#DC2626', text: '#FCA5A5' },
}

const AREA_COLORS = {
  Aprendizaje: '#3B82F6', Carrera: '#8B5CF6', Finanzas: '#10B981',
  Relaciones: '#EC4899',  General: '#6B7280',
}

const AREAS = ['Aprendizaje', 'Carrera', 'Finanzas', 'Relaciones', 'General']
const TYPES = ['Diaria', 'Semanal', 'Gran Meta']
const DAYS  = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const getLvl = xp => [...LEVELS].reverse().find(l => xp >= l.min) || LEVELS[0]

function getWeekKey() {
  const n = new Date(), d = n.getDay()
  const monday = new Date(n)
  monday.setDate(n.getDate() - d + (d === 0 ? -6 : 1))
  return monday.toISOString().split('T')[0]
}

const getTodayKey = () => new Date().toISOString().split('T')[0]
const uid = () => 'c' + Math.random().toString(36).slice(2, 10)

const EMPTY_STATE = {
  xp: 0,
  missions: {},
  achievements: [],
  habits: {},
  weekKey: getWeekKey(),
  allMissions: SEED_MISSIONS,
  tables: [],
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────

function AuthScreen({ onLogin }) {
  const [mode,     setMode]     = useState('login')
  const [username, setUsername] = useState('')
  const [pin,      setPin]      = useState(['', '', '', ''])
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const pinRefs = [useRef(), useRef(), useRef(), useRef()]

  const pinStr = pin.join('')

  async function handleSubmit() {
    if (!username.trim()) return setError('Ingresá tu nombre de usuario')
    if (pinStr.length !== 4) return setError('El PIN debe tener 4 dígitos')
    setLoading(true); setError('')
    const name = username.trim().toLowerCase()
    if (mode === 'register') {
      const { user, error: err } = await sbRegister(name, pinStr)
      if (err) { setError(err); setLoading(false); return }
      onLogin(user, EMPTY_STATE)
    } else {
      const { user, error: err } = await sbLogin(name, pinStr)
      if (err) { setError(err); setLoading(false); return }
      const remote = await sbLoadState(user.id)
      let s = remote || EMPTY_STATE
      if (s.weekKey !== getWeekKey()) s = { ...s, weekKey: getWeekKey(), habits: {} }
      if (!s.allMissions) s = { ...s, allMissions: SEED_MISSIONS }
      onLogin(user, s)
    }
    setLoading(false)
  }



  return (
    <div style={{ minHeight: '100vh', background: '#0A0B0E', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundImage: 'radial-gradient(ellipse 600px 400px at 50% -50px,rgba(124,106,232,.18) 0%,transparent 70%)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 28, fontWeight: 700, color: '#A594F9', letterSpacing: 3 }}>LIFE OS</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 6, letterSpacing: 2 }}>RPG · NÓMADA DIGITAL</div>
        </div>

        <div style={{ background: '#0F1117', border: '1px solid #252836', borderRadius: 14, padding: 28, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#7C6AE8,transparent)' }} />

          {/* Mode toggle */}
          <div style={{ display: 'flex', background: '#1C1F2A', borderRadius: 8, padding: 3, marginBottom: 24 }}>
            {[['login', 'Ingresar'], ['register', 'Registrarse']].map(([v, l]) => (
              <button key={v} onClick={() => { setMode(v); setError('') }}
                style={{ flex: 1, padding: '7px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
                  background: mode === v ? '#7C6AE8' : 'transparent', color: mode === v ? 'white' : '#6B7280',
                  fontFamily: "'Rajdhani',sans-serif", fontSize: 14, fontWeight: 600, transition: 'all .15s' }}>
                {l}
              </button>
            ))}
          </div>

          <label style={LBL}>Nombre de usuario</label>
          <input value={username} onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="ej: andres" style={{ ...INP, marginBottom: 16 }} />

          <label style={LBL}>PIN de 4 dígitos</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pinStr}
            onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setPin(e.target.value.split('')) }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="••••"
            style={{ ...INP, marginBottom: 24, fontSize: 24, letterSpacing: 8, textAlign: 'center' }}
          />

          {error && (
            <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8,
              padding: '10px 14px', color: '#FCA5A5', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', padding: '12px 0', background: '#7C6AE8', border: 'none', borderRadius: 8,
              color: 'white', fontFamily: "'Cinzel',serif", fontSize: 14, fontWeight: 600, letterSpacing: 2,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? '...' : mode === 'register' ? 'CREAR CUENTA' : 'INGRESAR'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MISSION MODAL ────────────────────────────────────────────────────────────

function MissionModal({ mission, onSave, onClose }) {
  const [name, setName] = useState(mission?.name || '')
  const [xp,   setXp]   = useState(mission?.xp   || 10)
  const [type, setType] = useState(mission?.type  || 'Diaria')
  const [area, setArea] = useState(mission?.area  || 'Aprendizaje')
  const [err,  setErr]  = useState('')

  function handleSave() {
    if (!name.trim()) return setErr('El nombre no puede estar vacío')
    if (!xp || xp < 1) return setErr('El XP debe ser mayor a 0')
    onSave({ id: mission?.id || uid(), name: name.trim(), xp: parseInt(xp), type, area })
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#0F1117', border: '1px solid #252836', borderRadius: 14,
        padding: 24, width: '100%', maxWidth: 420, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg,transparent,#7C6AE8,transparent)' }} />

        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 14, fontWeight: 600, letterSpacing: 1, marginBottom: 20 }}>
          {mission ? 'EDITAR MISIÓN' : 'NUEVA MISIÓN'}
        </div>

        <label style={LBL}>Nombre</label>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="Nombre de la misión..." style={{ ...INP, marginBottom: 14 }}
          onKeyDown={e => e.key === 'Enter' && handleSave()} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={LBL}>XP Recompensa</label>
            <input type="number" value={xp} min={1} max={9999}
              onChange={e => setXp(e.target.value)} style={{ ...INP, marginTop: 5 }} />
          </div>
          <div>
            <label style={LBL}>Tipo</label>
            <select value={type} onChange={e => setType(e.target.value)} style={{ ...INP, marginTop: 5 }}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <label style={LBL}>Área</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, marginBottom: err ? 8 : 20 }}>
          {AREAS.map(a => (
            <button key={a} onClick={() => setArea(a)}
              style={{ padding: '5px 12px', borderRadius: 99,
                border: `1px solid ${area === a ? AREA_COLORS[a] : '#2E3347'}`,
                background: area === a ? `${AREA_COLORS[a]}22` : 'transparent',
                color: area === a ? AREA_COLORS[a] : '#6B7280',
                cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Rajdhani',sans-serif" }}>
              {a}
            </button>
          ))}
        </div>

        {err && <div style={{ color: '#FCA5A5', fontSize: 12, marginBottom: 12 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose}
            style={{ ...BTN, flex: 1, background: 'transparent', borderColor: '#2E3347', color: '#6B7280' }}>
            Cancelar
          </button>
          <button onClick={handleSave}
            style={{ ...BTN, flex: 2, background: '#7C6AE8', borderColor: '#7C6AE8', color: 'white' }}>
            {mission ? 'Guardar cambios' : 'Crear misión'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [user,      setUser]      = useState(null)
  const [state,     setState]     = useState(EMPTY_STATE)
  const [loaded,    setLoaded]    = useState(false)
  const [tab,       setTab]       = useState('dashboard')
  const [mFilter,   setMFilter]   = useState('Todas')
  const [toast,     setToast]     = useState(null)
  const [syncing,   setSyncing]   = useState(false)
  const [undoStack, setUndoStack] = useState([])
  const [modal,     setModal]     = useState(null)
  const saveTimer = useRef(null)

  // ── Load user session on mount ─────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('lifeos_user')
    if (saved) {
      const u = JSON.parse(saved)
      setUser(u)
      sbLoadState(u.id).then(remote => {
        if (remote) {
          let s = remote
          if (s.weekKey !== getWeekKey()) s = { ...s, weekKey: getWeekKey(), habits: {} }
          if (!s.allMissions) s = { ...s, allMissions: SEED_MISSIONS }
          setState({ ...EMPTY_STATE, ...s })
        }
        setLoaded(true)
      })
    } else {
      setLoaded(true)
    }
  }, [])

  // ── Auto-save to Supabase (debounced 1.5s) ────────────────────────────────
  useEffect(() => {
    if (!loaded || !user) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSyncing(true)
      await sbSaveState(user.id, state)
      setSyncing(false)
    }, 1500)
  }, [state, loaded, user])

  function handleLogin(u, s) {
    localStorage.setItem('lifeos_user', JSON.stringify(u))
    setUser(u); setState(s); setLoaded(true)
  }

  function handleLogout() {
    localStorage.removeItem('lifeos_user')
    setUser(null); setState(EMPTY_STATE); setUndoStack([]); setTab('dashboard')
  }

  // ── Toast ──────────────────────────────────────────────────────────────────
  function showToast(msg, type = 'xp') {
    setToast({ msg, type, k: Date.now() })
    setTimeout(() => setToast(null), 2800)
  }

  // ── Undo ───────────────────────────────────────────────────────────────────
  function pushUndo(prev, label) {
    setUndoStack(s => [...s.slice(-9), { state: prev, label }])
  }
  function undo() {
    if (!undoStack.length) return
    const last = undoStack[undoStack.length - 1]
    setState(last.state)
    setUndoStack(s => s.slice(0, -1))
    showToast(`↩ Deshecho: ${last.label}`, 'level')
  }

  // ── Computed ───────────────────────────────────────────────────────────────
  const lvl      = getLvl(state.xp)
  const nextLvl  = LEVELS.find(l => l.min > state.xp)
  const pct      = nextLvl ? Math.round(((state.xp - lvl.min) / (nextLvl.min - lvl.min)) * 100) : 100
  const todayIdx = (new Date().getDay() + 6) % 7

  const allMissions = state.allMissions || SEED_MISSIONS
  const isMDone = m => !!state.missions[m.type === 'Gran Meta' ? m.id : `${m.id}_${getTodayKey()}`]
  const dailyMissions = allMissions.filter(m => m.type === 'Diaria')
  const dailyDone = dailyMissions.filter(isMDone).length

  // ── Mission actions ────────────────────────────────────────────────────────
  function toggleMission(m) {
    setState(prev => {
      const key  = m.type === 'Gran Meta' ? m.id : `${m.id}_${getTodayKey()}`
      const done = !!prev.missions[key]
      pushUndo(prev, done ? `Desmarcar "${m.name}"` : `Completar "${m.name}"`)
      const ms = { ...prev.missions }
      let xp = prev.xp, achs = [...prev.achievements]
      if (done) {
        delete ms[key]; xp = Math.max(0, xp - m.xp)
      } else {
        ms[key] = true
        const ol = getLvl(xp).level; xp += m.xp; const nl = getLvl(xp).level
        setTimeout(() => nl > ol
          ? showToast(`⚡ Nivel ${nl} — ${getLvl(xp).title}!`, 'level')
          : showToast(`+${m.xp} XP · ${m.name}`, 'xp'), 50)
        if (!achs.includes('a1')) {
          achs.push('a1'); xp += 50
          setTimeout(() => showToast('🏆 Primera Misión +50 XP', 'achieve'), 1200)
        }
      }
      return { ...prev, missions: ms, xp, achievements: achs }
    })
  }

  function addMission(m) {
    setState(prev => {
      pushUndo(prev, `Crear "${m.name}"`)
      return { ...prev, allMissions: [...(prev.allMissions || SEED_MISSIONS), m] }
    })
    setModal(null); showToast(`Misión "${m.name}" creada`, 'achieve')
  }

  function editMission(m) {
    setState(prev => {
      pushUndo(prev, `Editar "${m.name}"`)
      return { ...prev, allMissions: (prev.allMissions || SEED_MISSIONS).map(c => c.id === m.id ? m : c) }
    })
    setModal(null); showToast('Misión actualizada', 'xp')
  }

  function deleteMission(m) {
    setState(prev => {
      pushUndo(prev, `Borrar "${m.name}"`)
      return { ...prev, allMissions: (prev.allMissions || SEED_MISSIONS).filter(c => c.id !== m.id) }
    })
    showToast('Misión eliminada', 'level')
  }

  // ── Habit actions ──────────────────────────────────────────────────────────
  function toggleHabit(hid, dayIdx) {
    setState(prev => {
      const hab = HABITS.find(x => x.id === hid)
      const key = `${hid}_${dayIdx}`
      pushUndo(prev, `Hábito ${hab?.name}`)
      const h = { ...prev.habits }; let xp = prev.xp
      if (h[key]) { delete h[key]; xp = Math.max(0, xp - (hab?.xp || 5)) }
      else { h[key] = true; xp += hab?.xp || 5; setTimeout(() => showToast(`+${hab?.xp || 5} XP · ${hab?.name}`, 'xp'), 50) }
      return { ...prev, habits: h, xp }
    })
  }

  function getStreak(hid) {
    let s = 0
    for (let i = 6; i >= 0; i--) { if (state.habits[`${hid}_${i}`]) s++; else break }
    return s
  }

  // ── Achievement actions ────────────────────────────────────────────────────
  function unlockAchievement(a) {
    if (state.achievements.includes(a.id)) return
    setState(prev => {
      pushUndo(prev, `Logro ${a.name}`)
      return { ...prev, achievements: [...prev.achievements, a.id], xp: prev.xp + a.xp }
    })
    showToast(`🏆 ${a.name} +${a.xp} XP`, 'achieve')
  }

  const filteredMissions = mFilter === 'Todas' ? allMissions : allMissions.filter(m => m.type === mFilter)

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!loaded) return (
    <div style={{ minHeight: '100vh', background: '#0A0B0E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: "'Rajdhani',sans-serif", color: '#7C6AE8', fontSize: 18, letterSpacing: 3 }}>CARGANDO...</div>
    </div>
  )
  if (!user) return <AuthScreen onLogin={handleLogin} />

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* HEADER */}
        <header className="header">
          <div className="header-inner">
            <div className="logo">LIFE OS</div>
            <nav className="nav">
              {[['dashboard','Dashboard'],['missions','Misiones'],['habits','Hábitos'],['achievements','Logros'],['tables','Tablas']].map(([v, l]) => (
                <button key={v} className={`nav-btn${tab === v ? ' active' : ''}`} onClick={() => setTab(v)}>{l}</button>
              ))}
            </nav>
            <div className="xp-mini">
              {syncing && <span className="sync-dot" title="Guardando..." />}
              {undoStack.length > 0 && (
                <button onClick={undo} className="undo-btn" title={undoStack[undoStack.length - 1].label}>
                  ↩ Deshacer
                </button>
              )}
              <span className="level-pill" style={{ borderColor: lvl.color, color: lvl.color }}>LVL {lvl.level}</span>
              <div className="xp-bar-mini"><div className="xp-fill-mini" style={{ width: pct + '%', background: lvl.color }} /></div>
              <span className="xp-num">{state.xp} XP</span>
              <button onClick={handleLogout} className="logout-btn">{user.username} ×</button>
            </div>
          </div>
        </header>

        <main className="main">

          {/* ══ DASHBOARD ══ */}
          {tab === 'dashboard' && <>
            {/* Hero Card */}
            <div className="hero-card">
              <div className="hero-accent" style={{ background: `linear-gradient(90deg,transparent,${lvl.color},transparent)` }} />
              <div className="hero-top">
                <div>
                  <div className="hero-name" style={{textTransform:'capitalize'}}>{user.username}</div>
                  <div className="hero-subtitle">{lvl.title} · Nómada Digital en Entrenamiento</div>
                </div>
                <div className="hero-stats">
                  {[[lvl.level,'Nivel',lvl.color],[state.xp,'XP Total','#A594F9'],[`${dailyDone}/${dailyMissions.length}`,'Hoy','#10B981'],[state.achievements.length,'Logros','#F59E0B']].map(([v,l,c]) => (
                    <div key={l} className="hero-stat">
                      <div className="hero-stat-val" style={{ color: c }}>{v}</div>
                      <div className="hero-stat-lbl">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 7 }}>
                  <span style={{ color: '#6B7280' }}>{lvl.title}</span>
                  <span style={{ color: '#A594F9', fontWeight: 600 }}>
                    {nextLvl ? `${state.xp - lvl.min} / ${nextLvl.min - lvl.min} XP` : 'Nivel máximo'}
                  </span>
                </div>
                <div className="xp-track">
                  <div className="xp-fill" style={{ width: pct + '%', background: `linear-gradient(90deg,${lvl.color}88,${lvl.color})` }} />
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 5 }}>
                  {nextLvl ? `${nextLvl.min - state.xp} XP para ${getLvl(nextLvl.min).title}` : 'Gran Maestro alcanzado'}
                </div>
              </div>
            </div>

            {/* Two columns */}
            <div className="grid-2" style={{ marginBottom: 16 }}>
              <div className="panel">
                <div className="panel-head">
                  <span className="panel-title">Misiones de hoy</span>
                  <span className="panel-badge" style={{ marginLeft: 'auto' }}>{dailyDone}/{dailyMissions.length}</span>
                </div>
                {dailyMissions.map(m => <MissionRow key={m.id} m={m} done={isMDone(m)} onToggle={() => toggleMission(m)} onEdit={() => setModal(m)} onDelete={() => deleteMission(m)} compact />)}
              </div>
              <div className="panel">
                <div className="panel-head"><span className="panel-title">Hábitos — hoy</span></div>
                {HABITS.filter(h => !h.weekly).map(h => {
                  const done = !!state.habits[`${h.id}_${todayIdx}`]
                  return (
                    <div key={h.id} className="habit-row">
                      <Circle done={done} onClick={() => toggleHabit(h.id, todayIdx)} />
                      <div style={{ flex: 1 }}><div className="item-name">{h.name}</div><div className="item-sub">{h.sub}</div></div>
                      <span className="streak">{getStreak(h.id) > 0 ? `🔥 ${getStreak(h.id)}` : `+${h.xp}`}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Next achievements */}
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">Próximos logros</span>
                <button className="panel-action" onClick={() => setTab('achievements')}>Ver todos →</button>
              </div>
              <div style={{ display: 'flex', gap: 10, padding: 14, flexWrap: 'wrap' }}>
                {ACHIEVEMENTS.filter(a => !state.achievements.includes(a.id)).slice(0, 4).map(a => {
                  const c = RARITY_COLORS[a.rarity]
                  return (
                    <div key={a.id} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '10px 14px', flex: '1 1 130px', minWidth: 120 }}>
                      <div style={{ fontSize: 22 }}>{a.icon}</div>
                      <div style={{ fontFamily: "'Cinzel',serif", fontSize: 11, fontWeight: 600, color: c.text, marginTop: 6 }}>{a.name}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginTop: 4 }}>+{a.xp} XP</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>}

          {/* ══ MISSIONS ══ */}
          {tab === 'missions' && <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
              <div>
                <div className="section-title">Misiones</div>
                <div className="section-sub">Todas las misiones son editables</div>
              </div>
              <button onClick={() => setModal('new')} style={{ ...BTN, background: '#7C6AE8', borderColor: '#7C6AE8', color: 'white' }}>
                + Nueva misión
              </button>
            </div>
            <div className="tabs">
              {['Todas', 'Diaria', 'Semanal', 'Gran Meta'].map(f => (
                <button key={f} className={`tab-btn${mFilter === f ? ' active' : ''}`} onClick={() => setMFilter(f)}>{f}</button>
              ))}
            </div>
            <div className="panel">
              {filteredMissions.map(m => (
                <MissionRow key={m.id} m={m} done={isMDone(m)} onToggle={() => toggleMission(m)} onEdit={() => setModal(m)} onDelete={() => deleteMission(m)} />
              ))}
              {filteredMissions.length === 0 && (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>
                  No hay misiones en esta categoría.
                  <br /><br />
                  <button onClick={() => setModal('new')} style={{ ...BTN, background: '#7C6AE8', borderColor: '#7C6AE8', color: 'white' }}>+ Crear una</button>
                </div>
              )}
            </div>
          </>}

          {/* ══ HABITS ══ */}
          {tab === 'habits' && <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
              <div>
                <div className="section-title">Rastreador de Hábitos</div>
                <div className="section-sub">Se reinicia automáticamente cada lunes</div>
              </div>
              <span className="week-label">Semana del {state.weekKey}</span>
            </div>
            <div className="panel">
              <div className="habits-head">
                <span className="panel-title" style={{ padding: '12px 16px' }}>Esta semana</span>
                <div className="days-header">
                  {DAYS.map((d, i) => <div key={i} className="day-lbl" style={{ color: i === todayIdx ? '#F59E0B' : '#6B7280' }}>{d}</div>)}
                </div>
              </div>
              {HABITS.map(h => {
                const streak = getStreak(h.id)
                return (
                  <div key={h.id} className="habit-full-row">
                    <div style={{ flex: 1 }}>
                      <div className="item-name">{h.name}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: AREA_COLORS[h.area], display: 'inline-block' }} />
                        <span className="item-sub">{h.area}</span>
                        {h.weekly && <span style={{ fontSize: 10, color: '#A78BFA', fontWeight: 600, letterSpacing: .5 }}>SEMANAL</span>}
                      </div>
                    </div>
                    {streak > 0 && <span className="streak" style={{ marginRight: 8 }}>🔥 {streak}</span>}
                    <div className="days-row">
                      {DAYS.map((_, i) => {
                        const checked = !!state.habits[`${h.id}_${i}`]
                        return (
                          <button key={i} className={`day-btn${checked ? ' checked' : ''}${i === todayIdx && !checked ? ' today' : ''}`}
                            onClick={() => toggleHabit(h.id, i)}>{DAYS[i]}</button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </>}

          {/* ══ ACHIEVEMENTS ══ */}
          {tab === 'achievements' && <>
            <div style={{ marginBottom: 16 }}>
              <div className="section-title">Sala de Logros</div>
              <div className="section-sub">{state.achievements.length} / {ACHIEVEMENTS.length} desbloqueados</div>
            </div>
            <div className="achieve-grid">
              {ACHIEVEMENTS.map(a => {
                const unlocked = state.achievements.includes(a.id)
                const c = RARITY_COLORS[a.rarity]
                return (
                  <div key={a.id} className={`achieve-card${unlocked ? '' : ' locked'}`}
                    style={{ background: c.bg, borderColor: c.border }}
                    onClick={() => !unlocked && unlockAchievement(a)}>
                    <span style={{ fontSize: 26, display: 'block' }}>{a.icon}</span>
                    <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 600, color: c.text, marginTop: 8 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: c.text, opacity: .7, marginTop: 3, marginBottom: 8, lineHeight: 1.4 }}>{a.desc}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: c.text }}>+{a.xp} XP</span>
                      <span style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: c.text }}>{a.rarity}</span>
                    </div>
                    {!unlocked && <div className="achieve-overlay">DESBLOQUEAR</div>}
                  </div>
                )
              })}
            </div>
          </>}


          {/* ══ TABLES ══ */}
          {tab === 'tables' && <TablesSection state={state} setState={setState} pushUndo={pushUndo} />}

        </main>
      </div>

      {modal && (
        <MissionModal
          mission={modal === 'new' ? null : modal}
          onSave={modal === 'new' ? addMission : editMission}
          onClose={() => setModal(null)}
        />
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </>
  )
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function Circle({ done, onClick }) {
  return (
    <div className={`circle${done ? ' done' : ''}`} onClick={onClick}>
      {done && <div className="checkmark" />}
    </div>
  )
}

function MissionRow({ m, done, onToggle, onEdit, onDelete, compact }) {
  const TS = {
    'Diaria':    ['rgba(59,130,246,.15)',  '#60A5FA', 'rgba(59,130,246,.3)'],
    'Semanal':   ['rgba(139,92,246,.15)',  '#A78BFA', 'rgba(139,92,246,.3)'],
    'Gran Meta': ['rgba(245,158,11,.15)',  '#FCD34D', 'rgba(245,158,11,.3)'],
  }[m.type] || []

  return (
    <div className="mission-row">
      <Circle done={done} onClick={onToggle} />
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={onToggle}>
        <div className={`item-name${done ? ' done' : ''}`}>{m.name}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: AREA_COLORS[m.area], display: 'inline-block', flexShrink: 0 }} />
          <span className="item-sub">{m.area}</span>
          {!compact && <span className="type-badge" style={{ background: TS[0], color: TS[1], border: `1px solid ${TS[2]}` }}>{m.type.toUpperCase()}</span>}
        </div>
      </div>
      <span className={`xp-badge${done ? ' earned' : ''}`} style={{ marginRight: 6 }}>+{m.xp}</span>
      <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
        <button onClick={onEdit} title="Editar" className="icon-btn">✏️</button>
        <button onClick={onDelete} title="Eliminar" className="icon-btn del">🗑</button>
      </div>
    </div>
  )
}


// ─── TABLES SECTION ───────────────────────────────────────────────────────────

function TablesSection({ state, setState, pushUndo }) {
  const [view,       setView]       = useState(null)   // null = list, tableId = detail
  const [tableModal, setTableModal] = useState(false)  // create table modal
  const [colModal,   setColModal]   = useState(false)  // add column modal
  const [rowModal,   setRowModal]   = useState(null)   // null | row object

  const tables = state.tables || []
  const currentTable = tables.find(t => t.id === view)

  function createTable(name) {
    const t = { id: uid(), name, columns: [], rows: [] }
    setState(prev => {
      pushUndo(prev, `Crear tabla "${name}"`)
      return { ...prev, tables: [...(prev.tables || []), t] }
    })
    setTableModal(false)
    setView(t.id)
  }

  function deleteTable(tId) {
    const t = tables.find(x => x.id === tId)
    setState(prev => {
      pushUndo(prev, `Borrar tabla "${t?.name}"`)
      return { ...prev, tables: (prev.tables || []).filter(x => x.id !== tId) }
    })
    setView(null)
  }

  function addColumn(tId, col) {
    setState(prev => {
      pushUndo(prev, `Columna "${col.name}"`)
      return {
        ...prev,
        tables: (prev.tables || []).map(t => t.id !== tId ? t : {
          ...t,
          columns: [...t.columns, col],
          rows: t.rows.map(r => ({ ...r, [col.id]: col.type === 'checkbox' ? false : '' }))
        })
      }
    })
    setColModal(false)
  }

  function deleteColumn(tId, colId) {
    setState(prev => {
      pushUndo(prev, 'Borrar columna')
      return {
        ...prev,
        tables: (prev.tables || []).map(t => t.id !== tId ? t : {
          ...t,
          columns: t.columns.filter(c => c.id !== colId),
          rows: t.rows.map(r => { const nr = { ...r }; delete nr[colId]; return nr })
        })
      }
    })
  }

  function addRow(tId) {
    const t = tables.find(x => x.id === tId)
    if (!t) return
    const row = { id: uid(), _name: '' }
    t.columns.forEach(c => { row[c.id] = c.type === 'checkbox' ? false : '' })
    setState(prev => {
      pushUndo(prev, 'Nueva fila')
      return { ...prev, tables: (prev.tables || []).map(x => x.id !== tId ? x : { ...x, rows: [...x.rows, row] }) }
    })
    setRowModal({ ...row, _tableId: tId })
  }

  function saveRow(tId, row) {
    setState(prev => {
      pushUndo(prev, `Editar fila`)
      return {
        ...prev,
        tables: (prev.tables || []).map(t => t.id !== tId ? t : {
          ...t, rows: t.rows.map(r => r.id === row.id ? row : r)
        })
      }
    })
    setRowModal(null)
  }

  function deleteRow(tId, rowId) {
    setState(prev => {
      pushUndo(prev, 'Borrar fila')
      return {
        ...prev,
        tables: (prev.tables || []).map(t => t.id !== tId ? t : {
          ...t, rows: t.rows.filter(r => r.id !== rowId)
        })
      }
    })
  }

  const CELL_XP = 10  // Same as a daily mission

  function toggleCell(tId, rowId, colId, showToastFn) {
    setState(prev => {
      const table = (prev.tables || []).find(t => t.id === tId)
      const row   = table?.rows.find(r => r.id === rowId)
      const col   = table?.columns.find(c => c.id === colId)
      if (!row || !col || col.type !== 'checkbox') return prev

      const wasChecked = !!row[colId]
      const xpDelta    = wasChecked ? -CELL_XP : CELL_XP
      const newXp      = Math.max(0, prev.xp + xpDelta)

      if (!wasChecked) {
        const oldLvl = getLvl(prev.xp).level
        const newLvl = getLvl(newXp).level
        setTimeout(() => {
          if (newLvl > oldLvl) showToast(`⚡ Nivel ${newLvl} — ${getLvl(newXp).title}!`, 'level')
          else showToast(`+${CELL_XP} XP · ${col.name}`, 'xp')
        }, 50)
      }

      return {
        ...prev,
        xp: newXp,
        tables: (prev.tables || []).map(t => t.id !== tId ? t : {
          ...t, rows: t.rows.map(r => r.id !== rowId ? r : { ...r, [colId]: !r[colId] })
        })
      }
    })
  }

  // ── Table list view ──────────────────────────────────────────────────────
  if (!view) return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <div className="section-title">Tablas</div>
          <div className="section-sub">Creá tablas personalizadas para trackear lo que quieras</div>
        </div>
        <button onClick={() => setTableModal(true)} style={{ ...BTN, background: '#7C6AE8', borderColor: '#7C6AE8', color: 'white' }}>
          + Nueva tabla
        </button>
      </div>

      {tables.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 14, marginBottom: 8 }}>Sin tablas todavía</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Creá una tabla para empezar a trackear materias, proyectos o lo que quieras</div>
          <button onClick={() => setTableModal(true)} style={{ ...BTN, background: '#7C6AE8', borderColor: '#7C6AE8', color: 'white' }}>+ Nueva tabla</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
          {tables.map(t => (
            <div key={t.id} className="panel" style={{ cursor: 'pointer', transition: 'transform .15s' }}
              onClick={() => setView(t.id)}>
              <div style={{ padding: '20px 20px 16px' }}>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>
                  {t.columns.length} columnas · {t.rows.length} filas
                </div>
              </div>
              <div style={{ borderTop: '1px solid #252836', padding: '10px 20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={e => { e.stopPropagation(); deleteTable(t.id) }}
                  style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,.5)', cursor: 'pointer', fontSize: 12 }}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tableModal && <CreateTableModal onSave={createTable} onClose={() => setTableModal(false)} />}
    </>
  )

  // ── Table detail view ────────────────────────────────────────────────────
  if (!currentTable) { setView(null); return null }
  const { columns, rows } = currentTable

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => setView(null)}
          style={{ background: 'none', border: '1px solid #252836', borderRadius: 6, color: '#6B7280', cursor: 'pointer', padding: '5px 10px', fontSize: 12 }}>
          ← Volver
        </button>
        <div className="section-title">{currentTable.name}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => setColModal(true)}
            style={{ ...BTN, background: 'transparent', color: '#A594F9', borderColor: '#2E3347' }}>
            + Columna
          </button>
          <button onClick={() => addRow(view)}
            style={{ ...BTN, background: '#7C6AE8', borderColor: '#7C6AE8', color: 'white' }}>
            + Fila
          </button>
        </div>
      </div>

      {/* Table */}
      {columns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280', background: '#0F1117', border: '1px solid #252836', borderRadius: 12 }}>
          <div style={{ fontSize: 13, marginBottom: 12 }}>Agregá columnas para empezar a completar la tabla</div>
          <button onClick={() => setColModal(true)} style={{ ...BTN, background: '#7C6AE8', borderColor: '#7C6AE8', color: 'white' }}>+ Agregar columna</button>
        </div>
      ) : (
        <div style={{ background: '#0F1117', border: '1px solid #252836', borderRadius: 12, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: `200px ${columns.map(c => c.type === 'checkbox' ? '90px' : '1fr').join(' ')} 60px`,
            background: '#161820', borderBottom: '1px solid #252836' }}>
            <div style={TH}>Nombre</div>
            {columns.map(c => (
              <div key={c.id} style={{ ...TH, display: 'flex', alignItems: 'center', justifyContent: c.type === 'checkbox' ? 'center' : 'flex-start', gap: 6 }}>
                <span>{c.name}</span>
                <button onClick={() => deleteColumn(view, c.id)}
                  style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,.4)', cursor: 'pointer', fontSize: 10, padding: '0 2px', lineHeight: 1 }}>✕</button>
              </div>
            ))}
            <div style={TH} />
          </div>

          {/* Rows */}
          {rows.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
              Sin filas todavía. Clickeá "+ Fila" para agregar.
            </div>
          ) : rows.map(row => (
            <div key={row.id} style={{ display: 'grid', gridTemplateColumns: `200px ${columns.map(c => c.type === 'checkbox' ? '90px' : '1fr').join(' ')} 60px`,
              borderBottom: '1px solid #252836', transition: 'background .1s' }}
              className="table-row">
              <div style={TD}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{row._name || <span style={{ color: '#374151' }}>Sin nombre</span>}</span>
              </div>
              {columns.map(c => (
                <div key={c.id} style={{ ...TD, justifyContent: c.type === 'checkbox' ? 'center' : 'flex-start', cursor: c.type === 'checkbox' ? 'pointer' : 'default' }}
                  onClick={c.type === 'checkbox' ? e => { e.stopPropagation(); toggleCell(view, row.id, c.id, showToast) } : undefined}>
                  {c.type === 'checkbox' ? (
                    <div className={`circle${row[c.id] ? ' done' : ''}`}
                      style={{ width: 22, height: 22, cursor: 'pointer', flexShrink: 0 }}
                      onClick={e => { e.stopPropagation(); toggleCell(view, row.id, c.id, showToast) }}>
                      {row[c.id] && <div className="checkmark" />}
                    </div>
                  ) : c.type === 'number' ? (
                    <span style={{ fontSize: 13, color: row[c.id] ? '#E2E4ED' : '#374151' }}>{row[c.id] || '—'}</span>
                  ) : (
                    <span style={{ fontSize: 13, color: row[c.id] ? '#E2E4ED' : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row[c.id] || '—'}</span>
                  )}
                </div>
              ))}
              <div style={{ ...TD, justifyContent: 'center', gap: 4 }}>
                <button onClick={() => setRowModal({ ...row, _tableId: view })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 12, padding: '2px 4px' }}>✏️</button>
                <button onClick={() => deleteRow(view, row.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,.5)', fontSize: 12, padding: '2px 4px' }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {colModal && <AddColumnModal onSave={col => addColumn(view, col)} onClose={() => setColModal(false)} />}
      {rowModal && <EditRowModal row={rowModal} columns={columns} onSave={r => saveRow(r._tableId, r)} onClose={() => setRowModal(null)} />}
    </>
  )
}

// ── Sub-modals ────────────────────────────────────────────────────────────────

function CreateTableModal({ onSave, onClose }) {
  const [name, setName] = useState('')
  return (
    <Modal title="NUEVA TABLA" onClose={onClose}>
      <label style={LBL}>Nombre de la tabla</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="ej: Materias 1° cuatrimestre"
        style={{ ...INP, marginBottom: 20 }} onKeyDown={e => e.key === 'Enter' && name.trim() && onSave(name.trim())} autoFocus />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onClose} style={{ ...BTN, flex: 1, background: 'transparent', borderColor: '#2E3347', color: '#6B7280' }}>Cancelar</button>
        <button onClick={() => name.trim() && onSave(name.trim())} style={{ ...BTN, flex: 2, background: '#7C6AE8', borderColor: '#7C6AE8', color: 'white' }}>Crear tabla</button>
      </div>
    </Modal>
  )
}

function AddColumnModal({ onSave, onClose }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('text')
  return (
    <Modal title="NUEVA COLUMNA" onClose={onClose}>
      <label style={LBL}>Nombre de la columna</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="ej: Parcial 1"
        style={{ ...INP, marginBottom: 14 }} autoFocus onKeyDown={e => e.key === 'Enter' && name.trim() && onSave({ id: uid(), name: name.trim(), type })} />
      <label style={LBL}>Tipo</label>
      <div style={{ display: 'flex', gap: 8, marginTop: 6, marginBottom: 20 }}>
        {[['text','Texto'],['checkbox','Checkbox'],['number','Número']].map(([v, l]) => (
          <button key={v} onClick={() => setType(v)}
            style={{ flex: 1, padding: '8px 0', border: `1px solid ${type === v ? '#7C6AE8' : '#2E3347'}`,
              borderRadius: 8, background: type === v ? 'rgba(124,106,232,.2)' : 'transparent',
              color: type === v ? '#A594F9' : '#6B7280', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              fontFamily: "'Rajdhani',sans-serif" }}>
            {l}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onClose} style={{ ...BTN, flex: 1, background: 'transparent', borderColor: '#2E3347', color: '#6B7280' }}>Cancelar</button>
        <button onClick={() => name.trim() && onSave({ id: uid(), name: name.trim(), type })}
          style={{ ...BTN, flex: 2, background: '#7C6AE8', borderColor: '#7C6AE8', color: 'white' }}>Agregar</button>
      </div>
    </Modal>
  )
}

function EditRowModal({ row, columns, onSave, onClose }) {
  const [data, setData] = useState({ ...row })
  return (
    <Modal title="EDITAR FILA" onClose={onClose}>
      <label style={LBL}>Nombre</label>
      <input value={data._name || ''} onChange={e => setData(d => ({ ...d, _name: e.target.value }))}
        placeholder="Nombre de esta fila" style={{ ...INP, marginBottom: 14 }} autoFocus />
      {columns.map(c => (
        <div key={c.id} style={{ marginBottom: 14 }}>
          <label style={LBL}>{c.name}</label>
          {c.type === 'checkbox' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <div className={`circle${data[c.id] ? ' done' : ''}`} style={{ width: 22, height: 22, cursor: 'pointer' }}
                onClick={() => setData(d => ({ ...d, [c.id]: !d[c.id] }))}>
                {data[c.id] && <div className="checkmark" />}
              </div>
              <span style={{ fontSize: 13, color: data[c.id] ? '#10B981' : '#6B7280' }}>
                {data[c.id] ? 'Completado' : 'Pendiente'}
              </span>
            </div>
          ) : (
            <input value={data[c.id] || ''} onChange={e => setData(d => ({ ...d, [c.id]: e.target.value }))}
              type={c.type === 'number' ? 'number' : 'text'}
              placeholder={c.type === 'number' ? '0' : `Valor para ${c.name}`}
              style={{ ...INP, marginTop: 5 }} />
          )}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button onClick={onClose} style={{ ...BTN, flex: 1, background: 'transparent', borderColor: '#2E3347', color: '#6B7280' }}>Cancelar</button>
        <button onClick={() => onSave(data)} style={{ ...BTN, flex: 2, background: '#7C6AE8', borderColor: '#7C6AE8', color: 'white' }}>Guardar</button>
      </div>
    </Modal>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#0F1117', border: '1px solid #252836', borderRadius: 14,
        padding: 24, width: '100%', maxWidth: 440, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg,transparent,#7C6AE8,transparent)' }} />
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 600, letterSpacing: 1, marginBottom: 20 }}>{title}</div>
        {children}
      </div>
    </div>
  )
}

const TH = { padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#6B7280', letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center' }
const TD = { padding: '10px 14px', fontSize: 13, display: 'flex', alignItems: 'center', minWidth: 0 }

// ─── STYLE CONSTANTS ──────────────────────────────────────────────────────────

const LBL = { display: 'block', fontSize: 11, color: '#6B7280', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }
const INP = { width: '100%', background: '#161820', border: '1px solid #2E3347', borderRadius: 8, padding: '9px 12px', color: '#E2E4ED', fontSize: 14, fontFamily: "'Rajdhani',sans-serif", outline: 'none' }
const BTN = { padding: '9px 16px', border: '1px solid #2E3347', borderRadius: 8, cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: .5 }

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Rajdhani:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{min-height:100%;background:#0A0B0E;color:#E2E4ED;font-family:'Rajdhani',sans-serif}
button,input,select{font-family:'Rajdhani',sans-serif}
select option{background:#161820;color:#E2E4ED}

.app{min-height:100vh;background:#0A0B0E;background-image:radial-gradient(ellipse 800px 400px at 50% -100px,rgba(124,106,232,.13) 0%,transparent 70%)}

.header{border-bottom:1px solid #252836;background:rgba(10,11,14,.92);backdrop-filter:blur(12px);position:sticky;top:0;z-index:100;padding:0 20px}
.header-inner{max-width:1000px;margin:0 auto;display:flex;align-items:center;gap:10px;height:52px}
.logo{font-family:'Cinzel',serif;font-size:15px;font-weight:700;color:#A594F9;letter-spacing:2px;flex-shrink:0}
.nav{display:flex;gap:2px;flex:1}
.nav-btn{background:none;border:none;color:#6B7280;cursor:pointer;font-size:13px;font-weight:600;padding:5px 10px;border-radius:6px;transition:all .15s}
.nav-btn:hover{color:#E2E4ED;background:#161820}
.nav-btn.active{color:#A594F9;background:rgba(124,106,232,.18)}
.xp-mini{display:flex;align-items:center;gap:7px;margin-left:auto}
.sync-dot{width:6px;height:6px;border-radius:50%;background:#10B981;animation:pulse 1.5s infinite;flex-shrink:0}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.undo-btn{background:rgba(124,106,232,.15);border:1px solid #2E3347;border-radius:6px;color:#A594F9;cursor:pointer;font-size:12px;padding:3px 8px;font-weight:600;white-space:nowrap}
.level-pill{font-family:'Cinzel',serif;font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;border:1px solid;letter-spacing:1px;white-space:nowrap}
.xp-bar-mini{width:60px;height:4px;background:#2E3347;border-radius:99px;overflow:hidden;flex-shrink:0}
.xp-fill-mini{height:100%;border-radius:99px;transition:width .5s ease}
.xp-num{font-size:13px;font-weight:600;color:#A594F9;white-space:nowrap}
.logout-btn{background:none;border:1px solid #252836;border-radius:6px;color:#6B7280;cursor:pointer;font-size:11px;padding:3px 8px;white-space:nowrap}

.main{max-width:1000px;margin:0 auto;padding:24px 20px}

.hero-card{background:#0F1117;border:1px solid #252836;border-radius:14px;padding:24px 28px;margin-bottom:20px;position:relative;overflow:hidden}
.hero-accent{position:absolute;top:0;left:0;right:0;height:2px}
.hero-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap}
.hero-name{font-family:'Cinzel',serif;font-size:24px;font-weight:700}
.hero-subtitle{font-size:12px;color:#6B7280;margin-top:4px;letter-spacing:2px;text-transform:uppercase}
.hero-stats{display:flex;gap:20px;flex-wrap:wrap}
.hero-stat{text-align:center}
.hero-stat-val{font-family:'Cinzel',serif;font-size:22px;font-weight:700}
.hero-stat-lbl{font-size:11px;color:#6B7280;letter-spacing:1px;text-transform:uppercase;margin-top:2px}
.xp-track{background:#1C1F2A;border-radius:99px;height:12px;overflow:hidden;border:1px solid #2E3347}
.xp-fill{height:100%;border-radius:99px;transition:width .7s cubic-bezier(.4,0,.2,1)}

.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:640px){.grid-2{grid-template-columns:1fr}.hero-top{flex-direction:column}.xp-bar-mini,.xp-num{display:none}}

.panel{background:#0F1117;border:1px solid #252836;border-radius:12px;overflow:hidden;margin-bottom:16px}
.panel-head{padding:12px 16px;border-bottom:1px solid #252836;display:flex;align-items:center}
.panel-title{font-family:'Cinzel',serif;font-size:12px;font-weight:600;letter-spacing:1px;color:#E2E4ED}
.panel-badge{font-size:11px;background:#1C1F2A;border:1px solid #2E3347;color:#6B7280;padding:2px 8px;border-radius:99px}
.panel-action{background:none;border:none;color:#6B7280;cursor:pointer;font-size:12px;margin-left:auto}
.panel-action:hover{color:#A594F9}

.mission-row{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid #252836;transition:background .12s}
.mission-row:last-child{border-bottom:none}
.mission-row:hover{background:#161820}
.item-name{font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.item-name.done{text-decoration:line-through;color:#6B7280}
.item-sub{font-size:12px;color:#6B7280}
.type-badge{font-size:10px;padding:1px 6px;border-radius:4px;font-weight:600;letter-spacing:.5px}
.xp-badge{font-size:13px;font-weight:600;color:#6B7280;white-space:nowrap;flex-shrink:0}
.xp-badge.earned{color:#10B981}
.icon-btn{background:none;border:1px solid #2E3347;border-radius:6px;cursor:pointer;color:#6B7280;padding:2px 6px;font-size:12px;line-height:1.4;transition:all .15s}
.icon-btn:hover{border-color:#4B5563;color:#9CA3AF}
.icon-btn.del{border-color:rgba(239,68,68,.25);color:rgba(239,68,68,.6)}
.icon-btn.del:hover{border-color:#EF4444;color:#EF4444}

.circle{width:22px;height:22px;border-radius:50%;border:1.5px solid #2E3347;background:#1C1F2A;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;transition:all .2s}
.circle.done{background:#10B981;border-color:#10B981}
.checkmark{width:7px;height:11px;border:2px solid white;border-top:none;border-left:none;transform:rotate(45deg) translateY(-2px)}

.habit-row{display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid #252836}
.habit-row:last-child{border-bottom:none}
.streak{font-size:12px;color:#F59E0B;font-weight:600;white-space:nowrap}

.habits-head{display:flex;align-items:center;border-bottom:1px solid #252836}
.days-header{display:flex;gap:4px;padding:0 16px 0 0;margin-left:auto}
.day-lbl{width:26px;height:44px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600}
.habit-full-row{display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid #252836}
.habit-full-row:last-child{border-bottom:none}
.days-row{display:flex;gap:4px}
.day-btn{width:26px;height:26px;border-radius:6px;border:1px solid #2E3347;background:#1C1F2A;color:#6B7280;font-size:10px;font-weight:600;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center}
.day-btn:hover{border-color:#7C6AE8;color:#A594F9}
.day-btn.checked{background:#7C6AE8;border-color:#7C6AE8;color:white}
.day-btn.today{border-color:#F59E0B}
.week-label{font-size:11px;background:#1C1F2A;border:1px solid #2E3347;color:#6B7280;padding:4px 10px;border-radius:6px}

.achieve-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:12px}
.achieve-card{border:1px solid;border-radius:10px;padding:14px;position:relative;overflow:hidden;cursor:pointer;transition:transform .15s}
.achieve-card:hover{transform:translateY(-2px)}
.achieve-card.locked{opacity:.4;filter:grayscale(1)}
.achieve-overlay{position:absolute;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s;font-size:12px;font-weight:600;color:white;letter-spacing:1px}
.achieve-card.locked:hover .achieve-overlay{opacity:1}

.tabs{display:flex;gap:4px;margin-bottom:16px;background:#0F1117;border:1px solid #252836;border-radius:10px;padding:4px;width:fit-content}
.tab-btn{background:none;border:none;color:#6B7280;cursor:pointer;font-size:12px;font-weight:600;padding:5px 14px;border-radius:7px;letter-spacing:.5px;text-transform:uppercase;transition:all .15s}
.tab-btn.active{background:#7C6AE8;color:white}

.section-title{font-family:'Cinzel',serif;font-size:16px;font-weight:600;letter-spacing:1px}
.section-sub{font-size:13px;color:#6B7280;margin-top:3px}

.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:11px 22px;border-radius:10px;font-size:14px;font-weight:600;z-index:9999;white-space:nowrap;letter-spacing:.5px;border:1px solid;animation:slideUp .3s cubic-bezier(.34,1.56,.64,1)}
@keyframes slideUp{from{transform:translateX(-50%) translateY(20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
.toast-xp{background:#0D1F1A;border-color:#10B981;color:#34D399}
.toast-level{background:#1A0E2B;border-color:#7C6AE8;color:#A594F9}
.toast-achieve{background:#1F1600;border-color:#D97706;color:#FCD34D}
.table-row:hover{background:#161820}.table-row:last-child{border-bottom:none!important}
`

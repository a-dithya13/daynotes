
import { useState, useEffect, useRef } from "react";
 
const HOURS = Array.from({ length: 24 }, (_, i) => i);
 
function formatHour(h) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}
 
function getDayKey(date) {
  return date.toISOString().split("T")[0];
}
 
function getWeekDays(anchor) {
  const d = new Date(anchor);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return dd;
  });
}
 
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES_SHORT = ["M", "T", "W", "T", "F", "S", "S"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const COLORS = ["#4f8ef7","#f7824f","#a64ff7","#4ff7a6","#f7d44f","#f74f8e","#4fc8f7"];
 
function useIsMobile() {
  const [mobile, setMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 700 : false);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 700);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}
 
export default function App() {
  const today = new Date();
  const isMobile = useIsMobile();
  const [anchor, setAnchor] = useState(new Date(today));
  const [selectedDay, setSelectedDay] = useState(getDayKey(today));
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dnotes3") || "{}"); } catch { return {}; }
  });
  const [newNote, setNewNote] = useState({ hour: today.getHours(), text: "" });
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileTab, setMobileTab] = useState("calendar");
  const [showAddModal, setShowAddModal] = useState(false);
  const gridRef = useRef(null);
 
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
 
  useEffect(() => {
    localStorage.setItem("dnotes3", JSON.stringify(notes));
  }, [notes]);
 
  useEffect(() => {
    if (gridRef.current) {
      const h = today.getHours();
      gridRef.current.scrollTop = Math.max(0, (h - 2) * (isMobile ? 56 : 64));
    }
  }, [selectedDay, isMobile]);
 
  const weekDays = getWeekDays(anchor);
 
  function prevWeek() { const d = new Date(anchor); d.setDate(d.getDate() - 7); setAnchor(d); }
  function nextWeek() { const d = new Date(anchor); d.setDate(d.getDate() + 7); setAnchor(d); }
  function goToday() { setAnchor(new Date(today)); setSelectedDay(getDayKey(today)); }
 
  const dayNotes = notes[selectedDay] || [];
 
  function addNote() {
    if (!newNote.text.trim()) return;
    const updated = [...dayNotes, {
      id: Date.now(), hour: newNote.hour, minute: new Date().getMinutes(),
      text: newNote.text.trim(), color: COLORS[dayNotes.length % COLORS.length],
      created: new Date().toISOString()
    }].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
    setNotes({ ...notes, [selectedDay]: updated });
    setNewNote({ hour: newNote.hour, text: "" });
    setShowAddModal(false);
  }
 
  function deleteNote(id) {
    setNotes({ ...notes, [selectedDay]: dayNotes.filter(n => n.id !== id) });
  }
 
  function saveEdit(id) {
    setNotes({ ...notes, [selectedDay]: dayNotes.map(n => n.id === id ? { ...n, text: editText } : n) });
    setEditingId(null);
  }
 
  const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const isToday = selectedDay === getDayKey(today);
  const selDate = new Date(selectedDay + "T12:00:00");
  const ROW_H = isMobile ? 56 : 64;
 
  const sharedStyles = `
    * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #1e2540; border-radius: 3px; }
    button:hover { opacity: 0.82; }
    textarea:focus, select:focus, input:focus { border-color: #4f8ef750 !important; }
  `;
 
  // ── WEEK STRIP (shared) ──────────────────────────────────────────
  const WeekStrip = () => (
    <div style={{ display: "flex", borderBottom: "1px solid #1e2130", background: "#13161f", flexShrink: 0 }}>
      {!isMobile && <div style={{ width: 64, flexShrink: 0 }} />}
      {weekDays.map((d, i) => {
        const key = getDayKey(d);
        const isSel = key === selectedDay;
        const isTod = key === getDayKey(today);
        const cnt = (notes[key] || []).length;
        return (
          <div key={key} onClick={() => { setSelectedDay(key); setMobileTab("calendar"); }}
            style={{
              flex: 1, textAlign: "center", padding: isMobile ? "8px 2px 6px" : "10px 4px 8px",
              cursor: "pointer", background: isSel ? "#1a2040" : "transparent",
              borderBottom: isSel ? "2px solid #4f8ef7" : "2px solid transparent", position: "relative"
            }}>
            <div style={{ fontSize: isMobile ? 10 : 11, color: isSel ? "#4f8ef7" : "#3a4060", fontWeight: 600, marginBottom: 3, letterSpacing: 0.5 }}>
              {isMobile ? DAY_NAMES_SHORT[i] : DAY_NAMES[i]}
            </div>
            <div style={{
              width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: "50%",
              background: isTod ? "linear-gradient(135deg,#4f8ef7,#a64ff7)" : "transparent",
              border: isSel && !isTod ? "1px solid #4f8ef760" : "none",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
              fontWeight: isTod || isSel ? 600 : 400, fontSize: isMobile ? 13 : 14,
              color: isTod ? "#fff" : isSel ? "#a0b4f0" : "#8892b0"
            }}>{d.getDate()}</div>
            {cnt > 0 && (
              <div style={{ position: "absolute", bottom: isMobile ? 2 : 4, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 2 }}>
                {Array.from({ length: Math.min(cnt, 3) }).map((_, j) => (
                  <div key={j} style={{ width: isMobile ? 3 : 4, height: isMobile ? 3 : 4, borderRadius: "50%", background: COLORS[j % COLORS.length], opacity: 0.85 }} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
 
  // ── TIME GRID (shared) ───────────────────────────────────────────
  const TimeGrid = () => (
    <div ref={gridRef} style={{ flex: 1, overflowY: "auto", position: "relative", background: "#0f1117" }}>
      {isToday && (
        <div style={{
          position: "absolute", left: isMobile ? 52 : 64, right: 0,
          top: nowMinutes * (ROW_H / 60), height: 2,
          background: "#4ff7a6", boxShadow: "0 0 8px #4ff7a6aa", zIndex: 10, pointerEvents: "none"
        }}>
          <div style={{ position: "absolute", left: -5, top: -4, width: 10, height: 10, borderRadius: "50%", background: "#4ff7a6", boxShadow: "0 0 8px #4ff7a6" }} />
        </div>
      )}
      {HOURS.map(h => {
        const slotNotes = dayNotes.filter(n => n.hour === h);
        return (
          <div key={h} style={{ display: "flex", height: ROW_H, borderBottom: "1px solid #1a1f2e" }}>
            <div style={{ width: isMobile ? 52 : 64, flexShrink: 0, paddingTop: 5, paddingRight: isMobile ? 6 : 10, textAlign: "right", fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#2a3050", userSelect: "none" }}>
              {formatHour(h)}
            </div>
            <div style={{ flex: 1, padding: "3px 6px", display: "flex", flexDirection: "column", gap: 2 }}>
              {slotNotes.map(note => (
                <div key={note.id} style={{
                  background: note.color + "18", border: `1px solid ${note.color}40`,
                  borderLeft: `3px solid ${note.color}`, borderRadius: 5,
                  padding: "3px 8px", fontSize: isMobile ? 12 : 12,
                  display: "flex", alignItems: "center", gap: 6, minHeight: 22
                }}>
                  {editingId === note.id ? (
                    <input autoFocus value={editText} onChange={e => setEditText(e.target.value)}
                      onBlur={() => saveEdit(note.id)}
                      onKeyDown={e => { if (e.key === "Enter") saveEdit(note.id); if (e.key === "Escape") setEditingId(null); }}
                      style={{ flex: 1, background: "transparent", border: "none", color: "#e8eaf0", fontSize: 12, outline: "none", fontFamily: "inherit" }} />
                  ) : (
                    <span style={{ flex: 1, color: "#c5cce0" }} onDoubleClick={() => { setEditingId(note.id); setEditText(note.text); }}>{note.text}</span>
                  )}
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {!isMobile && <span style={{ fontSize: 10, color: "#3a4060", fontFamily: "'DM Mono', monospace" }}>{String(note.hour).padStart(2,"0")}:{String(note.minute||0).padStart(2,"0")}</span>}
                    <button onClick={() => deleteNote(note.id)} style={{ background: "none", border: "none", color: "#f74f8e88", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
 
  // ── ADD MODAL ────────────────────────────────────────────────────
  const AddModal = () => (
    <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center" }}
      onClick={() => setShowAddModal(false)}>
      <div onClick={e => e.stopPropagation()} style={{
        width: isMobile ? "100%" : 360, background: "#13161f",
        borderRadius: isMobile ? "20px 20px 0 0" : 16,
        padding: isMobile ? "20px 20px 36px" : "24px",
        boxShadow: "0 -4px 40px #0009"
      }}>
        {isMobile && <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2a2f45", margin: "0 auto 18px" }} />}
        <div style={{ fontSize: 13, fontWeight: 600, color: "#4f8ef7", marginBottom: 14, letterSpacing: 0.5 }}>
          + NEW NOTE — {MONTH_SHORT[selDate.getMonth()].toUpperCase()} {selDate.getDate()}
        </div>
        <label style={{ fontSize: 11, color: "#3a4060", display: "block", marginBottom: 5 }}>TIME SLOT</label>
        <select value={newNote.hour} onChange={e => setNewNote({ ...newNote, hour: +e.target.value })}
          style={{ width: "100%", background: "#0f1117", border: "1px solid #1e2130", color: "#8892b0", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "'DM Mono', monospace", outline: "none", marginBottom: 12 }}>
          {HOURS.map(h => <option key={h} value={h}>{formatHour(h)}</option>)}
        </select>
        <label style={{ fontSize: 11, color: "#3a4060", display: "block", marginBottom: 5 }}>NOTE</label>
        <textarea autoFocus placeholder="What's on your mind?" value={newNote.text}
          onChange={e => setNewNote({ ...newNote, text: e.target.value })}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNote(); } }}
          rows={4}
          style={{ width: "100%", background: "#0f1117", border: "1px solid #1e2130", color: "#c5cce0", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "none", marginBottom: 14 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "11px", background: "#1a1f30", border: "1px solid #2a2f45", borderRadius: 9, color: "#8892b0", fontWeight: 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={addNote} style={{ flex: 2, padding: "11px", background: "linear-gradient(135deg,#4f8ef7,#a64ff7)", border: "none", borderRadius: 9, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Add Note</button>
        </div>
      </div>
    </div>
  );
 
  // ── MOBILE ───────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0f1117", color: "#e8eaf0", display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{sharedStyles}</style>
 
        {/* Mobile Header */}
        <div style={{ background: "#13161f", borderBottom: "1px solid #1e2130", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#4f8ef7,#a64ff7)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff" }}>D</div>
              <span style={{ fontWeight: 600, fontSize: 16 }}>DayNotes</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={goToday} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #2a2f45", background: "#1a1f30", color: "#b0b8d0", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Today</button>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ff7a6" }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#8892b0" }}>{currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          </div>
 
          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 10px" }}>
            <button onClick={prevWeek} style={{ ...mobileBtn, fontSize: 18 }}>‹</button>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#c5cce0" }}>{MONTH_SHORT[selDate.getMonth()]} {selDate.getFullYear()}</span>
            <button onClick={nextWeek} style={{ ...mobileBtn, fontSize: 18 }}>›</button>
          </div>
 
          <WeekStrip />
 
          {/* Tabs */}
          <div style={{ display: "flex", borderTop: "1px solid #1e2130" }}>
            {[["calendar", "⏱ Timeline"], ["notes", `📝 Notes (${dayNotes.length})`]].map(([tab, label]) => (
              <button key={tab} onClick={() => setMobileTab(tab)} style={{
                flex: 1, padding: "10px 0", background: "none", border: "none",
                borderBottom: mobileTab === tab ? "2px solid #4f8ef7" : "2px solid transparent",
                color: mobileTab === tab ? "#4f8ef7" : "#3a4060",
                fontSize: 12, fontWeight: 600, cursor: "pointer", letterSpacing: 0.5,
                textTransform: "uppercase", fontFamily: "inherit"
              }}>{label}</button>
            ))}
          </div>
        </div>
 
        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
          {mobileTab === "calendar" ? (
            <TimeGrid />
          ) : (
            <div style={{ padding: "16px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#3a4060", letterSpacing: 1, marginBottom: 12 }}>
                {DAY_NAMES[(selDate.getDay() + 6) % 7].toUpperCase()}, {MONTH_SHORT[selDate.getMonth()].toUpperCase()} {selDate.getDate()}
              </div>
              {dayNotes.length === 0 && <div style={{ textAlign: "center", color: "#2a3045", marginTop: 40, fontSize: 14 }}>No notes yet.<br />Tap + to add one!</div>}
              {dayNotes.map(note => (
                <div key={note.id} style={{ marginBottom: 10, padding: "12px 14px", background: note.color + "12", border: `1px solid ${note.color}30`, borderLeft: `3px solid ${note.color}`, borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: note.color }}>{formatHour(note.hour)}</span>
                    <button onClick={() => deleteNote(note.id)} style={{ background: "none", border: "none", color: "#f74f8e88", cursor: "pointer", fontSize: 16, padding: 0 }}>×</button>
                  </div>
                  {editingId === note.id ? (
                    <textarea autoFocus value={editText} onChange={e => setEditText(e.target.value)} onBlur={() => saveEdit(note.id)} rows={2}
                      style={{ width: "100%", background: "transparent", border: "none", color: "#c5cce0", fontSize: 13, outline: "none", fontFamily: "inherit", resize: "none" }} />
                  ) : (
                    <div style={{ fontSize: 13, color: "#b0b8d0", lineHeight: 1.5 }} onDoubleClick={() => { setEditingId(note.id); setEditText(note.text); }}>{note.text}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
 
        {/* FAB */}
        <button onClick={() => setShowAddModal(true)} style={{
          position: "fixed", bottom: 22, right: 18, width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg,#4f8ef7,#a64ff7)", border: "none", color: "#fff",
          fontSize: 26, cursor: "pointer", boxShadow: "0 4px 20px #4f8ef750",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
        }}>+</button>
 
        {showAddModal && <AddModal />}
      </div>
    );
  }
 
  // ── DESKTOP ──────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0f1117", color: "#e8eaf0", display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{sharedStyles}</style>
 
      {/* Desktop Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 24px", borderBottom: "1px solid #1e2130", background: "#13161f", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#4f8ef7,#a64ff7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff" }}>D</div>
          <span style={{ fontWeight: 600, fontSize: 17, letterSpacing: "-0.3px" }}>DayNotes</span>
        </div>
        <button onClick={goToday} style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid #2a2f45", background: "#1a1f30", color: "#b0b8d0", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Today</button>
        <div style={{ display: "flex", gap: 2 }}>
          <button onClick={prevWeek} style={deskBtn}>‹</button>
          <button onClick={nextWeek} style={deskBtn}>›</button>
        </div>
        <span style={{ fontSize: 15, fontWeight: 500, color: "#c5cce0" }}>{MONTH_NAMES[selDate.getMonth()]} {selDate.getFullYear()}</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ff7a6", boxShadow: "0 0 8px #4ff7a660" }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#8892b0" }}>{currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>
 
      <WeekStrip />
 
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <TimeGrid />
 
        {/* Sidebar */}
        <div style={{ width: 280, flexShrink: 0, background: "#13161f", borderLeft: "1px solid #1e2130", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid #1e2130" }}>
            <div style={{ fontSize: 12, color: "#3a4060", fontWeight: 500, letterSpacing: 1, marginBottom: 2 }}>{DAY_NAMES[(selDate.getDay() + 6) % 7].toUpperCase()}</div>
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-1px" }}>{selDate.getDate()}</div>
            <div style={{ fontSize: 13, color: "#556070" }}>{MONTH_NAMES[selDate.getMonth()]} {selDate.getFullYear()}</div>
          </div>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #1e2130" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#4f8ef7", letterSpacing: 1, marginBottom: 8 }}>+ NEW NOTE</div>
            <label style={{ fontSize: 11, color: "#3a4060", display: "block", marginBottom: 4 }}>TIME</label>
            <select value={newNote.hour} onChange={e => setNewNote({ ...newNote, hour: +e.target.value })}
              style={{ width: "100%", background: "#0f1117", border: "1px solid #1e2130", color: "#8892b0", borderRadius: 6, padding: "6px 10px", fontSize: 12, fontFamily: "'DM Mono', monospace", outline: "none", cursor: "pointer", marginBottom: 8 }}>
              {HOURS.map(h => <option key={h} value={h}>{formatHour(h)}</option>)}
            </select>
            <textarea placeholder="Write your note..." value={newNote.text}
              onChange={e => setNewNote({ ...newNote, text: e.target.value })}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNote(); } }}
              rows={3}
              style={{ width: "100%", background: "#0f1117", border: "1px solid #1e2130", color: "#c5cce0", borderRadius: 6, padding: "8px 10px", fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "none" }} />
            <button onClick={addNote} style={{ marginTop: 8, width: "100%", padding: "9px", background: "linear-gradient(135deg,#4f8ef7,#a64ff7)", border: "none", borderRadius: 7, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 12px #4f8ef730" }}>Add Note</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#3a4060", letterSpacing: 1, marginBottom: 10 }}>ALL NOTES — {dayNotes.length}</div>
            {dayNotes.length === 0 && <div style={{ color: "#2a3045", fontSize: 13, textAlign: "center", marginTop: 30 }}>No notes for this day.<br />Add one above ↑</div>}
            {dayNotes.map(note => (
              <div key={note.id} style={{ marginBottom: 8, padding: "10px 12px", background: note.color + "12", border: `1px solid ${note.color}30`, borderLeft: `3px solid ${note.color}`, borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: note.color, marginBottom: 4, display: "block" }}>{formatHour(note.hour)}</span>
                  <button onClick={() => deleteNote(note.id)} style={{ background: "none", border: "none", color: "#f74f8e66", cursor: "pointer", fontSize: 14, padding: 0 }}>×</button>
                </div>
                <div style={{ fontSize: 12, color: "#b0b8d0", lineHeight: 1.5 }} onDoubleClick={() => { setEditingId(note.id); setEditText(note.text); }}>{note.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
 
      {showAddModal && <AddModal />}
    </div>
  );
}
 
const mobileBtn = { width: 28, height: 28, borderRadius: 6, border: "1px solid #2a2f45", background: "#1a1f30", color: "#8892b0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontFamily: "inherit" };
const deskBtn = { width: 30, height: 30, borderRadius: 6, border: "1px solid #2a2f45", background: "#1a1f30", color: "#8892b0", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 };
 

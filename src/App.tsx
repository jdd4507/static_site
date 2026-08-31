import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Filter, MapPin, Plus, Search, ShieldCheck, Users, X } from "lucide-react";

type AssignmentType = "Work" | "On Call" | "Training" | "OOF";
type Priority = "Normal" | "High" | "Emergency";
type ViewMode = "Month" | "Agenda";

type Technician = { id: string; name: string; initials: string; color: string };
type Assignment = { id: number; title: string; technicianId: string; type: AssignmentType; date: string; start: string; end: string; location: string; priority: Priority };
type AssignmentForm = Omit<Assignment, "id">;

const technicians: Technician[] = [
  { id: "james", name: "James Danley", initials: "JD", color: "#0F6CBD" },
  { id: "jason", name: "Jason Bartlett", initials: "JB", color: "#107C10" },
  { id: "jake", name: "Jake Binder", initials: "JB", color: "#8764B8" },
  { id: "dario", name: "Dario Nila", initials: "DN", color: "#D83B01" },
  { id: "hector", name: "Hector Garza", initials: "HG", color: "#008272" },
];

const typeStyles: Record<AssignmentType, string> = {
  Work: "bg-blue-50 text-blue-800 border-blue-200",
  "On Call": "bg-amber-50 text-amber-800 border-amber-200",
  Training: "bg-violet-50 text-violet-800 border-violet-200",
  OOF: "bg-slate-100 text-slate-700 border-slate-200",
};
const assignmentTypes = Object.keys(typeStyles) as AssignmentType[];
const pad = (value: number) => String(value).padStart(2, "0");
const toDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const personById = (id: string) => technicians.find((person) => person.id === id);
const today = new Date();
const todayKey = toDateKey(today);
const initialForm = (): AssignmentForm => ({ title: "", technicianId: "james", type: "Work", date: todayKey, start: "07:00", end: "15:30", location: "", priority: "Normal" });
const seedAssignments: Assignment[] = [
  { id: 1, title: "Microwave path survey", technicianId: "james", type: "Work", date: todayKey, start: "07:00", end: "15:30", location: "Mt Spokane", priority: "High" },
  { id: 2, title: "Fiber acceptance testing", technicianId: "jason", type: "Work", date: toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)), start: "08:00", end: "14:00", location: "Spokane", priority: "Normal" },
  { id: 3, title: "Radio system training", technicianId: "dario", type: "Training", date: toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2)), start: "09:00", end: "12:00", location: "Telecom Shop", priority: "Normal" },
  { id: 4, title: "Primary on-call", technicianId: "jake", type: "On Call", date: toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3)), start: "00:00", end: "23:59", location: "Region", priority: "High" },
  { id: 5, title: "Busy", technicianId: "hector", type: "OOF", date: toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4)), start: "07:00", end: "15:30", location: "Private", priority: "Normal" },
];

function loadAssignments(): Assignment[] {
  try { const saved = localStorage.getItem("comm-shop-assignments"); return saved ? JSON.parse(saved) as Assignment[] : seedAssignments; }
  catch { return seedAssignments; }
}

export default function App() {
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [assignments, setAssignments] = useState<Assignment[]>(loadAssignments);
  const [selectedPeople, setSelectedPeople] = useState<string[]>(technicians.map((p) => p.id));
  const [selectedTypes, setSelectedTypes] = useState<AssignmentType[]>(assignmentTypes);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("Month");
  const [showForm, setShowForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [form, setForm] = useState<AssignmentForm>(initialForm);

  useEffect(() => localStorage.setItem("comm-shop-assignments", JSON.stringify(assignments)), [assignments]);

  const filtered = useMemo(() => assignments.filter((item) => {
    const haystack = `${item.title} ${item.location} ${personById(item.technicianId)?.name ?? ""}`.toLowerCase();
    return selectedPeople.includes(item.technicianId) && selectedTypes.includes(item.type) && haystack.includes(query.toLowerCase());
  }), [assignments, selectedPeople, selectedTypes, query]);

  const firstDay = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const firstCalendarDay = new Date(firstDay);
  firstCalendarDay.setDate(1 - firstDay.getDay());
  const days = Array.from({ length: 42 }, (_, index) => new Date(firstCalendarDay.getFullYear(), firstCalendarDay.getMonth(), firstCalendarDay.getDate() + index));
  const monthPrefix = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}`;
  const monthAssignments = filtered.filter((item) => item.date.startsWith(monthPrefix));
  const stats = { visible: monthAssignments.length, onCall: monthAssignments.filter((x) => x.type === "On Call").length, training: monthAssignments.filter((x) => x.type === "Training").length };

  const togglePerson = (id: string) => setSelectedPeople((values) => values.includes(id) ? values.filter((x) => x !== id) : [...values, id]);
  const toggleType = (type: AssignmentType) => setSelectedTypes((values) => values.includes(type) ? values.filter((x) => x !== type) : [...values, type]);
  const moveMonth = (change: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + change, 1));
  const saveAssignment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.end <= form.start) { alert("End time must be after start time."); return; }
    setAssignments((items) => [...items, { ...form, id: Date.now() }]);
    setShowForm(false); setForm(initialForm());
  };
  const deleteAssignment = (id: number) => { setAssignments((items) => items.filter((x) => x.id !== id)); setSelectedAssignment(null); };

  return <div className="min-h-screen bg-[#f5f7fa] text-slate-900">
    <header className="bg-[#0b3b60] text-white shadow-lg"><div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-6 py-5">
      <div className="flex items-center gap-4"><div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/20"><CalendarDays className="h-7 w-7" /></div><div><h1 className="text-2xl font-bold tracking-tight">Comm Shop Scheduling Hub</h1><p className="mt-1 text-sm text-blue-100">Team assignments, availability, and field coverage</p></div></div>
      <div className="hidden items-center gap-2 rounded-full bg-emerald-400/15 px-4 py-2 text-sm text-emerald-100 ring-1 ring-emerald-300/25 md:flex"><ShieldCheck className="h-4 w-4" />Privacy mode on</div>
    </div></header>

    <main className="mx-auto max-w-[1600px] px-4 py-6 lg:px-6">
      <section className="mb-5 grid gap-4 sm:grid-cols-3">{[
        { label: "Visible assignments", value: stats.visible, Icon: CalendarDays }, { label: "On call", value: stats.onCall, Icon: Clock3 }, { label: "Training", value: stats.training, Icon: Users }
      ].map(({ label, value, Icon }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p></div><div className="rounded-xl bg-blue-50 p-3 text-blue-700"><Icon className="h-5 w-5" /></div></div></div>)}</section>

      <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 flex items-center gap-2"><Filter className="h-4 w-4 text-slate-500" /><h2 className="font-semibold">Technicians</h2></div><div className="space-y-2">{technicians.map((person) => <label key={person.id} className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-slate-50"><input type="checkbox" checked={selectedPeople.includes(person.id)} onChange={() => togglePerson(person.id)} className="h-4 w-4 rounded" /><span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: person.color }}>{person.initials}</span><span className="text-sm font-medium">{person.name}</span></label>)}</div></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="mb-3 font-semibold">Assignment type</h2><div className="space-y-2">{assignmentTypes.map((type) => <label key={type} className="flex cursor-pointer items-center gap-3 p-1.5 text-sm"><input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => toggleType(type)} className="h-4 w-4 rounded" /><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${typeStyles[type]}`}>{type}</span></label>)}</div></div>
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900"><div className="mb-2 flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" />Privacy protection</div><p className="leading-6">Shared views show only Busy or OOF for private calendar items. Subjects and details stay private.</p></div>
        </aside>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2"><button onClick={() => moveMonth(-1)} aria-label="Previous month" className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50"><ChevronLeft /></button><button onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Today</button><button onClick={() => moveMonth(1)} aria-label="Next month" className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50"><ChevronRight /></button><h2 className="ml-2 text-xl font-bold">{cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2></div>
            <div className="flex flex-wrap items-center gap-2"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search schedule" className="w-52 rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div><div className="flex rounded-xl bg-slate-100 p-1">{(["Month", "Agenda"] as ViewMode[]).map((item) => <button key={item} onClick={() => setView(item)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${view === item ? "bg-white shadow-sm" : "text-slate-500"}`}>{item}</button>)}</div><button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl bg-[#0f6cbd] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115ea3]"><Plus className="h-4 w-4" />Add assignment</button></div>
          </div>

          {view === "Month" ? <div className="overflow-x-auto"><div className="min-w-[900px]"><div className="grid grid-cols-7 border-b bg-slate-50">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day) => <div key={day} className="px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-slate-500">{day}</div>)}</div><div className="grid grid-cols-7">{days.map((date) => { const key = toDateKey(date); const items = filtered.filter((x) => x.date === key); const current = date.getMonth() === cursor.getMonth(); return <div key={key} className={`min-h-32 border-b border-r border-slate-200 p-2 ${current ? "bg-white" : "bg-slate-50/70"}`}><div className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${key === todayKey ? "bg-blue-600 text-white" : current ? "text-slate-700" : "text-slate-400"}`}>{date.getDate()}</div><div className="space-y-1.5">{items.map((item) => { const person = personById(item.technicianId); return <button key={item.id} onClick={() => setSelectedAssignment(item)} className={`w-full rounded-lg border p-2 text-left text-xs transition hover:-translate-y-0.5 hover:shadow-sm ${typeStyles[item.type]}`}><div className="truncate font-bold">{item.title}</div><div className="mt-1 flex items-center gap-1 opacity-80"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: person?.color }} />{person?.name.split(" ")[0]} · {item.start}</div></button>})}</div></div>})}</div></div></div>
          : <div className="divide-y divide-slate-100 p-4">{[...filtered].sort((a,b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)).map((item) => { const person = personById(item.technicianId); return <button key={item.id} onClick={() => setSelectedAssignment(item)} className="flex w-full items-center gap-4 rounded-xl p-4 text-left hover:bg-slate-50"><div className="w-16 text-center"><div className="text-xs font-bold uppercase text-slate-400">{new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", { month: "short" })}</div><div className="text-2xl font-bold">{Number(item.date.slice(-2))}</div></div><div className="h-10 w-1 rounded-full" style={{ backgroundColor: person?.color }} /><div className="flex-1"><div className="font-bold">{item.title}</div><div className="mt-1 text-sm text-slate-500">{person?.name} · {item.start} to {item.end} · {item.location}</div></div><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${typeStyles[item.type]}`}>{item.type}</span></button>})}</div>}
        </section>
      </div>
    </main>

    <AnimatePresence>
      {showForm && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={() => setShowForm(false)}><motion.form initial={{ scale: .96, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .96, y: 16 }} onSubmit={saveAssignment} onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-bold">Add work assignment</h2><p className="mt-1 text-sm text-slate-500">Create a schedule item for the team.</p></div><button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-2 hover:bg-slate-100"><X /></button></div><div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2 text-sm font-semibold">Title<input required value={form.title} onChange={(e) => setForm({...form,title:e.target.value})} className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 font-normal" /></label>
        <label className="text-sm font-semibold">Technician<select value={form.technicianId} onChange={(e) => setForm({...form,technicianId:e.target.value})} className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 font-normal">{technicians.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label className="text-sm font-semibold">Type<select value={form.type} onChange={(e) => setForm({...form,type:e.target.value as AssignmentType})} className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 font-normal">{assignmentTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label className="text-sm font-semibold">Date<input required type="date" value={form.date} onChange={(e) => setForm({...form,date:e.target.value})} className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 font-normal" /></label>
        <label className="text-sm font-semibold">Location<input required value={form.location} onChange={(e) => setForm({...form,location:e.target.value})} className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 font-normal" /></label>
        <label className="text-sm font-semibold">Start<input required type="time" value={form.start} onChange={(e) => setForm({...form,start:e.target.value})} className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 font-normal" /></label>
        <label className="text-sm font-semibold">End<input required type="time" value={form.end} onChange={(e) => setForm({...form,end:e.target.value})} className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 font-normal" /></label>
        <label className="text-sm font-semibold">Priority<select value={form.priority} onChange={(e) => setForm({...form,priority:e.target.value as Priority})} className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 font-normal"><option>Normal</option><option>High</option><option>Emergency</option></select></label>
      </div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Cancel</button><button className="rounded-xl bg-[#0f6cbd] px-4 py-2 text-sm font-semibold text-white">Save assignment</button></div></motion.form></motion.div>}

      {selectedAssignment && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-end justify-end bg-slate-950/20 p-4" onMouseDown={() => setSelectedAssignment(null)}><motion.div initial={{ x: 30 }} animate={{ x: 0 }} exit={{ x: 30 }} onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${typeStyles[selectedAssignment.type]}`}>{selectedAssignment.type}</span><h2 className="mt-4 text-2xl font-bold">{selectedAssignment.title}</h2></div><button onClick={() => setSelectedAssignment(null)} className="rounded-lg p-2 hover:bg-slate-100"><X /></button></div><div className="mt-6 space-y-4 text-sm"><div className="flex items-center gap-3"><Users className="text-slate-400" />{personById(selectedAssignment.technicianId)?.name}</div><div className="flex items-center gap-3"><CalendarDays className="text-slate-400" />{new Date(`${selectedAssignment.date}T12:00:00`).toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" })}</div><div className="flex items-center gap-3"><Clock3 className="text-slate-400" />{selectedAssignment.start} to {selectedAssignment.end}</div><div className="flex items-center gap-3"><MapPin className="text-slate-400" />{selectedAssignment.location}</div></div><button onClick={() => deleteAssignment(selectedAssignment.id)} className="mt-6 w-full rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Delete assignment</button></motion.div></motion.div>}
    </AnimatePresence>
  </div>;
}

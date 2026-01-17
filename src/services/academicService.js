import { hasSupabaseConfig, supabase } from "../lib/supabaseClient";

function ensureSupabase() {
  if (!hasSupabaseConfig || !supabase) {
    throw new Error("Supabase nao configurado. Verifique o .env.");
  }
}

function handleResponse(result) {
  if (result.error) {
    throw result.error;
  }
  return result.data;
}

export async function fetchSemesters() {
  ensureSupabase();
  const result = await supabase
    .from("semesters")
    .select("id,name,focus,created_at")
    .order("created_at", { ascending: true });
  return handleResponse(result);
}

export async function fetchClasses() {
  ensureSupabase();
  const result = await supabase
    .from("classes")
    .select("id,semester_id,title,teacher,schedule,created_at")
    .order("created_at", { ascending: true });
  return handleResponse(result);
}

export async function fetchNotes() {
  ensureSupabase();
  const result = await supabase
    .from("notes")
    .select("id,topic,detail,tag,created_at,class:classes(id,title)")
    .order("created_at", { ascending: false });
  return handleResponse(result);
}

export async function fetchActivities() {
  ensureSupabase();
  const result = await supabase
    .from("activities")
    .select("id,title,due_date,status,created_at,class:classes(id,title)")
    .order("created_at", { ascending: false });
  return handleResponse(result);
}

export async function fetchAgendaItems() {
  ensureSupabase();
  const result = await supabase
    .from("agenda_items")
    .select("id,type,title,date,time,created_at,class:classes(id,title)")
    .order("date", { ascending: true });
  return handleResponse(result);
}

export async function fetchExams() {
  ensureSupabase();
  const result = await supabase
    .from("exams")
    .select("id,exam,grade,max,created_at,class:classes(id,title)")
    .order("created_at", { ascending: false });
  return handleResponse(result);
}

export async function fetchAttendance() {
  ensureSupabase();
  const result = await supabase
    .from("attendance")
    .select("id,date,status,created_at,class:classes(id,title)")
    .order("date", { ascending: false });
  return handleResponse(result);
}

export async function addSemester({ name, focus }) {
  ensureSupabase();
  const result = await supabase
    .from("semesters")
    .insert({ name, focus })
    .select()
    .single();
  return handleResponse(result);
}

export async function addClass({ semesterId, title, teacher, schedule }) {
  ensureSupabase();
  const result = await supabase
    .from("classes")
    .insert({ semester_id: semesterId, title, teacher, schedule })
    .select()
    .single();
  return handleResponse(result);
}

export async function addNote({ classId, topic, detail, tag }) {
  ensureSupabase();
  const result = await supabase
    .from("notes")
    .insert({ class_id: classId, topic, detail, tag })
    .select("id,topic,detail,tag,created_at,class:classes(id,title)")
    .single();
  return handleResponse(result);
}

export async function addActivity({ classId, title, dueDate, status }) {
  ensureSupabase();
  const result = await supabase
    .from("activities")
    .insert({ class_id: classId, title, due_date: dueDate, status })
    .select("id,title,due_date,status,created_at,class:classes(id,title)")
    .single();
  return handleResponse(result);
}

export async function addAgendaItem({ classId, type, title, date, time }) {
  ensureSupabase();
  const result = await supabase
    .from("agenda_items")
    .insert({ class_id: classId || null, type, title, date, time })
    .select("id,type,title,date,time,created_at,class:classes(id,title)")
    .single();
  return handleResponse(result);
}

export async function addExam({ classId, exam, grade, max }) {
  ensureSupabase();
  const result = await supabase
    .from("exams")
    .insert({ class_id: classId, exam, grade, max })
    .select("id,exam,grade,max,created_at,class:classes(id,title)")
    .single();
  return handleResponse(result);
}

export async function addAttendance({ classId, date, status }) {
  ensureSupabase();
  const result = await supabase
    .from("attendance")
    .insert({ class_id: classId, date, status })
    .select("id,date,status,created_at,class:classes(id,title)")
    .single();
  return handleResponse(result);
}

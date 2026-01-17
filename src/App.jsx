import { useMemo, useState, useEffect } from "react";
import {
  addActivity,
  addAgendaItem,
  addAttendance,
  addClass,
  addExam,
  addNote,
  addSemester,
  fetchActivities,
  fetchAgendaItems,
  fetchAttendance,
  fetchClasses,
  fetchExams,
  fetchNotes,
  fetchSemesters,
} from "./services/academicService";
import { hasSupabaseConfig } from "./lib/supabaseClient";

const quickTips = [
  "Defina metas pequenas por semana para cada disciplina.",
  "Separe um bloco fixo de estudo para revisao rapida.",
  "Centralize materiais importantes e links de apoio.",
  "Acompanhe frequencia para evitar surpresas no semestre.",
];

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [semesters, setSemesters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState(null);
  const [newSemester, setNewSemester] = useState({ name: "", focus: "" });
  const [newClass, setNewClass] = useState({ title: "", teacher: "", day: "", time: "" });
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ classId: "", topic: "", detail: "", tag: "comentario" });
  const [activities, setActivities] = useState([]);
  const [newActivity, setNewActivity] = useState({ classId: "", title: "", dueDate: "", status: "Planejado" });
  const [agenda, setAgenda] = useState([]);
  const [newAgenda, setNewAgenda] = useState({ type: "Aula", title: "", date: "", time: "", classId: "" });
  const [exams, setExams] = useState([]);
  const [newExam, setNewExam] = useState({ classId: "", exam: "", grade: "", max: "10" });
  const [attendance, setAttendance] = useState([]);
  const [newAttendance, setNewAttendance] = useState({ classId: "", date: "", status: "Presenca" });

  const classesBySemester = useMemo(() => {
    const map = new Map();
    classes.forEach((item) => {
      const list = map.get(item.semester_id) || [];
      list.push(item);
      map.set(item.semester_id, list);
    });
    return map;
  }, [classes]);

  const activeSemester = semesters.find((semester) => semester.id === selectedSemesterId);
  const activeSemesterClasses = selectedSemesterId ? classesBySemester.get(selectedSemesterId) || [] : [];
  const totalClasses = activeSemesterClasses.length;

  const attendanceRate = useMemo(() => {
    if (!attendance.length) return 0;
    const presentCount = attendance.filter((item) => item.status === "Presenca").length;
    return Math.round((presentCount / attendance.length) * 100);
  }, [attendance]);

  const averageGrade = useMemo(() => {
    if (!exams.length) return 0;
    const sum = exams.reduce((acc, item) => acc + Number(item.grade || 0), 0);
    return (sum / exams.length).toFixed(1);
  }, [exams]);

  useEffect(() => {
    async function loadData() {
      if (!hasSupabaseConfig) {
        setError("Supabase nao configurado. Preencha o .env antes de usar.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [
          semestersData,
          classesData,
          notesData,
          activitiesData,
          agendaData,
          examsData,
          attendanceData,
        ] = await Promise.all([
          fetchSemesters(),
          fetchClasses(),
          fetchNotes(),
          fetchActivities(),
          fetchAgendaItems(),
          fetchExams(),
          fetchAttendance(),
        ]);

        setSemesters(semestersData);
        setClasses(classesData);
        setNotes(notesData);
        setActivities(activitiesData);
        setAgenda(agendaData);
        setExams(examsData);
        setAttendance(attendanceData);
        if (semestersData.length && !selectedSemesterId) {
          setSelectedSemesterId(semestersData[0].id);
        }
      } catch (loadError) {
        setError(loadError.message || "Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleSemesterSubmit(event) {
    event.preventDefault();
    if (!newSemester.name.trim()) return;
    try {
      const created = await addSemester({
        name: newSemester.name.trim(),
        focus: newSemester.focus.trim(),
      });
      setSemesters((prev) => [...prev, created]);
      setNewSemester({ name: "", focus: "" });
      if (!selectedSemesterId) {
        setSelectedSemesterId(created.id);
      }
    } catch (submitError) {
      setError(submitError.message || "Erro ao adicionar semestre.");
    }
  }

  async function handleClassSubmit(event) {
    event.preventDefault();
    if (!activeSemester || !newClass.title.trim()) return;
    if (!newClass.day || !newClass.time) return;
    try {
      const schedule = `${newClass.day} ${newClass.time}`;
      const created = await addClass({
        semesterId: activeSemester.id,
        title: newClass.title.trim(),
        teacher: newClass.teacher.trim(),
        schedule,
      });
      setClasses((prev) => [...prev, created]);
      setNewClass({ title: "", teacher: "", day: "", time: "" });
    } catch (submitError) {
      setError(submitError.message || "Erro ao adicionar disciplina.");
    }
  }

  async function handleNoteSubmit(event) {
    event.preventDefault();
    if (!newNote.classId || !newNote.detail.trim()) return;
    try {
      const created = await addNote({
        classId: newNote.classId,
        topic: newNote.topic.trim(),
        detail: newNote.detail.trim(),
        tag: newNote.tag,
      });
      setNotes((prev) => [created, ...prev]);
      setNewNote({ classId: "", topic: "", detail: "", tag: "comentario" });
    } catch (submitError) {
      setError(submitError.message || "Erro ao salvar comentario.");
    }
  }

  async function handleActivitySubmit(event) {
    event.preventDefault();
    if (!newActivity.classId || !newActivity.title.trim()) return;
    try {
      const created = await addActivity({
        classId: newActivity.classId,
        title: newActivity.title.trim(),
        dueDate: newActivity.dueDate,
        status: newActivity.status,
      });
      setActivities((prev) => [created, ...prev]);
      setNewActivity({ classId: "", title: "", dueDate: "", status: "Planejado" });
    } catch (submitError) {
      setError(submitError.message || "Erro ao adicionar atividade.");
    }
  }

  async function handleAgendaSubmit(event) {
    event.preventDefault();
    if (!newAgenda.title.trim() || !newAgenda.date) return;
    try {
      const created = await addAgendaItem({
        classId: newAgenda.classId,
        type: newAgenda.type,
        title: newAgenda.title.trim(),
        date: newAgenda.date,
        time: newAgenda.time,
      });
      setAgenda((prev) => [...prev, created]);
      setNewAgenda({ type: "Aula", title: "", date: "", time: "", classId: "" });
    } catch (submitError) {
      setError(submitError.message || "Erro ao adicionar evento.");
    }
  }

  async function handleExamSubmit(event) {
    event.preventDefault();
    if (!newExam.classId || !newExam.exam.trim()) return;
    try {
      const created = await addExam({
        classId: newExam.classId,
        exam: newExam.exam.trim(),
        grade: Number(newExam.grade || 0),
        max: Number(newExam.max || 10),
      });
      setExams((prev) => [created, ...prev]);
      setNewExam({ classId: "", exam: "", grade: "", max: "10" });
    } catch (submitError) {
      setError(submitError.message || "Erro ao adicionar nota.");
    }
  }

  async function handleAttendanceSubmit(event) {
    event.preventDefault();
    if (!newAttendance.classId || !newAttendance.date) return;
    try {
      const created = await addAttendance({
        classId: newAttendance.classId,
        date: newAttendance.date,
        status: newAttendance.status,
      });
      setAttendance((prev) => [created, ...prev]);
      setNewAttendance({ classId: "", date: "", status: "Presenca" });
    } catch (submitError) {
      setError(submitError.message || "Erro ao registrar frequencia.");
    }
  }

  const classOptions = classes.map((item) => (
    <option key={item.id} value={item.id}>
      {item.title}
    </option>
  ));

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark">GA</span>
          <div>
            <p className="brand__title">Gestao de Aulas</p>
            <p className="brand__subtitle">Vite + React + Supabase</p>
          </div>
        </div>
        <nav className="nav">
          <a href="#overview">Visao geral</a>
          <a href="#semesters">Semestres</a>
          <a href="#notes">Comentarios</a>
          <a href="#activities">Atividades</a>
          <a href="#agenda">Agenda</a>
          <a href="#exams">Provas & notas</a>
          <a href="#attendance">Frequencia</a>
        </nav>
        <div className="sidebar__card">
          <h3>Destaques</h3>
          <p>Frequencia atual</p>
          <strong>{attendanceRate}%</strong>
          <p>Media das notas</p>
          <strong>{averageGrade}</strong>
        </div>
      </aside>

      <main className="main">
        {(loading || error) && (
          <div className={`notice ${error ? "notice--error" : ""}`}>
            {error ? `Erro: ${error}` : "Carregando dados do Supabase..."}
          </div>
        )}
        <section className="hero" id="overview">
          <div className="hero__content">
            <p className="hero__eyebrow">Painel pessoal</p>
            <h1>Organize aulas, provas e atividades em um so lugar.</h1>
            <p className="hero__lead">
              Acompanhe semestres, registre duvidas, controle frequencia e mantenha a agenda alinhada com o ritmo da faculdade.
            </p>
            <div className="hero__stats">
              <div>
                <span>Semestre ativo</span>
                <strong>{activeSemester ? activeSemester.name : "-"}</strong>
              </div>
              <div>
                <span>Disciplinas</span>
                <strong>{totalClasses}</strong>
              </div>
              <div>
                <span>Atividades abertas</span>
                <strong>{activities.length}</strong>
              </div>
            </div>
          </div>
          <div className="hero__card">
            <h2>Prioridades da semana</h2>
            <ul>
              <li>Revisar conteudos chave antes das provas.</li>
              <li>Concluir atividades pendentes.</li>
              <li>Checar agenda e ajustes de horarios.</li>
            </ul>
            <div className="hero__progress">
              <div>
                <span>Progresso</span>
                <strong>68%</strong>
              </div>
              <div className="progress-bar">
                <span style={{ width: "68%" }} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid" id="semesters">
          <div className="panel">
            <div className="panel__header">
              <h2>Semestres</h2>
              <p>Cadastre semestres e defina o foco principal.</p>
            </div>
            <form className="form" onSubmit={handleSemesterSubmit}>
              <input
                type="text"
                placeholder="Nome do semestre"
                value={newSemester.name}
                onChange={(event) => setNewSemester({ ...newSemester, name: event.target.value })}
              />
              <input
                type="text"
                placeholder="Foco do semestre"
                value={newSemester.focus}
                onChange={(event) => setNewSemester({ ...newSemester, focus: event.target.value })}
              />
              <button type="submit">Adicionar semestre</button>
            </form>
            <div className="card-grid">
              {semesters.map((semester) => {
                const count = classesBySemester.get(semester.id)?.length || 0;
                return (
                  <button
                    key={semester.id}
                    className={`card ${semester.id === selectedSemesterId ? "card--active" : ""}`}
                    onClick={() => setSelectedSemesterId(semester.id)}
                    type="button"
                  >
                    <span>{semester.name}</span>
                    <strong>{semester.focus || "Sem foco definido"}</strong>
                    <small>{count} disciplinas</small>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <div className="panel__header">
              <h2>Disciplinas do semestre</h2>
              <p>Controle professores, horarios e distribuicao de carga.</p>
            </div>
            <form className="form" onSubmit={handleClassSubmit}>
              <input
                type="text"
                placeholder="Nome da disciplina"
                value={newClass.title}
                onChange={(event) => setNewClass({ ...newClass, title: event.target.value })}
              />
              <input
                type="text"
                placeholder="Professor"
                value={newClass.teacher}
                onChange={(event) => setNewClass({ ...newClass, teacher: event.target.value })}
              />
              <select
                value={newClass.day}
                onChange={(event) => setNewClass({ ...newClass, day: event.target.value })}
              >
                <option value="">Dia da semana</option>
                <option value="Seg">Segunda</option>
                <option value="Ter">Terca</option>
                <option value="Qua">Quarta</option>
                <option value="Qui">Quinta</option>
                <option value="Sex">Sexta</option>
                <option value="Sab">Sabado</option>
              </select>
              <select
                value={newClass.time}
                onChange={(event) => setNewClass({ ...newClass, time: event.target.value })}
              >
                <option value="">Horario</option>
                <option value="07:00">07:00</option>
                <option value="08:00">08:00</option>
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
                <option value="11:00">11:00</option>
                <option value="13:00">13:00</option>
                <option value="14:00">14:00</option>
                <option value="15:00">15:00</option>
                <option value="16:00">16:00</option>
                <option value="18:00">18:00</option>
                <option value="19:00">19:00</option>
                <option value="20:00">20:00</option>
                <option value="21:00">21:00</option>
              </select>
              <button type="submit" disabled={!activeSemester || !newClass.day || !newClass.time}>
                Adicionar disciplina
              </button>
            </form>
            <div className="list">
              {activeSemesterClasses.map((item) => (
                <div key={item.id} className="list__item">
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.teacher}</p>
                  </div>
                  <span>{item.schedule}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid" id="notes">
          <div className="panel">
            <div className="panel__header">
              <h2>Comentarios e duvidas</h2>
              <p>Registre percepcoes e pontos de atencao.</p>
            </div>
            <form className="form" onSubmit={handleNoteSubmit}>
              <select
                value={newNote.classId}
                onChange={(event) => setNewNote({ ...newNote, classId: event.target.value })}
                disabled={!classes.length}
              >
                <option value="">Selecione a disciplina</option>
                {classOptions}
              </select>
              <input
                type="text"
                placeholder="Topico"
                value={newNote.topic}
                onChange={(event) => setNewNote({ ...newNote, topic: event.target.value })}
              />
              <textarea
                placeholder="Comentario ou duvida"
                value={newNote.detail}
                onChange={(event) => setNewNote({ ...newNote, detail: event.target.value })}
              />
              <select
                value={newNote.tag}
                onChange={(event) => setNewNote({ ...newNote, tag: event.target.value })}
              >
                <option value="comentario">Comentario</option>
                <option value="duvida">Duvida</option>
                <option value="revisao">Revisao</option>
              </select>
              <button type="submit" disabled={!newNote.classId}>
                Salvar comentario
              </button>
            </form>
            <div className="stack">
              {notes.map((note) => (
                <div key={note.id} className="note">
                  <div>
                    <h3>{note.topic || "Observacao"}</h3>
                    <p className="note__meta">{note.class?.title || "Sem disciplina"} - {note.tag}</p>
                  </div>
                  <p>{note.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel" id="activities">
            <div className="panel__header">
              <h2>Atividades</h2>
              <p>Cadastre entregas e acompanhe status.</p>
            </div>
            <form className="form" onSubmit={handleActivitySubmit}>
              <select
                value={newActivity.classId}
                onChange={(event) => setNewActivity({ ...newActivity, classId: event.target.value })}
                disabled={!classes.length}
              >
                <option value="">Selecione a disciplina</option>
                {classOptions}
              </select>
              <input
                type="text"
                placeholder="Atividade"
                value={newActivity.title}
                onChange={(event) => setNewActivity({ ...newActivity, title: event.target.value })}
              />
              <input
                type="date"
                value={newActivity.dueDate}
                onChange={(event) => setNewActivity({ ...newActivity, dueDate: event.target.value })}
              />
              <select
                value={newActivity.status}
                onChange={(event) => setNewActivity({ ...newActivity, status: event.target.value })}
              >
                <option>Planejado</option>
                <option>Em andamento</option>
                <option>Concluido</option>
              </select>
              <button type="submit" disabled={!newActivity.classId}>
                Adicionar atividade
              </button>
            </form>
            <div className="list">
              {activities.map((activity) => (
                <div key={activity.id} className="list__item">
                  <div>
                    <h3>{activity.title}</h3>
                    <p>{activity.class?.title || "Sem disciplina"}</p>
                  </div>
                  <span>{activity.status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid" id="agenda">
          <div className="panel">
            <div className="panel__header">
              <h2>Agenda integrada</h2>
              <p>Inclua aulas, provas, entregas e lembretes.</p>
            </div>
            <form className="form" onSubmit={handleAgendaSubmit}>
              <select
                value={newAgenda.type}
                onChange={(event) => setNewAgenda({ ...newAgenda, type: event.target.value })}
              >
                <option>Aula</option>
                <option>Prova</option>
                <option>Entrega</option>
                <option>Estudo</option>
              </select>
              <select
                value={newAgenda.classId}
                onChange={(event) => setNewAgenda({ ...newAgenda, classId: event.target.value })}
                disabled={!classes.length}
              >
                <option value="">Sem disciplina</option>
                {classOptions}
              </select>
              <input
                type="text"
                placeholder="Titulo"
                value={newAgenda.title}
                onChange={(event) => setNewAgenda({ ...newAgenda, title: event.target.value })}
              />
              <input
                type="date"
                value={newAgenda.date}
                onChange={(event) => setNewAgenda({ ...newAgenda, date: event.target.value })}
              />
              <input
                type="time"
                value={newAgenda.time}
                onChange={(event) => setNewAgenda({ ...newAgenda, time: event.target.value })}
              />
              <button type="submit">Adicionar evento</button>
            </form>
            <div className="agenda">
              {agenda.map((item) => (
                <div key={item.id} className="agenda__item">
                  <span className={`badge badge--${item.type.toLowerCase()}`}>{item.type}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>
                      {item.date}
                      {item.time ? ` - ${item.time}` : ""}
                      {item.class?.title ? ` - ${item.class.title}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel" id="exams">
            <div className="panel__header">
              <h2>Provas e notas</h2>
              <p>Cadastre resultados e acompanhe desempenho.</p>
            </div>
            <form className="form" onSubmit={handleExamSubmit}>
              <select
                value={newExam.classId}
                onChange={(event) => setNewExam({ ...newExam, classId: event.target.value })}
                disabled={!classes.length}
              >
                <option value="">Selecione a disciplina</option>
                {classOptions}
              </select>
              <input
                type="text"
                placeholder="Tipo de prova"
                value={newExam.exam}
                onChange={(event) => setNewExam({ ...newExam, exam: event.target.value })}
              />
              <input
                type="number"
                step="0.1"
                placeholder="Nota"
                value={newExam.grade}
                onChange={(event) => setNewExam({ ...newExam, grade: event.target.value })}
              />
              <input
                type="number"
                step="0.1"
                placeholder="Max"
                value={newExam.max}
                onChange={(event) => setNewExam({ ...newExam, max: event.target.value })}
              />
              <button type="submit" disabled={!newExam.classId}>
                Adicionar nota
              </button>
            </form>
            <div className="table">
              <div className="table__row table__row--head">
                <span>Disciplina</span>
                <span>Avaliacao</span>
                <span>Nota</span>
              </div>
              {exams.map((exam) => (
                <div key={exam.id} className="table__row">
                  <span>{exam.class?.title || "Sem disciplina"}</span>
                  <span>{exam.exam}</span>
                  <span>
                    {exam.grade}/{exam.max}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid" id="attendance">
          <div className="panel">
            <div className="panel__header">
              <h2>Frequencia</h2>
              <p>Registre presencas e faltas para evitar surpresas.</p>
            </div>
            <form className="form" onSubmit={handleAttendanceSubmit}>
              <select
                value={newAttendance.classId}
                onChange={(event) => setNewAttendance({ ...newAttendance, classId: event.target.value })}
                disabled={!classes.length}
              >
                <option value="">Selecione a disciplina</option>
                {classOptions}
              </select>
              <input
                type="date"
                value={newAttendance.date}
                onChange={(event) => setNewAttendance({ ...newAttendance, date: event.target.value })}
              />
              <select
                value={newAttendance.status}
                onChange={(event) => setNewAttendance({ ...newAttendance, status: event.target.value })}
              >
                <option>Presenca</option>
                <option>Falta</option>
                <option>Justificada</option>
              </select>
              <button type="submit" disabled={!newAttendance.classId}>
                Registrar frequencia
              </button>
            </form>
            <div className="list">
              {attendance.map((item) => (
                <div key={item.id} className="list__item">
                  <div>
                    <h3>{item.class?.title || "Sem disciplina"}</h3>
                    <p>{item.date}</p>
                  </div>
                  <span>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel__header">
              <h2>Sugestoes e recursos</h2>
              <p>Complementos para manter o ritmo de estudos.</p>
            </div>
            <div className="tips">
              {quickTips.map((tip) => (
                <div key={tip} className="tip">
                  <span>Insight</span>
                  <p>{tip}</p>
                </div>
              ))}
            </div>
            <div className="resource">
              <div>
                <h3>Material central</h3>
                <p>Links, PDFs e contatos principais.</p>
              </div>
              <button type="button">Adicionar recursos</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

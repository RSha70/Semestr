import { useEffect, useState } from "react";
import "./App.css";

type Assignment = {
  id: number;
  name: string;
  course: string;
  due_date: string | null;
  completed: boolean;
};

function App() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedExams, setExtractedExams] = useState<Assignment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCourse, setEditCourse] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const fetchAssignments = () => {
    fetch("http://127.0.0.1:8000/assignments")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load assignments.");
        return response.json();
      })
      .then((data) => setAssignments(data))
      .catch(() => setError("Couldn't load assignments. Is the backend running?"));
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      const params = new URLSearchParams({
        name,
        course,
        due_date: dueDate,
      });

      const response = await fetch(
        `http://127.0.0.1:8000/assignments?${params}`,
        { method: "POST" }
      );

      if (!response.ok) throw new Error("Couldn't add assignment.");

      setName("");
      setCourse("");
      setDueDate("");
      fetchAssignments();
    } catch {
      setError("Couldn't add assignment. Check that the backend is running.");
    }
  };
  const handleCompletedChange = async (
    assignmentId: number,
    completed: boolean
  ) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/assignments/${assignmentId}?completed=${completed}`,
        { method: "PUT" }
      );

      const updatedAssignment = await response.json();

      setAssignments((current) =>
        current.map((assignment) =>
          assignment.id === updatedAssignment.id
            ? updatedAssignment
            : assignment
        )
      );
    } catch {
      setError("Couldn't update assignment.");
    }
  };

  const startEditing = (assignment: Assignment) => {
  setEditingId(assignment.id);
  setEditName(assignment.name);
  setEditCourse(assignment.course);

  if (assignment.due_date) {
    const date = new Date(assignment.due_date);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    setEditDueDate(date.toISOString().slice(0, 16));
  } else {
    setEditDueDate("");
  }
};

const saveEdit = async (assignmentId: number) => {
  setError("");

  try {
    const params = new URLSearchParams({
      name: editName,
      course: editCourse,
      due_date: editDueDate,
    });

    const response = await fetch(
      `http://127.0.0.1:8000/assignments/${assignmentId}?${params}`,
      { method: "PUT" }
    );

    if (!response.ok) throw new Error();

    const updatedAssignment = await response.json();

    setAssignments((current) =>
      current.map((assignment) =>
        assignment.id === updatedAssignment.id
          ? updatedAssignment
          : assignment
      )
    );

    setEditingId(null);
  } catch {
    setError("Couldn't save your changes.");
  }
};

  const handleSyllabusUpload = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Choose a PDF syllabus first.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        "http://127.0.0.1:8000/upload-syllabus",
        { method: "POST", body: formData }
      );

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Upload failed.");
      }

      setExtractedExams(data.exams_found ?? []);
    } catch {
      setError("Couldn't read that PDF. Check the file and try again.");
    } finally {
      setUploading(false);
    }
  };

  const addExam = async (exam: Assignment) => {
    try {
      const params = new URLSearchParams({
        name: exam.name,
        course: exam.course,
        due_date: exam.due_date ?? "",
      });

      const response = await fetch(
        `http://127.0.0.1:8000/assignments?${params}`,
        { method: "POST" }
      );

      if (!response.ok) throw new Error();

      setExtractedExams((current) =>
        current.filter((item) => item !== exam)
      );
      fetchAssignments();
    } catch {
      setError("Couldn't add this exam to your planner.");
    }
  };

  const pending = assignments.filter((assignment) => !assignment.completed);
  const completed = assignments.filter((assignment) => assignment.completed);
  const sortedPending = [...pending].sort(
  (a, b) =>
    new Date(a.due_date ?? "9999-12-31").getTime() -
    new Date(b.due_date ?? "9999-12-31").getTime()
);
  const formatDate = (date: string | null) => {
  if (!date) return "No due date";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "No due date";
  }

  return parsedDate.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
};

const isOverdue = (date: string | null) =>
  !!date && new Date(date).getTime() < Date.now();

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">S</span>
          <span>semestr</span>
        </a>
        <span className="topbar-note">Your semester, organized.</span>
      </header>

      <main className="dashboard">
        <section className="welcome">
          <p className="eyebrow">YOUR STUDENT DASHBOARD</p>
          <h1>Make room for what matters.</h1>
          <p className="welcome-copy">
            All your assignments, exams, and deadlines in one place.
          </p>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">To do</span>
            <strong>{pending.length}</strong>
            <span className="stat-hint">things on your list</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Completed</span>
            <strong>{completed.length}</strong>
            <span className="stat-hint">tasks checked off</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Coming up</span>
            <strong>{sortedPending.length > 0 ? formatDate(sortedPending[0].due_date).split(",")[0] : "—"}</strong>
            <span className="stat-hint">
              {sortedPending.length > 0 ? sortedPending[0].name : "You're all caught up"}
            </span>
          </div>
        </section>

        {error && <p className="error-message">{error}</p>}

        <div className="main-grid">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">STAY ON TRACK</p>
                <h2>Add an assignment</h2>
              </div>
              <span className="panel-icon">＋</span>
            </div>

            <form onSubmit={handleSubmit} className="planner-form">
              <label>
                Assignment name
                <input
                  required
                  placeholder="e.g. Problem Set 4"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label>
                Course
                <input
                  required
                  placeholder="e.g. CS 2200"
                  value={course}
                  onChange={(event) => setCourse(event.target.value)}
                />
              </label>
              <label>
  Due date (optional)
  <input
    type="datetime-local"
    value={dueDate}
    onChange={(e) => setDueDate(e.target.value)}
  />
</label>
              <button className="primary-button" type="submit">
                Add to planner <span>↗</span>
              </button>
            </form>

            <div className="upload-divider"><span>OR</span></div>

            <div className="upload-copy">
              <h3>Have a syllabus?</h3>
              <p>Upload a PDF to pull out exam dates automatically.</p>
            </div>
            
      
            <form onSubmit={handleSyllabusUpload} className="upload-form">
              <label className="file-picker">
                <span>{selectedFile ? selectedFile.name : "Choose a PDF syllabus"}</span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(event) =>
                    setSelectedFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>
              <button className="secondary-button" type="submit" disabled={uploading}>
                {uploading ? "Reading PDF..." : "Upload syllabus"}
              </button>
            </form>

            {extractedExams.length > 0 && (
              <div className="extracted-list">
                <h3>Exams found</h3>
                <p className="muted">Add the dates you want to keep.</p>
                {extractedExams.map((exam, index) => (
                  <div className="extracted-item" key={`${exam.name}-${index}`}>
                    <div>
                      <strong>{exam.name}</strong>
                      <span>{exam.course} · {formatDate(exam.due_date)}</span>
                    </div>
                    <button
                      className="add-exam-button"
                      type="button"
                      onClick={() => addExam(exam)}
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel assignments-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">THE BIG PICTURE</p>
                <h2>Your assignments</h2>
              </div>
              <span className="count-pill">{pending.length} left</span>
            </div>

            {sortedPending.length === 0 && completed.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">✳</span>
                <h3>A fresh start.</h3>
                <p>Add an assignment or upload a syllabus to get going.</p>
              </div>
            ) : (
              <>
                <div className="assignment-list">
                  {sortedPending.map((assignment) => (
                    <div className="assignment-item" key={assignment.id}>
                      <input
                        className="task-checkbox"
                        type="checkbox"
                        checked={assignment.completed}
                        onChange={(event) =>
                          handleCompletedChange(
                            assignment.id,
                            event.target.checked
                          )
                        }
                        aria-label={`Mark ${assignment.name} complete`}
                      />
                      {editingId === assignment.id ? (
  <div className="assignment-info editing">
    <input
      value={editName}
      onChange={(e) => setEditName(e.target.value)}
      placeholder="Assignment"
      required
    />
    <input
      value={editCourse}
      onChange={(e) => setEditCourse(e.target.value)}
      placeholder="Course"
      required
    />
    <input
      type="datetime-local"
      value={editDueDate}
      onChange={(e) => setEditDueDate(e.target.value)}
    />
    <div className="edit-actions">
  <button
    className="secondary-button"
    type="button"
    onClick={() => saveEdit(assignment.id)}
  >
    Save
  </button>
  <button
    className="secondary-button"
    type="button"
    onClick={() => setEditingId(null)}
  >
    Cancel
  </button>
</div>
  </div>
) : (
  <>
    <div className="assignment-info">
      <strong>{assignment.name}</strong>
      <span>{assignment.course}</span>
    </div>
    <div className="due-info">
      <span
        className={
          isOverdue(assignment.due_date)
            ? "due-date overdue"
            : "due-date"
        }
      >
        {formatDate(assignment.due_date)}
      </span>
      {isOverdue(assignment.due_date) && (
        <span className="overdue-label">Overdue</span>
      )}
      <button
        type="button"
        className="secondary-button"
        onClick={() => startEditing(assignment)}
      >
        Edit
      </button>
    </div>
  </>
)}
                    
                    </div>
                  ))}
                </div>

                {completed.length > 0 && (
                  <details className="completed-section">
                    <summary>Completed ({completed.length})</summary>
                    {completed.map((assignment) => (
                      <div className="assignment-item completed-item" key={assignment.id}>
                        <input
                          className="task-checkbox"
                          type="checkbox"
                          checked
                          onChange={() =>
                            handleCompletedChange(assignment.id, false)
                          }
                          aria-label={`Reopen ${assignment.name}`}
                        />
                        <div className="assignment-info">
                          <strong>{assignment.name}</strong>
                          <span>{assignment.course}</span>
                        </div>
                        <span className="done-label">Done</span>
                      </div>
                    ))}
                  </details>
                )}
              </>
            )}
          </section>
        </div>

        <footer className="footer">
          <span>semestr</span>
          <span>One semester at a time.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;

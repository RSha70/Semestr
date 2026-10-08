import { useEffect, useState } from "react";

type Assignment = {
  id: number;
  name: string;
  course: string;
  due_date: string;
  completed: boolean;
};

function App() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [dueDate, setDueDate] = useState("");

  const fetchAssignments = () => {
    fetch("http://127.0.0.1:8000/assignments")
      .then((response) => response.json())
      .then((data) => setAssignments(data));
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    fetch(
      `http://127.0.0.1:8000/assignments?name=${encodeURIComponent(
        name
      )}&course=${encodeURIComponent(
        course
      )}&due_date=${encodeURIComponent(dueDate)}`,
      {
        method: "POST",
      }
    )
      .then((response) => response.json())
      .then(() => {
        setName("");
        setCourse("");
        setDueDate("");
        fetchAssignments();
      });
  };

  const handleCompletedChange = (
    assignmentId: number,
    completed: boolean
  ) => {
    fetch(
      `http://127.0.0.1:8000/assignments/${assignmentId}?completed=${completed}`,
      {
        method: "PUT",
      }
    )
      .then((response) => response.json())
      .then((updatedAssignment) => {
        setAssignments((currentAssignments) =>
          currentAssignments.map((assignment) =>
            assignment.id === updatedAssignment.id
              ? updatedAssignment
              : assignment
          )
        );
      });
  };

  return (
    <div>
      <h1>Semestr</h1>

      <h2>Add Assignment</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Assignment name: </label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div>
          <label>Course: </label>
          <input
            value={course}
            onChange={(event) => setCourse(event.target.value)}
          />
        </div>

        <div>
          <label>Due date: </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>

        <button type="submit">Add Assignment</button>
      </form>

      <h2>Assignments</h2>

      {assignments.map((assignment) => (
        <div key={assignment.id}>
          <div>
            <input
              type="checkbox"
              checked={assignment.completed}
              onChange={(event) =>
                handleCompletedChange(
                  assignment.id,
                  event.target.checked
                )
              }
            />

            <span
  style={{
    textDecoration: assignment.completed ? "line-through" : "none",
  }}
>
  {assignment.name}
</span>
          </div>

          <p>{assignment.course}</p>
          <p>Due: {assignment.due_date}</p>
        </div>
      ))}
    </div>
  );
}

export default App;
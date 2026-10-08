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

  useEffect(() => {
    fetch("http://127.0.0.1:8000/assignments")
      .then((response) => response.json())
      .then((data) => setAssignments(data));
  }, []);

  return (
    <div>
      <h1>Semestr</h1>

      <h2>Assignments</h2>

      {assignments.map((assignment) => (
        <div key={assignment.id}>
          <h3>{assignment.name}</h3>
          <p>{assignment.course}</p>
          <p>Due: {assignment.due_date}</p>
        </div>
      ))}
    </div>
  );
}

export default App;
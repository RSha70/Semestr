from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from io import BytesIO
from database import SessionLocal
from models import Assignment
import re
from datetime import datetime
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Semester Planner API is running!"}


@app.get("/db-test")
def db_test():
    with SessionLocal() as db:
        return {"message": "Database connected!"}


@app.post("/assignments")
def create_assignment(
    name: str,
    course: str,
    due_date: str,
):
    db = SessionLocal()

    assignment = Assignment(
        name=name,
        course=course,
        due_date=due_date,
    )

    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    db.close()

    return assignment
@app.get("/assignments")
def get_assignments():
    db = SessionLocal()

    assignments = db.query(Assignment).all()

    db.close()

    return assignments
@app.put("/assignments/{assignment_id}")
def update_assignment(assignment_id: int, completed: bool):
    db = SessionLocal()

    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()

    if assignment is None:
        db.close()
        return {"error": "Assignment not found"}

    assignment.completed = completed

    db.commit()
    db.refresh(assignment)
    db.close()

    return assignment

@app.post("/upload-syllabus")
async def upload_syllabus(file: UploadFile = File(...)):
    contents = await file.read()

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        return {"error": "Please upload a PDF file."}

    reader = PdfReader(BytesIO(contents))

    text = ""
    for page in reader.pages:
        text += (page.extract_text() or "") + "\n"

    text = " ".join(text.split())
    print(text)

    # Identify the course code, such as LING 2100.

    course = "Unknown course"

    course_match = re.search(
        r"\b([A-Z]{2,5}\s*\d{3,4})\b",
        text,
        re.IGNORECASE,
    )

    if course_match:
        course = course_match.group(1).upper()

    if re.search(r"\bLing\s*2100\b", text, re.IGNORECASE):
        course = "Ling 2100"

    # Restrict extraction to the grading section when possible.
    grading_match = re.search(
        r"Grading Criteria.*?Assignment Description/Notes"
        r"(.*?)Attention checks",
        text,
        re.IGNORECASE,
    )

    section = grading_match.group(1) if grading_match else text

    # Find dates listed directly after "Exams".
    exam_match = re.search(
        r"\bExams?\s+((?:(?:January|February|March|April|May|June|"
        r"July|August|September|October|November|December)"
        r"\s+\d{1,2}\s*;?\s*)+)",
        section,
        re.IGNORECASE,
    )

    exams = []

    if exam_match:
        dates = re.findall(
            r"(January|February|March|April|May|June|July|August|"
            r"September|October|November|December)\s+(\d{1,2})",
            exam_match.group(1),
            re.IGNORECASE,
        )

        for index, (month, day) in enumerate(dates, start=1):
            try:
                due_date = datetime.strptime(
                    f"{month} {day} 2026", "%B %d %Y"
                )
            except ValueError:
                continue

            exams.append({
                "name": f"{course} Exam {index}",
                "course": course,
                "due_date": due_date.isoformat(),
                "type": "exam",
            })

    return {
        "filename": file.filename,
        "pages": len(reader.pages),
        "deadlines_found": exams,
        "exams_found": exams,
    }

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

    if not file.filename.lower().endswith(".pdf"):
        return {"error": "Please upload a PDF file."}

    reader = PdfReader(BytesIO(contents))

    text = ""

    for page in reader.pages:
        page_text = page.extract_text() or ""
        text += page_text + "\n"

    text = " ".join(text.split())

    exam_dates = []

    exam_section = re.search(
        r"Exams\s+(.*?)(?=Attention checks)",
        text,
        re.IGNORECASE,
    )

    if exam_section:
        exam_dates = re.findall(
            r"(September|October|November|December)\s+(\d{1,2})",
            exam_section.group(1),
            re.IGNORECASE,
        )

    exams = []

    for month, day in exam_dates:
        try:
            due_date = datetime.strptime(
                f"{month} {day} 2026", "%B %d %Y"
            )

            exams.append({
                "name": f"Ling 2100 Exam {len(exams) + 1}",
                "course": "Ling 2100",
                "due_date": due_date.isoformat(),
            })
        except ValueError:
            continue

    return {
        "filename": file.filename,
        "pages": len(reader.pages),
        "exams_found": exams,
    }
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import SessionLocal
from models import Assignment

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
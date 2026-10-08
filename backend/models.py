from sqlalchemy import Boolean, Column, DateTime, Integer, String

from database import Base


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    course = Column(String, nullable=False)
    due_date = Column(DateTime, nullable=False)
    completed = Column(Boolean, default=False)
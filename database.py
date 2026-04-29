from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

SQLALCHEMY_DATABASE_URL = os.environ.get("SQLALCHEMY_DATABASE_URL","sqlite:///./app.db")  # Correction: chemin relatif correct
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://")

Connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}
moteur = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=Connect_args)
Localsession = sessionmaker(autocommit=False, autoflush=False, bind=moteur)

Base = declarative_base()

def get_db():
    db = Localsession()
    try:
        yield db
    finally:
        db.close()

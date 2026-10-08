import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Lê o .env local (nunca commitado no GitHub)
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")

if not SUPABASE_URL:
    raise RuntimeError(
        "Falta a variável SUPABASE_URL no .env. "
        "Formato: postgresql://usuario:senha@host:5432/postgres"
    )

# SQLAlchemy + psycopg 3 precisa do prefixo postgresql+psycopg://
DATABASE_URL = SUPABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Abre uma sessão por requisição e garante que ela é fechada no final."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
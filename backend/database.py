import os
 
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
 
# Lê o .env local (nunca commitado no GitHub)
load_dotenv()
 
SUPABASE_HOST = os.getenv("supabase_host")
SUPABASE_PORT = os.getenv("supabase_port")
SUPABASE_DB = os.getenv("supabase_db")
SUPABASE_USER = os.getenv("supabase_user")
SUPABASE_PASSWORD = os.getenv("supabase_password")
 
if not all([SUPABASE_HOST, SUPABASE_PORT, SUPABASE_DB, SUPABASE_USER, SUPABASE_PASSWORD]):
    raise RuntimeError(
        "Faltam variáveis no .env. Confira se supabase_host, supabase_port, "
        "supabase_db, supabase_user e supabase_password estão todas preenchidas."
    )
 
DATABASE_URL = (
    f"postgresql+psycopg://{SUPABASE_USER}:{SUPABASE_PASSWORD}"
    f"@{SUPABASE_HOST}:{SUPABASE_PORT}/{SUPABASE_DB}"
)
 
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
 
Base = declarative_base()
 
 
def get_db():
    """Abre uma sessão por requisição e garante que ela é fechada no final."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
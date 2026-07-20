from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import text

# Create SQLite database in the backend directory
sqlite_file_name = "void.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, echo=True, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    
    # Automatic migration for added columns in message table
    with engine.connect() as conn:
        try:
            cursor = conn.execute(text("PRAGMA table_info(message)"))
            columns = [row[1] for row in cursor.fetchall()]
            if "model" not in columns:
                conn.execute(text("ALTER TABLE message ADD COLUMN model TEXT"))
            if "provider" not in columns:
                conn.execute(text("ALTER TABLE message ADD COLUMN provider TEXT"))
            if "system_prompt" not in columns:
                conn.execute(text("ALTER TABLE message ADD COLUMN system_prompt TEXT"))
            conn.commit()
        except Exception as e:
            print(f"Database migration notice: {e}")

def get_session():
    with Session(engine) as session:
        yield session

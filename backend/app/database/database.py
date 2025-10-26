import os
from sqlmodel import create_engine


database_url = database_url = os.getenv("DATABASE_URL") or os.getenv("LOCAL_DATABASE_URL")
engine = create_engine(database_url)

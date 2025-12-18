import os
import sys
from pathlib import Path

# add project and backend directories to path so 'app' package can be imported
_root = Path(__file__).resolve()
sys.path.insert(0, str(_root.parents[1]))  # backend/
# also add project root in case 'app' is located one level higher
if len(_root.parents) > 2:
    sys.path.insert(0, str(_root.parents[2]))

os.environ.setdefault("ALEMBIC_RUNNING", "1")

from sqlalchemy import text

try:
    from app.database.database import engine
except Exception:
    # ensure project and backend directories are on sys.path and retry import
    from importlib import import_module
    _root = Path(__file__).resolve()
    for p in (str(_root.parents[1]), str(_root.parents[2]) if len(_root.parents) > 2 else None):
        if p and p not in sys.path:
            sys.path.insert(0, p)
    engine = import_module("app.database.database").engine


def main() -> None:
    with engine.connect() as conn:
        tables = conn.execute(
            text(
                """
                select table_name
                from information_schema.tables
                where table_schema='public'
                order by table_name
                """
            )
        ).fetchall()

        rows = conn.execute(
            text(
                """
                select column_name, data_type, is_nullable
                from information_schema.columns
                where table_schema='public' and table_name='users'
                order by ordinal_position
                """
            )
        ).fetchall()

    print(f"users columns: {len(rows)}")
    for column_name, data_type, is_nullable in rows:
        print(f"- {column_name} {data_type} nullable={is_nullable}")

    wanted = {
        "is_email_verified",
        "email_verified_at",
        "failed_login_attempts",
        "locked_until",
        "is_2fa_enabled",
        "totp_secret_encrypted",
        "last_2fa_verified_at",
        "phone_number",
        "is_phone_verified",
        "phone_verified_at",
    }
    existing = {r[0] for r in rows}
    missing = sorted(list(wanted - existing))
    print("missing:", missing)

    table_names = {t[0] for t in tables}
    for name in ["email_verification_tokens", "password_reset_tokens"]:
        print(f"table {name} exists:", name in table_names)


if __name__ == "__main__":
    main()

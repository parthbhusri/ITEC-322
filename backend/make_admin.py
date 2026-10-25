"""Give an existing account admin access (or take it away).

Usage (from the backend folder, with the virtual environment active):

    python make_admin.py you@university.edu.au          # make admin
    python make_admin.py you@university.edu.au --remove # back to student

The person needs to log out and back in to see the Admin page.
"""

import sys

from sqlalchemy import select

from app.database import SessionLocal
from app.models import User


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    remove = "--remove" in sys.argv

    if len(args) != 1:
        print(__doc__)
        sys.exit(1)

    email = args[0].strip().lower()
    db = SessionLocal()

    try:
        user = db.scalar(select(User).where(User.email == email))

        if user is None:
            print(f"No account found for {email}. Register on the website first.")
            sys.exit(1)

        user.role = "student" if remove else "admin"
        db.commit()

        print(f"{user.full_name} ({email}) is now {'a student' if remove else 'an admin'}.")

    finally:
        db.close()


if __name__ == "__main__":
    main()


from decimal import Decimal
from sqlalchemy import select

from app.database import SessionLocal
from app.models import User, Item

# Product name, category, suggested daily price (AUD)
PRODUCTS = [
    ("Computer Science Textbook", "Textbook", 3),
    ("Nursing Fundamentals Textbook", "Textbook", 3),
    ("Anatomy & Physiology Textbook", "Textbook", 4),
    ("Business Management Textbook", "Textbook", 3),
    ("Accounting Textbook", "Textbook", 3),
    ("Psychology Textbook", "Textbook", 3),
    ("Engineering Mathematics Textbook", "Textbook", 4),
    ("Law Textbook", "Textbook", 4),

    ("Casio Scientific Calculator", "Calculator", 2),
    ("Graphing Calculator", "Calculator", 5),
    ("Financial Calculator", "Calculator", 3),
    ("Windows Student Laptop", "Electronics", 12),
    ("MacBook Laptop", "Electronics", 18),
    ("iPad or Android Tablet", "Electronics", 8),
    ("Computer Monitor", "Electronics", 6),
    ("USB-C Docking Station", "Electronics", 4),

    ("Laboratory Coat", "Lab Equipment", 2),
    ("Safety Goggles", "Lab Equipment", 1),
    ("Dissection Kit", "Lab Equipment", 3),
    ("Stethoscope", "Nursing Equipment", 5),
    ("Blood Pressure Monitor", "Nursing Equipment", 4),
    ("Anatomical Study Model", "Lab Equipment", 5),

    ("DSLR Camera", "Camera Equipment", 30),
    ("Mirrorless Camera", "Camera Equipment", 40),
    ("Camera Tripod", "Camera Equipment", 5),
    ("Ring Light", "Camera Equipment", 4),
    ("USB Microphone", "Camera Equipment", 5),
    ("Drawing Tablet", "Electronics", 7),

    ("Digital Multimeter", "Tool", 4),
    ("Arduino Starter Kit", "Tool", 5),
    ("Raspberry Pi Kit", "Tool", 7),
    ("Electronics Toolkit", "Tool", 4),
    ("Cordless Drill", "Tool", 8),
    ("Measuring & Drafting Kit", "Tool", 3),

    ("Portable Projector", "Electronics", 20),
    ("Portable Whiteboard", "Study Equipment", 5),
    ("Scientific Poster Stand", "Study Equipment", 5),
    ("Presentation Clicker", "Electronics", 3),
    ("Portable Charger", "Electronics", 3),
    ("Noise-Cancelling Headphones", "Electronics", 6),
]

DEMO_EMAIL = "demo-catalogue@campusrentalhub.invalid"


def main():
    db = SessionLocal()

    try:
        owner = db.scalar(
            select(User).where(User.email == DEMO_EMAIL)
        )

        if owner is None:
            owner = User(
                full_name="Campus Rental Hub Demo Catalogue",
                email=DEMO_EMAIL,
                password_hash="!demo-account-login-disabled",
                is_verified=False,
                role="student",
            )
            db.add(owner)
            db.flush()

        existing_titles = {
            title.casefold()
            for title in db.scalars(
                select(Item.title).where(Item.owner_id == owner.id)
            ).all()
        }

        added = 0

        for title, category, price in PRODUCTS:
            if title.casefold() in existing_titles:
                continue

            item = Item(
                owner_id=owner.id,
                title=title,
                description=(
                    f"DEMO LISTING ONLY. Example {title.lower()} "
                    "for university students across Australia. "
                    "Suggested daily price, not a confirmed rental offer."
                ),
                category=category,
                condition="Good",
                price_per_day=Decimal(str(price)),
                status="Demo",
                isbn=None,
            )

            db.add(item)
            existing_titles.add(title.casefold())
            added += 1

        db.commit()

        print(f"Successfully added {added} demo products.")
        print(f"Demo catalogue contains {len(existing_titles)} products.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()

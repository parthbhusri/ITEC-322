
from decimal import Decimal
from sqlalchemy import select

from app.database import SessionLocal
from app.models import User, Item
from app.security import hash_password

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

# Demo owner account. You can log in as this user to approve, start and
# complete rental requests made on the sample items.
DEMO_EMAIL = "demo.owner@example.com"
DEMO_PASSWORD = "DemoOwner123!"

# Email used by an earlier version of this script (login was disabled).
OLD_DEMO_EMAIL = "demo-catalogue@campusrentalhub.invalid"

PICKUP_SPOTS = [
    "Library - Main Entrance",
    "Student Union",
    "Science Building Lobby",
    "Engineering Annex",
]


def main():
    db = SessionLocal()

    try:
        owner = db.scalar(
            select(User).where(User.email.in_([DEMO_EMAIL, OLD_DEMO_EMAIL]))
        )

        if owner is None:
            owner = User(
                full_name="Demo Owner",
                email=DEMO_EMAIL,
                password_hash=hash_password(DEMO_PASSWORD),
                is_verified=False,
                role="student",
            )
            db.add(owner)

        # Make sure the demo owner can log in and list items
        owner.full_name = "Demo Owner"
        owner.email = DEMO_EMAIL
        owner.password_hash = hash_password(DEMO_PASSWORD)
        owner.university = owner.university or "Australian Catholic University"
        owner.campus = owner.campus or "North Sydney"
        db.flush()

        existing = {
            item.title.casefold(): item
            for item in db.scalars(
                select(Item).where(Item.owner_id == owner.id)
            ).all()
        }

        added = 0
        updated = 0

        for index, (title, category, price) in enumerate(PRODUCTS):
            item = existing.get(title.casefold())

            if item is not None:
                # Older seeds used status "Demo", which cannot be rented
                if item.status == "Demo":
                    item.status = "Available"
                    item.university = owner.university
                    item.campus = owner.campus
                    item.pickup_location = PICKUP_SPOTS[index % len(PICKUP_SPOTS)]
                    item.description = (
                        f"Sample listing: {title.lower()} for testing the rental flow."
                    )
                    updated += 1
                continue

            db.add(
                Item(
                    owner_id=owner.id,
                    title=title,
                    description=(
                        f"Sample listing: {title.lower()} for testing the rental flow."
                    ),
                    category=category,
                    condition="Good",
                    price_per_day=Decimal(str(price)),
                    status="Available",
                    isbn=None,
                    university=owner.university,
                    campus=owner.campus,
                    pickup_location=PICKUP_SPOTS[index % len(PICKUP_SPOTS)],
                )
            )
            added += 1

        db.commit()

        print(f"Added {added} sample products, updated {updated}.")
        print(f"Demo owner login: {DEMO_EMAIL} / {DEMO_PASSWORD}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()

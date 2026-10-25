from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.database import get_db
from app.listings import remove_item
from app.models import Item, Rental, User
from app.schemas import AdminStats, AdminUser, RentalResponse


# ==========================================
# ADMIN ROUTER
# --------------------------------------------------
# Every endpoint here needs an account with
# role "admin" (see make_admin.py).
# ==========================================

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
    dependencies=[Depends(require_admin)],
)


# ==========================================
# SITE STATISTICS
# ==========================================

@router.get("/stats", response_model=AdminStats)
def get_stats(db: Session = Depends(get_db)):
    by_status = dict(
        db.execute(
            select(Rental.status, func.count()).group_by(Rental.status)
        ).all()
    )

    revenue = db.scalar(
        select(func.coalesce(func.sum(Rental.total_price), 0)).where(
            Rental.payment_status == "Paid"
        )
    )

    return AdminStats(
        users=db.scalar(select(func.count()).select_from(User)) or 0,
        listings=db.scalar(
            select(func.count()).select_from(Item).where(Item.status != "Removed")
        )
        or 0,
        available_listings=db.scalar(
            select(func.count()).select_from(Item).where(Item.status == "Available")
        )
        or 0,
        rentals=sum(by_status.values()),
        rentals_by_status=by_status,
        paid_rentals=db.scalar(
            select(func.count())
            .select_from(Rental)
            .where(Rental.payment_status == "Paid")
        )
        or 0,
        revenue=Decimal(revenue or 0),
    )


# ==========================================
# ALL USERS (never includes password hashes)
# ==========================================

@router.get("/users", response_model=list[AdminUser])
def list_users(db: Session = Depends(get_db)):
    listing_counts = dict(
        db.execute(
            select(Item.owner_id, func.count())
            .where(Item.status != "Removed")
            .group_by(Item.owner_id)
        ).all()
    )
    rental_counts = dict(
        db.execute(
            select(Rental.renter_id, func.count()).group_by(Rental.renter_id)
        ).all()
    )

    users = db.scalars(select(User).order_by(User.id.desc())).all()

    return [
        AdminUser(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            role=user.role,
            university=user.university,
            campus=user.campus,
            listing_count=listing_counts.get(user.id, 0),
            rental_count=rental_counts.get(user.id, 0),
        )
        for user in users
    ]


# ==========================================
# ALL RENTALS ACROSS THE SITE
# ==========================================

@router.get("/rentals", response_model=list[RentalResponse])
def list_rentals(db: Session = Depends(get_db)):
    return db.scalars(select(Rental).order_by(Rental.id.desc())).all()


# ==========================================
# REMOVE ANY LISTING
# ==========================================

@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_remove_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(Item, item_id)

    if item is None or item.status == "Removed":
        raise HTTPException(status_code=404, detail="Item not found.")

    remove_item(item, db, force=True)

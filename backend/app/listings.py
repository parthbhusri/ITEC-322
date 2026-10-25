from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models import Item, Rental


# ==========================================
# REMOVE A LISTING (shared by owners and admins)
# ==========================================

def remove_item(item: Item, db: Session, force: bool = False):
    """Hide a listing and reject its pending requests.

    Owners can't remove an item that is booked (Approved) or out with
    someone (Active). Admins can (force=True); those rentals carry on.
    """
    booked = db.scalar(
        select(Rental).where(
            Rental.item_id == item.id,
            Rental.status.in_(["Approved", "Active"]),
        )
    )

    if booked is not None and not force:
        raise HTTPException(
            status_code=409,
            detail=(
                "This item has an approved or active rental. "
                "Finish that rental before deleting the listing."
            ),
        )

    pending = db.scalars(
        select(Rental).where(
            Rental.item_id == item.id,
            Rental.status == "Requested",
        )
    ).all()

    for rental in pending:
        rental.status = "Rejected"

    item.status = "Removed"

    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to remove listing.",
        )

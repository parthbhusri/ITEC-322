
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Item, Rental, User
from app.schemas import RentalCreate, RentalResponse
from app.auth import get_current_user


router = APIRouter(
    prefix="/api/rentals",
    tags=["Rental Bookings"]
)


# ==================================
# CREATE RENTAL BOOKING
# ==================================

@router.post(
    "",
    response_model=RentalResponse,
    status_code=201
)
def create_rental(
    booking: RentalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Find the requested item
    item = db.scalar(
        select(Item).where(
            Item.id == booking.item_id
        )
    )

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )

    # Students cannot rent their own items
    if item.owner_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot rent your own item"
        )

    # Check item availability
    if item.status != "Available":
        raise HTTPException(
            status_code=400,
            detail="Item is not available"
        )

    # Validate rental dates
    if booking.start_date < date.today():
        raise HTTPException(
            status_code=400,
            detail="Start date cannot be in the past"
        )

    if booking.end_date < booking.start_date:
        raise HTTPException(
            status_code=400,
            detail="End date must be on or after start date"
        )

    # ==================================
    # CHECK OVERLAPPING BOOKINGS
    # ==================================

    overlapping_booking = db.scalar(
        select(Rental).where(
            Rental.item_id == booking.item_id,
            Rental.status.in_(
                ["Approved", "Active"]
            ),
            Rental.start_date <= booking.end_date,
            Rental.end_date >= booking.start_date
        )
    )

    if overlapping_booking is not None:
        raise HTTPException(
            status_code=409,
            detail="Item is already booked for these dates"
        )

    # ==================================
    # PREVENT DUPLICATE RENTAL REQUESTS
    # ==================================

    duplicate_booking = db.scalar(
        select(Rental).where(
            Rental.item_id == booking.item_id,
            Rental.renter_id == current_user.id,
            Rental.status.in_(
                ["Requested", "Approved", "Active"]
            ),
            Rental.start_date <= booking.end_date,
            Rental.end_date >= booking.start_date
        )
    )

    if duplicate_booking is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                "You already have a rental request "
                "for this item and these dates"
            )
        )

    # ==================================
    # CALCULATE RENTAL PRICE
    # ==================================

    rental_days = (
        booking.end_date - booking.start_date
    ).days + 1

    total_price = (
        Decimal(str(item.price_per_day))
        * rental_days
    )

    # ==================================
    # CREATE RENTAL BOOKING
    # ==================================

    new_rental = Rental(
        item_id=item.id,
        renter_id=current_user.id,
        start_date=booking.start_date,
        end_date=booking.end_date,
        total_price=total_price,
        status="Requested",
        handoff_location=booking.handoff_location
    )

    db.add(new_rental)

    try:
        db.commit()
        db.refresh(new_rental)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to create rental booking"
        )

    return new_rental


# ==================================
# VIEW MY RENTAL BOOKINGS
# ==================================

@router.get(
    "/mine",
    response_model=list[RentalResponse]
)
def get_my_rentals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    rentals = db.scalars(
        select(Rental)
        .where(
            Rental.renter_id == current_user.id
        )
        .order_by(Rental.id.desc())
    ).all()

    return rentals


# ==================================
# CANCEL MY RENTAL BOOKING
# ==================================

@router.patch(
    "/{rental_id}/cancel",
    response_model=RentalResponse
)
def cancel_rental(
    rental_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    rental = db.scalar(
        select(Rental).where(
            Rental.id == rental_id,
            Rental.renter_id == current_user.id
        )
    )

    if rental is None:
        raise HTTPException(
            status_code=404,
            detail="Rental booking not found"
        )

    # Only requested bookings can be cancelled
    if rental.status != "Requested":
        raise HTTPException(
            status_code=400,
            detail="Only requested bookings can be cancelled"
        )

    rental.status = "Cancelled"

    try:
        db.commit()
        db.refresh(rental)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to cancel rental booking"
        )

    return rental


# ==================================
# VIEW RENTAL REQUESTS FOR MY ITEMS
# ==================================

@router.get(
    "/received",
    response_model=list[RentalResponse]
)
def get_received_rentals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    rentals = db.scalars(
        select(Rental)
        .join(Item, Rental.item_id == Item.id)
        .where(Item.owner_id == current_user.id)
        .order_by(Rental.id.desc())
    ).all()

    return rentals


# ==================================
# APPROVE OR REJECT RENTAL REQUEST
# ==================================

@router.patch(
    "/{rental_id}/decision",
    response_model=RentalResponse
)
def decide_rental(
    rental_id: int,
    decision: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Lock the item first to serialize decisions
    rental_item_id = db.scalar(
        select(Rental.item_id)
        .where(Rental.id == rental_id)
    )

    if rental_item_id is None:
        raise HTTPException(
            status_code=404,
            detail="Rental request not found"
        )

    item = db.scalar(
        select(Item)
        .where(
            Item.id == rental_item_id,
            Item.owner_id == current_user.id
        )
        .with_for_update()
    )

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Rental request not found for your items"
        )

    rental = db.scalar(
        select(Rental)
        .where(
            Rental.id == rental_id,
            Rental.item_id == item.id
        )
        .with_for_update()
    )

    if rental is None:
        raise HTTPException(
            status_code=404,
            detail="Rental request not found"
        )

    if rental.status != "Requested":
        raise HTTPException(
            status_code=400,
            detail="Only requested bookings can be reviewed"
        )

    decision = decision.strip().lower()

    if decision not in ["approve", "reject"]:
        raise HTTPException(
            status_code=400,
            detail="Decision must be approve or reject"
        )

    if decision == "approve":

        # Check conflicting approved or active bookings
        conflict = db.scalar(
            select(Rental).where(
                Rental.item_id == rental.item_id,
                Rental.id != rental.id,
                Rental.status.in_(
                    ["Approved", "Active"]
                ),
                Rental.start_date <= rental.end_date,
                Rental.end_date >= rental.start_date
            )
        )

        if conflict is not None:
            raise HTTPException(
                status_code=409,
                detail="Item is already booked for these dates"
            )

        rental.status = "Approved"

    else:
        rental.status = "Rejected"

    try:
        db.commit()
        db.refresh(rental)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to update rental decision"
        )

    return rental


# ==================================
# START RENTAL - ITEM HANDED OVER
# ==================================

@router.patch(
    "/{rental_id}/start",
    response_model=RentalResponse
)
def start_rental(
    rental_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Only the item owner can start the rental
    rental = db.scalar(
        select(Rental)
        .join(Item, Rental.item_id == Item.id)
        .where(
            Rental.id == rental_id,
            Item.owner_id == current_user.id
        )
        .with_for_update(of=Rental)
    )

    if rental is None:
        raise HTTPException(
            status_code=404,
            detail="Rental not found for your items"
        )

    # Rental must be approved first
    if rental.status != "Approved":
        raise HTTPException(
            status_code=400,
            detail="Only approved rentals can be started"
        )

    # Item has been handed over
    rental.status = "Active"

    try:
        db.commit()
        db.refresh(rental)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to start rental"
        )

    return rental


# ==================================
# COMPLETE RENTAL - ITEM RETURNED
# ==================================

@router.patch(
    "/{rental_id}/complete",
    response_model=RentalResponse
)
def complete_rental(
    rental_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Only the item owner can complete the rental
    rental = db.scalar(
        select(Rental)
        .join(Item, Rental.item_id == Item.id)
        .where(
            Rental.id == rental_id,
            Item.owner_id == current_user.id
        )
        .with_for_update(of=Rental)
    )

    if rental is None:
        raise HTTPException(
            status_code=404,
            detail="Rental not found for your items"
        )

    # Rental must be active before completion
    if rental.status != "Active":
        raise HTTPException(
            status_code=400,
            detail="Only active rentals can be completed"
        )

    # Item has been returned
    rental.status = "Completed"

    try:
        db.commit()
        db.refresh(rental)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to complete rental"
        )

    return rental

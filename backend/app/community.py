from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Favorite, Item, Rental, Review, User
from app.schemas import (
    RentalSummary,
    ReviewCreate,
    ReviewResponse,
    UserReviewSummary,
)

router = APIRouter(tags=["Saved items, notifications and reviews"])


# ==========================================
# SAVED ITEMS (favourites on the account)
# ==========================================

@router.get("/api/favorites", response_model=list[int])
def list_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """IDs of the items this student has saved."""
    return db.scalars(
        select(Favorite.item_id)
        .join(Item, Item.id == Favorite.item_id)
        .where(Favorite.user_id == current_user.id, Item.status != "Removed")
        .order_by(Favorite.id.desc())
    ).all()


@router.put("/api/favorites/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def add_favorite(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.get(Item, item_id)
    if item is None or item.status == "Removed":
        raise HTTPException(status_code=404, detail="Item not found.")

    exists = db.scalar(
        select(Favorite).where(
            Favorite.user_id == current_user.id, Favorite.item_id == item_id
        )
    )
    if exists is not None:
        return

    db.add(Favorite(user_id=current_user.id, item_id=item_id))
    try:
        db.commit()
    except IntegrityError:
        # Saved twice at the same moment: already saved, nothing to do
        db.rollback()


@router.delete("/api/favorites/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    favorite = db.scalar(
        select(Favorite).where(
            Favorite.user_id == current_user.id, Favorite.item_id == item_id
        )
    )
    if favorite is not None:
        db.delete(favorite)
        db.commit()


# ==========================================
# NOTIFICATION SUMMARY (navbar badge)
# ==========================================

@router.get("/api/rentals/summary", response_model=RentalSummary)
def rental_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    requests_to_review = (
        db.scalar(
            select(func.count())
            .select_from(Rental)
            .join(Item, Item.id == Rental.item_id)
            .where(Item.owner_id == current_user.id, Rental.status == "Requested")
        )
        or 0
    )

    rentals_to_pay = (
        db.scalar(
            select(func.count())
            .select_from(Rental)
            .where(
                Rental.renter_id == current_user.id,
                Rental.status == "Approved",
                Rental.payment_status != "Paid",
            )
        )
        or 0
    )

    completed = db.scalars(
        select(Rental)
        .join(Item, Item.id == Rental.item_id)
        .where(
            Rental.status == "Completed",
            (Rental.renter_id == current_user.id) | (Item.owner_id == current_user.id),
        )
    ).all()

    reviews_to_write = sum(
        1
        for rental in completed
        if not any(r.reviewer_id == current_user.id for r in rental.reviews)
    )

    return RentalSummary(
        requests_to_review=requests_to_review,
        rentals_to_pay=rentals_to_pay,
        reviews_to_write=reviews_to_write,
        total=requests_to_review + rentals_to_pay + reviews_to_write,
    )


# ==========================================
# REVIEWS
# ==========================================

@router.post(
    "/api/rentals/{rental_id}/review",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    rental_id: int,
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rental = db.get(Rental, rental_id)

    if rental is None:
        raise HTTPException(status_code=404, detail="Rental not found.")

    owner_id = rental.item.owner_id if rental.item else None

    # The renter reviews the owner, and the owner reviews the renter
    if current_user.id == rental.renter_id:
        reviewee_id = owner_id
    elif current_user.id == owner_id:
        reviewee_id = rental.renter_id
    else:
        raise HTTPException(
            status_code=403,
            detail="Only the renter or the owner can review this rental.",
        )

    if rental.status != "Completed":
        raise HTTPException(
            status_code=400,
            detail="You can leave a review once the item has been returned.",
        )

    if any(r.reviewer_id == current_user.id for r in rental.reviews):
        raise HTTPException(
            status_code=409,
            detail="You've already reviewed this rental.",
        )

    comment = (data.comment or "").strip() or None
    review = Review(
        rental_id=rental.id,
        reviewer_id=current_user.id,
        reviewee_id=reviewee_id,
        rating=data.rating,
        comment=comment,
    )
    db.add(review)

    try:
        db.commit()
        db.refresh(review)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="You've already reviewed this rental.")
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to save review.")

    return review


@router.get("/api/users/{user_id}/reviews", response_model=UserReviewSummary)
def user_reviews(user_id: int, db: Session = Depends(get_db)):
    """Public: the rating and reviews a student has received."""
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")

    reviews = db.scalars(
        select(Review)
        .where(Review.reviewee_id == user_id)
        .order_by(Review.id.desc())
    ).all()

    average = (
        round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else None
    )

    return UserReviewSummary(
        user_id=user.id,
        full_name=user.full_name,
        average_rating=average,
        review_count=len(reviews),
        reviews=reviews[:20],
    )

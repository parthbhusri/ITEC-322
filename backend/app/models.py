
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    Column,
    UniqueConstraint,
    Integer,
    String,
    Boolean,
    ForeignKey,
    Numeric,
    Date,
    DateTime,
)

from sqlalchemy.orm import relationship

from app.database import Base


# ==========================================
# USER MODEL
# ==========================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    full_name = Column(
        String(100),
        nullable=False,
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
    )

    password_hash = Column(
        String(255),
        nullable=False,
    )

    is_verified = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    role = Column(
        String(20),
        default="student",
        nullable=False,
    )

    university = Column(
        String(150),
        nullable=True,
    )

    campus = Column(
        String(150),
        nullable=True,
    )


# ==========================================
# ITEM MODEL
# ==========================================

class Item(Base):
    __tablename__ = "items"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    owner_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    title = Column(
        String(200),
        nullable=False,
    )

    description = Column(
        String(1000),
        nullable=True,
    )

    category = Column(
        String(50),
        nullable=False,
    )

    condition = Column(
        String(50),
        nullable=False,
    )

    price_per_day = Column(
        Numeric(10, 2),
        nullable=False,
    )

    status = Column(
        String(20),
        default="Available",
        nullable=False,
    )

    isbn = Column(
        String(20),
        nullable=True,
    )

    university = Column(
        String(150),
        nullable=True,
    )

    campus = Column(
        String(150),
        nullable=True,
    )

    pickup_location = Column(
        String(200),
        nullable=True,
    )

    # NEW: Permanent product image URL
    image_url = Column(
        String(300),
        nullable=True,
    )

    owner = relationship("User")

    # Read-only helper for API responses (no database column)
    @property
    def owner_name(self):
        return self.owner.full_name if self.owner else None


# ==========================================
# RENTAL MODEL
# ==========================================

class Rental(Base):
    __tablename__ = "rentals"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    item_id = Column(
        Integer,
        ForeignKey("items.id"),
        nullable=False,
    )

    renter_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    start_date = Column(
        Date,
        nullable=False,
    )

    end_date = Column(
        Date,
        nullable=False,
    )

    total_price = Column(
        Numeric(10, 2),
        nullable=False,
    )

    status = Column(
        String(20),
        default="Requested",
        nullable=False,
    )

    handoff_location = Column(
        String(200),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    
    # Stripe payment tracking
    payment_status = Column(
        String(20),
        default="Unpaid",
        nullable=False,
    )

    stripe_checkout_session_id = Column(
        String(255),
        nullable=True,
    )

    stripe_payment_intent_id = Column(
        String(255),
        nullable=True,
    )

    paid_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    item = relationship("Item")

    renter = relationship("User")

    # Read-only helpers for API responses (no database columns)
    @property
    def item_title(self):
        return self.item.title if self.item else None

    @property
    def item_category(self):
        return self.item.category if self.item else None

    @property
    def item_image_url(self):
        return self.item.image_url if self.item else None

    @property
    def owner_name(self):
        return self.item.owner_name if self.item else None

    @property
    def renter_name(self):
        return self.renter.full_name if self.renter else None

    @property
    def owner_id(self):
        return self.item.owner_id if self.item else None

    # Reviews written about this rental (at most one each way)
    reviews = relationship("Review", back_populates="rental")

    @property
    def renter_reviewed(self):
        return any(r.reviewer_id == self.renter_id for r in self.reviews)

    @property
    def owner_reviewed(self):
        owner_id = self.owner_id
        return any(r.reviewer_id == owner_id for r in self.reviews)


# ==========================================
# FAVORITE MODEL (saved items, per account)
# ==========================================

class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (
        UniqueConstraint("user_id", "item_id", name="uq_favorite_user_item"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


# ==========================================
# REVIEW MODEL
# --------------------------------------------------
# After a rental is completed, the renter and the
# owner can each rate the other once (1 to 5 stars).
# ==========================================

class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("rental_id", "reviewer_id", name="uq_review_rental_reviewer"),
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_review_rating"),
    )

    id = Column(Integer, primary_key=True)
    rental_id = Column(Integer, ForeignKey("rentals.id"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(String(500), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    rental = relationship("Rental", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id])

    @property
    def reviewer_name(self):
        return self.reviewer.full_name if self.reviewer else None

    @property
    def item_title(self):
        return self.rental.item_title if self.rental else None

    @property
    def reviewer_role(self):
        if self.rental is not None and self.reviewer_id == self.rental.renter_id:
            return "renter"
        return "owner"


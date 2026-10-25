
from datetime import date, datetime
from decimal import Decimal

import re
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)

# Student emails end in .edu (e.g. US) or .edu.<country> (e.g. .edu.au)
STUDENT_EMAIL_PATTERN = re.compile(r"\.edu(\.[a-z]{2})?$", re.IGNORECASE)


# ==========================================
# ITEM CREATE SCHEMA
# ==========================================

class ItemCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )

    category: str = Field(
        min_length=1,
        max_length=50,
    )

    condition: str = Field(
        min_length=1,
        max_length=50,
    )

    price_per_day: Decimal = Field(
        gt=0,
        max_digits=10,
        decimal_places=2,
    )

    isbn: str | None = Field(
        default=None,
        max_length=20,
    )

    university: str | None = Field(
        default=None,
        max_length=150,
    )

    campus: str | None = Field(
        default=None,
        max_length=150,
    )

    pickup_location: str | None = Field(
        default=None,
        max_length=200,
    )


# ==========================================
# ITEM RESPONSE SCHEMA
# ==========================================

class ItemResponse(BaseModel):
    id: int

    owner_id: int

    title: str

    description: str | None = None

    category: str

    condition: str

    price_per_day: Decimal

    status: str

    isbn: str | None = None

    university: str | None = None

    campus: str | None = None

    pickup_location: str | None = None

    # NEW: Image URL returned to frontend
    image_url: str | None = None

    # Name of the student who listed the item
    owner_name: str | None = None

    model_config = ConfigDict(
        from_attributes=True
    )


# ==========================================
# USER REGISTRATION SCHEMA
# ==========================================

class UserRegister(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=100,
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    @field_validator("email")
    @classmethod
    def must_be_student_email(cls, value: str) -> str:
        if not STUDENT_EMAIL_PATTERN.search(str(value).strip()):
            raise ValueError(
                "Please use your student email (ending in .edu or .edu.au)"
            )
        return value


# ==========================================
# USER LOGIN SCHEMA
# ==========================================

class UserLogin(BaseModel):
    email: EmailStr

    password: str


# ==========================================
# USER RESPONSE SCHEMA
# ==========================================

class UserResponse(BaseModel):
    id: int

    full_name: str

    email: EmailStr

    is_verified: bool

    role: str

    university: str | None = None

    campus: str | None = None

    model_config = ConfigDict(
        from_attributes=True
    )


# ==========================================
# USER PROFILE UPDATE SCHEMA
# ==========================================

class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    university: str | None = Field(
        default=None,
        max_length=150,
    )

    campus: str | None = Field(
        default=None,
        max_length=150,
    )


# ==========================================
# RENTAL CREATE SCHEMA
# ==========================================

class RentalCreate(BaseModel):
    item_id: int = Field(
        gt=0
    )

    start_date: date

    end_date: date

    handoff_location: str | None = Field(
        default=None,
        max_length=200,
    )


# ==========================================
# RENTAL RESPONSE SCHEMA
# ==========================================

class RentalResponse(BaseModel):
    id: int

    item_id: int

    renter_id: int

    start_date: date

    end_date: date

    total_price: Decimal

    status: str

    # Stripe payment status
    payment_status: str = "Unpaid"

    handoff_location: str | None = None

    # Extra details so the frontend can show a rental without extra requests
    created_at: datetime | None = None
    owner_id: int | None = None
    renter_reviewed: bool = False
    owner_reviewed: bool = False
    item_title: str | None = None
    item_category: str | None = None
    item_image_url: str | None = None
    owner_name: str | None = None
    renter_name: str | None = None

    model_config = ConfigDict(
        from_attributes=True
    )

# ==========================================
# ITEM UPDATE SCHEMA (owner edits a listing)
# ==========================================

class ItemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    category: str | None = Field(default=None, min_length=1, max_length=50)
    condition: str | None = Field(default=None, min_length=1, max_length=50)
    price_per_day: Decimal | None = Field(
        default=None, gt=0, max_digits=10, decimal_places=2
    )
    isbn: str | None = Field(default=None, max_length=20)
    pickup_location: str | None = Field(default=None, max_length=200)
    # Owners can pause a listing without deleting it
    status: Literal["Available", "Unavailable"] | None = None


# ==========================================
# PASSWORD CHANGE SCHEMA
# ==========================================

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


# ==========================================
# REVIEW SCHEMAS
# ==========================================

class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=500)


class ReviewResponse(BaseModel):
    id: int
    rental_id: int
    rating: int
    comment: str | None = None
    created_at: datetime | None = None
    reviewer_name: str | None = None
    item_title: str | None = None
    # "renter" if the renter wrote it, "owner" if the item owner wrote it
    reviewer_role: str

    model_config = ConfigDict(from_attributes=True)


class UserReviewSummary(BaseModel):
    user_id: int
    full_name: str
    average_rating: float | None = None
    review_count: int
    reviews: list[ReviewResponse]


# ==========================================
# RENTAL ACTIVITY SUMMARY (notification badge)
# ==========================================

class RentalSummary(BaseModel):
    # Requests on my items waiting for me to approve or reject
    requests_to_review: int
    # My approved rentals that still need paying
    rentals_to_pay: int
    # Completed rentals I haven't reviewed yet
    reviews_to_write: int
    total: int


# ==========================================
# ADMIN SCHEMAS
# ==========================================

class AdminUser(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    university: str | None = None
    campus: str | None = None
    listing_count: int
    rental_count: int


class AdminStats(BaseModel):
    users: int
    listings: int
    available_listings: int
    rentals: int
    rentals_by_status: dict[str, int]
    paid_rentals: int
    revenue: Decimal

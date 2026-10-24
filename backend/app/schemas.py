
from datetime import date
from decimal import Decimal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
)


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

    model_config = ConfigDict(
        from_attributes=True
    )
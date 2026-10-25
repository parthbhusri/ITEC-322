
import os
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

import stripe
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Item, Rental, User
from app.origins import is_local_frontend


# ==================================================
# CONFIGURATION
# ==================================================

load_dotenv()

router = APIRouter(
    prefix="/api/payments",
    tags=["Stripe Payments"],
)

STRIPE_SECRET_KEY = os.getenv(
    "STRIPE_SECRET_KEY", ""
).strip()

STRIPE_WEBHOOK_SECRET = os.getenv(
    "STRIPE_WEBHOOK_SECRET", ""
).strip()

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000",
).strip().rstrip("/")

stripe.api_key = STRIPE_SECRET_KEY


# ==================================================
# HELPER: CONVERT DOLLARS TO CENTS
# ==================================================

def to_cents(amount):
    value = Decimal(str(amount))

    return int(
        (value * Decimal("100")).quantize(
            Decimal("1"),
            rounding=ROUND_HALF_UP,
        )
    )


# ==================================================
# CREATE STRIPE CHECKOUT SESSION
# ==================================================

@router.post("/checkout/{rental_id}")
def create_checkout_session(
    rental_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # Check Stripe test key
    if not STRIPE_SECRET_KEY.startswith("sk_test_"):
        raise HTTPException(
            status_code=500,
            detail="Stripe test secret key is not configured.",
        )

    # Find rental belonging to logged-in user
    rental = db.scalar(
        select(Rental).where(
            Rental.id == rental_id,
            Rental.renter_id == current_user.id,
        )
    )

    if rental is None:
        raise HTTPException(
            status_code=404,
            detail="Rental booking not found.",
        )

    # Owner must approve before payment
    if rental.status != "Approved":
        raise HTTPException(
            status_code=400,
            detail=(
                "The owner must approve this rental "
                "before payment."
            ),
        )

    # Prevent duplicate payment
    if rental.payment_status == "Paid":
        raise HTTPException(
            status_code=400,
            detail="This rental is already paid.",
        )

    # Get item
    item = db.get(Item, rental.item_id)

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Rental item not found.",
        )

    # Calculate payment amount
    try:
        amount_cents = to_cents(rental.total_price)

    except (ValueError, TypeError, ArithmeticError):
        raise HTTPException(
            status_code=400,
            detail="Invalid rental payment amount.",
        )

    if amount_cents < 50:
        raise HTTPException(
            status_code=400,
            detail="Minimum payment amount is AUD $0.50.",
        )

    # Create Stripe Checkout session
    
   
    # Send the student back to the address they paid from (e.g. their
    # phone on the same Wi-Fi), otherwise to FRONTEND_URL
    origin = request.headers.get("origin")
    return_url = origin if is_local_frontend(origin) else FRONTEND_URL

    # Create Stripe Checkout session
    try:
        checkout_session = stripe.checkout.Session.create(
            mode="payment",
            line_items=[
                {
                    "price_data": {
                        "currency": "aud",
                        "unit_amount": amount_cents,
                        "product_data": {
                            "name": item.title,
                            "description": (
                                f"Campus Rental Hub Booking #{rental.id}"
                            ),
                        },
                    },
                    "quantity": 1,
                }
            ],
            client_reference_id=str(rental.id),
            metadata={
                "rental_id": str(rental.id),
                "renter_id": str(current_user.id),
            },
            payment_intent_data={
                "metadata": {
                    "rental_id": str(rental.id),
                }
            },
            success_url=(
                f"{return_url}/my-rentals"
                "?payment=success"
                "&session_id={CHECKOUT_SESSION_ID}"
            ),
            cancel_url=(
                f"{return_url}/my-rentals"
                "?payment=cancelled"
            ),
        )

    except stripe.StripeError as error:
        print(
            "STRIPE CHECKOUT ERROR:",
            repr(error),
            flush=True,
        )

        raise HTTPException(
            status_code=502,
            detail="Unable to create Stripe Checkout.",
        ) from error


    # Save Stripe session ID in PostgreSQL
    try:
        rental.stripe_checkout_session_id = (
            checkout_session.id
        )

        db.commit()

    except Exception as error:
        db.rollback()

        print(
            "DATABASE CHECKOUT ERROR:",
            repr(error),
            flush=True,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to save Checkout session.",
        ) from error

    return {
        "checkout_url": checkout_session.url,
        "session_id": checkout_session.id,
    }


# ==================================================
# STRIPE WEBHOOK
# ==================================================

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db),
):

    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Stripe webhook secret is not configured.",
        )

    payload = await request.body()

    signature = request.headers.get(
        "stripe-signature"
    )

    if not signature:
        raise HTTPException(
            status_code=400,
            detail="Missing Stripe signature.",
        )

    # Verify Stripe signature
    try:
        event = stripe.Webhook.construct_event(
            payload,
            signature,
            STRIPE_WEBHOOK_SECRET,
        )

    except (
        ValueError,
        stripe.SignatureVerificationError,
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid Stripe webhook signature.",
        )

    # Handle completed Checkout
    if event["type"] == "checkout.session.completed":

        checkout_session = event["data"]["object"]

        # Only process successful payments
        if checkout_session.get("payment_status") != "paid":
            return {"received": True}

        metadata = checkout_session.get("metadata") or {}

        rental_id = metadata.get("rental_id")

        if not rental_id:
            return {"received": True}

        try:
            rental_id = int(rental_id)

        except (ValueError, TypeError):
            return {"received": True}

        rental = db.get(Rental, rental_id)

        if rental is None:
            print(
                f"WEBHOOK: Rental #{rental_id} not found.",
                flush=True,
            )
            return {"received": True}

        # Confirm session matches booking
        if (
            rental.stripe_checkout_session_id
            != checkout_session.get("id")
        ):
            print(
                "WEBHOOK: Checkout session mismatch.",
                flush=True,
            )
            return {"received": True}

        # Confirm expected currency and amount
        expected_cents = to_cents(
            rental.total_price
        )

        if (
            checkout_session.get("currency") != "aud"
            or checkout_session.get("amount_total")
            != expected_cents
        ):
            print(
                "WEBHOOK: Payment amount mismatch.",
                flush=True,
            )
            return {"received": True}

        # Avoid duplicate processing
        if rental.payment_status == "Paid":
            return {"received": True}

        # Save successful payment
        try:
            rental.payment_status = "Paid"

            rental.stripe_payment_intent_id = (
                checkout_session.get("payment_intent")
            )

            rental.paid_at = datetime.now(
                timezone.utc
            )

            db.commit()

            print(
                f"PAYMENT SUCCESS: Rental #{rental.id}",
                flush=True,
            )

        except Exception as error:
            db.rollback()

            print(
                "WEBHOOK DATABASE ERROR:",
                repr(error),
                flush=True,
            )

            raise HTTPException(
                status_code=500,
                detail="Unable to save payment result.",
            ) from error

    return {"received": True}


# ==================================================
# PAYMENT CONFIG (lets the frontend know if Stripe is set up)
# ==================================================

@router.get("/config")
def payment_config():
    return {
        "enabled": STRIPE_SECRET_KEY.startswith("sk_test_"),
    }


# ==================================================
# VERIFY PAYMENT AFTER REDIRECT
# --------------------------------------------------
# The webhook needs the Stripe CLI to reach a laptop.
# This endpoint lets the frontend confirm the payment
# directly with Stripe when the student comes back
# from Checkout, so local demos work without it.
# ==================================================

@router.post("/verify/{rental_id}")
def verify_payment(
    rental_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not STRIPE_SECRET_KEY.startswith("sk_test_"):
        raise HTTPException(
            status_code=500,
            detail="Stripe test secret key is not configured.",
        )

    rental = db.scalar(
        select(Rental).where(
            Rental.id == rental_id,
            Rental.renter_id == current_user.id,
        )
    )

    if rental is None:
        raise HTTPException(
            status_code=404,
            detail="Rental booking not found.",
        )

    if rental.payment_status == "Paid":
        return {"payment_status": "Paid"}

    if not rental.stripe_checkout_session_id:
        raise HTTPException(
            status_code=400,
            detail="No checkout has been started for this rental.",
        )

    try:
        checkout_session = stripe.checkout.Session.retrieve(
            rental.stripe_checkout_session_id
        )
    except stripe.StripeError as error:
        raise HTTPException(
            status_code=502,
            detail="Unable to check payment with Stripe.",
        ) from error

    paid = (
        checkout_session.get("payment_status") == "paid"
        and checkout_session.get("currency") == "aud"
        and checkout_session.get("amount_total")
        == to_cents(rental.total_price)
    )

    if not paid:
        return {"payment_status": rental.payment_status}

    try:
        rental.payment_status = "Paid"
        rental.stripe_payment_intent_id = checkout_session.get(
            "payment_intent"
        )
        rental.paid_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to save payment result.",
        ) from error

    return {"payment_status": "Paid"}

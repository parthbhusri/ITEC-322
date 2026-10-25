
from pathlib import Path
from io import BytesIO

import logging

from fastapi import (
    FastAPI,
    Request,
    Response,
    Depends,
    HTTPException,
    UploadFile,
    File,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from PIL import Image, ImageOps, UnidentifiedImageError

from app.database import Base, engine, get_db
from app import models
from app.models import Item, ItemImage, Rental, User
from app.schemas import ItemCreate, ItemResponse, ItemUpdate
from app.auth import router as auth_router, get_current_user
from app.rentals import router as rentals_router
from app.stripe_payments import router as stripe_payments_router
from app.admin import router as admin_router
from app.community import router as community_router
from app.listings import remove_item
from app.origins import allowed_origin_regex, deployed_frontends, is_allowed_frontend


logger = logging.getLogger("uvicorn.error")


# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="Campus Rental Hub API",
    description=(
        "Backend API for student textbook "
        "and equipment rentals"
    ),
    version="1.0.0",
)


# ==========================================
# UNEXPECTED ERRORS
# --------------------------------------------------
# Turn a crash into a normal 500 response *inside*
# the CORS layer, so the browser can read it. Without
# this, the website only sees "can't reach the server".
# ==========================================

@app.middleware("http")
async def report_unexpected_errors(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "The server ran into a problem. Please try again."},
        )


# ==========================================
# CORS CONFIGURATION
# ==========================================

app.add_middleware(
    CORSMiddleware,
    # Allowed: the website on this computer (localhost), from another
    # device on the same Wi-Fi (192.168.x.x / 10.x.x.x / 172.16-31.x.x on
    # port 3000 or 3001), and the live website from FRONTEND_URL
    # (comma separated, '*' allowed, e.g. https://itec-322-*.vercel.app)
    allow_origin_regex=allowed_origin_regex(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shows up in the server log on start-up, to make setup problems easy to spot
logger.info("Live website address(es) allowed: %s", deployed_frontends() or "none set (FRONTEND_URL is empty)")


@app.middleware("http")
async def log_refused_websites(request: Request, call_next):
    """Log the exact address of any website the CORS rules turn away."""
    origin = request.headers.get("origin")
    if origin and not is_allowed_frontend(origin):
        logger.warning(
            "Refused a request from website %s. To allow it, add it to "
            "FRONTEND_URL (currently: %s)",
            origin,
            ", ".join(deployed_frontends()) or "empty",
        )
    return await call_next(request)


# ==========================================
# IMAGE UPLOAD CONFIGURATION
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_UPLOAD_BYTES = 5 * 1024 * 1024

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

app.mount(
    "/uploads",
    StaticFiles(directory=str(UPLOAD_DIR)),
    name="uploads",
)


# ==========================================
# DATABASE TABLES
# ==========================================

Base.metadata.create_all(bind=engine)


# ==========================================
# AUTH, RENTAL AND PAYMENT ROUTES
# ==========================================

app.include_router(auth_router)
app.include_router(rentals_router)
app.include_router(stripe_payments_router)
app.include_router(admin_router)
app.include_router(community_router)


# ==========================================
# ROOT ENDPOINT
# ==========================================

@app.get("/")
def root():
    return {
        "message": "Welcome to Campus Rental Hub API",
        "status": "running",
        "version": "1.0.0",
    }


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Campus Rental Hub API",
    }


# ==========================================
# GET ALL PRODUCTS
# ==========================================

@app.get(
    "/api/items",
    response_model=list[ItemResponse],
)
def get_items(
    db: Session = Depends(get_db),
):
    # Removed listings stay in the database (old rentals point to them)
    # but are hidden from browsing
    items = db.scalars(
        select(Item)
        .where(Item.status != "Removed")
        .order_by(Item.id.desc())
    ).all()

    return items


# ==========================================
# GET MY LISTINGS
# ==========================================

@app.get(
    "/api/items/mine",
    response_model=list[ItemResponse],
)
def get_my_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = db.scalars(
        select(Item)
        .where(
            Item.owner_id == current_user.id,
            Item.status != "Removed",
        )
        .order_by(Item.id.desc())
    ).all()

    return items


# ==========================================
# CREATE PRODUCT LISTING
# ==========================================

@app.post(
    "/api/items",
    response_model=ItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_item(
    item_data: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.university or not current_user.campus:
        raise HTTPException(
            status_code=400,
            detail=(
                "Please complete your university "
                "and campus profile before listing."
            ),
        )

    title = item_data.title.strip()

    if not title:
        raise HTTPException(
            status_code=400,
            detail="Product title cannot be empty.",
        )

    new_item = Item(
        owner_id=current_user.id,
        title=title,
        description=item_data.description,
        category=item_data.category.strip(),
        condition=item_data.condition.strip(),
        price_per_day=item_data.price_per_day,
        status="Available",
        isbn=item_data.isbn,
        university=current_user.university,
        campus=current_user.campus,
        pickup_location=item_data.pickup_location,
    )

    db.add(new_item)

    try:
        db.commit()
        db.refresh(new_item)

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to create product listing.",
        )

    return new_item


# ==========================================
# UPLOAD PRODUCT IMAGE
# ==========================================

@app.post(
    "/api/items/{item_id}/image",
    response_model=ItemResponse,
)
async def upload_item_image(
    item_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.scalar(
        select(Item).where(Item.id == item_id)
    )

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Item not found.",
        )

    if item.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the owner can upload this product image.",
        )

    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WebP images are supported.",
        )

    raw = await image.read(MAX_UPLOAD_BYTES + 1)
    await image.close()

    if not raw:
        raise HTTPException(
            status_code=400,
            detail="Image file is empty.",
        )

    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Image must be 5 MB or smaller.",
        )

    try:
        with Image.open(BytesIO(raw)) as original:
            original.verify()

        with Image.open(BytesIO(raw)) as original:
            if original.format not in ("JPEG", "PNG", "WEBP"):
                raise ValueError("Unsupported image format")

            if original.width * original.height > 20_000_000:
                raise ValueError("Image dimensions are too large")

            clean = ImageOps.exif_transpose(original)
            clean = clean.convert("RGB")
            clean.thumbnail((1600, 1600))

            output = BytesIO()

            clean.save(
                output,
                format="JPEG",
                quality=85,
                optimize=True,
            )

    except (
        UnidentifiedImageError,
        ValueError,
        OSError,
        Image.DecompressionBombError,
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid or unsupported image file.",
        )

    # Photos are stored in the database (not on disk), because hosts like
    # Render's free plan wipe the disk whenever the server restarts.
    previous_image = item.image_url
    photo = ItemImage(
        item_id=item.id,
        content=output.getvalue(),
        content_type="image/jpeg",
    )
    db.add(photo)

    try:
        db.flush()
        item.image_url = f"/api/images/{photo.id}"

        # Replace the old photo rather than keeping both
        if previous_image and previous_image.startswith("/api/images/"):
            old_id = previous_image.rsplit("/", 1)[-1]
            if old_id.isdigit():
                old = db.get(ItemImage, int(old_id))
                if old is not None and old.item_id == item.id:
                    db.delete(old)

        db.commit()
        db.refresh(item)

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to save image.",
        )

    # Tidy up a photo saved on disk by an older version
    if previous_image and previous_image.startswith("/uploads/"):
        (UPLOAD_DIR / Path(previous_image).name).unlink(missing_ok=True)

    return item


# ==========================================
# GET SINGLE PRODUCT
# ==========================================

@app.get(
    "/api/items/{item_id}",
    response_model=ItemResponse,
)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
):
    item = db.scalar(
        select(Item).where(Item.id == item_id)
    )

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Item not found.",
        )

    return item



def get_owned_item(item_id: int, db: Session, current_user: User) -> Item:
    item = db.get(Item, item_id)

    if item is None or item.status == "Removed":
        raise HTTPException(status_code=404, detail="Item not found.")

    if item.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the owner can change this listing.",
        )

    return item


# ==========================================
# EDIT A LISTING
# ==========================================

@app.patch(
    "/api/items/{item_id}",
    response_model=ItemResponse,
)
def update_item(
    item_id: int,
    item_data: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = get_owned_item(item_id, db, current_user)
    updates = item_data.model_dump(exclude_unset=True)

    for field in ("title", "category", "condition"):
        if field in updates:
            value = (updates[field] or "").strip()
            if not value:
                raise HTTPException(
                    status_code=400,
                    detail=f"{field.capitalize()} cannot be empty.",
                )
            setattr(item, field, value)

    for field in ("description", "isbn", "pickup_location"):
        if field in updates:
            value = updates[field]
            setattr(item, field, value.strip() if value and value.strip() else None)

    if updates.get("price_per_day") is not None:
        item.price_per_day = updates["price_per_day"]

    if updates.get("status") is not None:
        item.status = updates["status"]

    try:
        db.commit()
        db.refresh(item)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to update listing.",
        )

    return item


# ==========================================
# DELETE A LISTING
# ==========================================

@app.delete(
    "/api/items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = get_owned_item(item_id, db, current_user)
    remove_item(item, db)



# ==========================================
# SERVE A PRODUCT PHOTO
# ==========================================

@app.get("/api/images/{image_id}")
def get_image(image_id: int, db: Session = Depends(get_db)):
    photo = db.get(ItemImage, image_id)

    if photo is None:
        raise HTTPException(status_code=404, detail="Image not found.")

    # Each upload gets a new id, so browsers can cache it for good
    return Response(
        content=photo.content,
        media_type=photo.content_type,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )

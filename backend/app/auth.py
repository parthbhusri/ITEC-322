
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User

from app.schemas import (
    UserRegister,
    UserResponse,
    UserLogin,
    UserProfileUpdate,
    PasswordChange
)

from app.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)


# ==========================================
# AUTHENTICATION ROUTER
# ==========================================

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

bearer_scheme = HTTPBearer(auto_error=False)


# ==========================================
# STUDENT REGISTRATION
# ==========================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    email = str(user_data.email).strip().lower()

    existing_user = db.scalar(
        select(User).where(User.email == email)
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    new_user = User(
        full_name=user_data.full_name,
        email=email,
        password_hash=hash_password(user_data.password),
        is_verified=False,
        role="student",
        university=None,
        campus=None
    )

    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create account"
        )

    return new_user


# ==========================================
# STUDENT LOGIN WITH JWT
# ==========================================

@router.post("/login")
def login_user(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    email = str(login_data.email).strip().lower()

    user = db.scalar(
        select(User).where(User.email == email)
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(
        login_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(user.id)

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "full_name": user.full_name,
        "role": user.role
    }


# ==========================================
# VERIFY JWT AND GET CURRENT STUDENT
# ==========================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db)
):
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_id = decode_access_token(
        credentials.credentials
    )

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user


# ==========================================
# GET LOGGED-IN STUDENT PROFILE
# ==========================================

@router.get(
    "/me",
    response_model=UserResponse
)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


# ==========================================
# UPDATE LOGGED-IN STUDENT PROFILE
# ==========================================

@router.patch(
    "/me",
    response_model=UserResponse
)
def update_my_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only accept fields explicitly supplied
    updates = profile_data.model_dump(
        exclude_unset=True
    )

    # Validate and update full name
    if "full_name" in updates:
        new_name = updates["full_name"]

        if (
            new_name is None
            or not new_name.strip()
            or len(new_name.strip()) < 2
        ):
            raise HTTPException(
                status_code=422,
                detail="Full name must contain at least 2 characters"
            )

        current_user.full_name = new_name.strip()

    # Update university
    if "university" in updates:
        university = updates["university"]

        current_user.university = (
            university.strip()
            if university and university.strip()
            else None
        )

    # Update campus
    if "campus" in updates:
        campus = updates["campus"]

        current_user.campus = (
            campus.strip()
            if campus and campus.strip()
            else None
        )

    try:
        db.commit()
        db.refresh(current_user)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update profile"
        )

    return current_user



# ==========================================
# ADMIN-ONLY ACCESS
# ==========================================

def require_admin(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins only"
        )

    return current_user


# ==========================================
# CHANGE PASSWORD
# ==========================================

@router.post("/change-password")
def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(
        data.current_password,
        current_user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    if data.new_password == data.current_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current one"
        )

    current_user.password_hash = hash_password(data.new_password)

    try:
        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to change password"
        )

    return {"message": "Password changed"}

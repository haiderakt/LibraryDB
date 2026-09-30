import jwt
import os

from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

load_dotenv()

SECRET_KEY = os.environ["SECRET_KEY"]
REFRESH_TOKEN_SECRET = os.environ["REFRESH_TOKEN_SECRET"]
REFRESH_TOKEN_EXPIRE_DAYS = int(os.environ["REFRESH_TOKEN_EXPIRE_DAYS"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=["HS256"]
        )
        return payload

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Could not verify credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def create_access_token(username, role):
    return jwt.encode(
        {
            "username": username,
            "role": role,
            "exp": datetime.now() + timedelta(minutes=30)
        },
        SECRET_KEY,
        algorithm="HS256"
    )


def create_refresh_token(username, role):
    return jwt.encode(
        {
            "username": username,
            "role": role,
            "exp": datetime.now() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        },
        REFRESH_TOKEN_SECRET,
        algorithm="HS256"
    )

def verify_refresh_token(refresh_token):
    try:
        return jwt.decode(
            refresh_token,
            REFRESH_TOKEN_SECRET,
            algorithms=["HS256"]
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token"
        )


def required_role(*required_role: str):
    async def role_checker(user=Depends(get_current_user)):
        if user["role"] not in required_role:
            raise HTTPException(
                status_code=403,
                detail="You are not allowed to do that"
            )
        
    return role_checker
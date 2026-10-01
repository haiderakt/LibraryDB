from pydantic import BaseModel
from decimal import Decimal

class Book(BaseModel):
    title: str
    author: str
    price: Decimal

class Customer(BaseModel):
    name: str
    email: str


class RefreshRequest(BaseModel):
    refresh_token: str
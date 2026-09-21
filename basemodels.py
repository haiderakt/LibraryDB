from pydantic import BaseModel

class Book(BaseModel):
    title: str
    author: str

class Customer(BaseModel):
    name: str
    email: str


class RefreshRequest(BaseModel):
    refresh_token: str
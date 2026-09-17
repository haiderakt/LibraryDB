from psycopg_pool import AsyncConnectionPool
import psycopg
import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.environ["DATABASE_URL"]

class Queries:

    def __init__(self):
        self.pool = AsyncConnectionPool(
            conninfo=DB_URL,
            min_size=1,
            max_size=10,
        )

    async def get_books(self):
          async with self.pool.connection() as conn:
                async with conn.cursor() as cur:
                    await cur.execute("SELECT * FROM book")
                    books = await cur.fetchall()

                return books

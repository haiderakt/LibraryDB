from psycopg_pool import AsyncConnectionPool
import os
from dotenv import load_dotenv
from psycopg.rows import dict_row

load_dotenv()

DB_URL = os.environ["DATABASE_URL"]

class Queries:

    def __init__(self):
        self.pool = AsyncConnectionPool(
            conninfo=DB_URL,
            min_size=1,
            max_size=10,
            open=False
        )

    async def get_user(self, username, password): 
        async with self.pool.connection() as conn:
            conn.row_factory = dict_row

            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    SELECT * FROM users
                    WHERE username = %s
                    AND password_hash = crypt(%s, password_hash)
                    """,
                    (username,password)
                )


                results = await cur.fetchone()

        return results



    async def get_books(self):
        async with self.pool.connection() as conn:
            conn.row_factory = dict_row
                
            async with conn.cursor() as cur:
                await cur.execute("SELECT * FROM book")
                results = await cur.fetchall()

        return results

    async def search_book(self, title):
        async with self.pool.connection() as conn:
            conn.row_factory = dict_row

            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    SELECT * FROM book
                    WHERE title ILIKE %s
                    """,
                    (f"%{title}%",)
                )
                results = await cur.fetchall()

            return results

    async def create_book(self, title, author):
        async with self.pool.connection() as conn:
            conn.row_factory = dict_row

            async with conn.cursor() as cur:
                await cur.execute(
                       """
                       INSERT INTO book (title, author)
                        VALUES (%s, %s)
                        RETURNING *; 
                       """,
                       (title, author)
                  )
                results = await cur.fetchall()

            await conn.commit()
              
        return results


    async def delete_book(self, book_id):
        async with self.pool.connection() as conn:
            conn.row_factory = dict_row

            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    DELETE FROM book
                    WHERE id = %s
                    RETURNING*;
                    """,
                    (book_id,)
                )

                results = await cur.fetchall()

            await conn.commit()

        return results


    async def get_customer(self):
        async with self.pool.connection() as conn:
            conn.row_factory = dict_row

            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    SELECT * FROM customer;
                    """
                )

                results = await cur.fetchall()

        return results


    async def search_customer(self, name):
        async with self.pool.connection() as conn:
            conn.row_factory = dict_row

            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    SELECT * FROM customer
                    WHERE name ILIKE %s
                    """,
                    (f"%{name}%",)
                )
                results = await cur.fetchall()

            return results


    async def create_customer(self, name, email):
        async with self.pool.connection() as conn:
            conn.row_factory = dict_row

            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    INSERT INTO customer (name, email)
                    VALUES(%s, %s)
                    RETURNING*;
                    """,
                    (name, email)   
                )

                results = await cur.fetchall()

        return results



    async def delete_customer(self, customer_id):
        async with self.pool.connection() as conn:
            conn.row_factory = dict_row

            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    DELETE FROM customer
                    WHERE id = %s
                    RETURNING*;
                    """,
                    (customer_id,)
                )

                results = await cur.fetchall()

            await conn.commit()

        return results

    async def get_borrowing(self):
        async with self.pool.connection() as conn:
            conn.row_factory = dict_row

            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    SELECT * FROM borrowed;
                    """
                )

                result = await cur.fetchall()

        return result


    async def search_borrowing(self, customer_name):
        async with self.pool.connection() as conn:
            conn.row_factory = dict_row

            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    SELECT customer.name, book.title, borrowed.borrowed_at, borrowed.returned_at
                    FROM borrowed
                    INNER JOIN customer on borrowed.customer_id = customer.id
                    INNER JOIN book on borrowed.book_id = book.id
                    WHERE customer.name ILIKE %s
                    """,
                    (f"%{customer_name}%",)
                )

                results = await cur.fetchall()

        return results


    async def create_borrowing(self, customer_id, book_id):
        async with self.pool.connection() as conn:
            conn.row_factory = dict_row

            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    INSERT INTO borrowed (customer_id, book_id)
                    VALUES(%s, %s)
                    RETURNING*;
                    """,
                    (customer_id, book_id)
                )

                results = await cur.fetchall()

        return results


    async def return_borrowing(self, borrowed_id):
        async with self.pool.connection() as conn:
            conn.row_factory = dict_row

            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    UPDATE borrowed
                    SET returned_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING *;
                    """,
                    (borrowed_id,)
                )
                results = await cur.fetchall()

        return results




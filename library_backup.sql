--
-- PostgreSQL database dump
--

\restrict AiildSOeCMT9QAmStptdXXssfGUkAMC14jpFpHj2NN01pTF8klV7YzKHRfhDxTy

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: book; Type: TABLE; Schema: public; Owner: haider
--

CREATE TABLE public.book (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    author character varying(100) NOT NULL,
    available boolean DEFAULT true
);


ALTER TABLE public.book OWNER TO haider;

--
-- Name: book_id_seq; Type: SEQUENCE; Schema: public; Owner: haider
--

CREATE SEQUENCE public.book_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.book_id_seq OWNER TO haider;

--
-- Name: book_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: haider
--

ALTER SEQUENCE public.book_id_seq OWNED BY public.book.id;


--
-- Name: borrowed; Type: TABLE; Schema: public; Owner: haider
--

CREATE TABLE public.borrowed (
    id integer NOT NULL,
    customer_id integer,
    book_id integer,
    borrowed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    returned_at timestamp without time zone
);


ALTER TABLE public.borrowed OWNER TO haider;

--
-- Name: borrowed_id_seq; Type: SEQUENCE; Schema: public; Owner: haider
--

CREATE SEQUENCE public.borrowed_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.borrowed_id_seq OWNER TO haider;

--
-- Name: borrowed_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: haider
--

ALTER SEQUENCE public.borrowed_id_seq OWNED BY public.borrowed.id;


--
-- Name: customer; Type: TABLE; Schema: public; Owner: haider
--

CREATE TABLE public.customer (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL
);


ALTER TABLE public.customer OWNER TO haider;

--
-- Name: customer_id_seq; Type: SEQUENCE; Schema: public; Owner: haider
--

CREATE SEQUENCE public.customer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_id_seq OWNER TO haider;

--
-- Name: customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: haider
--

ALTER SEQUENCE public.customer_id_seq OWNED BY public.customer.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash text NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: book id; Type: DEFAULT; Schema: public; Owner: haider
--

ALTER TABLE ONLY public.book ALTER COLUMN id SET DEFAULT nextval('public.book_id_seq'::regclass);


--
-- Name: borrowed id; Type: DEFAULT; Schema: public; Owner: haider
--

ALTER TABLE ONLY public.borrowed ALTER COLUMN id SET DEFAULT nextval('public.borrowed_id_seq'::regclass);


--
-- Name: customer id; Type: DEFAULT; Schema: public; Owner: haider
--

ALTER TABLE ONLY public.customer ALTER COLUMN id SET DEFAULT nextval('public.customer_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: book; Type: TABLE DATA; Schema: public; Owner: haider
--

COPY public.book (id, title, author, available) FROM stdin;
1	The Hobbit	J.R.R. Tolkien	t
2	1984	George Orwell	t
3	Dune	Frank Herbert	t
\.


--
-- Data for Name: borrowed; Type: TABLE DATA; Schema: public; Owner: haider
--

COPY public.borrowed (id, customer_id, book_id, borrowed_at, returned_at) FROM stdin;
2	1	2	2026-09-18 16:05:40.579003	2026-09-18 16:24:07.855522
1	1	2	2026-09-18 16:05:34.70639	2026-09-18 16:35:58.434166
3	4	1	2026-09-21 14:12:28.892574	\N
\.


--
-- Data for Name: customer; Type: TABLE DATA; Schema: public; Owner: haider
--

COPY public.customer (id, name, email) FROM stdin;
1	Ali	ali@example.com
2	Ahmed	ahmed@example.com
4	Haider	haiderakt@gmail.com
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password_hash, role) FROM stdin;
1	haiderakt	$2a$06$ogH1cznPu630BLNJXMkTG.O962fCAmATnOMbj5fLAP00FZqu3NTwu	admin
\.


--
-- Name: book_id_seq; Type: SEQUENCE SET; Schema: public; Owner: haider
--

SELECT pg_catalog.setval('public.book_id_seq', 4, true);


--
-- Name: borrowed_id_seq; Type: SEQUENCE SET; Schema: public; Owner: haider
--

SELECT pg_catalog.setval('public.borrowed_id_seq', 3, true);


--
-- Name: customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: haider
--

SELECT pg_catalog.setval('public.customer_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: book book_pkey; Type: CONSTRAINT; Schema: public; Owner: haider
--

ALTER TABLE ONLY public.book
    ADD CONSTRAINT book_pkey PRIMARY KEY (id);


--
-- Name: borrowed borrowed_pkey; Type: CONSTRAINT; Schema: public; Owner: haider
--

ALTER TABLE ONLY public.borrowed
    ADD CONSTRAINT borrowed_pkey PRIMARY KEY (id);


--
-- Name: customer customer_email_key; Type: CONSTRAINT; Schema: public; Owner: haider
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_email_key UNIQUE (email);


--
-- Name: customer customer_pkey; Type: CONSTRAINT; Schema: public; Owner: haider
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: borrowed borrowed_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: haider
--

ALTER TABLE ONLY public.borrowed
    ADD CONSTRAINT borrowed_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.book(id);


--
-- Name: borrowed borrowed_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: haider
--

ALTER TABLE ONLY public.borrowed
    ADD CONSTRAINT borrowed_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(id);


--
-- PostgreSQL database dump complete
--

\unrestrict AiildSOeCMT9QAmStptdXXssfGUkAMC14jpFpHj2NN01pTF8klV7YzKHRfhDxTy


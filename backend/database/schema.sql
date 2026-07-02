--
-- PostgreSQL database dump
--

\restrict yYY2SREUqzmQb7y3wo8TZPODUiEGlkNgHzDmkfPb2QvDs8K7YqA4YVqaOzRHsZP

-- Dumped from database version 15.18 (Homebrew)
-- Dumped by pg_dump version 15.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: train_schedule; Type: TABLE; Schema: public; Owner: namansaini
--

CREATE TABLE public.train_schedule (
    train_no integer,
    train_name text,
    seq integer,
    station_code character varying(10),
    station_name text,
    arrival_time text,
    departure_time text,
    distance text,
    source_station character varying(10),
    source_station_name text,
    destination_station character varying(10),
    destination_station_name text
);


ALTER TABLE public.train_schedule OWNER TO namansaini;

--
-- Name: idx_seq; Type: INDEX; Schema: public; Owner: namansaini
--

CREATE INDEX idx_seq ON public.train_schedule USING btree (seq);


--
-- Name: idx_station_code; Type: INDEX; Schema: public; Owner: namansaini
--

CREATE INDEX idx_station_code ON public.train_schedule USING btree (station_code);


--
-- PostgreSQL database dump complete
--

\unrestrict yYY2SREUqzmQb7y3wo8TZPODUiEGlkNgHzDmkfPb2QvDs8K7YqA4YVqaOzRHsZP


import sqlite3
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from uuid import UUID
from app.models.entities import (
    Candidate,
    ResumeDocument,
    JobDescription,
    ProcessingJob,
    CandidateProfileEntity,
    EvidenceItemEntity,
    CandidateEvaluationEntity,
)
from app.services.database.base import Repository


def parse_dt(val: Optional[str]) -> Optional[datetime]:
    if not val:
        return None
    try:
        return datetime.fromisoformat(val)
    except Exception:
        return datetime.now(timezone.utc)


def iso_dt(dt: Optional[datetime]) -> Optional[str]:
    return dt.isoformat() if dt else None


class SQLiteRepository(Repository):
    """
    High-performance, zero-external-dependency SQLite repository.
    Enforces identical constraints, schemas, and relational invariants as the PostgreSQL migrations.
    """

    def __init__(self, db_path: str = "data/app.db"):
        self.db_path = db_path
        self._init_tables()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.row_factory = sqlite3.Row
        return conn

    def _init_tables(self):
        with self._get_connection() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS candidates (
                    id TEXT PRIMARY KEY,
                    candidate_code TEXT UNIQUE NOT NULL,
                    classification TEXT NOT NULL DEFAULT 'NEITHER_OR_UNCERTAIN',
                    processing_status TEXT NOT NULL DEFAULT 'PENDING',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS resume_documents (
                    id TEXT PRIMARY KEY,
                    candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                    original_filename TEXT NOT NULL,
                    storage_path TEXT NOT NULL,
                    mime_type TEXT NOT NULL,
                    file_size INTEGER NOT NULL,
                    file_hash TEXT UNIQUE NOT NULL,
                    page_count INTEGER,
                    raw_text TEXT,
                    normalized_text TEXT,
                    parser_name TEXT,
                    parser_version TEXT,
                    extraction_status TEXT DEFAULT 'PENDING',
                    extraction_warnings TEXT DEFAULT '[]',
                    extracted_at TEXT,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS job_descriptions (
                    id TEXT PRIMARY KEY,
                    role_key TEXT UNIQUE NOT NULL,
                    title TEXT NOT NULL,
                    source_text TEXT NOT NULL,
                    requirements TEXT NOT NULL DEFAULT '{}',
                    version TEXT NOT NULL DEFAULT '1.0',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS processing_jobs (
                    id TEXT PRIMARY KEY,
                    candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                    status TEXT NOT NULL DEFAULT 'PENDING',
                    stage TEXT NOT NULL DEFAULT 'INGESTION',
                    attempt_count INTEGER NOT NULL DEFAULT 1,
                    error_code TEXT,
                    error_message_safe TEXT,
                    started_at TEXT NOT NULL,
                    completed_at TEXT
                );

                CREATE TABLE IF NOT EXISTS candidate_profiles (
                    id TEXT PRIMARY KEY,
                    candidate_id TEXT UNIQUE NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                    profile_json TEXT NOT NULL,
                    schema_version TEXT NOT NULL DEFAULT '1.0',
                    model_provider TEXT NOT NULL,
                    model_name TEXT NOT NULL,
                    prompt_version TEXT NOT NULL DEFAULT '1.0',
                    extraction_confidence REAL NOT NULL DEFAULT 1.0,
                    validation_status TEXT NOT NULL DEFAULT 'VALIDATED',
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS evidence_items (
                    id TEXT PRIMARY KEY,
                    candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                    field_key TEXT NOT NULL,
                    evidence_text TEXT NOT NULL,
                    page_number INTEGER,
                    is_verified INTEGER NOT NULL DEFAULT 1,
                    validation_status TEXT NOT NULL DEFAULT 'VERIFIED',
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS candidate_evaluations (
                    id TEXT PRIMARY KEY,
                    candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                    role_key TEXT NOT NULL,
                    score REAL,
                    scoring_version TEXT NOT NULL DEFAULT '1.0',
                    breakdown TEXT NOT NULL DEFAULT '{}',
                    is_qualified INTEGER NOT NULL DEFAULT 0,
                    qualification_status TEXT NOT NULL DEFAULT 'UNQUALIFIED',
                    summary TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(candidate_id, role_key)
                );

                CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(processing_status);
                CREATE INDEX IF NOT EXISTS idx_candidates_code ON candidates(candidate_code);
                CREATE INDEX IF NOT EXISTS idx_resume_documents_hash ON resume_documents(file_hash);
                CREATE INDEX IF NOT EXISTS idx_processing_jobs_candidate ON processing_jobs(candidate_id);
                CREATE INDEX IF NOT EXISTS idx_candidate_profiles_candidate ON candidate_profiles(candidate_id);
                CREATE INDEX IF NOT EXISTS idx_evidence_items_candidate ON evidence_items(candidate_id);
                CREATE INDEX IF NOT EXISTS idx_candidate_evaluations_role ON candidate_evaluations(role_key);
                CREATE INDEX IF NOT EXISTS idx_candidate_evaluations_candidate ON candidate_evaluations(candidate_id);
                """
            )
            # Ensure columns exist if table was previously created
            for col, col_type in [
                ("raw_text", "TEXT"),
                ("normalized_text", "TEXT"),
                ("parser_name", "TEXT"),
                ("parser_version", "TEXT"),
                ("extraction_status", "TEXT DEFAULT 'PENDING'"),
                ("extraction_warnings", "TEXT DEFAULT '[]'"),
                ("extracted_at", "TEXT"),
            ]:
                try:
                    conn.execute(f"ALTER TABLE resume_documents ADD COLUMN {col} {col_type}")
                except sqlite3.OperationalError:
                    pass  # Column already exists

            for col, col_type in [
                ("lca_score", "REAL"),
                ("uiux_score", "REAL"),
            ]:
                try:
                    conn.execute(f"ALTER TABLE candidates ADD COLUMN {col} {col_type}")
                except sqlite3.OperationalError:
                    pass  # Column already exists

    def create_candidate(self, candidate: Candidate) -> Candidate:
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO candidates (id, candidate_code, classification, processing_status, lca_score, uiux_score, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(candidate.id),
                    candidate.candidate_code,
                    candidate.classification,
                    candidate.processing_status,
                    candidate.lca_score,
                    candidate.uiux_score,
                    iso_dt(candidate.created_at),
                    iso_dt(candidate.updated_at),
                ),
            )
        return candidate

    def _row_to_candidate(self, row: sqlite3.Row) -> Candidate:
        keys = row.keys()
        return Candidate(
            id=UUID(row["id"]),
            candidate_code=row["candidate_code"],
            classification=row["classification"],
            processing_status=row["processing_status"],
            lca_score=row["lca_score"] if "lca_score" in keys else None,
            uiux_score=row["uiux_score"] if "uiux_score" in keys else None,
            created_at=parse_dt(row["created_at"]),
            updated_at=parse_dt(row["updated_at"]),
        )

    def get_candidate_by_id(self, candidate_id: UUID) -> Optional[Candidate]:
        with self._get_connection() as conn:
            cur = conn.execute("SELECT * FROM candidates WHERE id = ?", (str(candidate_id),))
            row = cur.fetchone()
            if not row:
                return None
            return self._row_to_candidate(row)

    def get_candidate_by_code(self, candidate_code: str) -> Optional[Candidate]:
        with self._get_connection() as conn:
            cur = conn.execute(
                "SELECT * FROM candidates WHERE candidate_code = ?", (candidate_code,)
            )
            row = cur.fetchone()
            if not row:
                return None
            return self._row_to_candidate(row)

    def get_candidate_count(self) -> int:
        with self._get_connection() as conn:
            cur = conn.execute("SELECT COUNT(*) as count FROM candidates")
            return cur.fetchone()["count"]

    def list_candidates(self, limit: int = 100, offset: int = 0) -> List[Candidate]:
        with self._get_connection() as conn:
            cur = conn.execute(
                "SELECT * FROM candidates ORDER BY created_at ASC LIMIT ? OFFSET ?", (limit, offset)
            )
            rows = cur.fetchall()
            return [self._row_to_candidate(r) for r in rows]

    def _row_to_document(self, row: sqlite3.Row) -> ResumeDocument:
        keys = row.keys()
        warnings = []
        if "extraction_warnings" in keys and row["extraction_warnings"]:
            try:
                warnings = json.loads(row["extraction_warnings"])
            except Exception:
                warnings = []
        return ResumeDocument(
            id=UUID(row["id"]),
            candidate_id=UUID(row["candidate_id"]),
            original_filename=row["original_filename"],
            storage_path=row["storage_path"],
            mime_type=row["mime_type"],
            file_size=row["file_size"],
            file_hash=row["file_hash"],
            page_count=row["page_count"] if "page_count" in keys else None,
            raw_text=row["raw_text"] if "raw_text" in keys else None,
            normalized_text=row["normalized_text"] if "normalized_text" in keys else None,
            parser_name=row["parser_name"] if "parser_name" in keys else None,
            parser_version=row["parser_version"] if "parser_version" in keys else None,
            extraction_status=row["extraction_status"] if "extraction_status" in keys else "PENDING",
            extraction_warnings=warnings,
            extracted_at=parse_dt(row["extracted_at"]) if "extracted_at" in keys else None,
            created_at=parse_dt(row["created_at"]),
        )

    def create_resume_document(self, document: ResumeDocument) -> ResumeDocument:
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO resume_documents (
                    id, candidate_id, original_filename, storage_path, mime_type,
                    file_size, file_hash, page_count, raw_text, normalized_text,
                    parser_name, parser_version, extraction_status, extraction_warnings,
                    extracted_at, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(document.id),
                    str(document.candidate_id),
                    document.original_filename,
                    document.storage_path,
                    document.mime_type,
                    document.file_size,
                    document.file_hash,
                    document.page_count,
                    document.raw_text,
                    document.normalized_text,
                    document.parser_name,
                    document.parser_version,
                    document.extraction_status,
                    json.dumps(document.extraction_warnings),
                    iso_dt(document.extracted_at),
                    iso_dt(document.created_at),
                ),
            )
        return document

    def update_resume_document_extraction(
        self,
        doc_id: UUID,
        raw_text: str,
        normalized_text: str,
        parser_name: str,
        parser_version: str,
        page_count: Optional[int],
        status: str,
        warnings: List[str],
    ) -> bool:
        with self._get_connection() as conn:
            cur = conn.execute(
                """
                UPDATE resume_documents
                SET raw_text = ?, normalized_text = ?, parser_name = ?,
                    parser_version = ?, page_count = ?, extraction_status = ?,
                    extraction_warnings = ?, extracted_at = ?
                WHERE id = ?
                """,
                (
                    raw_text,
                    normalized_text,
                    parser_name,
                    parser_version,
                    page_count,
                    status,
                    json.dumps(warnings),
                    iso_dt(datetime.now(timezone.utc)),
                    str(doc_id),
                ),
            )
            return cur.rowcount > 0

    def update_candidate_status(
        self,
        candidate_id: UUID,
        processing_status: str,
        classification: Optional[str] = None,
    ) -> bool:
        with self._get_connection() as conn:
            now_iso = iso_dt(datetime.now(timezone.utc))
            if classification:
                cur = conn.execute(
                    """
                    UPDATE candidates
                    SET processing_status = ?, classification = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (processing_status, classification, now_iso, str(candidate_id)),
                )
            else:
                cur = conn.execute(
                    """
                    UPDATE candidates
                    SET processing_status = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (processing_status, now_iso, str(candidate_id)),
                )
            return cur.rowcount > 0

    def get_document_by_hash(self, file_hash: str) -> Optional[ResumeDocument]:
        with self._get_connection() as conn:
            cur = conn.execute("SELECT * FROM resume_documents WHERE file_hash = ?", (file_hash,))
            row = cur.fetchone()
            if not row:
                return None
            return self._row_to_document(row)

    def get_document_by_candidate_id(self, candidate_id: UUID) -> Optional[ResumeDocument]:
        with self._get_connection() as conn:
            cur = conn.execute(
                "SELECT * FROM resume_documents WHERE candidate_id = ?", (str(candidate_id),)
            )
            row = cur.fetchone()
            if not row:
                return None
            return self._row_to_document(row)

    def create_processing_job(self, job: ProcessingJob) -> ProcessingJob:
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO processing_jobs (id, candidate_id, status, stage, attempt_count, error_code, error_message_safe, started_at, completed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(job.id),
                    str(job.candidate_id),
                    job.status,
                    job.stage,
                    job.attempt_count,
                    job.error_code,
                    job.error_message_safe,
                    iso_dt(job.started_at),
                    iso_dt(job.completed_at),
                ),
            )
        return job

    def get_latest_job_for_candidate(self, candidate_id: UUID) -> Optional[ProcessingJob]:
        with self._get_connection() as conn:
            cur = conn.execute(
                "SELECT * FROM processing_jobs WHERE candidate_id = ? ORDER BY started_at DESC LIMIT 1",
                (str(candidate_id),),
            )
            row = cur.fetchone()
            if not row:
                return None
            return ProcessingJob(
                id=UUID(row["id"]),
                candidate_id=UUID(row["candidate_id"]),
                status=row["status"],
                stage=row["stage"],
                attempt_count=row["attempt_count"],
                error_code=row["error_code"],
                error_message_safe=row["error_message_safe"],
                started_at=parse_dt(row["started_at"]),
                completed_at=parse_dt(row["completed_at"]),
            )

    def update_processing_job(self, job: ProcessingJob) -> ProcessingJob:
        with self._get_connection() as conn:
            conn.execute(
                """
                UPDATE processing_jobs
                SET status = ?, stage = ?, attempt_count = ?, error_code = ?, error_message_safe = ?, completed_at = ?
                WHERE id = ?
                """,
                (
                    job.status,
                    job.stage,
                    job.attempt_count,
                    job.error_code,
                    job.error_message_safe,
                    iso_dt(job.completed_at),
                    str(job.id),
                ),
            )
        return job

    def upsert_job_description(self, jd: JobDescription) -> JobDescription:
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO job_descriptions (id, role_key, title, source_text, requirements, version, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(role_key) DO UPDATE SET
                    title = excluded.title,
                    source_text = excluded.source_text,
                    requirements = excluded.requirements,
                    version = excluded.version,
                    updated_at = excluded.updated_at
                """,
                (
                    str(jd.id),
                    jd.role_key,
                    jd.title,
                    jd.source_text,
                    json.dumps(jd.requirements),
                    jd.version,
                    iso_dt(jd.created_at),
                    iso_dt(jd.updated_at),
                ),
            )
        return jd

    def get_job_description_by_role(self, role_key: str) -> Optional[JobDescription]:
        with self._get_connection() as conn:
            cur = conn.execute(
                "SELECT * FROM job_descriptions WHERE role_key = ?", (role_key,)
            )
            row = cur.fetchone()
            if not row:
                return None
            return JobDescription(
                id=UUID(row["id"]),
                role_key=row["role_key"],
                title=row["title"],
                source_text=row["source_text"],
                requirements=json.loads(row["requirements"] or "{}"),
                version=row["version"],
                created_at=parse_dt(row["created_at"]),
                updated_at=parse_dt(row["updated_at"]),
            )

    def delete_candidate(self, candidate_id: UUID) -> bool:
        with self._get_connection() as conn:
            cur = conn.execute("DELETE FROM candidates WHERE id = ?", (str(candidate_id),))
            return cur.rowcount > 0

    def save_candidate_profile(
        self, profile_entity: CandidateProfileEntity
    ) -> CandidateProfileEntity:
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO candidate_profiles (
                    id, candidate_id, profile_json, schema_version, model_provider,
                    model_name, prompt_version, extraction_confidence, validation_status, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(candidate_id) DO UPDATE SET
                    profile_json = excluded.profile_json,
                    schema_version = excluded.schema_version,
                    model_provider = excluded.model_provider,
                    model_name = excluded.model_name,
                    prompt_version = excluded.prompt_version,
                    extraction_confidence = excluded.extraction_confidence,
                    validation_status = excluded.validation_status
                """,
                (
                    str(profile_entity.id),
                    str(profile_entity.candidate_id),
                    json.dumps(profile_entity.profile_json),
                    profile_entity.schema_version,
                    profile_entity.model_provider,
                    profile_entity.model_name,
                    profile_entity.prompt_version,
                    profile_entity.extraction_confidence,
                    profile_entity.validation_status,
                    iso_dt(profile_entity.created_at),
                ),
            )
        return profile_entity

    def get_candidate_profile(
        self, candidate_id: UUID
    ) -> Optional[CandidateProfileEntity]:
        with self._get_connection() as conn:
            cur = conn.execute(
                "SELECT * FROM candidate_profiles WHERE candidate_id = ?",
                (str(candidate_id),),
            )
            row = cur.fetchone()
            if not row:
                return None
            return CandidateProfileEntity(
                id=UUID(row["id"]),
                candidate_id=UUID(row["candidate_id"]),
                profile_json=json.loads(row["profile_json"]),
                schema_version=row["schema_version"],
                model_provider=row["model_provider"],
                model_name=row["model_name"],
                prompt_version=row["prompt_version"],
                extraction_confidence=row["extraction_confidence"],
                validation_status=row["validation_status"],
                created_at=parse_dt(row["created_at"]),
            )

    def save_evidence_items(
        self, candidate_id: UUID, items: List[EvidenceItemEntity]
    ) -> List[EvidenceItemEntity]:
        with self._get_connection() as conn:
            conn.execute("DELETE FROM evidence_items WHERE candidate_id = ?", (str(candidate_id),))
            for item in items:
                conn.execute(
                    """
                    INSERT INTO evidence_items (
                        id, candidate_id, field_key, evidence_text, page_number,
                        is_verified, validation_status, created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(item.id),
                        str(candidate_id),
                        item.field_key,
                        item.evidence_text,
                        item.page_number,
                        1 if item.is_verified else 0,
                        item.validation_status,
                        iso_dt(item.created_at),
                    ),
                )
        return items

    def get_evidence_items(
        self, candidate_id: UUID
    ) -> List[EvidenceItemEntity]:
        with self._get_connection() as conn:
            cur = conn.execute(
                "SELECT * FROM evidence_items WHERE candidate_id = ? ORDER BY field_key ASC",
                (str(candidate_id),),
            )
            rows = cur.fetchall()
            return [
                EvidenceItemEntity(
                    id=UUID(r["id"]),
                    candidate_id=UUID(r["candidate_id"]),
                    field_key=r["field_key"],
                    evidence_text=r["evidence_text"],
                    page_number=r["page_number"],
                    is_verified=bool(r["is_verified"]),
                    validation_status=r["validation_status"],
                    created_at=parse_dt(r["created_at"]),
                )
                for r in rows
            ]

    def save_candidate_evaluation(
        self, eval_entity: CandidateEvaluationEntity
    ) -> CandidateEvaluationEntity:
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO candidate_evaluations (
                    id, candidate_id, role_key, score, scoring_version,
                    breakdown, is_qualified, qualification_status, summary, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(candidate_id, role_key) DO UPDATE SET
                    score = excluded.score,
                    scoring_version = excluded.scoring_version,
                    breakdown = excluded.breakdown,
                    is_qualified = excluded.is_qualified,
                    qualification_status = excluded.qualification_status,
                    summary = excluded.summary,
                    updated_at = excluded.updated_at
                """,
                (
                    str(eval_entity.id),
                    str(eval_entity.candidate_id),
                    eval_entity.role_key,
                    eval_entity.score,
                    eval_entity.scoring_version,
                    json.dumps(eval_entity.breakdown),
                    1 if eval_entity.is_qualified else 0,
                    eval_entity.qualification_status,
                    eval_entity.summary,
                    iso_dt(eval_entity.created_at),
                    iso_dt(eval_entity.updated_at),
                ),
            )
        return eval_entity

    def get_candidate_evaluations(
        self, candidate_id: UUID
    ) -> List[CandidateEvaluationEntity]:
        with self._get_connection() as conn:
            cur = conn.execute(
                "SELECT * FROM candidate_evaluations WHERE candidate_id = ?",
                (str(candidate_id),),
            )
            rows = cur.fetchall()
            return [
                CandidateEvaluationEntity(
                    id=UUID(r["id"]),
                    candidate_id=UUID(r["candidate_id"]),
                    role_key=r["role_key"],
                    score=r["score"],
                    scoring_version=r["scoring_version"],
                    breakdown=json.loads(r["breakdown"] or "{}"),
                    is_qualified=bool(r["is_qualified"]),
                    qualification_status=r["qualification_status"],
                    summary=r["summary"],
                    created_at=parse_dt(r["created_at"]),
                    updated_at=parse_dt(r["updated_at"]),
                )
                for r in rows
            ]

    def get_evaluations_by_role(
        self, role_key: str
    ) -> List[CandidateEvaluationEntity]:
        with self._get_connection() as conn:
            cur = conn.execute(
                "SELECT * FROM candidate_evaluations WHERE role_key = ?",
                (role_key,),
            )
            rows = cur.fetchall()
            return [
                CandidateEvaluationEntity(
                    id=UUID(r["id"]),
                    candidate_id=UUID(r["candidate_id"]),
                    role_key=r["role_key"],
                    score=r["score"],
                    scoring_version=r["scoring_version"],
                    breakdown=json.loads(r["breakdown"] or "{}"),
                    is_qualified=bool(r["is_qualified"]),
                    qualification_status=r["qualification_status"],
                    summary=r["summary"],
                    created_at=parse_dt(r["created_at"]),
                    updated_at=parse_dt(r["updated_at"]),
                )
                for r in rows
            ]

    def update_candidate_scores_and_classification(
        self,
        candidate_id: UUID,
        lca_score: Optional[float],
        uiux_score: Optional[float],
        classification: str,
    ) -> bool:
        with self._get_connection() as conn:
            cur = conn.execute(
                """
                UPDATE candidates
                SET lca_score = ?, uiux_score = ?, classification = ?, updated_at = ?
                WHERE id = ?
                """,
                (
                    lca_score,
                    uiux_score,
                    classification,
                    iso_dt(datetime.now(timezone.utc)),
                    str(candidate_id),
                ),
            )
            return cur.rowcount > 0

    def check_health(self) -> Dict[str, Any]:
        try:
            with self._get_connection() as conn:
                conn.execute("SELECT 1")
            return {
                "status": "connected",
                "engine": "sqlite",
                "path": self.db_path,
            }
        except Exception as e:
            return {"status": "error", "error": str(e), "engine": "sqlite"}


from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from supabase import create_client, Client
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


class SupabaseRepository(Repository):
    """
    Supabase PostgreSQL repository.
    Interacts with Supabase tables using the service-role client.
    """

    def __init__(self, supabase_url: str, service_role_key: str):
        self.client: Client = create_client(supabase_url, service_role_key)

    def create_candidate(self, candidate: Candidate) -> Candidate:
        data = {
            "id": str(candidate.id),
            "candidate_code": candidate.candidate_code,
            "classification": candidate.classification,
            "processing_status": candidate.processing_status,
            "lca_score": candidate.lca_score,
            "uiux_score": candidate.uiux_score,
            "created_at": candidate.created_at.isoformat(),
            "updated_at": candidate.updated_at.isoformat(),
        }
        self.client.table("candidates").insert(data).execute()
        return candidate

    def _row_to_candidate(self, row: dict) -> Candidate:
        return Candidate(
            id=UUID(row["id"]),
            candidate_code=row["candidate_code"],
            classification=row["classification"],
            processing_status=row["processing_status"],
            lca_score=row.get("lca_score"),
            uiux_score=row.get("uiux_score"),
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
        )

    def get_candidate_by_id(self, candidate_id: UUID) -> Optional[Candidate]:
        res = (
            self.client.table("candidates")
            .select("*")
            .eq("id", str(candidate_id))
            .limit(1)
            .execute()
        )
        if not res.data:
            return None
        return self._row_to_candidate(res.data[0])

    def get_candidate_by_code(self, candidate_code: str) -> Optional[Candidate]:
        res = (
            self.client.table("candidates")
            .select("*")
            .eq("candidate_code", candidate_code)
            .limit(1)
            .execute()
        )
        if not res.data:
            return None
        return self._row_to_candidate(res.data[0])

    def get_candidate_count(self) -> int:
        res = (
            self.client.table("candidates")
            .select("id", count="exact")
            .execute()
        )
        return res.count or len(res.data)

    def list_candidates(self, limit: int = 100, offset: int = 0) -> List[Candidate]:
        res = (
            self.client.table("candidates")
            .select("*")
            .range(offset, offset + limit - 1)
            .order("created_at", desc=False)
            .execute()
        )
        return [self._row_to_candidate(r) for r in res.data]
            .execute()
        )
        return [
            Candidate(
                id=UUID(r["id"]),
                candidate_code=r["candidate_code"],
                classification=r["classification"],
                processing_status=r["processing_status"],
                created_at=datetime.fromisoformat(r["created_at"]),
                updated_at=datetime.fromisoformat(r["updated_at"]),
            )
            for r in res.data
        ]

    def create_resume_document(self, document: ResumeDocument) -> ResumeDocument:
        data = {
            "id": str(document.id),
            "candidate_id": str(document.candidate_id),
            "original_filename": document.original_filename,
            "storage_path": document.storage_path,
            "mime_type": document.mime_type,
            "file_size": document.file_size,
            "file_hash": document.file_hash,
            "page_count": document.page_count,
            "raw_text": document.raw_text,
            "normalized_text": document.normalized_text,
            "parser_name": document.parser_name,
            "parser_version": document.parser_version,
            "extraction_status": document.extraction_status,
            "extraction_warnings": document.extraction_warnings,
            "extracted_at": document.extracted_at.isoformat() if document.extracted_at else None,
            "created_at": document.created_at.isoformat(),
        }
        self.client.table("resume_documents").insert(data).execute()
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
        data = {
            "raw_text": raw_text,
            "normalized_text": normalized_text,
            "parser_name": parser_name,
            "parser_version": parser_version,
            "page_count": page_count,
            "extraction_status": status,
            "extraction_warnings": warnings,
            "extracted_at": datetime.now(timezone.utc).isoformat(),
        }
        res = self.client.table("resume_documents").update(data).eq("id", str(doc_id)).execute()
        return len(res.data) > 0

    def update_candidate_status(
        self,
        candidate_id: UUID,
        processing_status: str,
        classification: Optional[str] = None,
    ) -> bool:
        data = {
            "processing_status": processing_status,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        if classification:
            data["classification"] = classification
        res = self.client.table("candidates").update(data).eq("id", str(candidate_id)).execute()
        return len(res.data) > 0

    def get_document_by_hash(self, file_hash: str) -> Optional[ResumeDocument]:
        res = (
            self.client.table("resume_documents")
            .select("*")
            .eq("file_hash", file_hash)
            .limit(1)
            .execute()
        )
        if not res.data:
            return None
        row = res.data[0]
        return ResumeDocument(
            id=UUID(row["id"]),
            candidate_id=UUID(row["candidate_id"]),
            original_filename=row["original_filename"],
            storage_path=row["storage_path"],
            mime_type=row["mime_type"],
            file_size=row["file_size"],
            file_hash=row["file_hash"],
            page_count=row.get("page_count"),
            raw_text=row.get("raw_text"),
            normalized_text=row.get("normalized_text"),
            parser_name=row.get("parser_name"),
            parser_version=row.get("parser_version"),
            extraction_status=row.get("extraction_status", "PENDING"),
            extraction_warnings=row.get("extraction_warnings", []),
            extracted_at=datetime.fromisoformat(row["extracted_at"])
            if row.get("extracted_at")
            else None,
            created_at=datetime.fromisoformat(row["created_at"]),
        )

    def get_document_by_candidate_id(self, candidate_id: UUID) -> Optional[ResumeDocument]:
        res = (
            self.client.table("resume_documents")
            .select("*")
            .eq("candidate_id", str(candidate_id))
            .limit(1)
            .execute()
        )
        if not res.data:
            return None
        row = res.data[0]
        return ResumeDocument(
            id=UUID(row["id"]),
            candidate_id=UUID(row["candidate_id"]),
            original_filename=row["original_filename"],
            storage_path=row["storage_path"],
            mime_type=row["mime_type"],
            file_size=row["file_size"],
            file_hash=row["file_hash"],
            page_count=row.get("page_count"),
            raw_text=row.get("raw_text"),
            normalized_text=row.get("normalized_text"),
            parser_name=row.get("parser_name"),
            parser_version=row.get("parser_version"),
            extraction_status=row.get("extraction_status", "PENDING"),
            extraction_warnings=row.get("extraction_warnings", []),
            extracted_at=datetime.fromisoformat(row["extracted_at"])
            if row.get("extracted_at")
            else None,
            created_at=datetime.fromisoformat(row["created_at"]),
        )

    def create_processing_job(self, job: ProcessingJob) -> ProcessingJob:
        data = {
            "id": str(job.id),
            "candidate_id": str(job.candidate_id),
            "status": job.status,
            "stage": job.stage,
            "attempt_count": job.attempt_count,
            "error_code": job.error_code,
            "error_message_safe": job.error_message_safe,
            "started_at": job.started_at.isoformat(),
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        }
        self.client.table("processing_jobs").insert(data).execute()
        return job

    def get_latest_job_for_candidate(self, candidate_id: UUID) -> Optional[ProcessingJob]:
        res = (
            self.client.table("processing_jobs")
            .select("*")
            .eq("candidate_id", str(candidate_id))
            .order("started_at", desc=True)
            .limit(1)
            .execute()
        )
        if not res.data:
            return None
        row = res.data[0]
        return ProcessingJob(
            id=UUID(row["id"]),
            candidate_id=UUID(row["candidate_id"]),
            status=row["status"],
            stage=row["stage"],
            attempt_count=row["attempt_count"],
            error_code=row.get("error_code"),
            error_message_safe=row.get("error_message_safe"),
            started_at=datetime.fromisoformat(row["started_at"]),
            completed_at=datetime.fromisoformat(row["completed_at"])
            if row.get("completed_at")
            else None,
        )

    def update_processing_job(self, job: ProcessingJob) -> ProcessingJob:
        data = {
            "status": job.status,
            "stage": job.stage,
            "attempt_count": job.attempt_count,
            "error_code": job.error_code,
            "error_message_safe": job.error_message_safe,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        }
        self.client.table("processing_jobs").update(data).eq("id", str(job.id)).execute()
        return job

    def upsert_job_description(self, jd: JobDescription) -> JobDescription:
        data = {
            "id": str(jd.id),
            "role_key": jd.role_key,
            "title": jd.title,
            "source_text": jd.source_text,
            "requirements": jd.requirements,
            "version": jd.version,
            "created_at": jd.created_at.isoformat(),
            "updated_at": jd.updated_at.isoformat(),
        }
        self.client.table("job_descriptions").upsert(data, on_conflict="role_key").execute()
        return jd

    def get_job_description_by_role(self, role_key: str) -> Optional[JobDescription]:
        res = (
            self.client.table("job_descriptions")
            .select("*")
            .eq("role_key", role_key)
            .limit(1)
            .execute()
        )
        if not res.data:
            return None
        row = res.data[0]
        return JobDescription(
            id=UUID(row["id"]),
            role_key=row["role_key"],
            title=row["title"],
            source_text=row["source_text"],
            requirements=row.get("requirements", {}),
            version=row.get("version", "1.0"),
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
        )

    def delete_candidate(self, candidate_id: UUID) -> bool:
        res = (
            self.client.table("candidates")
            .delete()
            .eq("id", str(candidate_id))
            .execute()
        )
        return len(res.data) > 0

    def save_candidate_profile(
        self, profile_entity: CandidateProfileEntity
    ) -> CandidateProfileEntity:
        data = {
            "id": str(profile_entity.id),
            "candidate_id": str(profile_entity.candidate_id),
            "profile_json": profile_entity.profile_json,
            "schema_version": profile_entity.schema_version,
            "model_provider": profile_entity.model_provider,
            "model_name": profile_entity.model_name,
            "prompt_version": profile_entity.prompt_version,
            "extraction_confidence": profile_entity.extraction_confidence,
            "validation_status": profile_entity.validation_status,
            "created_at": profile_entity.created_at.isoformat(),
        }
        self.client.table("candidate_profiles").upsert(data, on_conflict="candidate_id").execute()
        return profile_entity

    def get_candidate_profile(
        self, candidate_id: UUID
    ) -> Optional[CandidateProfileEntity]:
        res = (
            self.client.table("candidate_profiles")
            .select("*")
            .eq("candidate_id", str(candidate_id))
            .limit(1)
            .execute()
        )
        if not res.data:
            return None
        row = res.data[0]
        return CandidateProfileEntity(
            id=UUID(row["id"]),
            candidate_id=UUID(row["candidate_id"]),
            profile_json=row["profile_json"],
            schema_version=row["schema_version"],
            model_provider=row["model_provider"],
            model_name=row["model_name"],
            prompt_version=row["prompt_version"],
            extraction_confidence=row["extraction_confidence"],
            validation_status=row["validation_status"],
            created_at=datetime.fromisoformat(row["created_at"]),
        )

    def save_evidence_items(
        self, candidate_id: UUID, items: List[EvidenceItemEntity]
    ) -> List[EvidenceItemEntity]:
        # Delete old items
        self.client.table("evidence_items").delete().eq("candidate_id", str(candidate_id)).execute()
        if items:
            data = [
                {
                    "id": str(item.id),
                    "candidate_id": str(candidate_id),
                    "field_key": item.field_key,
                    "evidence_text": item.evidence_text,
                    "page_number": item.page_number,
                    "is_verified": item.is_verified,
                    "validation_status": item.validation_status,
                    "created_at": item.created_at.isoformat(),
                }
                for item in items
            ]
            self.client.table("evidence_items").insert(data).execute()
        return items

    def get_evidence_items(
        self, candidate_id: UUID
    ) -> List[EvidenceItemEntity]:
        res = (
            self.client.table("evidence_items")
            .select("*")
            .eq("candidate_id", str(candidate_id))
            .order("field_key", desc=False)
            .execute()
        )
        return [
            EvidenceItemEntity(
                id=UUID(r["id"]),
                candidate_id=UUID(r["candidate_id"]),
                field_key=r["field_key"],
                evidence_text=r["evidence_text"],
                page_number=r.get("page_number"),
                is_verified=bool(r["is_verified"]),
                validation_status=r.get("validation_status", "VERIFIED"),
                created_at=datetime.fromisoformat(r["created_at"]),
            )
            for r in res.data
        ]

    def save_candidate_evaluation(
        self, eval_entity: CandidateEvaluationEntity
    ) -> CandidateEvaluationEntity:
        data = {
            "id": str(eval_entity.id),
            "candidate_id": str(eval_entity.candidate_id),
            "role_key": eval_entity.role_key,
            "score": eval_entity.score,
            "scoring_version": eval_entity.scoring_version,
            "breakdown": eval_entity.breakdown,
            "is_qualified": eval_entity.is_qualified,
            "qualification_status": eval_entity.qualification_status,
            "summary": eval_entity.summary,
            "created_at": eval_entity.created_at.isoformat(),
            "updated_at": eval_entity.updated_at.isoformat(),
        }
        self.client.table("candidate_evaluations").upsert(
            data, on_conflict="candidate_id,role_key"
        ).execute()
        return eval_entity

    def get_candidate_evaluations(
        self, candidate_id: UUID
    ) -> List[CandidateEvaluationEntity]:
        res = (
            self.client.table("candidate_evaluations")
            .select("*")
            .eq("candidate_id", str(candidate_id))
            .execute()
        )
        return [
            CandidateEvaluationEntity(
                id=UUID(r["id"]),
                candidate_id=UUID(r["candidate_id"]),
                role_key=r["role_key"],
                score=r.get("score"),
                scoring_version=r.get("scoring_version", "1.0"),
                breakdown=r.get("breakdown", {}),
                is_qualified=bool(r.get("is_qualified", False)),
                qualification_status=r.get("qualification_status", "UNQUALIFIED"),
                summary=r.get("summary"),
                created_at=datetime.fromisoformat(r["created_at"]),
                updated_at=datetime.fromisoformat(r["updated_at"]),
            )
            for r in res.data
        ]

    def get_evaluations_by_role(
        self, role_key: str
    ) -> List[CandidateEvaluationEntity]:
        res = (
            self.client.table("candidate_evaluations")
            .select("*")
            .eq("role_key", role_key)
            .execute()
        )
        return [
            CandidateEvaluationEntity(
                id=UUID(r["id"]),
                candidate_id=UUID(r["candidate_id"]),
                role_key=r["role_key"],
                score=r.get("score"),
                scoring_version=r.get("scoring_version", "1.0"),
                breakdown=r.get("breakdown", {}),
                is_qualified=bool(r.get("is_qualified", False)),
                qualification_status=r.get("qualification_status", "UNQUALIFIED"),
                summary=r.get("summary"),
                created_at=datetime.fromisoformat(r["created_at"]),
                updated_at=datetime.fromisoformat(r["updated_at"]),
            )
            for r in res.data
        ]

    def update_candidate_scores_and_classification(
        self,
        candidate_id: UUID,
        lca_score: Optional[float],
        uiux_score: Optional[float],
        classification: str,
    ) -> bool:
        data = {
            "lca_score": lca_score,
            "uiux_score": uiux_score,
            "classification": classification,
            "updated_at": datetime.now().isoformat(),
        }
        res = self.client.table("candidates").update(data).eq("id", str(candidate_id)).execute()
        return bool(res.data)

    def check_health(self) -> Dict[str, Any]:
        try:
            res = self.client.table("candidates").select("id").limit(1).execute()
            return {"status": "connected", "engine": "supabase"}
        except Exception as e:
            return {"status": "error", "error": str(e), "engine": "supabase"}


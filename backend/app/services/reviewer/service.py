import math
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from app.models.entities import ProcessingJob
from app.schemas.profile import CandidateProfile
from app.schemas.evaluation import RoleEvaluation, CriterionEvaluation
from app.schemas.reviewer import (
    CandidateSummaryItem,
    CandidateListResponse,
    CandidateDetailResponse,
    DocumentMeta,
    TextSnippetMeta,
    ProcessingStatusResponse,
    MethodologyResponse,
)
from app.services.database.base import Repository
from app.services.storage.base import StorageService
from app.services.extraction.pipeline import ExtractionPipelineService
from app.services.extraction.profile_service import ProfileExtractionService
from app.services.scoring.service import EvaluationService


class ReviewerService:
    """
    Coordinates candidate review workflows, detail retrieval with secure source URLs,
    filtering, pagination, reprocessing retries, and methodology specification.
    """

    def __init__(self, repository: Repository, storage_service: StorageService):
        self.repo = repository
        self.storage = storage_service
        self.pipeline = ExtractionPipelineService(repository, storage_service)
        self.profile_service = ProfileExtractionService(repository, storage_service)
        self.eval_service = EvaluationService(repository, storage_service)

    def list_candidates(
        self,
        page: int = 1,
        page_size: int = 20,
        classification: Optional[str] = None,
        processing_status: Optional[str] = None,
        min_score: Optional[float] = None,
        max_score: Optional[float] = None,
        search: Optional[str] = None,
    ) -> CandidateListResponse:
        # Fetch all candidate entities
        all_cands = self.repo.list_candidates(limit=1000, offset=0)

        filtered: List[CandidateSummaryItem] = []

        for cand in all_cands:
            # 1. Filter classification
            if classification and classification.upper() != "ALL":
                if cand.classification.upper() != classification.upper():
                    continue

            # 2. Filter processing status
            if processing_status and processing_status.upper() != "ALL":
                if cand.processing_status.upper() != processing_status.upper():
                    continue

            # 3. Filter score range (checks either LCA or UI/UX score)
            top_score = None
            if cand.lca_score is not None and cand.uiux_score is not None:
                top_score = max(cand.lca_score, cand.uiux_score)
            elif cand.lca_score is not None:
                top_score = cand.lca_score
            elif cand.uiux_score is not None:
                top_score = cand.uiux_score

            if min_score is not None:
                if top_score is None or top_score < min_score:
                    continue
            if max_score is not None:
                if top_score is None or top_score > max_score:
                    continue

            # 4. Search query
            doc = self.repo.get_document_by_candidate_id(cand.id)
            orig_filename = doc.original_filename if doc else "unknown"
            file_size = doc.file_size if doc else 0

            if search:
                q = search.lower()
                cand_code_match = q in cand.candidate_code.lower()
                filename_match = q in orig_filename.lower()
                skills_match = False
                
                # Check profile skills if needed
                prof_entity = self.repo.get_candidate_profile(cand.id)
                if prof_entity and "profile_json" in prof_entity.profile_json:
                    skills_list = prof_entity.profile_json.get("skills", [])
                    skills_match = any(q in s.lower() for s in skills_list)

                if not (cand_code_match or filename_match or skills_match):
                    continue

            # Fetch extraction confidence
            prof_entity = self.repo.get_candidate_profile(cand.id)
            confidence = prof_entity.extraction_confidence if prof_entity else 1.0

            filtered.append(
                CandidateSummaryItem(
                    id=cand.id,
                    candidate_code=cand.candidate_code,
                    classification=cand.classification,
                    processing_status=cand.processing_status,
                    lca_score=cand.lca_score,
                    uiux_score=cand.uiux_score,
                    original_filename=orig_filename,
                    file_size=file_size,
                    extraction_confidence=confidence,
                    created_at=cand.created_at,
                )
            )

        total = len(filtered)
        total_pages = max(1, math.ceil(total / page_size))
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paged_items = filtered[start_idx:end_idx]

        return CandidateListResponse(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            candidates=paged_items,
        )

    def get_candidate_detail(self, candidate_id: UUID) -> CandidateDetailResponse:
        cand = self.repo.get_candidate_by_id(candidate_id)
        if not cand:
            raise ValueError(f"Candidate {candidate_id} not found.")

        doc = self.repo.get_document_by_candidate_id(candidate_id)
        if not doc:
            raise ValueError(f"No document found for candidate {candidate_id}.")

        # Direct download/preview endpoint for source resume inspection
        access_url = f"/api/candidates/{candidate_id}/resume"

        doc_meta = DocumentMeta(
            original_filename=doc.original_filename,
            file_size=doc.file_size,
            mime_type=doc.mime_type,
            page_count=doc.page_count,
            access_url=access_url,
        )

        text_meta = TextSnippetMeta(
            raw_text=doc.raw_text or "",
            normalized_text=doc.normalized_text or "",
            parser_name=doc.parser_name,
            extraction_status=doc.extraction_status,
            warnings=doc.extraction_warnings,
        )

        # Retrieve profile
        prof_entity = self.repo.get_candidate_profile(candidate_id)
        profile = CandidateProfile(**prof_entity.profile_json) if prof_entity else None

        # Retrieve verified evidence items
        ev_items = self.repo.get_evidence_items(candidate_id)
        evidence_dicts = [
            {
                "id": str(e.id),
                "field_key": e.field_key,
                "evidence_text": e.evidence_text,
                "is_verified": e.is_verified,
                "validation_status": e.validation_status,
            }
            for e in ev_items
        ]

        # Retrieve evaluations
        eval_entities = self.repo.get_candidate_evaluations(candidate_id)
        lca_eval = None
        uiux_eval = None

        for ent in eval_entities:
            bd = {k: CriterionEvaluation(**v) for k, v in ent.breakdown.items()}
            role_ev = RoleEvaluation(
                role_key=ent.role_key,
                score=ent.score,
                scoring_version=ent.scoring_version,
                is_qualified=ent.is_qualified,
                qualification_status=ent.qualification_status,
                summary=ent.summary or "",
                breakdown=bd,
            )
            if ent.role_key == "LCA":
                lca_eval = role_ev
            elif ent.role_key == "UI_UX":
                uiux_eval = role_ev

        all_warnings = list(doc.extraction_warnings)
        if profile and profile.extraction_warnings:
            all_warnings.extend(profile.extraction_warnings)

        return CandidateDetailResponse(
            id=cand.id,
            candidate_code=cand.candidate_code,
            classification=cand.classification,
            processing_status=cand.processing_status,
            lca_score=cand.lca_score,
            uiux_score=cand.uiux_score,
            document=doc_meta,
            extracted_text=text_meta,
            profile=profile,
            evidence_items=evidence_dicts,
            lca_evaluation=lca_eval,
            uiux_evaluation=uiux_eval,
            warnings=all_warnings,
        )

    def retry_candidate_processing(self, candidate_id: UUID) -> CandidateDetailResponse:
        cand = self.repo.get_candidate_by_id(candidate_id)
        if not cand:
            raise ValueError(f"Candidate {candidate_id} not found.")

        # Re-run extraction pipeline
        self.pipeline.process_candidate_document(candidate_id)

        # Re-run structured profile extraction
        self.profile_service.extract_and_validate_profile(candidate_id)

        # Re-run evaluations
        self.eval_service.evaluate_candidate(candidate_id)

        # Return refreshed detail view
        return self.get_candidate_detail(candidate_id)

    def get_candidate_status(self, candidate_id: UUID) -> ProcessingStatusResponse:
        cand = self.repo.get_candidate_by_id(candidate_id)
        if not cand:
            raise ValueError(f"Candidate {candidate_id} not found.")

        job = self.repo.get_latest_job_for_candidate(candidate_id)
        if not job:
            return ProcessingStatusResponse(
                candidate_id=cand.id,
                candidate_code=cand.candidate_code,
                status=cand.processing_status,
                stage="COMPLETED",
                attempt_count=1,
            )

        return ProcessingStatusResponse(
            candidate_id=cand.id,
            candidate_code=cand.candidate_code,
            status=job.status,
            stage=job.stage,
            attempt_count=job.attempt_count,
            error_code=job.error_code,
            error_message=job.error_message_safe,
            started_at=job.started_at,
            completed_at=job.completed_at,
        )

    def get_methodology(self) -> MethodologyResponse:
        return MethodologyResponse(
            app_name="GFI AI Resume Screener",
            version="1.0.0",
            scoring_version="1.0",
            roles={
                "LCA": {
                    "title": "Life Cycle Assessment (LCA) Consultant",
                    "location": "Chennai (Onsite)",
                    "qualification_threshold": 55.0,
                    "max_points": 100.0,
                    "criteria": [
                        {"key": "lca_experience", "name": "LCA Project Experience", "weight": 25.0, "source": "JD1 Lines 29-30 (2-3 yrs baseline)"},
                        {"key": "lca_tools", "name": "GaBi / SimaPro Modeling Tools", "weight": 25.0, "source": "JD1 Lines 31-32 (GaBi/SimaPro)"},
                        {"key": "lca_standards", "name": "ISO 14040/14044 & EPD Standards", "weight": 20.0, "source": "JD1 Lines 35-36, 51"},
                        {"key": "lca_education", "name": "Environmental Domain Degree", "weight": 15.0, "source": "JD1 Line 44"},
                        {"key": "lca_projects", "name": "Documented LCA Projects", "weight": 10.0, "source": "JD1 Lines 33-34 (>= 3 projects)"},
                        {"key": "lca_location", "name": "Chennai Location / Relocation", "weight": 5.0, "source": "JD1 Lines 7, 37-39"},
                    ],
                },
                "UI_UX": {
                    "title": "UI/UX Designer Intern",
                    "location": "Fully Remote",
                    "qualification_threshold": 50.0,
                    "max_points": 100.0,
                    "criteria": [
                        {"key": "uiux_tools", "name": "Figma & Prototyping Tools", "weight": 25.0, "source": "JD2 Lines 11, 23 (Figma)"},
                        {"key": "uiux_methodology", "name": "Design Methodology & Systems", "weight": 25.0, "source": "JD2 Line 22 (HCD, wireframing)"},
                        {"key": "uiux_user_psychology", "name": "User Research & Psychology", "weight": 20.0, "source": "JD2 Lines 9, 24, 28 (User psychology)"},
                        {"key": "uiux_portfolio", "name": "Design Portfolio & Artifacts", "weight": 15.0, "source": "JD2 Lines 11, 25 (Prototypes, portfolio)"},
                        {"key": "uiux_experience", "name": "Target Intern Experience (0-1 yr)", "weight": 10.0, "source": "JD2 Line 19 (0-1 yr tier)"},
                        {"key": "uiux_alignment", "name": "Sustainability & Web Alignment", "weight": 5.0, "source": "JD2 Lines 3, 34, 41 (Job board revamp)"},
                    ],
                },
            },
            methodological_rules=[
                "Unavailable / Failed Score Integrity: Failed or unreadable extractions strictly receive null scores (never artificial zero) with manual review required.",
                "Missing Relocation Willingness Policy: Missing relocation willingness is strictly represented as UNKNOWN, receiving non-punitive neutral credit.",
                "Orthogonal Role Evaluation: Scores are never blended or averaged across roles. Every candidate receives two independent scores.",
                "Evidence Anchoring: Every claimed skill, tool, degree, or job must cite a verbatim string verified by the EvidenceVerifier.",
            ],
            tie_breaking_protocol=[
                "1. Total Role Score (DESC, null placed last)",
                "2. Extraction Confidence (DESC)",
                "3. Primary Role Criterion Score (DESC: lca_experience for LCA, uiux_tools for UI/UX)",
                "4. Total Verified Claims Count (DESC)",
                "5. Candidate Code Lexicographical Order (ASC)",
            ],
        )


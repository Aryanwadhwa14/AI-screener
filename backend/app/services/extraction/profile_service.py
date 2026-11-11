from uuid import UUID, uuid4
from typing import Optional, List
from app.models.entities import CandidateProfileEntity, EvidenceItemEntity
from app.schemas.profile import CandidateProfile, EvidenceSnippet
from app.services.database.base import Repository
from app.services.storage.base import StorageService
from app.services.extraction.pipeline import ExtractionPipelineService
from app.services.evidence.verifier import EvidenceVerifier
from app.services.llm.base import LLMProvider
from app.services.llm.factory import get_llm_provider
from app.prompts.extraction_prompt import PROMPT_VERSION


class ProfileExtractionService:
    def __init__(
        self,
        repository: Repository,
        storage_service: StorageService,
        llm_provider: Optional[LLMProvider] = None,
    ):
        self.repo = repository
        self.storage = storage_service
        self.llm = llm_provider or get_llm_provider()
        self.verifier = EvidenceVerifier()
        self.pipeline = ExtractionPipelineService(repository, storage_service)

    def extract_and_validate_profile(self, candidate_id: UUID) -> CandidateProfile:
        candidate = self.repo.get_candidate_by_id(candidate_id)
        if not candidate:
            raise ValueError(f"Candidate {candidate_id} not found.")

        doc = self.repo.get_document_by_candidate_id(candidate_id)
        if not doc:
            raise ValueError(f"No document record found for candidate {candidate_id}.")

        # If document text has not been extracted yet and not already failed, run extraction pipeline first
        if doc.extraction_status != "FAILED" and not doc.normalized_text and not doc.raw_text:
            try:
                self.pipeline.process_candidate_document(candidate_id)
                doc = self.repo.get_document_by_candidate_id(candidate_id)
            except Exception as e:
                doc.extraction_status = "FAILED"

        raw_text = doc.raw_text or ""
        normalized_text = doc.normalized_text or ""

        # Low-Text & Empty File Guard (ADR-01):
        # If document is confirmed empty, do not invoke LLM; record failure and return empty profile
        if doc.extraction_status == "FAILED" or len(normalized_text.strip()) == 0:
            profile = CandidateProfile(
                candidate_code=candidate.candidate_code,
                skills=[],
                tools=[],
                lca_tools=[],
                uiux_tools=[],
                standards=[],
                work_experience=[],
                total_experience_months=None,
                education=[],
                projects=[],
                portfolio_urls=[],
                relocation_willingness="UNKNOWN",
                evidence_items=[],
                extraction_confidence=0.0,
                extraction_warnings=["Empty or unreadable document: structured extraction skipped."],
            )
            # Update candidate status
            self.repo.update_candidate_status(
                candidate_id=candidate_id,
                processing_status="FAILED",
                classification="NEITHER_OR_UNCERTAIN",
            )
            # Persist failed profile entity so subsequent GET endpoints retrieve valid empty profile
            profile_entity = CandidateProfileEntity(
                candidate_id=candidate_id,
                profile_json=profile.model_dump(),
                schema_version="1.0",
                model_provider="system",
                model_name="rule_guard",
                prompt_version=PROMPT_VERSION,
                extraction_confidence=0.0,
                validation_status="FAILED",
            )
            self.repo.save_candidate_profile(profile_entity)
            return profile

        # Invoke LLM Provider
        profile = self.llm.extract_profile(
            normalized_text=normalized_text,
            candidate_code=candidate.candidate_code,
        )

        # Ensure relocation willingness strictly complies with methodology rule
        if not profile.relocation_willingness or profile.relocation_willingness not in ["YES", "NO", "UNKNOWN"]:
            profile.relocation_willingness = "UNKNOWN"

        # Verify evidence snippets against raw and normalized source text
        profile = self.verifier.verify_profile_evidence(
            profile=profile,
            raw_text=raw_text,
            normalized_text=normalized_text,
        )

        # Persist CandidateProfileEntity in database
        profile_entity = CandidateProfileEntity(
            candidate_id=candidate_id,
            profile_json=profile.model_dump(),
            schema_version="1.0",
            model_provider=self.llm.provider_name,
            model_name=self.llm.model_name,
            prompt_version=PROMPT_VERSION,
            extraction_confidence=profile.extraction_confidence,
            validation_status="VALIDATED" if profile.extraction_confidence >= 0.7 else "LOW_CONFIDENCE",
        )
        self.repo.save_candidate_profile(profile_entity)

        # Persist Evidence items in database
        evidence_entities = []
        for ev in profile.evidence_items:
            evidence_entities.append(
                EvidenceItemEntity(
                    candidate_id=candidate_id,
                    field_key=ev.field_key,
                    evidence_text=ev.evidence_snippet,
                    is_verified=ev.is_verified,
                    validation_status="VERIFIED" if ev.is_verified else "UNVERIFIED",
                )
            )
        self.repo.save_evidence_items(candidate_id, evidence_entities)

        # Update candidate processing status to PROFILED
        self.repo.update_candidate_status(
            candidate_id=candidate_id,
            processing_status="PROFILED",
        )

        return profile

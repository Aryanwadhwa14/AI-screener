from typing import List, Tuple, Optional
from uuid import UUID
from app.schemas.profile import CandidateProfile
from app.schemas.evaluation import (
    CandidateEvaluationResult,
    RoleEvaluation,
    CandidateRankingItem,
)
from app.services.scoring.lca_scorer import LCARoleScorer
from app.services.scoring.uiux_scorer import UIUXRoleScorer


class CandidateEvaluator:
    """
    Orchestrates deterministic dual-role evaluation, orthogonal classification,
    and deterministic tie-breaking for candidate rankings.
    """

    def __init__(self):
        self.lca_scorer = LCARoleScorer()
        self.uiux_scorer = UIUXRoleScorer()

    def evaluate_candidate(
        self,
        candidate_id: UUID,
        profile: CandidateProfile,
        is_extraction_failed: bool = False,
    ) -> CandidateEvaluationResult:
        # Evaluate LCA role
        lca_eval = self.lca_scorer.evaluate(profile, is_extraction_failed=is_extraction_failed)
        
        # Evaluate UI/UX role
        uiux_eval = self.uiux_scorer.evaluate(profile, is_extraction_failed=is_extraction_failed)

        # Classification Logic (ADR-04)
        if is_extraction_failed or profile.extraction_confidence == 0.0 or lca_eval.score is None or uiux_eval.score is None:
            classification = "NEITHER_OR_UNCERTAIN"
        elif lca_eval.is_qualified and uiux_eval.is_qualified:
            classification = "BOTH"
        elif lca_eval.is_qualified:
            classification = "LCA"
        elif uiux_eval.is_qualified:
            classification = "UI_UX"
        else:
            classification = "NEITHER_OR_UNCERTAIN"

        return CandidateEvaluationResult(
            candidate_id=candidate_id,
            candidate_code=profile.candidate_code,
            classification=classification,
            lca_evaluation=lca_eval,
            uiux_evaluation=uiux_eval,
            extraction_confidence=profile.extraction_confidence,
        )

    def generate_ranking(
        self,
        evaluations: List[Tuple[UUID, CandidateProfile, RoleEvaluation, str]],
        role_key: str,
    ) -> List[CandidateRankingItem]:
        """
        Sorts candidates deterministically using the mandated multi-tier tie-breaking protocol:
        1. Score DESC (None/null placed at the bottom)
        2. Extraction confidence DESC
        3. Primary criterion score DESC (lca_experience for LCA, uiux_tools for UI/UX)
        4. Total verified claims count DESC
        5. Candidate code ASC (lexicographical stability)
        """
        primary_key = "lca_experience" if role_key == "LCA" else "uiux_tools"

        def sort_key(item: Tuple[UUID, CandidateProfile, RoleEvaluation, str]):
            _, prof, r_eval, _ = item
            
            # 1. Score (None sorted to bottom)
            score_val = -1.0 if r_eval.score is None else r_eval.score
            
            # 2. Confidence
            conf_val = prof.extraction_confidence
            
            # 3. Primary criterion score
            prim_score = 0.0
            if r_eval.breakdown and primary_key in r_eval.breakdown:
                prim_score = r_eval.breakdown[primary_key].score
                
            # 4. Verified claims count
            verified_count = sum(1 for e in prof.evidence_items if e.is_verified)
            
            # Return tuple for DESC sorting on metrics, ASC on code
            return (-score_val, -conf_val, -prim_score, -verified_count, prof.candidate_code)

        sorted_items = sorted(evaluations, key=sort_key)

        ranked_results: List[CandidateRankingItem] = []
        for idx, (cid, prof, r_eval, classification) in enumerate(sorted_items, start=1):
            # Extract key strengths
            key_strengths = []
            if r_eval.breakdown:
                top_criteria = sorted(
                    r_eval.breakdown.values(),
                    key=lambda c: (c.score / max(c.weight, 1.0)),
                    reverse=True,
                )
                for crit in top_criteria:
                    if crit.score > 0:
                        key_strengths.append(f"{crit.criterion_name}: {crit.score:.0f}/{crit.weight:.0f} pts")
                    if len(key_strengths) >= 3:
                        break

            ranked_results.append(
                CandidateRankingItem(
                    rank=idx,
                    candidate_id=cid,
                    candidate_code=prof.candidate_code,
                    score=r_eval.score,
                    is_qualified=r_eval.is_qualified,
                    qualification_status=r_eval.qualification_status,
                    classification=classification,
                    extraction_confidence=prof.extraction_confidence,
                    key_strengths=key_strengths,
                    summary=r_eval.summary,
                )
            )

        return ranked_results


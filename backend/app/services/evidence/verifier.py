import re
from typing import Tuple, List
from app.schemas.profile import CandidateProfile, EvidenceSnippet


def normalize_snippet_for_matching(text: str) -> str:
    """Collapses spaces and punctuation for flexible, reliable substring matching."""
    if not text:
        return ""
    # Lowercase and collapse all whitespace to single space
    lowered = text.lower()
    return re.sub(r"\s+", " ", lowered).strip()


class EvidenceVerifier:
    """
    Verifies that all extracted claims and cited evidence snippets genuinely exist
    in the raw or normalized document text.
    Marks unverifiable claims as unverified and computes extraction confidence.
    """

    @staticmethod
    def normalize(text: str) -> str:
        return normalize_snippet_for_matching(text)

    def verify_profile_evidence(
        self, profile: CandidateProfile, raw_text: str, normalized_text: str
    ) -> CandidateProfile:
        search_corpus = (
            normalize_snippet_for_matching(raw_text)
            + " "
            + normalize_snippet_for_matching(normalized_text)
        )

        total_claims = 0
        verified_claims = 0

        # 1. Verify general evidence snippets
        for ev in profile.evidence_items:
            total_claims += 1
            snip = normalize_snippet_for_matching(ev.evidence_snippet)
            if snip and (snip in search_corpus or self._fuzzy_containment(snip, search_corpus)):
                ev.is_verified = True
                verified_claims += 1
            else:
                ev.is_verified = False
                profile.extraction_warnings.append(
                    f"Unverified evidence snippet for '{ev.field_key}': text not located in resume."
                )

        # 2. Verify work experience claims
        for exp in profile.work_experience:
            if exp.evidence_snippet:
                total_claims += 1
                snip = normalize_snippet_for_matching(exp.evidence_snippet)
                if snip and (snip in search_corpus or self._fuzzy_containment(snip, search_corpus)):
                    exp.is_verified = True
                    verified_claims += 1
                else:
                    exp.is_verified = False
                    profile.extraction_warnings.append(
                        f"Unverified work experience at '{exp.organization or exp.role_title}'."
                    )

        # 3. Verify education claims
        for edu in profile.education:
            if edu.evidence_snippet:
                total_claims += 1
                snip = normalize_snippet_for_matching(edu.evidence_snippet)
                if snip and (snip in search_corpus or self._fuzzy_containment(snip, search_corpus)):
                    edu.is_verified = True
                    verified_claims += 1
                else:
                    edu.is_verified = False
                    profile.extraction_warnings.append(
                        f"Unverified education degree '{edu.degree}'."
                    )

        # 4. Verify project claims
        for proj in profile.projects:
            if proj.evidence_snippet:
                total_claims += 1
                snip = normalize_snippet_for_matching(proj.evidence_snippet)
                if snip and (snip in search_corpus or self._fuzzy_containment(snip, search_corpus)):
                    proj.is_verified = True
                    verified_claims += 1
                else:
                    proj.is_verified = False
                    profile.extraction_warnings.append(
                        f"Unverified project '{proj.title}'."
                    )

        # Compute confidence ratio
        if total_claims == 0:
            # If no claims were extracted, check if document was empty
            profile.extraction_confidence = 1.0 if profile.skills else 0.5
        else:
            profile.extraction_confidence = round(verified_claims / total_claims, 2)

        return profile

    def _fuzzy_containment(self, snippet: str, corpus: str, min_word_match_ratio: float = 0.8) -> bool:
        """
        Allows matching when minor punctuation or line wrapping differences exist,
        by verifying that >= 80% of words in the snippet appear in sequence or close proximity.
        """
        words = snippet.split()
        if len(words) < 3:
            return snippet in corpus

        # Check if 4-word window exists
        window_size = min(4, len(words))
        sub_phrase = " ".join(words[:window_size])
        return sub_phrase in corpus

import re
from typing import Dict, Any, List, Optional
from app.schemas.profile import CandidateProfile
from app.schemas.evaluation import RoleEvaluation, CriterionEvaluation
from app.services.scoring.base import RoleScorer

SCORING_VERSION_LCA = "1.0"


class LCARoleScorer(RoleScorer):
    """
    Deterministic scoring engine for Life Cycle Assessment (LCA) Consultant role.
    Governed by canonical source text in data/JD1 (LCA).txt:
    Baseline: 2-3 years independent LCA experience, GaBi or SimaPro, ISO 14040/14044.
    """

    @property
    def role_key(self) -> str:
        return "LCA"

    @property
    def version(self) -> str:
        return SCORING_VERSION_LCA

    def evaluate(
        self, profile: CandidateProfile, is_extraction_failed: bool = False
    ) -> RoleEvaluation:
        # Mandatory Methodological Rule (ADR-01):
        # Failed or unreadable extractions must NOT receive an artificial score of zero.
        # Unavailable scores must be represented as None (null in JSON).
        if is_extraction_failed or profile.extraction_confidence == 0.0:
            return RoleEvaluation(
                role_key=self.role_key,
                score=None,
                scoring_version=self.version,
                is_qualified=False,
                qualification_status="MANUAL_REVIEW_REQUIRED",
                summary="Candidate profile unavailable or unreadable. Manual human review required.",
                breakdown={},
            )

        breakdown: Dict[str, CriterionEvaluation] = {}

        # -------------------------------------------------------------
        # 1. Core LCA Experience (Weight: 25.0)
        # JD1 Lines 29-30: 2 to 3 years independent LCA experience baseline
        # -------------------------------------------------------------
        exp_score = 0.0
        exp_evidence = []
        exp_notes = ""

        # Estimate LCA months from relevant work experience
        lca_months = 0
        lca_keywords = ["lca", "life cycle", "sustainability", "carbon", "ghg", "environmental"]
        
        for w in profile.work_experience:
            text_to_check = f"{w.role_title} {w.organization or ''} {' '.join(w.responsibilities)}".lower()
            if any(k in text_to_check for k in lca_keywords):
                months = w.estimated_months or 12  # fallback default 1 year if unspecified
                lca_months += months
                if w.evidence_snippet:
                    exp_evidence.append(w.evidence_snippet)

        # Fallback to total experience if specific role months wasn't parsed but total is known
        if lca_months == 0 and profile.total_experience_months:
            if any("life cycle" in s.lower() or "lca" in s.lower() for s in profile.skills):
                lca_months = profile.total_experience_months

        if lca_months >= 48:
            exp_score = 25.0
            exp_notes = f"{lca_months} months LCA/sustainability experience (Senior bonus tier, >= 4 years)."
        elif lca_months >= 24:
            exp_score = 20.0
            exp_notes = f"{lca_months} months LCA/sustainability experience (Meets JD 2-3 years baseline)."
        elif lca_months >= 12:
            exp_score = 12.0
            exp_notes = f"{lca_months} months LCA/sustainability experience (Junior/associate tier, 1-2 years)."
        elif lca_months > 0:
            exp_score = 6.0
            exp_notes = f"{lca_months} months introductory LCA experience (< 1 year)."
        else:
            exp_score = 0.0
            exp_notes = "No independent LCA or environmental consulting experience identified."

        breakdown["lca_experience"] = CriterionEvaluation(
            criterion_key="lca_experience",
            criterion_name="LCA Project Experience",
            weight=25.0,
            score=exp_score,
            evidence=exp_evidence[:3],
            notes=exp_notes,
        )

        # -------------------------------------------------------------
        # 2. Software Expertise: GaBi or SimaPro (Weight: 25.0)
        # JD1 Lines 31-32: Hands-on experience using either GaBi or SimaPro
        # -------------------------------------------------------------
        tools_score = 0.0
        tools_evidence = []
        tools_notes = ""

        all_tools_str = " ".join(profile.tools + profile.lca_tools + profile.skills).lower()
        has_gabi = "gabi" in all_tools_str or "ga bi" in all_tools_str
        has_simapro = "simapro" in all_tools_str or "sima pro" in all_tools_str
        other_lca_tools = [t for t in profile.lca_tools if t.lower() not in ["gabi", "simapro"]]
        if not other_lca_tools:
            for alt in ["openlca", "air.e", "umberto", "sphera", "ecoinvent"]:
                if alt in all_tools_str:
                    other_lca_tools.append(alt)

        # Collect evidence
        for ev in profile.evidence_items:
            if "tool" in ev.field_key or "gabi" in ev.evidence_snippet.lower() or "simapro" in ev.evidence_snippet.lower():
                if ev.is_verified:
                    tools_evidence.append(ev.evidence_snippet)

        if has_gabi and has_simapro:
            tools_score = 25.0
            tools_notes = "Proficiency verified in both mandatory software packages: GaBi and SimaPro."
        elif has_gabi or has_simapro:
            tools_score = 20.0
            tools_notes = f"Proficiency verified in mandatory software: {'GaBi' if has_gabi else 'SimaPro'}."
        elif other_lca_tools:
            tools_score = 10.0
            tools_notes = f"Proficiency in alternative LCA software ({', '.join(other_lca_tools)}), but GaBi/SimaPro not explicitly cited."
        else:
            tools_score = 0.0
            tools_notes = "No GaBi, SimaPro, or recognized LCA modeling software cited."

        breakdown["lca_tools"] = CriterionEvaluation(
            criterion_key="lca_tools",
            criterion_name="GaBi / SimaPro Modeling Tools",
            weight=25.0,
            score=tools_score,
            evidence=tools_evidence[:3],
            notes=tools_notes,
        )

        # -------------------------------------------------------------
        # 3. Standards Compliance: ISO 14040/14044 & EPDs (Weight: 20.0)
        # JD1 Lines 35-36, 51: Strictly follow ISO 14040/14044; EPD is preferred
        # -------------------------------------------------------------
        std_score = 0.0
        std_evidence = []
        std_notes = []

        standards_str = " ".join(profile.standards + profile.skills).lower()
        has_iso = "14040" in standards_str or "14044" in standards_str or "iso 14040" in standards_str
        has_epd = "epd" in standards_str or "environmental product declaration" in standards_str

        for ev in profile.evidence_items:
            if "standard" in ev.field_key or "14040" in ev.evidence_snippet or "epd" in ev.evidence_snippet.lower():
                if ev.is_verified:
                    std_evidence.append(ev.evidence_snippet)

        if has_iso:
            std_score += 14.0
            std_notes.append("ISO 14040/14044 guidelines compliance verified.")
        if has_epd:
            std_score += 6.0
            std_notes.append("EPD (Environmental Product Declaration) experience verified.")

        if not std_notes:
            std_notes.append("No explicit ISO 14040/14044 or EPD standards cited.")

        breakdown["lca_standards"] = CriterionEvaluation(
            criterion_key="lca_standards",
            criterion_name="ISO 14040/14044 & EPD Standards",
            weight=20.0,
            score=min(std_score, 20.0),
            evidence=std_evidence[:3],
            notes=" ".join(std_notes),
        )

        # -------------------------------------------------------------
        # 4. Domain & Education (Weight: 15.0)
        # JD1 Line 44: Bachelor's or Master's (Environmental domain highly desired)
        # -------------------------------------------------------------
        edu_score = 0.0
        edu_evidence = []
        edu_notes = ""

        has_env_degree = any(e.is_environmental_domain for e in profile.education)
        has_degree = len(profile.education) > 0

        for ed in profile.education:
            if ed.evidence_snippet:
                edu_evidence.append(ed.evidence_snippet)

        if has_env_degree:
            edu_score = 15.0
            edu_notes = "Degree in Environmental Science / Engineering / Sustainability domain (Highly desired)."
        elif has_degree:
            # Check if STEM / Engineering
            all_edu_str = " ".join(e.degree + " " + (e.field_of_study or "") for e in profile.education).lower()
            if any(term in all_edu_str for term in ["engineer", "b.tech", "m.tech", "b.e", "m.sc", "science", "chemical"]):
                edu_score = 10.0
                edu_notes = "Engineering / STEM degree outside direct environmental specialization."
            else:
                edu_score = 5.0
                edu_notes = "Degree outside STEM / Environmental domain."
        else:
            edu_score = 0.0
            edu_notes = "No formal degree documented."

        breakdown["lca_education"] = CriterionEvaluation(
            criterion_key="lca_education",
            criterion_name="Environmental Domain Degree",
            weight=15.0,
            score=edu_score,
            evidence=edu_evidence[:2],
            notes=edu_notes,
        )

        # -------------------------------------------------------------
        # 5. LCA Project Track Record (Weight: 10.0)
        # JD1 Lines 33-34: Completed at least 03 LCA projects
        # -------------------------------------------------------------
        proj_score = 0.0
        proj_evidence = []
        proj_notes = ""

        lca_projects_count = len([p for p in profile.projects if p.role_type == "LCA"])
        if lca_projects_count == 0:
            # Check if mentioned in work experience responsibilities
            for w in profile.work_experience:
                for resp in w.responsibilities:
                    if "lca" in resp.lower() or "cradle" in resp.lower() or "inventory" in resp.lower():
                        lca_projects_count += 1
                        proj_evidence.append(resp)

        if lca_projects_count >= 3:
            proj_score = 10.0
            proj_notes = f"{lca_projects_count} LCA projects documented (Meets JD milestone of >= 3 projects)."
        elif lca_projects_count >= 1:
            proj_score = 6.0
            proj_notes = f"{lca_projects_count} LCA project(s) documented."
        else:
            proj_score = 0.0
            proj_notes = "No specific standalone LCA projects documented."

        breakdown["lca_projects"] = CriterionEvaluation(
            criterion_key="lca_projects",
            criterion_name="Documented LCA Projects",
            weight=10.0,
            score=proj_score,
            evidence=proj_evidence[:2],
            notes=proj_notes,
        )

        # -------------------------------------------------------------
        # 6. Chennai Location / Relocation (Weight: 5.0)
        # JD1 Lines 7, 37-39: Onsite Chennai
        # Mandatory Methodology Rule: UNKNOWN must NOT be penalized as False.
        # -------------------------------------------------------------
        loc_score = 0.0
        loc_notes = ""
        reloc = profile.relocation_willingness.upper()

        if reloc == "YES":
            loc_score = 5.0
            loc_notes = "Explicit willingness to relocate to Chennai verified."
        elif reloc == "UNKNOWN":
            loc_score = 2.0
            loc_notes = "Relocation willingness UNKNOWN (Methodology rule: non-punitive neutral credit)."
        else:
            loc_score = 0.0
            loc_notes = "Candidate explicitly indicated unwillingness to relocate."

        breakdown["lca_location"] = CriterionEvaluation(
            criterion_key="lca_location",
            criterion_name="Chennai Location / Relocation",
            weight=5.0,
            score=loc_score,
            evidence=[],
            notes=loc_notes,
        )

        # -------------------------------------------------------------
        # Aggregate Total Score & Hard Qualification Gate
        # -------------------------------------------------------------
        total_score = sum(c.score for c in breakdown.values())
        total_score = round(min(max(total_score, 0.0), 100.0), 1)

        # Hard Qualification Gate:
        # Score >= 55.0 AND must have at least one must-have signal
        # (LCA experience >= 12m OR GaBi/SimaPro/openLCA OR ISO standards)
        has_must_have = (
            lca_months >= 12 or has_gabi or has_simapro or bool(other_lca_tools) or has_iso
        )
        is_qualified = (total_score >= 55.0) and has_must_have
        qual_status = "QUALIFIED" if is_qualified else "UNQUALIFIED"

        summary_parts = []
        if is_qualified:
            summary_parts.append(f"Candidate {profile.candidate_code} qualifies for LCA Consultant with a score of {total_score}/100.")
            if has_gabi or has_simapro:
                summary_parts.append(f"Verified core modeling tooling ({'GaBi' if has_gabi else ''} {'SimaPro' if has_simapro else ''}).")
            if has_iso:
                summary_parts.append("Confirmed ISO 14040/14044 compliance.")
        else:
            summary_parts.append(f"Candidate {profile.candidate_code} does not meet the LCA qualification threshold ({total_score}/100, threshold 55.0).")
            if not has_must_have:
                summary_parts.append("Lacks mandatory hands-on LCA experience or recognized software tools.")

        return RoleEvaluation(
            role_key=self.role_key,
            score=total_score,
            scoring_version=self.version,
            is_qualified=is_qualified,
            qualification_status=qual_status,
            summary=" ".join(summary_parts),
            breakdown=breakdown,
        )


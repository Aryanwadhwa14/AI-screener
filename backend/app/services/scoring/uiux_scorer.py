from typing import Dict, Any, List
from app.schemas.profile import CandidateProfile
from app.schemas.evaluation import RoleEvaluation, CriterionEvaluation
from app.services.scoring.base import RoleScorer

SCORING_VERSION_UIUX = "1.0"


class UIUXRoleScorer(RoleScorer):
    """
    Deterministic scoring engine for UI/UX Designer Intern role.
    Governed by canonical source text in data/JD2.txt:
    Target: 0-1 year UX/UI experience, Figma prototyping, user research/psychology, human-centered design.
    """

    @property
    def role_key(self) -> str:
        return "UI_UX"

    @property
    def version(self) -> str:
        return SCORING_VERSION_UIUX

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
        # 1. Core Tooling: Figma & Prototyping (Weight: 25.0)
        # JD2 Lines 11, 23: Create high-fidelity prototypes using Figma
        # -------------------------------------------------------------
        tools_score = 0.0
        tools_evidence = []
        tools_notes = ""

        all_tools_str = " ".join(profile.tools + profile.uiux_tools + profile.skills).lower()
        has_figma = "figma" in all_tools_str

        secondary_tools = [
            t for t in ["framer", "adobe xd", "xd", "protopie", "miro", "canva", "invision", "sketch"]
            if t in all_tools_str
        ]

        # Gather evidence
        for ev in profile.evidence_items:
            if "figma" in ev.evidence_snippet.lower() or any(st in ev.evidence_snippet.lower() for st in secondary_tools):
                if ev.is_verified:
                    tools_evidence.append(ev.evidence_snippet)

        if has_figma and secondary_tools:
            tools_score = 25.0
            tools_notes = f"Proficiency verified in primary tool Figma plus secondary design tooling ({', '.join(secondary_tools)})."
        elif has_figma:
            tools_score = 20.0
            tools_notes = "Verified proficiency in core required tool: Figma."
        elif secondary_tools or "prototyping" in all_tools_str:
            tools_score = 10.0
            tools_notes = f"Prototyping tools cited ({', '.join(secondary_tools) if secondary_tools else 'General'}), but Figma not verified."
        else:
            tools_score = 0.0
            tools_notes = "No Figma or interactive prototyping tools cited."

        breakdown["uiux_tools"] = CriterionEvaluation(
            criterion_key="uiux_tools",
            criterion_name="Figma & Prototyping Tools",
            weight=25.0,
            score=tools_score,
            evidence=tools_evidence[:3],
            notes=tools_notes,
        )

        # -------------------------------------------------------------
        # 2. Design Methodology & Systems (Weight: 25.0)
        # JD2 Line 22: UI/UX design principles, HCD, wireframing, design systems
        # -------------------------------------------------------------
        method_score = 0.0
        method_evidence = []
        method_notes = []

        skills_str = " ".join(profile.skills).lower()
        has_wireframing = "wirefram" in skills_str or "wireframe" in skills_str
        has_prototyping = "prototyp" in skills_str
        has_ui_ux = "ui/ux" in skills_str or "user interface" in skills_str or "user experience" in skills_str
        has_design_systems = "design system" in skills_str or "design systems" in skills_str or "component" in skills_str

        for ev in profile.evidence_items:
            if any(term in ev.evidence_snippet.lower() for term in ["wirefram", "design system", "prototype", "hcd", "user flow"]):
                if ev.is_verified:
                    method_evidence.append(ev.evidence_snippet)

        if has_wireframing and has_prototyping and has_ui_ux:
            method_score += 15.0
            method_notes.append("End-to-end design process: wireframing, prototyping, and UI/UX flows.")
        elif has_wireframing or has_prototyping or has_ui_ux:
            method_score += 10.0
            method_notes.append("Partial design process methods cited.")

        if has_design_systems:
            method_score += 10.0
            method_notes.append("Design systems and component library maintenance verified.")

        if not method_notes:
            method_notes.append("No structured UI/UX design methodology or design systems cited.")

        breakdown["uiux_methodology"] = CriterionEvaluation(
            criterion_key="uiux_methodology",
            criterion_name="Design Methodology & Systems",
            weight=25.0,
            score=min(method_score, 25.0),
            evidence=method_evidence[:3],
            notes=" ".join(method_notes),
        )

        # -------------------------------------------------------------
        # 3. User Research & Psychology (Weight: 20.0)
        # JD2 Lines 9, 24, 28: Strong understanding of user psychology and behavior
        # -------------------------------------------------------------
        psych_score = 0.0
        psych_evidence = []
        psych_notes = []

        exp_resp_text = " ".join(" ".join(w.responsibilities) for w in profile.work_experience).lower()

        has_psychology = any(
            term in skills_str or term in exp_resp_text
            for term in ["user psychology", "psychology", "behavior", "cognitive", "human-centered"]
        )
        has_research = any(
            term in skills_str or term in exp_resp_text
            for term in ["user research", "usability testing", "interviews", "user feedback", "personas", "testing"]
        )

        for ev in profile.evidence_items:
            if any(term in ev.evidence_snippet.lower() for term in ["research", "psychology", "usability", "testing", "interview"]):
                if ev.is_verified:
                    psych_evidence.append(ev.evidence_snippet)

        if has_psychology:
            psych_score += 10.0
            psych_notes.append("User psychology or human-centered behavioral insight explicitly verified.")
        if has_research:
            psych_score += 10.0
            psych_notes.append("User research, usability testing, or user interview methodology documented.")

        if not psych_notes:
            psych_notes.append("No explicit user psychology or empirical research methods cited.")

        breakdown["uiux_user_psychology"] = CriterionEvaluation(
            criterion_key="uiux_user_psychology",
            criterion_name="User Research & Psychology",
            weight=20.0,
            score=min(psych_score, 20.0),
            evidence=psych_evidence[:3],
            notes=" ".join(psych_notes),
        )

        # -------------------------------------------------------------
        # 4. Design Portfolio & Artifacts (Weight: 15.0)
        # JD2 Lines 11, 25, 30: High-fidelity prototypes, aesthetic sense
        # -------------------------------------------------------------
        port_score = 0.0
        port_evidence = []
        port_notes = ""

        has_portfolio_url = len(profile.portfolio_urls) > 0
        has_projects = len([p for p in profile.projects if p.role_type == "UI_UX" or "design" in p.title.lower()]) > 0
        has_academic = any("design" in e.degree.lower() for e in profile.education)

        if has_portfolio_url:
            port_score = 15.0
            port_evidence = profile.portfolio_urls[:2]
            port_notes = f"Verified external design portfolio: {', '.join(profile.portfolio_urls[:2])}"
        elif has_projects:
            port_score = 10.0
            port_notes = "Practical design projects/case studies documented in resume."
        elif has_academic:
            port_score = 5.0
            port_notes = "Academic design coursework without live portfolio link."
        else:
            port_score = 0.0
            port_notes = "No design portfolio link, live prototypes, or case studies documented."

        breakdown["uiux_portfolio"] = CriterionEvaluation(
            criterion_key="uiux_portfolio",
            criterion_name="Design Portfolio & Artifacts",
            weight=15.0,
            score=port_score,
            evidence=port_evidence,
            notes=port_notes,
        )

        # -------------------------------------------------------------
        # 5. Target Intern Experience (0-1 yr) (Weight: 10.0)
        # JD2 Line 19: 0-1 year experience, recent graduate or transitioner
        # -------------------------------------------------------------
        exp_score = 0.0
        exp_notes = ""

        # Calculate UX experience in months
        ux_months = 0
        for w in profile.work_experience:
            title_lower = w.role_title.lower()
            if any(term in title_lower for term in ["ui", "ux", "design", "product", "intern", "interaction"]):
                ux_months += w.estimated_months or 6

        # Check educational or career background
        if 0 <= ux_months <= 12 and (has_figma or has_ui_ux or has_academic or ux_months > 0):
            exp_score = 10.0
            exp_notes = f"{ux_months} months experience. Ideal target intern profile (0-1 year tier)."
        elif 13 <= ux_months <= 24:
            exp_score = 8.0
            exp_notes = f"{ux_months} months experience. Experienced junior tier (1-2 years)."
        elif ux_months > 24:
            exp_score = 6.0
            exp_notes = f"{ux_months} months experience. Senior candidate (Overqualification taper for intern role)."
        else:
            exp_score = 0.0
            exp_notes = "No design internship or work experience recorded."

        breakdown["uiux_experience"] = CriterionEvaluation(
            criterion_key="uiux_experience",
            criterion_name="Target Intern Experience (0-1 yr)",
            weight=10.0,
            score=exp_score,
            evidence=[],
            notes=exp_notes,
        )

        # -------------------------------------------------------------
        # 6. Sustainability & Web Alignment (Weight: 5.0)
        # JD2 Lines 3, 34, 41: LinkedIn for sustainability, job board revamp
        # -------------------------------------------------------------
        align_score = 0.0
        align_notes = ""

        full_profile_text = (
            " ".join(profile.skills)
            + " "
            + " ".join(p.title + " " + (p.description or "") for p in profile.projects)
            + " "
            + " ".join(w.role_title + " " + (w.organization or "") for w in profile.work_experience)
        ).lower()

        has_sust = any(term in full_profile_text for term in ["sustainability", "climate", "impact", "green", "cleantech", "social impact"])
        has_web_jobboard = any(term in full_profile_text for term in ["job board", "marketplace", "platform", "web app", "responsive", "saas"])

        if has_sust or has_web_jobboard:
            align_score = 5.0
            align_notes = "Demonstrated alignment with sustainability products, job boards, or digital platforms."
        elif "web" in full_profile_text or "mobile" in full_profile_text:
            align_score = 3.0
            align_notes = "General web or mobile app design background."
        else:
            align_score = 0.0
            align_notes = "No specific sustainability or platform design experience."

        breakdown["uiux_alignment"] = CriterionEvaluation(
            criterion_key="uiux_alignment",
            criterion_name="Sustainability & Web Alignment",
            weight=5.0,
            score=align_score,
            evidence=[],
            notes=align_notes,
        )

        # -------------------------------------------------------------
        # Aggregate Total Score & Hard Qualification Gate
        # -------------------------------------------------------------
        total_score = sum(c.score for c in breakdown.values())
        total_score = round(min(max(total_score, 0.0), 100.0), 1)

        # Hard Qualification Gate:
        # Score >= 50.0 AND must have verified Figma experience OR documented portfolio/case studies
        has_must_have = has_figma or has_portfolio_url or has_projects
        is_qualified = (total_score >= 50.0) and has_must_have
        qual_status = "QUALIFIED" if is_qualified else "UNQUALIFIED"

        summary_parts = []
        if is_qualified:
            summary_parts.append(f"Candidate {profile.candidate_code} qualifies for UI/UX Designer Intern with a score of {total_score}/100.")
            if has_figma:
                summary_parts.append("Verified Figma proficiency.")
            if has_portfolio_url:
                summary_parts.append("Active design portfolio cited.")
            if has_psychology:
                summary_parts.append("Confirmed user psychology / research background.")
        else:
            summary_parts.append(f"Candidate {profile.candidate_code} does not meet the UI/UX qualification threshold ({total_score}/100, threshold 50.0).")
            if not has_must_have:
                summary_parts.append("Lacks mandatory Figma proficiency or practical UI design portfolio.")

        return RoleEvaluation(
            role_key=self.role_key,
            score=total_score,
            scoring_version=self.version,
            is_qualified=is_qualified,
            qualification_status=qual_status,
            summary=" ".join(summary_parts),
            breakdown=breakdown,
        )


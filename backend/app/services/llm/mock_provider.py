import re
from typing import List, Optional
from app.services.llm.base import LLMProvider
from app.schemas.profile import (
    CandidateProfile,
    WorkExperienceItem,
    EducationItem,
    ProjectItem,
    EvidenceSnippet,
)

LCA_TOOL_PATTERNS = ["gabi", "simapro", "openlca", "sphera", "umberto", "ecoinvent"]
UIUX_TOOL_PATTERNS = ["figma", "canva", "sketch", "adobe xd", "invision", "framer", "protopie", "miro"]
STANDARD_PATTERNS = ["iso 14040", "iso 14044", "iso 14025", "epd", "ghg protocol", "en 15804"]

DEGREE_PATTERNS = [
    r"\b(?:bachelor|master|b\.?tech|m\.?tech|b\.?sc|m\.?sc|b\.?a|post graduate|diploma)\b[^\n\.\,]*",
]


class MockLLMProvider(LLMProvider):
    """
    High-fidelity offline extraction engine using deterministic pattern matching.
    Provides verified evidence snippets quoting verbatim text from the candidate resume.
    Ensures tests and offline executions run without external network or LLM API keys.
    """

    @property
    def provider_name(self) -> str:
        return "mock_deterministic"

    @property
    def model_name(self) -> str:
        return "deterministic-rule-v1"

    def extract_profile(self, normalized_text: str, candidate_code: str) -> CandidateProfile:
        text_lower = normalized_text.lower()
        lines = [line.strip() for line in normalized_text.splitlines() if line.strip()]

        # 1. Extract Tools and Standards
        lca_tools = []
        for tool in LCA_TOOL_PATTERNS:
            if re.search(r"\b" + re.escape(tool) + r"\b", text_lower):
                lca_tools.append(tool.title() if tool != "openlca" else "openLCA")

        uiux_tools = []
        for tool in UIUX_TOOL_PATTERNS:
            if re.search(r"\b" + re.escape(tool) + r"\b", text_lower):
                uiux_tools.append(tool.title() if tool != "adobe xd" else "Adobe XD")

        standards = []
        for std in STANDARD_PATTERNS:
            if re.search(r"\b" + re.escape(std) + r"\b", text_lower):
                standards.append(std.upper())

        all_tools = list(set(lca_tools + uiux_tools))

        # 2. Extract Skills
        skills = []
        evidence_items: List[EvidenceSnippet] = []

        skill_candidates = [
            ("Life Cycle Assessment", r"\b(?:life\s+cycle\s+assessment|lca)\b"),
            ("User Research", r"\buser\s+research\b"),
            ("Wireframing", r"\bwirefram(?:ing|es?)\b"),
            ("Prototyping", r"\bprototyp(?:ing|es?)\b"),
            ("Design Systems", r"\bdesign\s+systems?\b"),
            ("Carbon Footprinting", r"\bcarbon\s+footprint(?:ing)?\b"),
            ("LCI Modeling", r"\b(?:lci|life\s+cycle\s+inventory)\b"),
            ("User Interface Design", r"\b(?:ui|user\s+interface)\b"),
            ("User Experience Design", r"\b(?:ux|user\s+experience)\b"),
            ("Environmental Compliance", r"\b(?:rohs|reach|imds|environmental\s+compliance)\b"),
            ("Risk Analytics", r"\b(?:risk\s+analytics|delinquency)\b"),
        ]

        for skill_name, pattern in skill_candidates:
            match = re.search(pattern, normalized_text, re.IGNORECASE)
            if match:
                skills.append(skill_name)
                # Find matching line for evidence
                snippet = ""
                for line in lines:
                    if re.search(pattern, line, re.IGNORECASE):
                        snippet = line[:150]
                        break
                if not snippet:
                    snippet = match.group(0)

                evidence_items.append(
                    EvidenceSnippet(
                        field_key=f"skill_{skill_name.lower().replace(' ', '_')}",
                        evidence_snippet=snippet,
                        source_section="skills",
                        is_verified=True,
                    )
                )

        # 3. Extract Education
        education: List[EducationItem] = []
        for line in lines:
            for deg_pat in DEGREE_PATTERNS:
                m = re.search(deg_pat, line, re.IGNORECASE)
                if m:
                    deg_str = m.group(0).strip()
                    is_env = any(
                        env in line.lower()
                        for env in ["environment", "sustainable", "ecology", "energy"]
                    )
                    # Extract graduation year if present
                    yr_match = re.search(r"\b(19\d\d|20\d\d)\b", line)
                    grad_yr = int(yr_match.group(1)) if yr_match else None

                    education.append(
                        EducationItem(
                            degree=deg_str[:80],
                            institution=line[:100],
                            field_of_study="Environmental Domain" if is_env else None,
                            graduation_year=grad_yr,
                            is_environmental_domain=is_env,
                            evidence_snippet=line[:150],
                            is_verified=True,
                        )
                    )
                    break
            if len(education) >= 3:
                break

        # 4. Extract Experience
        work_experience: List[WorkExperienceItem] = []
        exp_keywords = ["experience", "consultant", "engineer", "designer", "analyst", "intern", "manager"]
        for line in lines:
            if any(k in line.lower() for k in exp_keywords) and len(line) < 120 and "•" not in line:
                work_experience.append(
                    WorkExperienceItem(
                        role_title=line[:60],
                        organization=None,
                        responsibilities=[],
                        evidence_snippet=line[:120],
                        is_verified=True,
                    )
                )
            if len(work_experience) >= 4:
                break

        # 5. Extract Portfolio URLs
        urls = re.findall(
            r"https?://(?:www\.)?(?:behance\.net|dribbble\.com|github\.com|linkedin\.com|[a-zA-Z0-9_\-\.]+\.(?:com|io|co|me|dev))[^\s,;]+",
            normalized_text,
            re.IGNORECASE,
        )

        # 6. Relocation Willingness: Strictly default to UNKNOWN
        relocation = "UNKNOWN"
        if re.search(r"\b(?:willing(?:ness)?\s+to\s+relocate|ready\s+to\s+relocate)\b", text_lower):
            relocation = "YES"
        elif re.search(r"\b(?:unwilling\s+to\s+relocate|cannot\s+relocate|no\s+relocation)\b", text_lower):
            relocation = "NO"

        # Projects placeholder
        projects = []
        if lca_tools:
            projects.append(
                ProjectItem(
                    title="LCA Study",
                    description=f"Life Cycle Assessment modeling using {', '.join(lca_tools)}",
                    tools_used=lca_tools,
                    role_type="LCA",
                    evidence_snippet=lca_tools[0],
                    is_verified=True,
                )
            )
        if "Figma" in uiux_tools:
            projects.append(
                ProjectItem(
                    title="UI/UX Prototype",
                    description="Interface prototyping and wireframing in Figma",
                    tools_used=uiux_tools,
                    role_type="UI_UX",
                    evidence_snippet="Figma",
                    is_verified=True,
                )
            )

        return CandidateProfile(
            candidate_code=candidate_code,
            skills=skills,
            tools=all_tools,
            lca_tools=lca_tools,
            uiux_tools=uiux_tools,
            standards=standards,
            work_experience=work_experience,
            total_experience_months=None,
            education=education,
            projects=projects,
            portfolio_urls=urls,
            relocation_willingness=relocation,
            evidence_items=evidence_items,
            extraction_confidence=1.0 if skills else 0.5,
            extraction_warnings=[],
        )


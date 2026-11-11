# Job Description Analysis & Requirements Specification

**Date:** 2026-11-10  
**Status:** Approved Source Document Review  
**Source Files:**  
- `data/JD1 (LCA).txt` (LCA Consultant)  
- `data/JD2.txt` (UI/UX Design Intern)  

---

## 1. Overview and Source Verification

Both job descriptions were inspected directly from the local repository `data/` directory. No external or assumed requirements were introduced.

### Critical Discrepancy Note
- **Assignment Overview vs. Source JD1:** The assignment summary document (`CONTEXT.md` / `GFI Software Engineer Assignment.pdf`) mentioned an LCA role of *“approximately 4–6 years of experience”*. However, the authoritative source text in `data/JD1 (LCA).txt` explicitly states:  
  > *"Experience: The consultant must have 2 to 3 years of experience running Life Cycle Assessment (LCA) projects independently."* (Lines 29–30)  
  **Rule Applied:** As established in `CONTEXT.md` Section 3 & 5.1, the downloaded source files are canonical. Our scoring engine and requirements criteria will treat 2–3 years as the baseline required experience while giving credit for 4+ years under senior experience tiers.

---

## 2. JD1: LCA Consultant (Life Cycle Assessment)

### 2.1 Metadata
- **Job Title:** LCA Consultant (Chennai based/relocate)
- **Hiring Entity:** Leading global sustainability consultancy based in Pune, serving manufacturing, construction, healthcare, and corporate sectors.
- **Location:** Chennai (onsite at client facility). Relocation assistance offered.
- **Commitment:** Minimum 1 year commitment; high willingness to travel extensively across India.
- **Compensation:** Industry level, finalized based on qualifications and skills.

### 2.2 Core Responsibilities (Source: Lines 13–27)
1. **LCI Data Collection:** Collect and compile comprehensive Life Cycle Inventory (LCI) data.
2. **Data Validation & Quality Control:** Standardize and validate LCI data for accuracy, completeness, and consistency; thoroughly document missing data.
3. **LCA Modelling:** Build LCI models in software using gathered inventory.
4. **Assumptions & Traceability:** Document all modeling assumptions to ensure datasets and models are fully traceable and audit-ready.
5. **Operational Data Gathering:** Partner with Cross-Functional Teams (CFTs) on plant-level assembly details, resource/energy consumption, and inbound/outbound logistics.
6. **Public Benchmarking:** Benchmark against databases, industry reports, research papers, academic studies, and regulatory filings.
7. **Delivery & Stakeholder Management:** Meet project deadlines and represent the consultancy with clients.

### 2.3 Strict Mandatory Criteria (Source: Lines 28–42, 44–49)
| Criterion ID | Criterion | Source Citation | Notes for Extraction & Scoring |
|---|---|---|---|
| `LCA-M-01` | **Domain Experience** | Lines 29–30: *"2 to 3 years of experience running Life Cycle Assessment (LCA) projects independently"* | Candidate must demonstrate active hands-on LCA project work. |
| `LCA-M-02` | **Software Expertise** | Lines 31–32: *"Hands-on experience using either GaBi or SimaPro software"* | Direct mention of GaBi or SimaPro is mandatory. (openLCA/other tools are secondary). |
| `LCA-M-03` | **Project History** | Lines 33–34: *"Completed at least 03 LCA projects"* | Quantifiable project delivery track record. |
| `LCA-M-04` | **Standards Knowledge** | Lines 35–36: *"Strictly follow ISO 14040 and ISO 14044 guidelines"* | Explicit reference to ISO 14040/14044 standards in studies or certifications. |
| `LCA-M-05` | **Education** | Line 44: *"Bachelor’s or Master’s (Environmental domain highly desired)"* | Degree required; bonus for Environmental Science/Engineering. |
| `LCA-M-06` | **Workplace/Location** | Line 7, 12, 37–39: *"Chennai (onsite)... relocate to Chennai... full-time from office"* | Candidate willingness or existing presence in Chennai / relocation readiness. **Methodology Rule:** Missing relocation willingness must be represented as `UNKNOWN`, not `FALSE`. Never infer willingness to relocate from a candidate's resume. |

### 2.4 Preferred / Bonus Criteria (Source: Lines 50–53)
| Criterion ID | Criterion | Source Citation | Notes for Scoring |
|---|---|---|---|
| `LCA-P-01` | **EPD Experience** | Line 51: *"Prior experience in Life Cycle Assessment (LCA) and Environmental Product Declaration (EPD)"* | Differentiator for product-level environmental declarations. |
| `LCA-P-02` | **Business Finance / Accounting** | Line 52: *"Basic understanding of business finance and accounting"* | Cost accounting, financial modeling, or budget tracking in project contexts. |
| `LCA-P-03` | **Language & Mobility** | Lines 45, 48: *"Fluent spoken and written English", "Willingness to travel extensively"* | Communication and multi-site project mobility. |

---

## 3. JD2: UI/UX Designer Internship

### 3.1 Metadata
- **Job Title:** UI/UX Designer Intern
- **Company / Product:** Growth For Impact (`growthforimpact.co` — *building LinkedIn for sustainability*)
- **Role Position:** First member of the design team
- **Location:** Fully remote, flexible working hours
- **Compensation:** Stipend of ₹10,000 – ₹15,000 per month
- **Success Milestone (90 Days):** Complete website revamp and optimal design solution for the sustainability job board.

### 3.2 Core Responsibilities (Source: Lines 7–15)
1. **User Interface Design:** Design engaging UI for website and job board across devices/platforms.
2. **User Research:** Conduct user research to understand user psychology and behavior to inform design decisions.
3. **Cross-Functional Collaboration:** Align design deliverables with business objectives.
4. **Prototyping & Specs:** Build high-fidelity prototypes and design specifications using Figma.
5. **Design Review:** Participate in critiques and feedback sessions for quality and consistency.
6. **Design System:** Maintain cohesive design language and visual identity.

### 3.3 Strict Mandatory Criteria (Source: Lines 18–32)
| Criterion ID | Criterion | Source Citation | Notes for Extraction & Scoring |
|---|---|---|---|
| `UI-M-01` | **Experience Level** | Line 19: *"0-1 year of experience in UX/UI design. If you're a recent graduate or looking to transition into a design role, we encourage you to apply"* | Target is early-career/entry-level/interns. 0–1 yr is ideal; overqualified candidates should be categorized appropriately without undue penalty. |
| `UI-M-02` | **Core Tooling (Figma)** | Line 11, 23: *"Create high-fidelity prototypes and design specifications using Figma", "Experience with Figma and prototyping tools"* | Figma proficiency is explicitly required. |
| `UI-M-03` | **Design Methodology** | Line 22: *"Proficiency in UI/UX design principles and human-centered design methodologies"* | Wireframing, user flows, personas, usability testing, HCD frameworks. |
| `UI-M-04` | **User Research & Psychology** | Lines 9, 24, 28: *"Strong understanding of user psychology and behavior", "Must be great at understanding user psychology"* | Evidence of user research, feedback loops, or behavioral inquiry in projects. |
| `UI-M-05` | **Portfolio / Artifacts** | Implicit in Lines 11, 25, 30–31: *"High-fidelity prototypes", "eye for detail", "aesthetic sense"* | Presence of portfolio links (Behance, Dribbble, Figma, personal website) or documented case studies. |

### 3.4 Preferred / Bonus Criteria (Source: Lines 3–5, 34, 41–42)
| Criterion ID | Criterion | Source Citation | Notes for Scoring |
|---|---|---|---|
| `UI-P-01` | **Sustainability Alignment** | Lines 3, 34, 43: *"building LinkedIn for sustainability", "make a real impact in the sustainability industry"* | Prior interest or project work in sustainability, clean tech, or social impact. |
| `UI-P-02` | **Web / Job Board Experience** | Lines 8, 41–42: *"website and job board... revamping the entire website"* | Prior UX work specifically on marketplace platforms, job boards, or responsive web apps. |
| `UI-P-03` | **Prototyping Diversity** | Line 23: *"prototyping tools"* | Experience with additional tools (Protopie, Framer, Adobe XD) or basic frontend literacy (HTML/CSS). |

---

## 4. Key Takeaways for Scoring & Extraction Engines

1. **Orthogonal Skillsets:**
   - LCA is an engineering/environmental science specialty requiring specific ISO standards and complex software (GaBi, SimaPro).
   - UI/UX is a visual and product design role centered on Figma, user psychology, and user flows.
   - Genuine overlap in candidates is expected to be minimal to non-existent, though candidate initials or multidisciplinary academic backgrounds might yield partial signals.
2. **Experience Expectations Differ Radically:**
   - LCA expects 2–3+ years of professional or project autonomy.
   - UI/UX explicitly encourages 0–1 years (students, fresh graduates, career switchers).
   - Scoring engines must account for these different baselines: 0 years experience in LCA is a heavy gap, while 0 years experience in UI/UX is fully expected and acceptable.
3. **Evidence Validation Focus:**
   - For LCA: look for explicit software names, ISO standard numbers, project counts, and LCI/LCA modeling responsibilities.
   - For UI/UX: look for Figma, wireframing, high-fidelity prototypes, user research, and portfolio URLs.


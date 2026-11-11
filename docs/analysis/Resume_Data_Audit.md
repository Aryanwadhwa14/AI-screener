# Resume Data Audit & Parsing Risk Assessment

**Date:** 2026-11-10  
**Status:** Completed Full Source-Data Audit  
**Dataset Location:** `data/`  
**Dataset Scope:** 47 anonymized candidate resumes  

---

## 1. Executive Summary

A programmatic audit of the source dataset in `data/` was executed. All 47 files were verified, inspected, hashed, and parsed.

| Metric | Verified Value |
|---|---|
| **Total files supplied** | 47 |
| **File formats** | 47 `.docx` (100% Microsoft Word OpenXML; 0 `.pdf` in initial batch) |
| **Unique SHA-256 hashes** | 47 (No exact byte duplicates) |
| **Min file size** | 7,733 bytes (`anonymized_resume_1793685080327.docx`) |
| **Max file size** | 10,700 bytes (`anonymized_PW_1793682784228.docx`) |
| **Word count range** | 0 to 744 words (Mean: 361.4 words) |
| **Character count range** | 0 to 5,546 characters (Mean: 2,683.9 characters) |
| **Embedded images / media** | 0 (All files contain standard XML text; no embedded image scans) |
| **Unreadable / Empty files** | 1 file (`anonymized_resume_1793685080327.docx`) |

---

## 2. Source Inventory & File Integrity

All 47 files have been indexed with their SHA-256 fingerprints, file sizes, and initial word counts. The raw inventory is saved in `docs/analysis/resume_audit_raw.json`.

### Notable File Characteristics:
1. **Naming Pattern:** Almost all files follow `anonymized_<INITIALS>_<TIMESTAMP>.docx` (e.g. `anonymized_AA_1793682784144.docx`).
2. **Single Generic Filename:** One file deviates from the initials pattern: `anonymized_resume_1793685080327.docx`.
3. **No Embedded Scans / OCR Need for Initial Batch:** Since all 47 files are native DOCX containing XML paragraph structures (`w:p`, `w:r`, `w:t`), OCR is not required for the supplied batch. However, an OCR adapter remains necessary for Phase 1/2 upload requirements to support external scanned PDFs.

---

## 3. Critical Edge Cases & Parsing Risks

### 3.1 Edge Case 1: Empty Document (`anonymized_resume_1793685080327.docx`)
- **Inspection Findings:** Inspecting `word/document.xml` revealed only a single paragraph containing an empty text tag: `<w:t xml:space="preserve"></w:t>`. The file has 0 words, 0 characters, and 0 paragraphs of actual content.
- **Risk:** Ingestion or LLM extraction will fail or hallucinate if not checked prior to LLM invocation.
- **Engine Rule:** The 50-character threshold is a low-text warning/validation trigger (not automatic proof of invalidity). Once validated as truly empty/unreadable, the candidate is marked `FAILED_EXTRACTION` with an extraction warning: `"Empty or unreadable document content"`, bypassing LLM extraction. Crucially, failed extractions must NOT receive an artificial score of zero; scores must be represented as `null`, with a clear status and manual human review requirement.

### 3.2 Edge Case 2: Minimal Content / Student Profile (`anonymized_KN_1793685080310.docx`)
- **Inspection Findings:** Contains only 84 words and 621 characters. This candidate is an active student pursuing a Post Graduate diploma in UI/UX at IIIT Bangalore with no employment history.
- **Risk:** Standard ATS parsers often reject resumes with no "Experience" section.
- **Engine Rule:** The UI/UX internship specifically accommodates 0–1 years of experience (`UI-M-01`). The parsing schema must gracefully accept an empty `work_experience` list and properly extract education, tools (Figma, Canva), and skills without lowering extraction confidence.

### 3.3 Edge Case 3: Initial Substring Collisions (`anonymized_UI_1793682784506.docx`)
- **Inspection Findings:** The candidate's initials in the resume text are literally `"UI"`. Naive substring search flags this candidate as a UI/UX applicant. In reality, the candidate is a *Sustainability Consultant / Operations In-charge* at VRS CERT FZ LLC working on ESG and carbon projects.
- **Risk:** False-positive classification into UI/UX.
- **Engine Rule:** Tokenization and extraction must distinguish candidate identity headers from functional skills. Classification must rely on semantic, evidence-grounded role scoring rather than naive keyword occurrences.

### 3.4 Edge Case 4: Completely Out-of-Domain Candidates
Several resumes represent domains completely outside both LCA and UI/UX:
- `anonymized_PS_1793682784387.docx`: Manager – Risk Analytics at Axis Bank (banking delinquency, credit risk, loan recovery portfolio analytics).
- `anonymized_KA_1793682784307.docx`: Research Executive at L’Oréal Research & Innovation (Regulatory affairs, Halal cosmetic compliance).
- `anonymized_BA_1793682784206.docx`: Automotive product compliance engineer (RoHS 2/3, REACH, IMDS, California Prop 65).
- **Risk:** Forcing a binary choice (`LCA` vs. `UI_UX`) would incorrectly assign these candidates to one of the roles with misleading low/medium scores.
- **Engine Rule:** Validates the mandatory requirement for the 4-way classification: `LCA`, `UI_UX`, `BOTH`, or `NEITHER_OR_UNCERTAIN`. Candidates whose maximum score across both roles falls below a defined baseline must receive `NEITHER_OR_UNCERTAIN`.

---

## 4. Initial Domain Distribution Estimate

Based on targeted regex analysis with strict word boundaries:
- **LCA Dominant:** ~17 candidates (e.g. SimaPro, GaBi, ISO 14040/14044, EPD, LCI).
- **UI/UX Dominant:** ~24 candidates (e.g. Figma, Wireframing, User Research, Prototyping).
- **Neither / Outlier / Unreadable:** 5–6 candidates (Bank Risk Analytics, Halal Cosmetics, Empty DOCX, Automotive Compliance).
- **Both:** 0 genuine dual-domain candidates detected (one initial candidate was an acronym collision with candidate initials "UI").

---

## 5. Ingestion Pipeline Recommendations

1. **Format Validation:** Verify magic bytes / ZIP headers for `.docx` and `%PDF` headers for `.pdf`.
2. **Text Extraction:** Use `python-docx` for reliable paragraph and table text extraction from DOCX.
3. **Empty Text Guard:** Flag files with `< 50` characters immediately as `FAILED_EXTRACTION`.
4. **Candidate ID Assignment:** Generate deterministic IDs (`CAND-001` through `CAND-047`) mapped to the unique SHA-256 hash.
5. **Private Storage:** Keep source `.docx` files in private storage; never expose file paths or un-anonymized metadata.


export type RoleKey = 'LCA' | 'UI_UX';

export type CandidateClassification = 'LCA' | 'UI_UX' | 'BOTH' | 'NEITHER_OR_UNCERTAIN';

export type ProcessingStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'FAILED'
  | 'MANUAL_REVIEW_REQUIRED';

export type QualificationStatus = 'QUALIFIED' | 'UNQUALIFIED' | 'MANUAL_REVIEW_REQUIRED';

export interface EvidenceSnippet {
  text: string;
  section?: string | null;
  page_number?: number | null;
  is_verified?: boolean;
}

export interface WorkExperienceItem {
  role_title: string;
  company_or_org?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_current?: boolean;
  years_experience?: number | null;
  responsibilities: string[];
  evidence_snippets: EvidenceSnippet[];
}

export interface EducationItem {
  degree?: string | null;
  field_of_study?: string | null;
  institution?: string | null;
  graduation_year?: number | null;
  evidence_snippets: EvidenceSnippet[];
}

export interface ProjectItem {
  title: string;
  description?: string | null;
  technologies_used: string[];
  portfolio_url?: string | null;
  evidence_snippets: EvidenceSnippet[];
}

export interface CandidateProfile {
  candidate_id: string;
  candidate_code: string;
  full_name?: string | null;
  skills: string[];
  tools_and_technologies: string[];
  total_years_experience?: number | null;
  work_experience: WorkExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: string[];
  relocation_willingness?: string | null;
  portfolio_links: string[];
  extraction_confidence: number;
  unsupported_claims: string[];
  parser_warnings: string[];
}

export interface CriterionEvaluation {
  criterion_key: string;
  criterion_name: string;
  weight: number;
  score: number;
  evidence: string[];
  notes?: string;
}

export interface RoleEvaluation {
  role_key: RoleKey;
  score: number | null;
  scoring_version: string;
  is_qualified: boolean;
  qualification_status: QualificationStatus;
  summary: string;
  breakdown: Record<string, CriterionEvaluation>;
}

export interface CandidateRankingItem {
  rank: number;
  candidate_id: string;
  candidate_code: string;
  score: number | null;
  is_qualified: boolean;
  qualification_status: QualificationStatus;
  classification: CandidateClassification;
  extraction_confidence: number;
  key_strengths: string[];
  summary?: string | null;
  verified_evidence_count?: number;
}

export interface RoleRankingResponse {
  role_key: RoleKey;
  role_title: string;
  total_candidates: number;
  qualified_count: number;
  scoring_threshold: number;
  rankings: CandidateRankingItem[];
}

export interface CandidateSummaryItem {
  id: string;
  candidate_code: string;
  classification: CandidateClassification;
  processing_status: ProcessingStatus;
  lca_score: number | null;
  uiux_score: number | null;
  original_filename: string;
  file_size: number;
  extraction_confidence: number;
  created_at: string;
}

export interface CandidateListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  candidates: CandidateSummaryItem[];
}

export interface DocumentMeta {
  original_filename: string;
  file_size: number;
  mime_type: string;
  page_count?: number | null;
  access_url?: string | null;
}

export interface TextSnippetMeta {
  raw_text: string;
  normalized_text: string;
  parser_name?: string | null;
  extraction_status: string;
  warnings: string[];
}

export interface CandidateDetailResponse {
  id: string;
  candidate_code: string;
  classification: CandidateClassification;
  processing_status: ProcessingStatus;
  lca_score: number | null;
  uiux_score: number | null;
  document: DocumentMeta;
  extracted_text: TextSnippetMeta;
  profile?: CandidateProfile | null;
  evidence_items: Record<string, any>[];
  lca_evaluation?: RoleEvaluation | null;
  uiux_evaluation?: RoleEvaluation | null;
  warnings: string[];
}

export interface ProcessingStatusResponse {
  candidate_id: string;
  candidate_code: string;
  status: ProcessingStatus;
  stage: string;
  attempt_count: number;
  error_code?: string | null;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface MethodologyResponse {
  app_name: string;
  version: string;
  scoring_version: string;
  roles: Record<string, any>;
  methodological_rules: string[];
  tie_breaking_protocol: string[];
}

export interface UploadResponse {
  message: string;
  candidate_id: string;
  candidate_code: string;
  document_id: string;
  job_id: string;
  processing_status: ProcessingStatus;
  sha256: string;
  is_duplicate?: boolean;
}

export interface SystemStats {
  totalCandidates: number;
  lcaQualified: number;
  uiuxQualified: number;
  bothQualified: number;
  neitherCount: number;
  completedProcessing: number;
  manualReviewRequired: number;
}


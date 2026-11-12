import {
  CandidateDetailResponse,
  CandidateListResponse,
  CandidateRankingItem,
  MethodologyResponse,
  ProcessingStatusResponse,
  RoleKey,
  RoleRankingResponse,
  UploadResponse,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Accept: 'application/json',
      ...options?.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
        try {
          const errorJson = await response.json();
          if (errorJson.detail) {
            errorMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
          }
        } catch {
          // fallback to text errorMsg
        }
        throw new Error(errorMsg);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (err.message && err.message.includes('Failed to fetch')) {
        throw new Error(`Cannot connect to backend server at ${this.baseUrl}. Please verify the FastAPI backend is running.`);
      }
      throw err;
    }
  }

  // Health
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/api/health');
  }

  // Jobs
  async getJobs(): Promise<any[]> {
    return this.request<any[]>('/api/jobs');
  }

  async getJob(roleKey: RoleKey): Promise<any> {
    return this.request<any>(`/api/jobs/${roleKey}`);
  }

  // Rankings
  async getRankings(
    roleKey: RoleKey,
    params?: {
      qualification_status?: string;
      min_score?: number;
      max_score?: number;
      search?: string;
    }
  ): Promise<RoleRankingResponse> {
    const query = new URLSearchParams();
    if (params?.qualification_status) query.append('qualification_status', params.qualification_status);
    if (params?.min_score !== undefined) query.append('min_score', params.min_score.toString());
    if (params?.max_score !== undefined) query.append('max_score', params.max_score.toString());
    if (params?.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request<RoleRankingResponse>(`/api/rankings/${roleKey}${queryString}`);
  }

  // Candidates
  async getCandidates(params?: {
    page?: number;
    page_size?: number;
    classification?: string;
    processing_status?: string;
    search?: string;
    min_score?: number;
    max_score?: number;
    sort_by?: string;
    sort_order?: string;
  }): Promise<CandidateListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.page_size) query.append('page_size', params.page_size.toString());
    if (params?.classification) query.append('classification', params.classification);
    if (params?.processing_status) query.append('processing_status', params.processing_status);
    if (params?.search) query.append('search', params.search);
    if (params?.min_score !== undefined) query.append('min_score', params.min_score.toString());
    if (params?.max_score !== undefined) query.append('max_score', params.max_score.toString());
    if (params?.sort_by) query.append('sort_by', params.sort_by);
    if (params?.sort_order) query.append('sort_order', params.sort_order);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request<CandidateListResponse>(`/api/candidates${queryString}`);
  }

  async getCandidateDetail(candidateId: string): Promise<CandidateDetailResponse> {
    return this.request<CandidateDetailResponse>(`/api/candidates/${candidateId}`);
  }

  async retryProcessing(candidateId: string): Promise<{ message: string; processing_status: string }> {
    return this.request<{ message: string; processing_status: string }>(`/api/candidates/${candidateId}/retry`, {
      method: 'POST',
    });
  }

  // Upload Resume
  async uploadResume(file: File, autoProcess = true): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseUrl}/api/resumes?auto_process=${autoProcess}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMsg = `Upload failed (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }

    return (await response.json()) as UploadResponse;
  }

  // Processing Status
  async getProcessingStatus(jobId: string): Promise<ProcessingStatusResponse> {
    return this.request<ProcessingStatusResponse>(`/api/jobs/${jobId}/status`);
  }

  // Methodology
  async getMethodology(): Promise<MethodologyResponse> {
    return this.request<MethodologyResponse>('/api/methodology');
  }
}

export const api = new ApiClient(API_BASE_URL);


export interface LeadSubmission {
  name: string;
  company: string;
  email: string;
  message: string;
}

export interface LeadResponse {
  message?: string;
  error?: string;
}

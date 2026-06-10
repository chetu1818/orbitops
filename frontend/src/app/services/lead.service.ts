import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LeadResponse, LeadSubmission } from '../models/lead.model';
import { resolveApiUrl } from '../utils/api';

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private readonly apiUrl = resolveApiUrl('/api/leads', 'http://localhost:5015/api/leads');

  constructor(private http: HttpClient) { }

  /**
   * Submits a B2B automation lead to the .NET Web API.
   * @param lead The validated contact form values.
   */
  submitLead(lead: LeadSubmission): Observable<LeadResponse> {
    return this.http.post<LeadResponse>(this.apiUrl, lead);
  }
}

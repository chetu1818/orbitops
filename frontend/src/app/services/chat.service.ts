import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { resolveApiUrl } from '../utils/api';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  sentAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  participantIds: string[];
  participants: any[];
  messages: ChatMessage[];
  lastMessageAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = resolveApiUrl('/api/chats', 'http://localhost:5015/api/chats');

  private getHeaders() {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', token ? `Bearer ${token}` : '');
  }

  getMyChats(): Observable<ChatSession[]> {
    return this.http.get<ChatSession[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  createChat(participantIds: string[], title: string = ''): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, { participantIds, title }, { headers: this.getHeaders() });
  }

  sendMessage(sessionId: string, content: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.apiUrl}/message`, { sessionId, content }, { headers: this.getHeaders() });
  }

  addParticipant(sessionId: string, userId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/add-participant`, { sessionId, userId }, { headers: this.getHeaders() });
  }

  searchUsers(query: string = ''): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/search-users?query=${query}`, { headers: this.getHeaders() });
  }

  renameChat(sessionId: string, newTitle: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rename`, { sessionId, newTitle }, { headers: this.getHeaders() });
  }
}

import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatSession, ChatMessage } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="teams-outer-layout">
      
      <!-- SIDEBAR: MEMBERS SEARCH & RECENT ACTIVE CHATS -->
      <div class="teams-chat-sidebar">
        <!-- Sidebar Header -->
        <div class="sidebar-header">
          <span class="header-title">Active Chats</span>
          <div class="header-icons">
            <i class="bi bi-pencil-square" title="New chat" (click)="focusSearch()"></i>
          </div>
        </div>

        <!-- Member Search input -->
        <div class="sidebar-search-container">
          <i class="bi bi-search search-icon"></i>
          <input 
            type="text" 
            id="sidebar-search-input"
            [(ngModel)]="searchQuery" 
            (input)="onSearchUsers()" 
            placeholder="Search members to chat..." 
            class="search-input"
          />
          <button *ngIf="searchQuery().trim() !== ''" class="clear-search-btn" (click)="clearSearch()">&times;</button>
        </div>

        <!-- Search Results overlay list -->
        <div *ngIf="searchQuery().trim() !== ''" class="search-results-overlay">
          <div class="results-label">Matching Members</div>
          <div *ngFor="let user of searchResults()" class="member-item" (click)="startChatWith(user)">
            <div class="member-avatar">{{ getInitials(user.name) }}</div>
            <div class="member-info">
              <span class="member-name">{{ user.name }}</span>
              <span class="member-role">{{ user.role }}</span>
            </div>
            <span class="status-indicator" 
                  [class.online]="user.status === 'Available'" 
                  [class.busy]="user.status === 'Busy'"
                  [class.offline]="user.status === 'Offline'"></span>
          </div>
          <div *ngIf="searchResults().length === 0" class="no-results-text">No matching members found.</div>
        </div>

        <!-- Active Chats list -->
        <div class="chats-section-wrapper">
          <div class="scrollable-chats">
            <div 
              *ngFor="let session of activeSessionsFiltered()" 
              class="chat-session-row" 
              [class.active]="selectedSession()?.id === session.id"
              [class.unread]="isSessionUnread(session)"
              (click)="selectSession(session)"
            >
              <div class="session-avatar-circle">
                {{ getInitials(session.title) }}
                <span class="session-status-dot" 
                      [class.online]="getSessionStatus(session) === 'Available'" 
                      [class.busy]="getSessionStatus(session) === 'Busy'"
                      [class.offline]="getSessionStatus(session) === 'Offline'"></span>
              </div>
              <div class="session-details">
                <div class="session-row-header">
                  <span class="session-title-text" [style.font-weight]="isSessionUnread(session) ? '800' : 'normal'" [style.color]="isSessionUnread(session) ? '#ffffff' : '#adadad'">{{ session.title }}</span>
                  <span class="session-time-text">{{ session.lastMessageAt | date:'HH:mm' }}</span>
                </div>
                <span class="session-last-excerpt" *ngIf="session.messages && session.messages.length > 0" [style.font-weight]="isSessionUnread(session) ? '700' : 'normal'" [style.color]="isSessionUnread(session) ? '#ffffff' : '#888888'">
                  {{ session.messages[session.messages.length - 1].content }}
                </span>
              </div>
              <!-- Unread indicator dot -->
              <span *ngIf="isSessionUnread(session)" class="unread-dot"></span>
            </div>
            <div *ngIf="activeSessionsFiltered().length === 0" class="no-chats-placeholder">
              No recent conversations.<br/>Search members above to begin.
            </div>
          </div>
        </div>

      </div>

      <!-- MAIN CHAT VIEWPORT -->
      <div class="teams-chat-viewport">
        <ng-container *ngIf="selectedSession() as session; else noSessionSelected">
          
          <!-- Viewport Header -->
          <div class="viewport-header">
            <div class="header-left">
              <div class="header-avatar" (click)="fetchAndShowProfileById(session.id, session.title)" style="cursor: pointer;">
                {{ getInitials(session.title) }}
                <span class="header-status" 
                      [class.online]="getSessionStatus(session) === 'Available'" 
                      [class.busy]="getSessionStatus(session) === 'Busy'"
                      [class.offline]="getSessionStatus(session) === 'Offline'"></span>
              </div>
              <div class="header-title-container">
                <div class="title-row" *ngIf="!isEditingTitle()">
                  <h2 (click)="fetchAndShowProfileById(session.id, session.title)" style="cursor: pointer;">{{ session.title }}</h2>
                  <i class="bi bi-pencil edit-title-btn" (click)="startEditingTitle()" title="Rename group chat"></i>
                </div>
                <div class="title-row editing" *ngIf="isEditingTitle()">
                  <input 
                    type="text" 
                    [(ngModel)]="newChatTitle" 
                    class="rename-input"
                    (keyup.enter)="saveChatTitle()"
                    (keyup.escape)="cancelEditingTitle()"
                  />
                  <i class="bi bi-check-lg rename-btn confirm" (click)="saveChatTitle()" title="Confirm"></i>
                  <i class="bi bi-x rename-btn cancel" (click)="cancelEditingTitle()" title="Cancel"></i>
                </div>
                <div class="header-tabs">
                  <span class="tab active">Chat</span>
                </div>
              </div>
            </div>
            
            <div class="header-right">
              <i class="bi bi-person-plus" (click)="toggleAddParticipantModal(true)" title="Add members"></i>
              
              <!-- Search inside chat box -->
              <div class="header-search-bar">
                <i class="bi bi-search" style="font-size: 0.8rem; color: #888888;"></i>
                <input 
                  type="text" 
                  [(ngModel)]="chatSearchQuery" 
                  placeholder="Search messages..." 
                  style="background: transparent; border: none; color: #ffffff; font-size: 0.78rem; outline: none; width: 120px;"
                />
                <button *ngIf="chatSearchQuery !== ''" (click)="chatSearchQuery = ''" style="background: none; border: none; color: #adadad; font-size: 0.8rem; cursor: pointer; padding: 0; line-height: 1;">&times;</button>
              </div>
            </div>
          </div>

          <!-- Messages Container -->
          <div class="messages-viewport" id="teams-msg-container">
            <div class="day-divider">
              <span class="divider-line"></span>
              <span class="divider-text">Today</span>
              <span class="divider-line"></span>
            </div>

            <div *ngFor="let msg of filteredMessages(session.messages); let idx = index" 
                 class="message-bubble-row" 
                 [class.right-align]="msg.senderId === authService.currentUser()?.id"
                 [class.system-message]="msg.senderId === 'system'">
              
              <!-- System Badge -->
              <ng-container *ngIf="msg.senderId === 'system'">
                <div class="system-announcement">
                  <span class="announcement-content">{{ msg.content }}</span>
                </div>
              </ng-container>

              <!-- Standard Message Bubble -->
              <ng-container *ngIf="msg.senderId !== 'system'">
                <div class="sender-avatar-block" *ngIf="msg.senderId !== authService.currentUser()?.id && shouldShowAvatar(session.messages, idx)">
                  <div class="msg-sender-avatar" (click)="fetchAndShowProfileById(msg.senderId, msg.senderName)">{{ getInitials(msg.senderName) }}</div>
                </div>
                <div class="avatar-spacer" *ngIf="msg.senderId !== authService.currentUser()?.id && !shouldShowAvatar(session.messages, idx)"></div>

                <div class="bubble-wrapper">
                  <div class="message-meta-header" *ngIf="shouldShowHeader(session.messages, idx)">
                    <span class="sender-display-name" (click)="fetchAndShowProfileById(msg.senderId, msg.senderName)" style="cursor: pointer;">{{ msg.senderName }}</span>
                    <span class="message-sent-time">{{ msg.sentAt | date:'HH:mm' }}</span>
                  </div>
                  <div class="message-content-bubble" [class.my-bubble]="msg.senderId === authService.currentUser()?.id">
                    <div class="bubble-text" [innerHTML]="highlightText(msg.content)"></div>
                    <span class="successive-time" *ngIf="!shouldShowHeader(session.messages, idx)">
                      {{ msg.sentAt | date:'HH:mm' }}
                    </span>
                  </div>
                </div>
              </ng-container>

            </div>
          </div>

          <!-- Message Input Area -->
          <div class="viewport-input-area">
            <div class="teams-input-box">
              <div class="input-text-container">
                <div 
                  #editor
                  contenteditable="true" 
                  (keydown)="onEditorKeydown($event, editor)"
                  placeholder="Type a message..." 
                  class="teams-message-field rich-editor"
                  style="min-height: 48px; max-height: 120px; overflow-y: auto; color: #fff; background: transparent; border: none; font-size: 0.88rem; outline: none; width: 100%; white-space: pre-wrap; word-break: break-word;"
                ></div>
              </div>
              <div class="input-toolbar">
                <div class="toolbar-left">
                  <div class="emoji-picker-container" style="position: relative; display: flex; align-items: center;">
                    <i class="bi bi-emoji-smile" (click)="toggleEmojiPicker()" title="Emojis" style="cursor: pointer;"></i>
                    <div class="emoji-picker-menu" *ngIf="emojiPickerOpen()" style="position: absolute; bottom: 35px; left: 0; background: #252528; border: 1px solid #3d3d3d; border-radius: 8px; padding: 0.5rem; display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; z-index: 2000; width: 180px; box-shadow: 0 8px 24px rgba(0,0,0,0.6);">
                      <span *ngFor="let emoji of emojis" (click)="insertEmoji(emoji)" style="font-size: 1.25rem; cursor: pointer; text-align: center; display: inline-block;">{{ emoji }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="toolbar-right">
                  <button type="button" class="send-message-btn" (click)="sendRichChatMessage(editor)" [disabled]="isEditorEmpty(editor.innerHTML)">
                    <i class="bi bi-send-fill" [style.opacity]="isEditorEmpty(editor.innerHTML) ? '0.4' : '1'"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </ng-container>

        <!-- No Active Conversation -->
        <ng-template #noSessionSelected>
          <div class="no-session-splash">
            <div class="splash-logo"><i class="bi bi-chat-left-dots"></i></div>
            <h3>Collaborative Chat</h3>
            <p>Select a conversation under **Active Chats** or search team members above to begin messaging.</p>
          </div>
        </ng-template>
      </div>

      <!-- RIGHT SIDE DETAIL PROFILE PANEL -->
      <div *ngIf="selectedProfileUser" class="teams-profile-panel">
        <button (click)="closeProfilePanel()" class="profile-close-btn">&times;</button>
        
        <div class="profile-header-card">
          <div class="profile-avatar-circle">
            {{ getInitials(selectedProfileUser.name) }}
          </div>
          <div>
            <h3>{{ selectedProfileUser.name }}</h3>
            <span class="profile-role-badge">{{ selectedProfileUser.role }}</span>
          </div>
        </div>

        <hr style="border: none; border-top: 1px solid #2d2d2d; margin: 1.5rem 0;" />

        <div class="profile-details-list">
          <div>
            <label>Email Address</label>
            <span>{{ selectedProfileUser.email }}</span>
          </div>
          <div>
            <label>Company</label>
            <span>{{ selectedProfileUser.company || 'OrbitOps Partner' }}</span>
          </div>
          <div>
            <label>Status</label>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
              <span class="profile-status-dot-indicator" 
                    [style.background-color]="selectedProfileUser.status === 'Available' ? '#22c55e' : (selectedProfileUser.status === 'Busy' ? '#ef4444' : '#eab308')"></span>
              <span style="font-size: 0.85rem; color: #ffffff;">{{ selectedProfileUser.status === 'Available' ? 'Online' : (selectedProfileUser.status === 'Busy' ? 'In Meeting' : 'Offline') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ADD PARTICIPANT MODAL OVERLAY -->
      <div *ngIf="showAddModal()" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h4>Add Members to Chat</h4>
            <button class="close-btn" (click)="toggleAddParticipantModal(false)">&times;</button>
          </div>
          <div class="modal-body">
            <p>Select members to add to <strong>{{ selectedSession()?.title }}</strong>.</p>
            <div class="search-invite-wrapper">
              <input 
                type="text" 
                [(ngModel)]="inviteSearchQuery" 
                (input)="onSearchInviteUsers()" 
                placeholder="Search team members by name..." 
                class="form-control"
              />
            </div>
            <div class="invite-candidates-list">
              <div 
                *ngFor="let candidate of inviteCandidates()" 
                class="candidate-row"
                (click)="inviteUser(candidate)"
              >
                <div class="candidate-meta">
                  <span class="c-name">{{ candidate.name }}</span>
                  <span class="c-role">{{ candidate.role }} ({{ candidate.company }})</span>
                </div>
                <button class="btn btn-primary btn-sm"><i class="bi bi-plus"></i> Add</button>
              </div>
              <div *ngIf="inviteCandidates().length === 0" class="no-candidates">No additional chatable members found.</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      height: 100%;
    }

    .teams-outer-layout {
      display: flex;
      height: calc(100vh - 70px);
      background: #1f1f1f;
      color: #adadad;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      overflow: hidden;
      width: 100%;
    }

    /* SIDEBAR */
    .teams-chat-sidebar {
      width: 300px;
      flex-shrink: 0;
      background: #202020;
      border-right: 1px solid #292929;
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
    }
    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.25rem 0.75rem 1.25rem;
    }
    .header-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #ffffff;
    }
    .header-icons {
      display: flex;
      font-size: 1.1rem;
      color: #9c9c9c;
    }
    .header-icons i:hover {
      color: #ffffff;
      cursor: pointer;
    }
    .sidebar-search-container {
      padding: 0.5rem 1.25rem;
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-input {
      width: 100%;
      background: #292929;
      border: 1px solid #3d3d3d;
      border-radius: 4px;
      padding: 0.35rem 0.75rem 0.35rem 2rem;
      color: #ffffff;
      font-size: 0.8rem;
      outline: none;
    }
    .search-input:focus {
      border-color: #7b69ee;
      background: #1f1f1f;
    }
    .search-icon {
      position: absolute;
      left: 1.75rem;
      color: #888888;
      font-size: 0.85rem;
    }
    .clear-search-btn {
      position: absolute;
      right: 1.75rem;
      background: none;
      border: none;
      color: #9c9c9c;
      font-size: 1.1rem;
      cursor: pointer;
    }

    /* Search Results overlay */
    .search-results-overlay {
      position: absolute;
      top: 90px;
      left: 1.25rem;
      right: 1.25rem;
      background: #242424;
      border: 1px solid #3d3d3d;
      border-radius: 4px;
      box-shadow: 0 8px 16px rgba(0,0,0,0.5);
      z-index: 99;
      max-height: 250px;
      overflow-y: auto;
    }
    .results-label {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #7b69ee;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid #2d2d2d;
    }
    .no-results-text {
      padding: 1rem;
      text-align: center;
      font-size: 0.78rem;
      color: #909090;
    }

    /* Member Row */
    .member-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.45rem 1.25rem;
      cursor: pointer;
      position: relative;
    }
    .member-item:hover {
      background: #2d2d2d;
    }
    .member-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #4a148c;
      color: #e1bee7;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.72rem;
      font-weight: 700;
    }
    .member-info {
      display: flex;
      flex-direction: column;
      line-height: 1.25;
      overflow: hidden;
    }
    .member-name {
      font-size: 0.82rem;
      font-weight: 600;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .member-role {
      font-size: 0.68rem;
      color: #909090;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      position: absolute;
      right: 1.25rem;
      top: 50%;
      transform: translateY(-50%);
      background: #eab308;
    }
    .status-indicator.online { background: #22c55e !important; }
    .status-indicator.busy { background: #ef4444 !important; }
    .status-indicator.offline { background: #eab308 !important; }

    /* Chats list */
    .chats-section-wrapper {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      margin-top: 0.5rem;
    }
    .scrollable-chats {
      overflow-y: auto;
      flex: 1;
    }
    .chat-session-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.25rem;
      cursor: pointer;
      border-left: 3px solid transparent;
      transition: background 0.15s;
    }
    .chat-session-row:hover {
      background: #2d2d2d;
    }
    .chat-session-row.active {
      background: #2b2b30;
      border-left-color: #7b69ee;
    }
    .chat-session-row.unread {
      background: rgba(123, 105, 238, 0.05);
      border-left-color: #7b69ee !important;
    }
    .chat-session-row.unread .session-title-text {
      font-weight: 800 !important;
      color: #ffffff !important;
    }
    .chat-session-row.unread .session-last-excerpt {
      font-weight: 700 !important;
      color: #ffffff !important;
    }
    .session-avatar-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #004d40;
      color: #a7ffeb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.78rem;
      font-weight: 700;
      position: relative;
      flex-shrink: 0;
    }
    .session-status-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      border: 1px solid #202020;
      position: absolute;
      bottom: -1px;
      right: -1px;
      background: #eab308;
    }
    .session-status-dot.online { background: #22c55e !important; }
    .session-status-dot.busy { background: #ef4444 !important; }
    .session-status-dot.offline { background: #eab308 !important; }
    .session-details {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
      line-height: 1.3;
    }
    .session-row-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .session-title-text {
      font-size: 0.82rem;
      font-weight: 600;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .session-time-text {
      font-size: 0.65rem;
      color: #808080;
    }
    .session-last-excerpt {
      font-size: 0.72rem;
      color: #888888;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #7b69ee;
      margin-left: 0.5rem;
      flex-shrink: 0;
    }
    .no-chats-placeholder {
      padding: 3rem 1.5rem;
      text-align: center;
      font-size: 0.78rem;
      color: #808080;
      line-height: 1.5;
    }

    /* MAIN VIEWPORT */
    .teams-chat-viewport {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #1f1f1f;
      flex: 1;
      min-width: 0;
    }
    .viewport-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.75rem;
      background: #202020;
      border-bottom: 1px solid #292929;
      height: 64px;
      flex-shrink: 0;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .header-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #004d40;
      color: #a7ffeb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 700;
      position: relative;
    }
    .header-status {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 1px solid #202020;
      position: absolute;
      bottom: -1px;
      right: -1px;
      background: #eab308;
    }
    .header-status.online { background: #22c55e !important; }
    .header-status.busy { background: #ef4444 !important; }
    .header-status.offline { background: #eab308 !important; }
    
    .header-title-container {
      display: flex;
      flex-direction: column;
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .title-row h2 {
      font-size: 0.95rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
    }
    .edit-title-btn {
      color: #9c9c9c;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .edit-title-btn:hover { color: #ffffff; }
    .rename-input {
      background: #292929;
      border: 1px solid #7b69ee;
      border-radius: 4px;
      padding: 0.15rem 0.5rem;
      color: #ffffff;
      font-size: 0.85rem;
      outline: none;
    }
    .rename-btn {
      font-size: 1.05rem;
      cursor: pointer;
      padding: 0 0.15rem;
    }
    .rename-btn.confirm { color: #4caf50; }
    .rename-btn.cancel { color: #f44336; }
    
    .header-tabs {
      display: flex;
      margin-top: 0.15rem;
    }
    .tab {
      font-size: 0.72rem;
      font-weight: 600;
      color: #ffffff;
      position: relative;
      padding-bottom: 0.2rem;
    }
    .tab.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: #7b69ee;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 1.15rem;
      font-size: 1.1rem;
      color: #9c9c9c;
    }
    .header-right i {
      cursor: pointer;
      transition: color 0.15s;
    }
    .header-right i:hover { color: #ffffff; }
    .header-search-bar {
      display: flex; 
      align-items: center; 
      background: #292929; 
      border: 1px solid #3d3d3d; 
      border-radius: 4px; 
      padding: 0.15rem 0.5rem; 
      gap: 0.25rem;
    }

    /* Messages container */
    .messages-viewport {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .day-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 1.5rem 0 1rem 0;
      width: 100%;
    }
    .divider-line {
      flex: 1;
      height: 1px;
      background: #2b2b2b;
    }
    .divider-text {
      padding: 0 0.75rem;
      font-size: 0.68rem;
      font-weight: 700;
      color: #757575;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Message Bubbles */
    .message-bubble-row {
      display: flex;
      gap: 0.65rem;
      width: 100%;
      position: relative;
    }
    .message-bubble-row.right-align {
      justify-content: flex-end;
    }
    .message-bubble-row.system-message {
      justify-content: center;
      margin: 0.5rem 0;
    }
    .system-announcement {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .announcement-content {
      background: #28282b;
      border: 1px solid #38383c;
      padding: 0.2rem 0.75rem;
      border-radius: 12px;
      font-size: 0.68rem;
      color: #9c9c9c;
      font-family: monospace;
    }
    .sender-avatar-block {
      flex-shrink: 0;
      width: 28px;
    }
    .msg-sender-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #004d40;
      color: #a7ffeb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.68rem;
      font-weight: 700;
      margin-top: 0.25rem;
      cursor: pointer;
    }
    .avatar-spacer {
      width: 28px;
      flex-shrink: 0;
    }
    .bubble-wrapper {
      display: flex;
      flex-direction: column;
      max-width: 65%;
    }
    .message-meta-header {
      display: flex;
      gap: 0.45rem;
      align-items: baseline;
      margin-bottom: 0.15rem;
    }
    .sender-display-name {
      font-size: 0.75rem;
      font-weight: 700;
      color: #ffffff;
      cursor: pointer;
    }
    .message-sent-time {
      font-size: 0.65rem;
      color: #757575;
    }
    .message-content-bubble {
      background: #29292c;
      border: 1px solid #38383c;
      color: #f5f5f5;
      padding: 0.55rem 0.95rem;
      border-radius: 8px;
      font-size: 0.92rem;
      line-height: 1.5;
      position: relative;
    }
    .message-content-bubble.my-bubble {
      background: #5c2d91;
      border-color: #6d3ca7;
      color: #ffffff;
    }
    .bubble-text {
      word-break: break-word;
    }
    .successive-time {
      font-size: 0.55rem;
      color: #707070;
      float: right;
      margin-top: 0.25rem;
      margin-left: 0.5rem;
    }

    /* Input area */
    .viewport-input-area {
      padding: 0.75rem 1.75rem 1.25rem 1.75rem;
      background: #1f1f1f;
      flex-shrink: 0;
    }
    .teams-input-box {
      background: #292929;
      border: 1px solid #3d3d3d;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: border-color 0.15s;
    }
    .teams-input-box:focus-within {
      border-color: #7b69ee;
    }
    .input-text-container {
      padding: 0.5rem 0.75rem 0.25rem 0.75rem;
    }
    .teams-message-field {
      width: 100%;
      background: transparent;
      border: none;
      color: #ffffff;
      font-size: 0.85rem;
      outline: none;
    }
    .input-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.35rem 0.75rem;
      background: #242424;
      border-top: 1px solid #2d2d2d;
    }
    .toolbar-left {
      display: flex;
      gap: 0.85rem;
      color: #9c9c9c;
      font-size: 1rem;
    }
    .toolbar-left i {
      cursor: pointer;
    }
    .toolbar-left i:hover {
      color: #ffffff;
    }
    .send-message-btn {
      background: none;
      border: none;
      color: #7b69ee;
      font-size: 0.95rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .send-message-btn:disabled {
      color: #444444;
      cursor: not-allowed;
    }
    .send-message-btn:not(:disabled):hover {
      color: #9587f2;
    }
    .rich-editor:empty::before {
      content: attr(placeholder);
      color: #888888;
      pointer-events: none;
    }

    /* Splash Screen */
    .no-session-splash {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem;
      background: #1f1f1f;
    }
    .splash-logo {
      font-size: 3.5rem;
      color: #2b2b2b;
      margin-bottom: 1rem;
    }
    .no-session-splash h3 {
      font-size: 1.15rem;
      color: #ffffff;
      margin: 0 0 0.5rem 0;
    }
    .no-session-splash p {
      font-size: 0.8rem;
      color: #8c8c8c;
      max-width: 400px;
      line-height: 1.5;
    }

    /* Detail Profile Panel */
    .teams-profile-panel {
      width: 280px;
      background: #202020;
      border-left: 1px solid #292929;
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 1.5rem;
      flex-shrink: 0;
      position: relative;
    }
    .profile-close-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: none;
      border: none;
      color: #adadad;
      font-size: 1.2rem;
      cursor: pointer;
    }
    .profile-header-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
      text-align: center;
    }
    .profile-avatar-circle {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #4a148c;
      color: #e1bee7;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      font-weight: 700;
      border: 2px solid #7b69ee;
    }
    .profile-role-badge {
      font-size: 0.75rem;
      color: #7b69ee;
      font-weight: 600;
      text-transform: uppercase;
      background: rgba(123, 105, 238, 0.1);
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      display: inline-block;
      margin-top: 0.25rem;
    }
    .profile-details-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      flex: 1;
    }
    .profile-details-list label {
      font-size: 0.68rem;
      color: #888888;
      text-transform: uppercase;
      font-weight: 700;
      display: block;
      margin-bottom: 0.25rem;
    }
    .profile-details-list span {
      font-size: 0.85rem;
      color: #ffffff;
      word-break: break-all;
    }
    .profile-status-dot-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }

    /* Modal dialog */
    .modal-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(3px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-card {
      width: 100%;
      max-width: 440px;
      background: #202020;
      border: 1px solid #3d3d3d;
      border-radius: 8px;
      box-shadow: 0 12px 24px rgba(0,0,0,0.6);
      overflow: hidden;
    }
    .modal-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #2d2d2d;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1c1c1c;
    }
    .modal-header h4 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: #ffffff;
    }
    .close-btn {
      background: none;
      border: none;
      color: #9c9c9c;
      font-size: 1.35rem;
      cursor: pointer;
    }
    .modal-body {
      padding: 1.25rem;
    }
    .modal-body p {
      font-size: 0.78rem;
      color: #909090;
      margin-bottom: 0.85rem;
    }
    .search-invite-wrapper {
      margin-bottom: 1rem;
    }
    .search-invite-wrapper .form-control {
      width: 100%;
      background: #292929;
      border: 1px solid #3d3d3d;
      border-radius: 4px;
      padding: 0.35rem 0.75rem;
      color: #ffffff;
      font-size: 0.82rem;
      outline: none;
    }
    .invite-candidates-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 200px;
      overflow-y: auto;
    }
    .candidate-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #292929;
      border: 1px solid #3d3d3d;
      padding: 0.5rem 0.75rem;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .candidate-row:hover {
      background: #333333;
    }
    .candidate-meta {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .c-name {
      font-size: 0.78rem;
      font-weight: 600;
      color: #ffffff;
    }
    .c-role {
      font-size: 0.65rem;
      color: #909090;
    }
    .no-candidates {
      text-align: center;
      font-size: 0.75rem;
      color: #909090;
      padding: 1rem;
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private chatService = inject(ChatService);

  activeSessions = signal<ChatSession[]>([]);
  selectedSession = signal<ChatSession | null>(null);

  membersList = signal<any[]>([]);

  searchQuery = signal('');
  searchResults = signal<any[]>([]);

  inviteSearchQuery = signal('');
  inviteCandidates = signal<any[]>([]);

  showAddModal = signal(false);

  // Renaming chat state
  isEditingTitle = signal(false);
  newChatTitle = signal('');

  // Sections collapsible state
  sectionsOpen: { [key: string]: boolean } = {
    chats: true
  };

  // Profile sidebar state
  selectedProfileUser: any = null;

  // Search inside chat
  chatSearchQuery = '';

  readCounts: { [sessionId: string]: number } = {};

  private pollIntervalId: any;

  // Rich toolbar states
  emojiPickerOpen = signal(false);

  emojis = ['😊', '👍', '❤️', '😆', '😮', '😢', '🔥', '👏', '🎉', '💡', '🚀', '💯'];

  ngOnInit() {
    // Load read counts
    const storedCounts = localStorage.getItem('orbitops_chat_read_counts');
    if (storedCounts) {
      try {
        this.readCounts = JSON.parse(storedCounts);
      } catch {}
    }

    this.loadMyChats();
    this.loadMembersList();

    this.pollIntervalId = setInterval(() => {
      this.loadMyChats(true);
      this.loadMembersList();
    }, 4000);
  }

  ngOnDestroy() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
    }
  }

  loadMyChats(isSilent: boolean = false) {
    this.chatService.getMyChats().subscribe({
      next: (chats) => {
        chats.forEach(c => {
          if (this.readCounts[c.id] === undefined) {
            this.readCounts[c.id] = c.messages ? c.messages.length : 0;
          }
        });
        localStorage.setItem('orbitops_chat_read_counts', JSON.stringify(this.readCounts));

        this.activeSessions.set(chats);

        if (this.selectedSession()) {
          const updated = chats.find(c => c.id === this.selectedSession()?.id);
          if (updated) {
            const currentMsgCount = this.selectedSession()?.messages?.length || 0;
            this.selectedSession.set(updated);
            this.updateReadCount(updated);
            if (updated.messages && updated.messages.length > currentMsgCount) {
              this.scrollToBottom();
            }
          }
        }
      }
    });
  }

  getDemoStatus(name: string): string {
    const lower = (name || '').toLowerCase();
    if (lower.includes('piyush') || lower.includes('chetan')) {
      return 'Available';
    } else if (lower.includes('elena') || lower.includes('marcus') || lower.includes('jane')) {
      return 'Offline';
    } else {
      return 'Busy';
    }
  }

  loadMembersList() {
    this.chatService.searchUsers('').subscribe({
      next: (users) => {
        const mappedUsers = users.map(u => ({ ...u, status: this.getDemoStatus(u.name) }));
        this.membersList.set(mappedUsers);
      }
    });
  }

  onSearchUsers() {
    const q = this.searchQuery().trim();
    if (q === '') {
      this.searchResults.set([]);
      return;
    }
    this.chatService.searchUsers(q).subscribe({
      next: (users) => {
        const mapped = users.map(u => ({ ...u, status: this.getDemoStatus(u.name) }));
        this.searchResults.set(mapped);
      }
    });
  }

  onSearchInviteUsers() {
    const q = this.inviteSearchQuery().trim();
    this.chatService.searchUsers(q).subscribe({
      next: (users) => {
        const activeIds = this.selectedSession()?.participantIds || [];
        this.inviteCandidates.set(users.filter(u => !activeIds.includes(u.id)));
      }
    });
  }

  startChatWith(targetUser: any) {
    this.chatService.createChat([targetUser.id]).subscribe({
      next: (sessionRes) => {
        this.clearSearch();
        this.loadMyChats();
        
        setTimeout(() => {
          const found = this.activeSessions().find(c => c.id === sessionRes.id);
          if (found) {
            this.selectSession(found);
          } else {
            this.selectedSession.set(sessionRes);
          }
        }, 100);
      }
    });
  }

  selectSession(session: ChatSession) {
    this.selectedSession.set(session);
    this.isEditingTitle.set(false);
    this.updateReadCount(session);
    this.scrollToBottom();
  }

  // Filtered Chats (only show chats that have at least one message, or is currently selected)
  activeSessionsFiltered() {
    const selectedId = this.selectedSession()?.id;
    return this.activeSessions().filter(s => (s.messages && s.messages.length > 0) || s.id === selectedId);
  }

  showProfile(user: any) {
    this.selectedProfileUser = user;
  }

  closeProfilePanel() {
    this.selectedProfileUser = null;
  }

  fetchAndShowProfileById(userId: string, userName: string) {
    let user = this.membersList().find(u => u.id === userId);
    if (!user && this.selectedSession()) {
      user = this.selectedSession()?.participants.find(p => p.id === userId);
    }
    if (user) {
      this.showProfile(user);
    } else {
      this.showProfile({
        id: userId,
        name: userName,
        email: `${userName.toLowerCase().replace(/\s+/g, '')}@orbit.ai`,
        role: 'Team Member',
        company: 'OrbitOps Client',
        status: this.getDemoStatus(userName)
      });
    }
  }

  getSessionStatus(session: ChatSession): string {
    const currentUserId = this.authService.currentUser()?.id;
    const otherUser = session.participants?.find(p => p.id !== currentUserId);
    if (!otherUser) return 'Available';
    const actualMember = this.membersList().find(m => m.id === otherUser.id);
    return actualMember ? actualMember.status : this.getDemoStatus(otherUser.name);
  }

  filteredMessages(messages: ChatMessage[]): ChatMessage[] {
    const q = this.chatSearchQuery.trim().toLowerCase();
    if (q === '') return messages || [];
    return (messages || []).filter(m => m.content.toLowerCase().includes(q));
  }

  highlightText(text: string): string {
    const q = this.chatSearchQuery.trim();
    if (q === '') return text;
    
    const escapedQ = q.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedQ})`, 'gi');
    return text.replace(regex, '<span style="background-color: #7b69ee; color: #ffffff; padding: 0 2px; border-radius: 2px; font-weight: bold;">$1</span>');
  }

  isSessionUnread(session: ChatSession): boolean {
    if (this.selectedSession()?.id === session.id) {
      return false;
    }
    const msgCount = session.messages ? session.messages.length : 0;
    if (this.readCounts[session.id] === undefined) {
      this.readCounts[session.id] = msgCount;
      localStorage.setItem('orbitops_chat_read_counts', JSON.stringify(this.readCounts));
      return false;
    }
    return msgCount > this.readCounts[session.id];
  }

  updateReadCount(session: ChatSession) {
    const msgCount = session.messages ? session.messages.length : 0;
    this.readCounts[session.id] = msgCount;
    localStorage.setItem('orbitops_chat_read_counts', JSON.stringify(this.readCounts));
  }

  toggleAddParticipantModal(show: boolean) {
    this.showAddModal.set(show);
    if (show) {
      this.inviteSearchQuery.set('');
      this.onSearchInviteUsers();
    }
  }

  inviteUser(candidate: any) {
    const session = this.selectedSession();
    if (!session) return;

    this.chatService.addParticipant(session.id, candidate.id).subscribe({
      next: () => {
        this.toggleAddParticipantModal(false);
        this.loadMyChats();
      }
    });
  }

  startEditingTitle() {
    this.newChatTitle.set(this.selectedSession()?.title || '');
    this.isEditingTitle.set(true);
  }

  saveChatTitle() {
    const session = this.selectedSession();
    const newTitle = this.newChatTitle().trim();
    if (!session || newTitle === '') {
      this.isEditingTitle.set(false);
      return;
    }

    this.chatService.renameChat(session.id, newTitle).subscribe({
      next: (res) => {
        session.title = res.title;
        this.isEditingTitle.set(false);
        this.loadMyChats(true);
      }
    });
  }

  cancelEditingTitle() {
    this.isEditingTitle.set(false);
  }

  toggleSection(section: string) {
    this.sectionsOpen[section] = !this.sectionsOpen[section];
  }

  getInitials(name: string): string {
    if (!name) return 'VY';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  clearSearch() {
    this.searchQuery.set('');
    this.searchResults.set([]);
  }

  focusSearch() {
    const input = document.getElementById('sidebar-search-input');
    if (input) {
      input.focus();
    }
  }

  shouldShowAvatar(messages: ChatMessage[], index: number): boolean {
    if (index === 0) return true;
    const prev = messages[index - 1];
    const current = messages[index];
    if (prev.senderId !== current.senderId) return true;
    const prevTime = new Date(prev.sentAt).getTime();
    const currentTime = new Date(current.sentAt).getTime();
    return (currentTime - prevTime) > 120000;
  }

  shouldShowHeader(messages: ChatMessage[], index: number): boolean {
    return this.shouldShowAvatar(messages, index);
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = document.getElementById('teams-msg-container');
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }

  toggleEmojiPicker() {
    this.emojiPickerOpen.update(v => !v);
  }

  insertEmoji(emoji: string) {
    const editor = document.querySelector('.rich-editor') as HTMLElement;
    if (editor) {
      editor.focus();
      document.execCommand('insertText', false, emoji);
    }
    this.emojiPickerOpen.set(false);
  }

  isEditorEmpty(html: string): boolean {
    if (!html) return true;
    const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
    return text === '';
  }

  sendRichChatMessage(editorEl: HTMLElement) {
    const content = editorEl.innerHTML.trim();
    const session = this.selectedSession();
    if (this.isEditorEmpty(content) || !session) return;

    editorEl.innerHTML = '';
    
    this.chatService.sendMessage(session.id, content).subscribe({
      next: (msg) => {
        if (!session.messages) session.messages = [];
        session.messages.push(msg);
        this.scrollToBottom();
        this.loadMyChats(true);
      }
    });
  }

  onEditorKeydown(event: KeyboardEvent, editor: HTMLElement) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendRichChatMessage(editor);
    }
  }
}

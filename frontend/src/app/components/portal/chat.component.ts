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
      
      <!-- 1. LEFT-MOST NAVIGATION ICON SIDEBAR -->
      <div class="teams-nav-sidebar">
        <div class="nav-top-icons">
          <div class="nav-icon-wrapper" title="Activity">
            <i class="bi bi-bell-fill"></i>
            <span class="icon-label">Activity</span>
          </div>
          <div class="nav-icon-wrapper active" title="Chat">
            <i class="bi bi-chat-left-text-fill"></i>
            <span class="icon-label">Chat</span>
            <span class="badge">4</span>
          </div>
          <div class="nav-icon-wrapper" title="Teams">
            <i class="bi bi-people-fill"></i>
            <span class="icon-label">Teams</span>
          </div>
          <div class="nav-icon-wrapper" title="Calendar">
            <i class="bi bi-calendar3"></i>
            <span class="icon-label">Calendar</span>
          </div>
          <div class="nav-icon-wrapper" title="Calls">
            <i class="bi bi-telephone-fill"></i>
            <span class="icon-label">Calls</span>
          </div>
          <div class="nav-icon-wrapper" title="Files">
            <i class="bi bi-file-earmark-fill"></i>
            <span class="icon-label">Files</span>
          </div>
        </div>
        <div class="nav-bottom-icons">
          <div class="nav-avatar-badge b-avatar">B</div>
          <div class="nav-avatar-badge pc-avatar">PC</div>
          <div class="nav-avatar-badge pc-avatar2">
            PC
            <span class="avatar-badge-dot">2</span>
          </div>
        </div>
      </div>

      <!-- 2. SECOND SIDEBAR: CHANNELS & QUICK VIEWS & CHATS -->
      <div class="teams-chat-sidebar">
        <!-- Sidebar Header -->
        <div class="sidebar-header">
          <span class="header-title">Chat</span>
          <div class="header-icons">
            <i class="bi bi-three-dots" title="More options"></i>
            <i class="bi bi-funnel" title="Filter"></i>
            <i class="bi bi-pencil-square" title="New chat" (click)="focusSearch()"></i>
          </div>
        </div>

        <!-- Pill Filters -->
        <div class="pill-filters">
          <span class="pill active">Chats</span>
          <span class="pill">Channels</span>
          <span class="pill">Unread</span>
        </div>

        <!-- Copilot Shortcut -->
        <div class="copilot-item">
          <i class="bi bi-brightness-high-fill copilot-icon"></i>
          <span>Copilot</span>
        </div>

        <!-- Collapsible Quick Views -->
        <div class="collapsible-section">
          <div class="section-trigger" (click)="toggleSection('quickViews')">
            <i class="bi" [class.bi-chevron-down]="sectionsOpen['quickViews']" [class.bi-chevron-right]="!sectionsOpen['quickViews']"></i>
            <span>Quick views</span>
          </div>
          <div class="section-content" *ngIf="sectionsOpen['quickViews']">
            <div class="sub-item"><i class="bi bi-chat-square-text"></i> Followed threads</div>
            <div class="sub-item"><i class="bi bi-compass"></i> Discover</div>
            <div class="sub-item"><i class="bi bi-file-earmark"></i> Drafts</div>
          </div>
        </div>

        <!-- Dynamic Search and Results -->
        <div class="sidebar-search-container">
          <i class="bi bi-search search-icon"></i>
          <input 
            type="text" 
            id="sidebar-search-input"
            [(ngModel)]="searchQuery" 
            (input)="onSearchUsers()" 
            placeholder="Search members or start typing..." 
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
            <span class="status-indicator" [class.online]="user.status === 'Available'" [class.busy]="user.status === 'Busy'"></span>
          </div>
          <div *ngIf="searchResults().length === 0" class="no-results-text">No matching members found.</div>
        </div>

        <!-- Collapsible Contacted Users -->
        <div class="collapsible-section">
          <div class="section-trigger" (click)="toggleSection('contacted')">
            <i class="bi" [class.bi-chevron-down]="sectionsOpen['contacted']" [class.bi-chevron-right]="!sectionsOpen['contacted']"></i>
            <span>Contacted Users</span>
          </div>
          <div class="section-content" *ngIf="sectionsOpen['contacted']">
            <div *ngFor="let cUser of contactedUsers()" class="member-item" (click)="selectContactedUser(cUser)">
              <div class="member-avatar" style="cursor: pointer;">{{ getInitials(cUser.name) }}</div>
              <div class="member-info" style="cursor: pointer;">
                <span class="member-name">{{ cUser.name }}</span>
                <span class="member-role">{{ cUser.role }}</span>
              </div>
            </div>
            <div *ngIf="contactedUsers().length === 0" class="no-chats-placeholder" style="padding: 0.5rem 1.25rem; text-align: left;">
              No contacted users yet.
            </div>
          </div>
        </div>

        <!-- Collapsible Phase 3 Make (Members List) -->
        <div class="collapsible-section">
          <div class="section-trigger" (click)="toggleSection('members')">
            <i class="bi" [class.bi-chevron-down]="sectionsOpen['members']" [class.bi-chevron-right]="!sectionsOpen['members']"></i>
            <span>Phase 3 Make</span>
          </div>
          <div class="section-content" *ngIf="sectionsOpen['members']">
            <!-- Current User (You) -->
            <div class="member-item" *ngIf="authService.currentUser() as currentUser" (click)="selectContactedUser(currentUser)">
              <div class="member-avatar self">{{ getInitials(currentUser.name) }}</div>
              <div class="member-info">
                <span class="member-name">{{ currentUser.name }} (You)</span>
                <span class="member-role">Client Admin</span>
              </div>
              <span class="status-indicator online"></span>
            </div>

            <!-- Other Members -->
            <div *ngFor="let member of membersList()" class="member-item" (click)="selectContactedUser(member)">
              <div class="member-avatar">{{ getInitials(member.name) }}</div>
              <div class="member-info">
                <span class="member-name">{{ member.name }}</span>
                <span class="member-role">{{ member.role }}</span>
              </div>
              <span class="status-indicator" [class.online]="member.status === 'Available'" [class.busy]="member.status === 'Busy'"></span>
            </div>
          </div>
        </div>

        <!-- Collapsible Chats (Recent Active Chats) -->
        <div class="collapsible-section chats-section-wrapper">
          <div class="section-trigger" (click)="toggleSection('chats')">
            <i class="bi" [class.bi-chevron-down]="sectionsOpen['chats']" [class.bi-chevron-right]="!sectionsOpen['chats']"></i>
            <span>Chats</span>
          </div>
          <div class="section-content scrollable-chats" *ngIf="sectionsOpen['chats']">
            <div 
              *ngFor="let session of activeSessions()" 
              class="chat-session-row" 
              [class.active]="selectedSession()?.id === session.id"
              [class.unread]="isSessionUnread(session)"
              (click)="selectSession(session)"
            >
              <div class="session-avatar-circle">
                {{ getInitials(session.title) }}
                <span class="session-status-dot online"></span>
              </div>
              <div class="session-details">
                <div class="session-row-header">
                  <span class="session-title-text" [style.font-weight]="isSessionUnread(session) ? '800' : 'normal'" [style.color]="isSessionUnread(session) ? '#ffffff' : '#adadad'">{{ session.title }}</span>
                  <span class="session-time-text">{{ session.lastMessageAt | date:'HH:mm' }}</span>
                </div>
                <span class="session-last-excerpt" *ngIf="session.messages.length > 0" [style.font-weight]="isSessionUnread(session) ? '700' : 'normal'" [style.color]="isSessionUnread(session) ? '#ffffff' : '#888888'">
                  {{ session.messages[session.messages.length - 1].content }}
                </span>
              </div>
              <!-- Unread badge/dot -->
              <span *ngIf="isSessionUnread(session)" class="unread-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #7b69ee; margin-left: 0.5rem; flex-shrink: 0;"></span>
            </div>
            <div *ngIf="activeSessions().length === 0" class="no-chats-placeholder">
              No recent conversations. Use search or select a member above.
            </div>
          </div>
        </div>

      </div>

      <!-- 3. MAIN CHAT VIEWPORT -->
      <div class="teams-chat-viewport">
        <ng-container *ngIf="selectedSession() as session; else noSessionSelected">
          
          <!-- Viewport Header -->
          <div class="viewport-header">
            <div class="header-left">
              <div class="header-avatar" (click)="fetchAndShowProfileById(session.id, session.title)" style="cursor: pointer;">
                {{ getInitials(session.title) }}
                <span class="header-status online"></span>
              </div>
              <div class="header-title-container">
                <!-- Inline Chat Rename Toggle -->
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
                <!-- Navigation Tabs -->
                <div class="header-tabs">
                  <span class="tab active">Chat</span>
                  <span class="tab">Shared</span>
                  <span class="tab">Storyline</span>
                  <span class="tab" (click)="toggleAddParticipantModal(true)"><i class="bi bi-plus"></i></span>
                </div>
              </div>
            </div>
            
            <div class="header-right">
              <!-- Video Call Button -->
              <i class="bi bi-camera-video" (click)="triggerCallSimulation({ name: session.title }, 'video')" title="Video call"></i>
              <!-- Audio Call Button -->
              <i class="bi bi-telephone" (click)="triggerCallSimulation({ name: session.title }, 'audio')" title="Audio call"></i>
              <i class="bi bi-box-arrow-up" title="Screen share"></i>
              <i class="bi bi-person-plus" (click)="toggleAddParticipantModal(true)" title="Add members"></i>
              
              <!-- Search inside chat box -->
              <div class="header-search-bar" style="display: flex; align-items: center; background: #292929; border: 1px solid #3d3d3d; border-radius: 4px; padding: 0.15rem 0.5rem; gap: 0.25rem;">
                <i class="bi bi-search" style="font-size: 0.8rem; color: #888888;"></i>
                <input 
                  type="text" 
                  [(ngModel)]="chatSearchQuery" 
                  placeholder="Search messages..." 
                  style="background: transparent; border: none; color: #ffffff; font-size: 0.78rem; outline: none; width: 120px;"
                />
                <button *ngIf="chatSearchQuery !== ''" (click)="chatSearchQuery = ''" style="background: none; border: none; color: #adadad; font-size: 0.8rem; cursor: pointer; padding: 0; line-height: 1;">&times;</button>
              </div>

              <i class="bi bi-three-dots" title="More settings"></i>
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
                <!-- Sender Avatar on Left for incoming messages -->
                <div class="sender-avatar-block" *ngIf="msg.senderId !== authService.currentUser()?.id && shouldShowAvatar(session.messages, idx)">
                  <div class="msg-sender-avatar" (click)="fetchAndShowProfileById(msg.senderId, msg.senderName)">{{ getInitials(msg.senderName) }}</div>
                </div>
                <div class="avatar-spacer" *ngIf="msg.senderId !== authService.currentUser()?.id && !shouldShowAvatar(session.messages, idx)"></div>

                <!-- Bubble and Meta -->
                <div class="bubble-wrapper">
                  <!-- Sender Header details if first in group -->
                  <div class="message-meta-header" *ngIf="shouldShowHeader(session.messages, idx)">
                    <span class="sender-display-name" (click)="fetchAndShowProfileById(msg.senderId, msg.senderName)" style="cursor: pointer;">{{ msg.senderName }}</span>
                    <span class="message-sent-time">{{ msg.sentAt | date:'HH:mm' }}</span>
                  </div>
                  <!-- Bubble Content -->
                  <div class="message-content-bubble" [class.my-bubble]="msg.senderId === authService.currentUser()?.id">
                    <div class="bubble-text" [innerHTML]="highlightText(msg.content)"></div>
                    
                    <!-- Tiny time indicator inside bubble for successive messages -->
                    <span class="successive-time" *ngIf="!shouldShowHeader(session.messages, idx)">
                      {{ msg.sentAt | date:'HH:mm' }}
                    </span>

                    <!-- Floating Hover Reactions Bar -->
                    <div class="bubble-reaction-bar">
                      <span class="reaction-emoji" title="Like">👍</span>
                      <span class="reaction-emoji" title="Heart">❤️</span>
                      <span class="reaction-emoji" title="Laugh">😆</span>
                      <span class="reaction-emoji" title="Surprised">😮</span>
                      <span class="reaction-emoji" title="Sad">😢</span>
                      <span class="reaction-emoji" title="More">...</span>
                    </div>
                  </div>
                </div>
              </ng-container>

            </div>
          </div>

          <!-- Message Input Area -->
          <div class="viewport-input-area">
            <form (ngSubmit)="sendChatMessage()" class="teams-input-box">
              <div class="input-text-container">
                <input 
                  type="text" 
                  [(ngModel)]="newMessageContent" 
                  name="msgContent"
                  placeholder="Type a message" 
                  class="teams-message-field"
                  autocomplete="off"
                />
              </div>
              <div class="input-toolbar">
                <div class="toolbar-left">
                  <i class="bi bi-type" title="Format Text"></i>
                  <i class="bi bi-emoji-smile" title="Emojis"></i>
                  <i class="bi bi-filetype-gif" title="GIFs"></i>
                  <i class="bi bi-sticky" title="Stickers"></i>
                  <i class="bi bi-paperclip" title="Attach file"></i>
                </div>
                <div class="toolbar-right">
                  <button type="submit" class="send-message-btn" [disabled]="newMessageContent().trim() === ''">
                    <i class="bi bi-send-fill"></i>
                  </button>
                </div>
              </div>
            </form>
          </div>

        </ng-container>

        <!-- No Active Conversation -->
        <ng-template #noSessionSelected>
          <div class="no-session-splash">
            <div class="splash-logo"><i class="bi bi-chat-left-dots"></i></div>
            <h3>Microsoft Teams Collaboration</h3>
            <p>Select a group conversation under **Chats**, search team members, or click on a member in the **Phase 3 Make** list to begin direct messaging.</p>
          </div>
        </ng-template>
      </div>

      <!-- 4. RIGHT SIDE DETAIL PROFILE PANEL -->
      <div *ngIf="selectedProfileUser" class="teams-profile-panel" style="width: 280px; background: #202020; border-left: 1px solid #292929; display: flex; flex-direction: column; height: 100%; padding: 1.5rem; flex-shrink: 0; position: relative;">
        <!-- Close button -->
        <button (click)="closeProfilePanel()" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: #adadad; font-size: 1.2rem; cursor: pointer;">&times;</button>
        
        <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; margin-top: 2rem; text-align: center;">
          <div style="width: 72px; height: 72px; border-radius: 50%; background: #4a148c; color: #e1bee7; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; font-weight: 700; border: 2px solid #7b69ee;">
            {{ getInitials(selectedProfileUser.name) }}
          </div>
          <div>
            <h3 style="font-size: 1.1rem; color: #ffffff; margin-bottom: 0.25rem;">{{ selectedProfileUser.name }}</h3>
            <span style="font-size: 0.75rem; color: #7b69ee; font-weight: 600; text-transform: uppercase; background: rgba(123, 105, 238, 0.1); padding: 0.2rem 0.6rem; border-radius: 12px;">{{ selectedProfileUser.role }}</span>
          </div>
        </div>

        <hr style="border: none; border-top: 1px solid #2d2d2d; margin: 1.5rem 0;" />

        <div style="display: flex; flex-direction: column; gap: 1rem; flex: 1;">
          <div>
            <label style="font-size: 0.68rem; color: #888888; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">Email Address</label>
            <span style="font-size: 0.85rem; color: #ffffff; word-break: break-all;">{{ selectedProfileUser.email }}</span>
          </div>
          <div>
            <label style="font-size: 0.68rem; color: #888888; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">Company</label>
            <span style="font-size: 0.85rem; color: #ffffff;">{{ selectedProfileUser.company || 'OrbitOps Partner' }}</span>
          </div>
          <div>
            <label style="font-size: 0.68rem; color: #888888; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">Status</label>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
              <span style="width: 8px; height: 8px; border-radius: 50%;" [style.background-color]="selectedProfileUser.status === 'Busy' ? '#f44336' : '#4caf50'"></span>
              <span style="font-size: 0.85rem; color: #ffffff;">{{ selectedProfileUser.status || 'Available' }}</span>
            </div>
          </div>
        </div>

        <!-- Call and Video Action Shortcuts in Profile Panel -->
        <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: auto;">
          <button (click)="triggerCallSimulation(selectedProfileUser, 'audio')" class="btn btn-secondary" style="width: 100%; justify-content: center; font-size: 0.85rem; padding: 0.5rem 1rem; border: 1px solid #3d3d3d;">
            <i class="bi bi-telephone-fill"></i> Voice Call
          </button>
          <button (click)="triggerCallSimulation(selectedProfileUser, 'video')" class="btn btn-primary" style="width: 100%; justify-content: center; font-size: 0.85rem; padding: 0.5rem 1rem; background: #7b69ee;">
            <i class="bi bi-camera-video-fill"></i> Video Call
          </button>
        </div>
      </div>

      <!-- ADD PARTICIPANT DRAWER MODAL OVERLAY -->
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

      <!-- 5. TEAMS-STYLE CALL SIMULATION OVERLAY -->
      <div *ngIf="activeCall() as call" class="modal-overlay" style="z-index: 2000; background: rgba(15, 15, 15, 0.95); backdrop-filter: blur(10px); position: absolute; top:0; left:0; width:100%; height:100%;">
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 2rem; width: 100%; color: #ffffff;">
          
          <!-- Caller Avatar and Ringing/Video display -->
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 200px; height: 200px; border-radius: 50%; background: #2d2d30;">
            <div *ngIf="call.status === 'ringing'" class="ringing-ring" style="position: absolute; border: 2px solid #7b69ee; border-radius: 50%; animation: ring-pulse 1.5s infinite; width: 220px; height: 220px;"></div>
            <div *ngIf="call.status === 'ringing'" class="ringing-ring" style="position: absolute; border: 2px solid #7b69ee; border-radius: 50%; animation: ring-pulse 1.5s infinite; animation-delay: 0.5s; width: 240px; height: 240px;"></div>
            
            <!-- Video Simulation placeholder -->
            <div *ngIf="call.type === 'video' && call.status === 'connected'" style="position: absolute; inset: 0; border-radius: 20px; overflow: hidden; border: 3px solid #7b69ee; background: #000; display: flex; align-items: center; justify-content: center; width: 320px; height: 240px; transform: translateY(-20px);">
              <div style="text-align: center; color: #ffffff;">
                <i class="bi bi-person-video3" style="font-size: 3rem; color: #7b69ee; animation: float 4s infinite;"></i>
                <div style="font-size: 0.85rem; margin-top: 0.5rem; color: #adadad;">[ Simulating Video Stream ]</div>
              </div>
            </div>

            <!-- Initials for audio call or ringing video call -->
            <div *ngIf="call.type === 'audio' || call.status === 'ringing'" style="width: 140px; height: 140px; border-radius: 50%; background: #7b69ee; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: bold; box-shadow: 0 0 32px rgba(123, 105, 238, 0.4);">
              {{ getInitials(call.user.name) }}
            </div>
          </div>

          <!-- Metadata -->
          <div style="text-align: center; margin-top: 1rem;">
            <h2 style="font-size: 1.6rem; color: #ffffff; margin-bottom: 0.5rem;">{{ call.user.name }}</h2>
            <p style="font-size: 0.95rem; color: #adadad; margin: 0; font-family: monospace;">
              <span *ngIf="call.status === 'ringing'">Calling via {{ call.type }}...</span>
              <span *ngIf="call.status === 'connected'" style="color: #4caf50;">
                Connected — {{ formatCallDuration(call.duration) }}
              </span>
            </p>
          </div>

          <!-- Controls panel -->
          <div style="display: flex; gap: 1.5rem; background: #202020; padding: 1rem 2.5rem; border-radius: 40px; border: 1px solid #3d3d3d; box-shadow: 0 8px 24px rgba(0,0,0,0.5); align-items: center;">
            <button style="background: none; border: none; color: #ffffff; font-size: 1.35rem; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; background: #2f2f32;" title="Mute Microphone">
              <i class="bi bi-mic-fill"></i>
            </button>
            <button style="background: none; border: none; color: #ffffff; font-size: 1.35rem; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; background: #2f2f32;" title="Toggle Camera">
              <i class="bi bi-camera-video-fill"></i>
            </button>
            <button (click)="hangUpCall()" style="background: none; border: none; color: #ffffff; font-size: 1.35rem; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: 50%; background: #f44336;" title="Hang Up">
              <i class="bi bi-telephone-x-fill"></i>
            </button>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    /* TEAMS DARK MODE MATRIX THEME & STYLES */
    .teams-outer-layout {
      display: flex;
      height: calc(100vh - 70px);
      background: #1f1f1f;
      color: #adadad;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      overflow: hidden;
    }

    /* 1. LEFT-MOST NAVIGATION BAR */
    .teams-nav-sidebar {
      width: 68px;
      flex-shrink: 0;
      background: #181818;
      border-right: 1px solid #292929;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
    }
    .nav-top-icons, .nav-bottom-icons {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      gap: 1.25rem;
    }
    .nav-icon-wrapper {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      width: 100%;
      height: 52px;
      color: #9c9c9c;
      transition: color 0.15s, background-color 0.15s;
    }
    .nav-icon-wrapper:hover {
      color: #ffffff;
      background-color: #292929;
    }
    .nav-icon-wrapper.active {
      color: #7b69ee; /* Microsoft Teams purple highlight */
      border-left: 3px solid #7b69ee;
    }
    .nav-icon-wrapper i {
      font-size: 1.35rem;
    }
    .icon-label {
      font-size: 0.65rem;
      margin-top: 0.25rem;
    }
    .nav-icon-wrapper .badge {
      position: absolute;
      top: 4px;
      right: 14px;
      background: #c43131;
      color: #ffffff;
      font-size: 0.62rem;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 9px;
      border: 1px solid #181818;
    }
    .nav-avatar-badge {
      width: 34px;
      height: 34px;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
    }
    .b-avatar {
      background: #3a1d1d;
      color: #e57373;
    }
    .pc-avatar {
      background: #1b5e20;
      color: #81c784;
    }
    .pc-avatar2 {
      background: #0d47a1;
      color: #64b5f6;
    }
    .avatar-badge-dot {
      position: absolute;
      bottom: -4px;
      right: -4px;
      background: #c43131;
      color: #ffffff;
      font-size: 0.6rem;
      font-weight: 700;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #181818;
    }

    /* 2. SECOND SIDEBAR (CHAT & QUICK VIEWS & CHATS) */
    .teams-chat-sidebar {
      width: 290px;
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
      padding: 1rem 1.25rem;
    }
    .header-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #ffffff;
    }
    .header-icons {
      display: flex;
      gap: 0.95rem;
      font-size: 1rem;
      color: #9c9c9c;
    }
    .header-icons i:hover {
      color: #ffffff;
      cursor: pointer;
    }
    .pill-filters {
      display: flex;
      gap: 0.5rem;
      padding: 0 1.25rem 0.75rem 1.25rem;
      border-bottom: 1px solid #2d2d2d;
    }
    .pill {
      font-size: 0.72rem;
      font-weight: 600;
      background: #2d2d2d;
      padding: 0.3rem 0.65rem;
      border-radius: 12px;
      cursor: pointer;
      color: #c8c8c8;
      transition: background 0.15s, color 0.15s;
    }
    .pill:hover {
      background: #3d3d3d;
      color: #ffffff;
    }
    .pill.active {
      background: #352c4a;
      color: #a78bfa;
      border: 1px solid rgba(167, 139, 250, 0.15);
    }
    .copilot-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.75rem 1.25rem;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      color: #ffffff;
      transition: background 0.15s;
    }
    .copilot-item:hover {
      background: #2d2d2d;
    }
    .copilot-icon {
      color: #7b69ee;
      font-size: 1.1rem;
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

    /* Collapsible Section styles */
    .collapsible-section {
      margin-top: 0.25rem;
      display: flex;
      flex-direction: column;
    }
    .section-trigger {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.45rem 1.25rem;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #909090;
      cursor: pointer;
      transition: color 0.15s;
    }
    .section-trigger:hover {
      color: #ffffff;
    }
    .section-content {
      display: flex;
      flex-direction: column;
    }
    .sub-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.5rem 2rem;
      font-size: 0.82rem;
      cursor: pointer;
      color: #c8c8c8;
    }
    .sub-item:hover {
      background: #2d2d2d;
      color: #ffffff;
    }

    /* Scrollable Chats wrapper */
    .chats-section-wrapper {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .scrollable-chats {
      overflow-y: auto;
      flex: 1;
    }

    /* Search Results overlay panel */
    .search-results-overlay {
      position: absolute;
      top: 155px;
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

    /* Member List styles (Phase 3 Make) */
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
    .member-avatar.self {
      background: #311b92;
      color: #d1c4e9;
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
      width: 7px;
      height: 7px;
      border-radius: 50%;
      position: absolute;
      right: 1.25rem;
      top: 50%;
      transform: translateY(-50%);
      background: #888888;
    }
    .status-indicator.online {
      background: #4caf50;
    }
    .status-indicator.busy {
      background: #f44336;
    }

    /* Active Chats list item */
    .chat-session-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 1.25rem;
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
      width: 7px;
      height: 7px;
      border-radius: 50%;
      border: 1px solid #202020;
      position: absolute;
      bottom: 0;
      right: 0;
    }
    .session-status-dot.online {
      background: #4caf50;
    }
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
    .no-chats-placeholder {
      padding: 1.5rem;
      text-align: center;
      font-size: 0.75rem;
      color: #808080;
    }

    /* 3. MAIN CHAT VIEWPORT */
    .teams-chat-viewport {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #1f1f1f;
      flex: 1;
      min-width: 0;
    }
    
    /* Viewport Header */
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
      width: 9px;
      height: 9px;
      border-radius: 50%;
      border: 1px solid #202020;
      position: absolute;
      bottom: 0;
      right: 0;
    }
    .header-status.online {
      background: #4caf50;
    }
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
    .edit-title-btn:hover {
      color: #ffffff;
    }
    .title-row.editing {
      gap: 0.35rem;
    }
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
    .rename-btn.confirm {
      color: #4caf50;
    }
    .rename-btn.cancel {
      color: #f44336;
    }
    .header-tabs {
      display: flex;
      gap: 0.85rem;
      margin-top: 0.15rem;
    }
    .tab {
      font-size: 0.72rem;
      font-weight: 600;
      color: #9c9c9c;
      cursor: pointer;
      position: relative;
      padding-bottom: 0.2rem;
    }
    .tab:hover {
      color: #ffffff;
    }
    .tab.active {
      color: #ffffff;
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
    .header-right i:hover {
      color: #ffffff;
    }

    /* Messages Viewport Container */
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

    /* Message Bubble row styling */
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
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      position: relative;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .message-content-bubble.my-bubble {
      background: #5c2d91; /* High-contrast Teams Royal Purple */
      border-color: #6d3ca7;
      color: #ffffff;
    }
    .msg-sender-avatar {
      cursor: pointer;
    }
    @keyframes ring-pulse {
      0% {
        transform: scale(0.95);
        opacity: 0.8;
      }
      100% {
        transform: scale(1.3);
        opacity: 0;
      }
    }
    .message-content-bubble:hover .bubble-reaction-bar {
      display: flex;
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

    /* Floating Reactions Bar on bubble hover */
    .bubble-reaction-bar {
      display: none;
      position: absolute;
      top: -24px;
      right: 8px;
      background: #242424;
      border: 1px solid #3d3d3d;
      border-radius: 12px;
      padding: 0.15rem 0.45rem;
      gap: 0.35rem;
      box-shadow: 0 4px 8px rgba(0,0,0,0.5);
      z-index: 5;
    }
    .reaction-emoji {
      font-size: 0.78rem;
      cursor: pointer;
      transition: transform 0.15s;
    }
    .reaction-emoji:hover {
      transform: scale(1.35);
    }

    /* Message Input Box */
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
      transition: color 0.15s;
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
      transition: color 0.15s, transform 0.15s;
    }
    .send-message-btn:disabled {
      color: #444444;
      cursor: not-allowed;
    }
    .send-message-btn:not(:disabled):hover {
      color: #9587f2;
      transform: scale(1.1);
    }

    /* Empty state splash */
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

    /* Invites Drawer Modal Overlay */
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

  newMessageContent = signal('');
  showAddModal = signal(false);

  // Renaming chat state
  isEditingTitle = signal(false);
  newChatTitle = signal('');

  // Sections collapsible state
  sectionsOpen: { [key: string]: boolean } = {
    quickViews: true,
    members: true,
    chats: true,
    contacted: true
  };

  // Profile sidebar state
  selectedProfileUser: any = null;

  // Search inside chat
  chatSearchQuery = '';

  // Call simulation state
  activeCall = signal<{
    user: any;
    type: 'audio' | 'video';
    status: 'ringing' | 'connected';
    duration: number;
  } | null>(null);

  readCounts: { [sessionId: string]: number } = {};

  private callTimerId: any;
  private pollIntervalId: any;

  ngOnInit() {
    const stored = localStorage.getItem('orbitops_chat_read_counts');
    if (stored) {
      try {
        this.readCounts = JSON.parse(stored);
      } catch {}
    }
    this.loadMyChats();
    this.loadMembersList();
    // Setup simple polling every 4 seconds to fetch new messages/chats (simulating websockets)
    this.pollIntervalId = setInterval(() => {
      this.loadMyChats(true);
      this.loadMembersList();
    }, 4000);
  }

  ngOnDestroy() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
    }
    if (this.callTimerId) {
      clearInterval(this.callTimerId);
    }
  }

  loadMyChats(isSilent: boolean = false) {
    this.chatService.getMyChats().subscribe({
      next: (chats) => {
        this.activeSessions.set(chats);
        // Sync selected session message details
        if (this.selectedSession()) {
          const updated = chats.find(c => c.id === this.selectedSession()?.id);
          if (updated) {
            const currentMsgCount = this.selectedSession()?.messages.length || 0;
            this.selectedSession.set(updated);
            this.updateReadCount(updated);
            if (updated.messages.length > currentMsgCount) {
              this.scrollToBottom();
            }
          }
        }
      }
    });
  }

  loadMembersList() {
    this.chatService.searchUsers('').subscribe({
      next: (users) => {
        this.membersList.set(users);
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
      next: (users) => this.searchResults.set(users)
    });
  }

  onSearchInviteUsers() {
    const q = this.inviteSearchQuery().trim();
    this.chatService.searchUsers(q).subscribe({
      next: (users) => {
        // Exclude users already present in the active conversation
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
        // Set as active
        setTimeout(() => {
          const found = this.activeSessions().find(c => c.id === sessionRes.id);
          if (found) {
            this.selectSession(found);
          } else {
            // Decorable session object
            this.selectedSession.set(sessionRes);
          }
        }, 100);
      }
    });
  }

  selectSession(session: ChatSession) {
    this.selectedSession.set(session);
    this.newMessageContent.set('');
    this.isEditingTitle.set(false);
    this.updateReadCount(session);
    this.scrollToBottom();
  }

  sendChatMessage() {
    const content = this.newMessageContent().trim();
    const session = this.selectedSession();
    if (content === '' || !session) return;

    this.newMessageContent.set('');
    this.chatService.sendMessage(session.id, content).subscribe({
      next: (msg) => {
        // Appends and scrolls locally
        session.messages.push(msg);
        this.scrollToBottom();
        this.loadMyChats(true);
      }
    });
  }

  // contactedUsers list computing
  contactedUsers() {
    const currentUserId = this.authService.currentUser()?.id;
    const usersMap = new Map<string, any>();
    
    this.activeSessions().forEach(session => {
      if (session.participants) {
        session.participants.forEach(p => {
          if (p.id !== currentUserId) {
            usersMap.set(p.id, p);
          }
        });
      }
    });
    
    return Array.from(usersMap.values());
  }

  showProfile(user: any) {
    this.selectedProfileUser = user;
  }

  closeProfilePanel() {
    this.selectedProfileUser = null;
  }

  selectContactedUser(contact: any) {
    this.showProfile(contact);
    this.startChatWith(contact);
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
        status: 'Available'
      });
    }
  }

  triggerCallSimulation(user: any, type: 'audio' | 'video') {
    if (this.callTimerId) clearInterval(this.callTimerId);
    
    this.activeCall.set({
      user,
      type,
      status: 'ringing',
      duration: 0
    });

    setTimeout(() => {
      const call = this.activeCall();
      if (call && call.status === 'ringing') {
        call.status = 'connected';
        this.activeCall.set({ ...call });
        
        this.callTimerId = setInterval(() => {
          const c = this.activeCall();
          if (c && c.status === 'connected') {
            c.duration++;
            this.activeCall.set({ ...c });
          }
        }, 1000);
      }
    }, 3000);
  }

  hangUpCall() {
    if (this.callTimerId) {
      clearInterval(this.callTimerId);
      this.callTimerId = null;
    }
    this.activeCall.set(null);
  }

  formatCallDuration(sec: number): string {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  filteredMessages(messages: ChatMessage[]): ChatMessage[] {
    const q = this.chatSearchQuery.trim().toLowerCase();
    if (q === '') return messages;
    return messages.filter(m => m.content.toLowerCase().includes(q));
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
    const stored = this.readCounts[session.id] || 0;
    return session.messages.length > stored;
  }

  updateReadCount(session: ChatSession) {
    this.readCounts[session.id] = session.messages.length;
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
      next: (updatedSession) => {
        this.toggleAddParticipantModal(false);
        this.loadMyChats();
      }
    });
  }

  // Renaming chat
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

  // UI Helpers
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
    // Show avatar if message is sent > 2 minutes after the previous one
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
}

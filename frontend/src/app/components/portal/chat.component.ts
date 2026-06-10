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
          <div class="nav-icon-wrapper" [class.active]="activeSidebarTab() === 'Activity'" (click)="selectSidebarTab('Activity')" title="Activity">
            <i class="bi bi-bell-fill"></i>
            <span class="icon-label">Activity</span>
            <span class="badge" *ngIf="activityBadge() > 0">{{ activityBadge() }}</span>
          </div>
          <div class="nav-icon-wrapper" [class.active]="activeSidebarTab() === 'Chat'" (click)="selectSidebarTab('Chat')" title="Chat">
            <i class="bi bi-chat-left-text-fill"></i>
            <span class="icon-label">Chat</span>
            <span class="badge" *ngIf="chatBadge() > 0">{{ chatBadge() }}</span>
          </div>
          <div class="nav-icon-wrapper" [class.active]="activeSidebarTab() === 'Calendar'" (click)="selectSidebarTab('Calendar')" title="Calendar">
            <i class="bi bi-calendar3"></i>
            <span class="icon-label">Calendar</span>
          </div>
          <div class="nav-icon-wrapper" [class.active]="activeSidebarTab() === 'Calls'" (click)="selectSidebarTab('Calls')" title="Calls">
            <i class="bi bi-telephone-fill"></i>
            <span class="icon-label">Calls</span>
          </div>
        </div>
      </div>

      <!-- 2. SECOND SIDEBAR: CHANNELS & QUICK VIEWS & CHATS -->
      <div class="teams-chat-sidebar" *ngIf="activeSidebarTab() === 'Chat'">
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
            <span class="status-indicator" 
                  [class.online]="user.status === 'Available'" 
                  [class.busy]="user.status === 'Busy'"
                  [class.offline]="user.status === 'Offline'"></span>
          </div>
          <div *ngIf="searchResults().length === 0" class="no-results-text">No matching members found.</div>
        </div>

        <!-- Collapsible Contacted Users (only those with message history) -->
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
              <span class="status-indicator" 
                    [class.online]="cUser.status === 'Available'" 
                    [class.busy]="cUser.status === 'Busy'"
                    [class.offline]="cUser.status === 'Offline'"></span>
            </div>
            <div *ngIf="contactedUsers().length === 0" class="no-chats-placeholder" style="padding: 0.5rem 1.25rem; text-align: left;">
              No contacted users yet.
            </div>
          </div>
        </div>

        <!-- Collapsible Chats (Recent Active Chats with message history) -->
        <div class="collapsible-section chats-section-wrapper">
          <div class="section-trigger" (click)="toggleSection('chats')">
            <i class="bi" [class.bi-chevron-down]="sectionsOpen['chats']" [class.bi-chevron-right]="!sectionsOpen['chats']"></i>
            <span>Chats</span>
          </div>
          <div class="section-content scrollable-chats" *ngIf="sectionsOpen['chats']">
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
                <span class="session-last-excerpt" *ngIf="session.messages.length > 0" [style.font-weight]="isSessionUnread(session) ? '700' : 'normal'" [style.color]="isSessionUnread(session) ? '#ffffff' : '#888888'">
                  {{ session.messages[session.messages.length - 1].content }}
                </span>
              </div>
              <!-- Unread badge/dot -->
              <span *ngIf="isSessionUnread(session)" class="unread-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #7b69ee; margin-left: 0.5rem; flex-shrink: 0;"></span>
            </div>
            <div *ngIf="activeSessionsFiltered().length === 0" class="no-chats-placeholder">
              No recent conversations. Use search above.
            </div>
          </div>
        </div>

      </div>

      <!-- 3. MAIN VIEWPORTS -->
      
      <!-- A. CHAT VIEWPORT -->
      <div class="teams-chat-viewport" *ngIf="activeSidebarTab() === 'Chat'">
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
          <div class="viewport-input-area" style="position: relative;">
            
            <!-- Teams-style Formatting Toolbar (only shown if showFormatToolbar() is true) -->
            <div class="teams-format-toolbar" *ngIf="showFormatToolbar()" style="display: flex; align-items: center; gap: 0.25rem; background: #202020; border: 1px solid #2d2d2d; border-bottom: none; border-radius: 4px 4px 0 0; padding: 0.4rem 0.5rem; flex-wrap: wrap; user-select: none;">
              <button type="button" class="tb-btn" (click)="execCmd('bold')" title="Bold"><i class="bi bi-type-bold"></i></button>
              <button type="button" class="tb-btn" (click)="execCmd('italic')" title="Italic"><i class="bi bi-type-italic"></i></button>
              <button type="button" class="tb-btn" (click)="execCmd('underline')" title="Underline"><i class="bi bi-type-underline"></i></button>
              <button type="button" class="tb-btn" (click)="execCmd('strikeThrough')" title="Strikethrough"><i class="bi bi-type-strikethrough"></i></button>
              <span class="tb-sep" style="width: 1px; height: 16px; background: #3d3d3d; margin: 0 0.25rem;"></span>
              <button type="button" class="tb-btn" (click)="execCmd('insertUnorderedList')" title="Bulleted list"><i class="bi bi-list-task"></i></button>
              <button type="button" class="tb-btn" (click)="execCmd('insertOrderedList')" title="Numbered list"><i class="bi bi-list-ol"></i></button>
              <span class="tb-sep" style="width: 1px; height: 16px; background: #3d3d3d; margin: 0 0.25rem;"></span>
              
              <!-- Text Highlight Color picker dropdown -->
              <div class="tb-dropdown-container" style="position: relative;">
                <button type="button" class="tb-btn" (click)="toggleHighlightPicker()" title="Text highlight color"><i class="bi bi-pen-fill"></i></button>
                <div class="tb-color-menu" *ngIf="highlightPickerOpen()" style="position: absolute; bottom: 30px; left: 0; background: #252528; border: 1px solid #3d3d3d; border-radius: 4px; padding: 0.35rem; display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; z-index: 1000; width: 100px;">
                  <span *ngFor="let c of highlightColors" (click)="execCmd('backColor', c)" [style.background]="c" style="width: 16px; height: 16px; border-radius: 2px; cursor: pointer; border: 1px solid #555; display: inline-block;"></span>
                </div>
              </div>

              <!-- Font Color picker dropdown -->
              <div class="tb-dropdown-container" style="position: relative;">
                <button type="button" class="tb-btn" (click)="toggleColorPicker()" title="Font color"><i class="bi bi-fonts"></i></button>
                <div class="tb-color-menu" *ngIf="colorPickerOpen()" style="position: absolute; bottom: 30px; left: 0; background: #252528; border: 1px solid #3d3d3d; border-radius: 4px; padding: 0.35rem; display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; z-index: 1000; width: 100px;">
                  <span *ngFor="let c of fontColors" (click)="execCmd('foreColor', c)" [style.background]="c" style="width: 16px; height: 16px; border-radius: 2px; cursor: pointer; border: 1px solid #555; display: inline-block;"></span>
                </div>
              </div>

              <!-- Font Size selection -->
              <select (change)="onFontSizeChange($event)" class="tb-select" title="Font size" style="background: #2d2d2d; border: 1px solid #3d3d3d; color: #fff; font-size: 0.75rem; padding: 0.1rem 0.25rem; border-radius: 3px; outline: none; cursor: pointer;">
                <option value="3">Normal</option>
                <option value="1">Small</option>
                <option value="5">Large</option>
                <option value="7">Extra Large</option>
              </select>

              <button type="button" class="tb-btn" (click)="execCmd('formatBlock', 'blockquote')" title="Quotes"><i class="bi bi-quote"></i></button>
              <button type="button" class="tb-btn" (click)="insertLink()" title="Insert link"><i class="bi bi-link-45deg"></i></button>
              <button type="button" class="tb-btn" (click)="execCmd('formatBlock', 'pre')" title="Code block"><i class="bi bi-code-square"></i></button>
              <span class="tb-sep" style="width: 1px; height: 16px; background: #3d3d3d; margin: 0 0.25rem;"></span>

              <!-- More formatting options dropdown (...) -->
              <div class="tb-dropdown-container" style="position: relative;">
                <button type="button" class="tb-btn" (click)="toggleMoreFormatting()" title="More options"><i class="bi bi-three-dots"></i></button>
                <div class="tb-more-menu" *ngIf="moreFormattingOpen()" style="position: absolute; bottom: 30px; left: -50px; background: #252528; border: 1px solid #3d3d3d; border-radius: 4px; padding: 0.35rem 0; z-index: 1000; width: 180px; display: flex; flex-direction: column; gap: 2px; box-shadow: 0 8px 16px rgba(0,0,0,0.5);">
                  <button type="button" (click)="execCmd('formatBlock', 'p')" class="menu-item"><i class="bi bi-paragraph"></i> Paragraph</button>
                  <button type="button" (click)="execCmd('fontName', 'Courier New')" class="menu-item"><i class="bi bi-code"></i> Code font</button>
                  <button type="button" (click)="execCmd('removeFormat')" class="menu-item"><i class="bi bi-trash-fill"></i> Clear all formatting</button>
                  <button type="button" (click)="execCmd('outdent')" class="menu-item"><i class="bi bi-arrow-left-indent"></i> Decrease indent</button>
                  <button type="button" (click)="execCmd('indent')" class="menu-item"><i class="bi bi-arrow-right-indent"></i> Increase indent</button>
                  <button type="button" (click)="execCmd('insertHorizontalRule')" class="menu-item"><i class="bi bi-hr"></i> Insert horizontal rule</button>
                  <span style="height: 1px; background: #3d3d3d; margin: 0.25rem 0; display: block;"></span>
                  <button type="button" (click)="insertTable()" class="menu-item"><i class="bi bi-grid-3x3-gap"></i> Insert table</button>
                  <button type="button" (click)="insertTableRow()" class="menu-item"><i class="bi bi-row"></i> Insert row</button>
                  <button type="button" (click)="insertTableCol()" class="menu-item"><i class="bi bi-columns"></i> Insert column</button>
                  <button type="button" (click)="deleteTable()" class="menu-item"><i class="bi bi-grid-3x3"></i> Delete table</button>
                  <span style="height: 1px; background: #3d3d3d; margin: 0.25rem 0; display: block;"></span>
                  <button type="button" (click)="execCmd('undo')" class="menu-item"><i class="bi bi-arrow-counterclockwise"></i> Undo</button>
                  <button type="button" (click)="execCmd('redo')" class="menu-item"><i class="bi bi-arrow-clockwise"></i> Redo</button>
                </div>
              </div>

              <!-- Delete (Clear all editor contents) button on the right -->
              <button type="button" class="tb-btn btn-trash-editor" (click)="clearEditor()" title="Delete draft" style="margin-left: auto; color: #ef4444;"><i class="bi bi-trash"></i></button>
            </div>

            <!-- Contenteditable input editor container -->
            <div class="teams-input-box" style="border-radius: 0 0 4px 4px; border-top: none;">
              <div class="input-text-container" style="padding: 0.5rem 0.75rem;">
                <div 
                  #editor
                  contenteditable="true" 
                  (keydown)="onEditorKeydown($event, editor)"
                  placeholder="Type a message" 
                  class="teams-message-field rich-editor"
                  style="min-height: 48px; max-height: 120px; overflow-y: auto; color: #fff; background: transparent; border: none; font-size: 0.88rem; outline: none; width: 100%; white-space: pre-wrap; word-break: break-word;"
                ></div>
              </div>
              <div class="input-toolbar" style="border-top: 1px solid #2d2d2d; padding: 0.4rem 0.75rem; background: #1c1c1c;">
                <div class="toolbar-left" style="display: flex; gap: 0.85rem; align-items: center; font-size: 1.05rem; color: #888;">
                  
                  <!-- Format Options Toggle (A) -->
                  <i class="bi bi-type" [class.active]="showFormatToolbar()" (click)="toggleFormatToolbar()" title="Show formatting options" style="cursor: pointer; transition: color 0.2s;"></i>
                  
                  <!-- Emoji trigger and popup -->
                  <div class="emoji-picker-container" style="position: relative; display: flex; align-items: center;">
                    <i class="bi bi-emoji-smile" (click)="toggleEmojiPicker()" title="Emojis" style="cursor: pointer;"></i>
                    <div class="emoji-picker-menu" *ngIf="emojiPickerOpen()" style="position: absolute; bottom: 35px; left: 0; background: #252528; border: 1px solid #3d3d3d; border-radius: 8px; padding: 0.5rem; display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; z-index: 2000; width: 180px; box-shadow: 0 8px 24px rgba(0,0,0,0.6);">
                      <span *ngFor="let emoji of emojis" (click)="insertEmoji(emoji)" style="font-size: 1.25rem; cursor: pointer; text-align: center; display: inline-block; transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.25)'" onmouseout="this.style.transform='scale(1)'">{{ emoji }}</span>
                    </div>
                  </div>

                  <!-- GIF trigger and popup -->
                  <div class="gif-picker-container" style="position: relative; display: flex; align-items: center;">
                    <i class="bi bi-filetype-gif" (click)="toggleGifPicker()" title="GIFs" style="cursor: pointer;"></i>
                    <div class="gif-picker-menu" *ngIf="gifPickerOpen()" style="position: absolute; bottom: 35px; left: 0; background: #252528; border: 1px solid #3d3d3d; border-radius: 8px; padding: 0.5rem; z-index: 2000; width: 220px; box-shadow: 0 8px 24px rgba(0,0,0,0.6); display: flex; flex-direction: column; gap: 6px;">
                      <div style="font-size: 0.72rem; color: #888; font-weight: 700; margin-bottom: 2px;">SUGGESTED GIFS</div>
                      <div class="gif-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                        <img *ngFor="let gif of gifs" [src]="gif" (click)="insertGif(gif)" style="width: 100%; border-radius: 4px; cursor: pointer; border: 1px solid transparent; transition: border-color 0.2s;" onmouseover="this.style.borderColor='#7b69ee'" onmouseout="this.style.borderColor='transparent'" />
                      </div>
                    </div>
                  </div>

                  <!-- Paperclip file input trigger -->
                  <i class="bi bi-paperclip" (click)="triggerFileInput()" title="Attach file" style="cursor: pointer;"></i>
                  <input type="file" #fileInput (change)="onFileAttached($event)" style="display: none;" />

                  <!-- Attached File Name display -->
                  <span *ngIf="attachedFileName()" class="attached-file-badge" style="font-size: 0.75rem; color: #a78bfa; background: rgba(123, 105, 238, 0.1); padding: 0.15rem 0.5rem; border-radius: 12px; display: inline-flex; align-items: center; gap: 0.35rem; border: 1px solid rgba(123, 105, 238, 0.2);">
                    <i class="bi bi-file-earmark-check"></i> {{ attachedFileName() }}
                    <span (click)="clearAttachment()" style="cursor: pointer; font-weight: bold; color: #f87171; padding: 0 2px;">&times;</span>
                  </span>
                </div>
                
                <div class="toolbar-right">
                  <button type="button" class="send-message-btn" (click)="sendRichChatMessage(editor)" [disabled]="isEditorEmpty(editor.innerHTML)" style="background: none; border: none; color: #7b69ee; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0.25rem;">
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
            <h3>Microsoft Teams Collaboration</h3>
            <p>Select a conversation under **Chats** or search team members above to begin direct messaging.</p>
          </div>
        </ng-template>
      </div>

      <!-- B. CALENDAR VIEWPORT -->
      <div class="teams-calendar-viewport" *ngIf="activeSidebarTab() === 'Calendar'">
        <div class="calendar-header">
          <h2>Calendar</h2>
          <div style="font-size: 1.1rem; font-weight: 600; color: #ffffff; background: #2d2d2d; padding: 0.35rem 0.85rem; border-radius: 4px;">June 2026</div>
        </div>
        
        <div class="calendar-grid-header">
          <div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div><div>SUN</div>
        </div>
        
        <div class="calendar-grid">
          <!-- Empty days before June 1, 2026 (June 1 is a Monday, so 0 empty days!) -->
          <!-- Day cells from 1 to 30 -->
          <div *ngFor="let day of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30]" 
               class="calendar-cell"
               [class.today]="day === 10">
            <div class="calendar-day-num">{{ day }} <span *ngIf="day === 10" style="font-size: 0.65rem; background: #7b69ee; color: #ffffff; padding: 1px 4px; border-radius: 3px; margin-left: 2px;">Today</span></div>
            <div class="calendar-events-container" style="overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 2px;">
              <div *ngFor="let ev of getEventsForDay(day)" 
                   class="calendar-event" 
                   [class.internal]="ev.type === 'internal'"
                   [class.client]="ev.type === 'client'"
                   [class.critical]="ev.type === 'critical'"
                   [title]="ev.title">
                {{ ev.time }} - {{ ev.title }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- C. CALLS VIEWPORT -->
      <div class="teams-calls-viewport" *ngIf="activeSidebarTab() === 'Calls'" style="display: flex; flex: 1; width: 100%;">
        <div class="calls-main-content" style="flex: 1; padding: 1.5rem; display: flex; flex-direction: column;">
          <div class="calls-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2>Call History</h2>
            <button (click)="clearCallLogs()" class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.35rem 0.75rem; border: 1px solid #3d3d3d; color: #adadad; background: #252528; cursor: pointer; border-radius: 4px;">
              <i class="bi bi-trash"></i> Clear Logs
            </button>
          </div>
          
          <div class="calls-log-list" style="display: flex; flex-direction: column; gap: 0.75rem; overflow-y: auto;">
            <div *ngFor="let log of callLogs()" class="calls-log-row" style="display: flex; justify-content: space-between; align-items: center; background: #202020; border: 1px solid #2d2d2d; padding: 0.85rem 1.25rem; border-radius: 6px;">
              <div class="call-user-info" style="display: flex; align-items: center; gap: 0.85rem;">
                <span class="call-direction-icon" 
                      [class.incoming]="log.direction === 'incoming'"
                      [class.outgoing]="log.direction === 'outgoing'"
                      [class.missed]="log.direction === 'missed'">
                  <i class="bi" 
                     [class.bi-telephone-inbound-fill]="log.direction === 'incoming'"
                     [class.bi-telephone-outbound-fill]="log.direction === 'outgoing'"
                     [class.bi-telephone-x-fill]="log.direction === 'missed'"></i>
                </span>
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 0.85rem; font-weight: 600; color: #ffffff;">{{ log.userName }}</span>
                  <span style="font-size: 0.72rem; color: #888888;">{{ log.timestamp | date:'MMM d, yyyy HH:mm' }}</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 1.5rem;">
                <span style="font-size: 0.78rem; color: #adadad; display: flex; align-items: center; gap: 0.35rem;">
                  <i class="bi" [class.bi-camera-video-fill]="log.type === 'video'" [class.bi-telephone-fill]="log.type === 'audio'"></i> 
                  {{ log.type | titlecase }} Call
                </span>
                <span style="font-size: 0.78rem; color: #adadad;">
                  {{ log.duration ? formatCallDuration(log.duration) : 'No answer' }}
                </span>
              </div>
            </div>
            <div *ngIf="callLogs().length === 0" class="no-chats-placeholder" style="padding: 3rem; text-align: center; background: #202020; border-radius: 6px; border: 1px solid #2d2d2d;">
              No call history logs found.
            </div>
          </div>
        </div>
      </div>

      <!-- D. ACTIVITY VIEWPORT -->
      <div class="teams-activity-viewport" *ngIf="activeSidebarTab() === 'Activity'">
        <div class="activity-header">
          <h2>Feed</h2>
        </div>
        
        <div class="activity-list">
          <div *ngFor="let act of activities()" 
               class="activity-row" 
               [class.unread]="!act.read"
               (click)="clickActivity(act)">
            
            <div class="activity-avatar" 
                 [class.message]="act.type === 'message'"
                 [class.call]="act.type === 'call'"
                 [class.order]="act.type === 'order'">
              <i class="bi" 
                 [class.bi-chat-left-text-fill]="act.type === 'message'"
                 [class.bi-telephone-x-fill]="act.type === 'call'"
                 [class.bi-arrow-repeat]="act.type === 'order'"></i>
            </div>
            
            <div class="activity-details">
              <div class="activity-row-header">
                <span class="activity-title">{{ act.title }}</span>
                <span class="activity-time">{{ act.timestamp | date:'MMM d, HH:mm' }}</span>
              </div>
              <span class="activity-desc">{{ act.description }}</span>
            </div>
            
            <span *ngIf="!act.read" style="width: 8px; height: 8px; border-radius: 50%; background: #7b69ee; position: absolute; right: 1rem; top: 50%; transform: translateY(-50%);"></span>
          </div>
          <div *ngIf="activities().length === 0" class="no-chats-placeholder" style="padding: 3rem; text-align: center; background: #202020; border-radius: 6px; border: 1px solid #2d2d2d;">
            No recent notifications or feed activity.
          </div>
        </div>
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
              <span style="width: 8px; height: 8px; border-radius: 50%;" 
                    [style.background-color]="selectedProfileUser.status === 'Available' ? '#22c55e' : (selectedProfileUser.status === 'Busy' ? '#ef4444' : '#eab308')"></span>
              <span style="font-size: 0.85rem; color: #ffffff;">{{ selectedProfileUser.status === 'Available' ? 'Online' : (selectedProfileUser.status === 'Busy' ? 'In Meeting' : 'Offline') }}</span>
            </div>
          </div>
        </div>

        <!-- Shortcuts removed -->
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

      <!-- Calling overlay removed -->

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

    /* TEAMS DARK MODE MATRIX THEME & STYLES */
    .teams-outer-layout {
      display: flex;
      height: calc(100vh - 70px);
      background: #1f1f1f;
      color: #adadad;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      overflow: hidden;
      width: 100%;
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
    .nav-top-icons {
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

    /* Member List styles */
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
      background: #eab308; /* Default yellow (offline) */
    }
    .status-indicator.online {
      background: #22c55e !important; /* green (online/available) */
    }
    .status-indicator.busy {
      background: #ef4444 !important; /* red (busy/in meeting) */
    }
    .status-indicator.offline {
      background: #eab308 !important; /* yellow (offline) */
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
      width: 9px;
      height: 9px;
      border-radius: 50%;
      border: 1px solid #202020;
      position: absolute;
      bottom: -1px;
      right: -1px;
      background: #eab308; /* yellow */
    }
    .session-status-dot.online {
      background: #22c55e !important; /* green */
    }
    .session-status-dot.busy {
      background: #ef4444 !important; /* red */
    }
    .session-status-dot.offline {
      background: #eab308 !important; /* yellow */
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
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 1px solid #202020;
      position: absolute;
      bottom: -1px;
      right: -1px;
      background: #eab308;
    }
    .header-status.online {
      background: #22c55e !important;
    }
    .header-status.busy {
      background: #ef4444 !important;
    }
    .header-status.offline {
      background: #eab308 !important;
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

    /* Calendar styles */
    .teams-calendar-viewport {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #1f1f1f;
      height: 100%;
      overflow-y: auto;
      padding: 1.5rem 2.5rem;
    }
    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .calendar-header h2 {
      font-size: 1.5rem;
      color: #ffffff;
      margin: 0;
    }
    .calendar-grid-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      background: #2d2d2d;
      text-align: center;
      font-size: 0.72rem;
      font-weight: 700;
      color: #909090;
      padding: 0.5rem 0;
      border-radius: 4px 4px 0 0;
    }
    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      grid-auto-rows: 100px;
      gap: 1px;
      background: #2d2d2d;
      border-radius: 0 0 4px 4px;
      overflow: hidden;
      border: 1px solid #2d2d2d;
    }
    .calendar-cell {
      background: #1f1f1f;
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      position: relative;
    }
    .calendar-cell:hover {
      background: #242424;
    }
    .calendar-day-num {
      font-size: 0.8rem;
      font-weight: 600;
      color: #8c8c8c;
    }
    .calendar-cell.today .calendar-day-num {
      color: #7b69ee;
      font-weight: bold;
    }
    .calendar-event {
      font-size: 0.65rem;
      padding: 0.15rem 0.35rem;
      border-radius: 3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 600;
    }
    .calendar-event.internal {
      background: rgba(123, 105, 238, 0.15);
      color: #a78bfa;
      border-left: 2px solid #7b69ee;
    }
    .calendar-event.client {
      background: rgba(34, 197, 94, 0.15);
      color: #4caf50;
      border-left: 2px solid #22c55e;
    }
    .calendar-event.critical {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border-left: 2px solid #ef4444;
    }

    /* Calls styles */
    .teams-calls-viewport {
      flex: 1;
      display: flex;
      background: #1f1f1f;
      height: 100%;
      overflow: hidden;
    }
    .calls-main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 1.5rem 2.5rem;
      overflow-y: auto;
    }
    .calls-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .calls-header h2 {
      font-size: 1.5rem;
      color: #ffffff;
      margin: 0;
    }
    .calls-log-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .calls-log-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #202020;
      border: 1px solid #2d2d2d;
      padding: 0.75rem 1.25rem;
      border-radius: 6px;
      transition: background 0.15s;
    }
    .calls-log-row:hover {
      background: #252528;
    }
    .call-user-info {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .call-direction-icon {
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .call-direction-icon.incoming {
      color: #22c55e;
    }
    .call-direction-icon.outgoing {
      color: #3b82f6;
    }
    .call-direction-icon.missed {
      color: #ef4444;
    }
    .calls-sidebar {
      width: 320px;
      background: #202020;
      border-left: 1px solid #2d2d2d;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    .calls-sidebar h3 {
      font-size: 1.05rem;
      color: #ffffff;
      margin: 0 0 1rem 0;
    }
    .speed-dial-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .speed-dial-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #292929;
      padding: 0.55rem 0.85rem;
      border-radius: 6px;
      border: 1px solid #3d3d3d;
    }
    .speed-dial-user {
      display: flex;
      flex-direction: column;
      line-height: 1.25;
    }
    .speed-dial-actions {
      display: flex;
      gap: 0.5rem;
    }
    .speed-dial-btn {
      background: #202020;
      border: 1px solid #3d3d3d;
      color: #adadad;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.82rem;
      transition: all 0.15s;
    }
    .speed-dial-btn:hover {
      background: #7b69ee;
      color: #ffffff;
      border-color: #7b69ee;
    }

    /* Activity feed styles */
    .teams-activity-viewport {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #1f1f1f;
      height: 100%;
      overflow-y: auto;
      padding: 1.5rem 2.5rem;
    }
    .activity-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .activity-header h2 {
      font-size: 1.5rem;
      color: #ffffff;
      margin: 0;
    }
    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .activity-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #202020;
      border: 1px solid #2d2d2d;
      padding: 1rem;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      border-left: 3px solid transparent;
      transition: background 0.15s;
    }
    .activity-row:hover {
      background: #252528;
    }
    .activity-row.unread {
      background: rgba(123, 105, 238, 0.05);
      border-left-color: #7b69ee;
    }
    .activity-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
    }
    .activity-avatar.message {
      background: rgba(123, 105, 238, 0.15);
      color: #a78bfa;
    }
    .activity-avatar.call {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
    }
    .activity-avatar.order {
      background: rgba(34, 197, 94, 0.15);
      color: #4caf50;
    }
    .activity-details {
      display: flex;
      flex-direction: column;
      flex: 1;
      line-height: 1.3;
    }
    .activity-row-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .activity-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #ffffff;
    }
    .activity-time {
      font-size: 0.65rem;
      color: #808080;
    }
    .activity-desc {
      font-size: 0.78rem;
      color: #adadad;
    }
    .activity-row.unread .activity-desc {
      color: #ffffff;
      font-weight: 600;
    }
    .teams-format-toolbar button {
      background: none;
      border: none;
      color: #adadad;
      width: 28px;
      height: 28px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.95rem;
      transition: background 0.15s, color 0.15s;
    }
    .teams-format-toolbar button:hover {
      background: #2d2d2d;
      color: #ffffff;
    }
    .menu-item {
      background: none;
      border: none;
      color: #adadad;
      padding: 0.45rem 1rem;
      text-align: left;
      font-size: 0.8rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      transition: background 0.15s, color 0.15s;
    }
    .menu-item:hover {
      background: #2d2d2d !important;
      color: #ffffff !important;
    }
    .menu-item i {
      font-size: 0.9rem;
      color: #7b69ee;
    }
    .bi-type.active {
      color: #7b69ee !important;
    }
    .rich-editor:empty::before {
      content: attr(placeholder);
      color: #888888;
      pointer-events: none;
    }
    .rich-editor table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #3d3d3d;
      margin: 0.5rem 0;
    }
    .rich-editor th, .rich-editor td {
      border: 1px solid #3d3d3d;
      padding: 0.5rem;
      font-size: 0.82rem;
    }
    .rich-editor blockquote {
      border-left: 3px solid #7b69ee;
      margin: 0.5rem 0;
      padding-left: 0.75rem;
      color: #adadad;
      font-style: italic;
    }
    .rich-editor pre {
      background: #151515;
      border: 1px solid #2d2d2d;
      padding: 0.5rem;
      font-family: 'Courier New', Courier, monospace;
      border-radius: 4px;
      color: #4caf50;
      margin: 0.5rem 0;
    }
    .tb-color-menu span:hover {
      transform: scale(1.15);
      border-color: #ffffff !important;
    }
    .color-dropdown {
      position: absolute;
      bottom: 30px;
      left: 0;
      background: #252528;
      border: 1px solid #3d3d3d;
      border-radius: 4px;
      padding: 0.35rem;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      z-index: 1000;
      width: 100px;
    }
    .color-dropdown span {
      width: 16px;
      height: 16px;
      border-radius: 2px;
      cursor: pointer;
      border: 1px solid #555;
    }
    .color-dropdown span:hover {
      transform: scale(1.15);
      border-color: #ffffff;
    }
    .tb-select {
      font-size: 0.72rem !important;
      font-family: inherit;
    }
    .tb-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .attached-file-badge span:hover {
      transform: scale(1.2);
    }
    .file-attachment-card {
      margin: 0.5rem 0;
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
    .unread-dot {
      background: #7b69ee !important;
    }
    .teams-outer-layout {
      height: calc(100vh - 70px) !important;
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
    chats: true,
    contacted: true
  };

  // Profile sidebar state
  selectedProfileUser: any = null;

  // Search inside chat
  chatSearchQuery = '';

  readCounts: { [sessionId: string]: number } = {};

  private pollIntervalId: any;

  // VIEWPORTS NAVIGATION AND BADGES
  activeSidebarTab = signal<'Chat' | 'Activity' | 'Calendar' | 'Calls'>('Chat');

  callLogs = signal<Array<{
    id: string;
    userName: string;
    type: 'audio' | 'video';
    direction: 'incoming' | 'outgoing' | 'missed';
    timestamp: Date;
    duration?: number;
  }>>([]);

  activities = signal<Array<{
    id: string;
    title: string;
    description: string;
    timestamp: Date;
    type: 'message' | 'call' | 'order';
    read: boolean;
    sessionId?: string;
  }>>([
    { id: '1', title: 'Missed Call', description: 'You missed a video call from Marcus Vance', timestamp: new Date(Date.now() - 86400000), type: 'call', read: false },
    { id: '2', title: 'Order Update', description: 'Order ORD-7241 status changed to In Progress', timestamp: new Date(Date.now() - 43200000), type: 'order', read: true }
  ]);
  activityBadge = signal<number>(1);

  calendarEvents = signal<Array<{
    title: string;
    time: string;
    day: number;
    type: 'internal' | 'client' | 'critical';
  }>>([
    { title: 'SOC2 Compliance Alignment', time: '10:00 AM', day: 8, type: 'critical' },
    { title: 'HiBob API Migration Planning', time: '2:00 PM', day: 10, type: 'internal' },
    { title: 'Payroll Sync Live Review', time: '11:30 AM', day: 12, type: 'client' },
    { title: 'BambooHR Onboarding', time: '9:00 AM', day: 15, type: 'client' },
    { title: 'Architecture Sync', time: '4:00 PM', day: 18, type: 'internal' }
  ]);

  // Rich toolbar states
  showFormatToolbar = signal(false);
  emojiPickerOpen = signal(false);
  gifPickerOpen = signal(false);
  highlightPickerOpen = signal(false);
  colorPickerOpen = signal(false);
  moreFormattingOpen = signal(false);
  attachedFileName = signal('');

  highlightColors = ['#ffff00', '#00ff00', '#ff00ff', '#00ffff', '#ffa500', '#ffc0cb', '#adff2f', '#ffffff'];
  fontColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ffa500', '#a200ff', '#ffffff', '#adadad'];
  emojis = ['😊', '👍', '❤️', '😆', '😮', '😢', '🔥', '👏', '🎉', '💡', '🚀', '💯'];
  gifs = [
    'https://media.giphy.com/media/l3q2zVr6cu95nF6O4/giphy.gif', // Celebrations
    'https://media.giphy.com/media/3o7abKhOpu0NXS3wy4/giphy.gif', // Coding/Typing
    'https://media.giphy.com/media/26n6WywJyum39Xabe/giphy.gif', // Success/High Five
    'https://media.giphy.com/media/d31w24psGYeekCZy/giphy.gif'  // Nice
  ];

  ngOnInit() {
    // Load read counts
    const storedCounts = localStorage.getItem('orbitops_chat_read_counts');
    if (storedCounts) {
      try {
        this.readCounts = JSON.parse(storedCounts);
      } catch {}
    }

    // Load Call Logs
    const storedLogs = localStorage.getItem('orbitops_call_logs');
    if (storedLogs && storedLogs !== '[]') {
      try {
        const parsed = JSON.parse(storedLogs);
        this.callLogs.set(parsed.map((l: any) => ({ ...l, timestamp: new Date(l.timestamp) })));
      } catch {}
    } else {
      const dummyLogs = [
        { id: '1', userName: 'Sarah Jenkins', type: 'video' as const, direction: 'incoming' as const, timestamp: new Date(Date.now() - 3600000), duration: 124 },
        { id: '2', userName: 'Alex Chen', type: 'audio' as const, direction: 'outgoing' as const, timestamp: new Date(Date.now() - 7200000), duration: 45 },
        { id: '3', userName: 'Marcus Vance', type: 'video' as const, direction: 'missed' as const, timestamp: new Date(Date.now() - 86400000) }
      ];
      this.callLogs.set(dummyLogs);
      localStorage.setItem('orbitops_call_logs', JSON.stringify(dummyLogs));
    }

    // Load Activities
    const storedActs = localStorage.getItem('orbitops_activities');
    if (storedActs) {
      try {
        const parsed = JSON.parse(storedActs);
        this.activities.set(parsed.map((a: any) => ({ ...a, timestamp: new Date(a.timestamp) })));
        const unreadCount = parsed.filter((a: any) => !a.read).length;
        this.activityBadge.set(unreadCount);
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
            this.readCounts[c.id] = c.messages.length;
          }
        });
        localStorage.setItem('orbitops_chat_read_counts', JSON.stringify(this.readCounts));

        if (isSilent && this.activeSessions().length > 0) {
          chats.forEach(newChat => {
            const oldChat = this.activeSessions().find(c => c.id === newChat.id);
            const oldMsgCount = oldChat ? oldChat.messages.length : (this.readCounts[newChat.id] || 0);
            const newMsgCount = newChat.messages ? newChat.messages.length : 0;
            
            if (newMsgCount > oldMsgCount) {
              const newMsgs = newChat.messages.slice(oldMsgCount);
              newMsgs.forEach(msg => {
                if (msg.senderId !== this.authService.currentUser()?.id) {
                  this.triggerNewMessageNotification(newChat, msg);
                }
              });
            }
          });
        }

        this.activeSessions.set(chats);

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

  getDemoStatus(name: string): string {
    const lower = (name || '').toLowerCase();
    if (lower.includes('piyush') || lower.includes('chetan')) {
      return 'Available';
    } else if (lower.includes('elena') || lower.includes('marcus') || lower.includes('jane')) {
      return 'Offline';
    } else {
      return 'Busy'; // Meeting
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
    this.newMessageContent.set('');
    this.isEditingTitle.set(false);
    this.updateReadCount(session);
    this.scrollToBottom();
  }

  // Not used in rich text mode, but kept for compatibility
  sendChatMessage() {}

  // Filtered Chats (only show chats that have at least one message, or is currently selected)
  activeSessionsFiltered() {
    const selectedId = this.selectedSession()?.id;
    return this.activeSessions().filter(s => (s.messages && s.messages.length > 0) || s.id === selectedId);
  }

  contactedUsers() {
    const currentUserId = this.authService.currentUser()?.id;
    const usersMap = new Map<string, any>();
    
    this.activeSessions().forEach(session => {
      if (session.messages && session.messages.length > 0) {
        if (session.participants) {
          session.participants.forEach(p => {
            if (p.id !== currentUserId) {
              const actualMember = this.membersList().find(m => m.id === p.id);
              usersMap.set(p.id, {
                ...p,
                status: actualMember ? actualMember.status : 'Offline'
              });
            }
          });
        }
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
    const mappedContact = { ...contact };
    const actualMember = this.membersList().find(m => m.id === contact.id);
    if (actualMember) {
      mappedContact.status = actualMember.status;
    }
    this.showProfile(mappedContact);
    this.startChatWith(mappedContact);
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

  clearCallLogs() {
    this.callLogs.set([]);
    localStorage.removeItem('orbitops_call_logs');
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
    if (this.readCounts[session.id] === undefined) {
      this.readCounts[session.id] = session.messages.length;
      localStorage.setItem('orbitops_chat_read_counts', JSON.stringify(this.readCounts));
      return false;
    }
    return session.messages.length > this.readCounts[session.id];
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

  selectSidebarTab(tab: 'Chat' | 'Activity' | 'Calendar' | 'Calls') {
    this.activeSidebarTab.set(tab);
    if (tab === 'Activity') {
      this.activityBadge.set(0);
      this.activities.update(list => list.map(a => ({ ...a, read: true })));
      localStorage.setItem('orbitops_activities', JSON.stringify(this.activities()));
    }
  }

  chatBadge(): number {
    return this.activeSessions().filter(s => this.isSessionUnread(s)).length;
  }

  getEventsForDay(day: number) {
    return this.calendarEvents().filter(e => e.day === day);
  }

  clickActivity(act: any) {
    this.activities.update(list => list.map(a => a.id === act.id ? { ...a, read: true } : a));
    localStorage.setItem('orbitops_activities', JSON.stringify(this.activities()));
    
    const unreadCount = this.activities().filter(a => !a.read).length;
    this.activityBadge.set(unreadCount);

    if (act.sessionId) {
      const session = this.activeSessions().find(c => c.id === act.sessionId);
      if (session) {
        this.selectSidebarTab('Chat');
        this.selectSession(session);
      }
    } else {
      this.selectSidebarTab('Chat');
    }
  }

  triggerNewMessageNotification(session: ChatSession, message: ChatMessage) {
    const newActivity = {
      id: Math.random().toString(),
      title: `New message from ${message.senderName}`,
      description: message.content.length > 60 ? `${message.content.substring(0, 60)}...` : message.content,
      timestamp: new Date(message.sentAt),
      type: 'message' as const,
      read: false,
      sessionId: session.id
    };
    
    this.activities.update(list => [newActivity, ...list]);
    localStorage.setItem('orbitops_activities', JSON.stringify(this.activities()));
    
    if (this.activeSidebarTab() !== 'Activity') {
      this.activityBadge.update(b => b + 1);
    }
  }

  // RICH TEXT TOOLBAR LOGIC
  execCmd(cmd: string, val: string = '') {
    document.execCommand(cmd, false, val);
    this.highlightPickerOpen.set(false);
    this.colorPickerOpen.set(false);
    this.moreFormattingOpen.set(false);
  }

  onFontSizeChange(event: any) {
    const val = event.target.value;
    this.execCmd('fontSize', val);
  }

  insertLink() {
    const url = prompt('Enter link URL:');
    if (url) {
      this.execCmd('createLink', url);
    }
  }

  insertEmoji(emoji: string) {
    const editor = document.querySelector('.rich-editor') as HTMLElement;
    if (editor) {
      editor.focus();
      document.execCommand('insertText', false, emoji);
    }
    this.emojiPickerOpen.set(false);
  }

  insertGif(gifUrl: string) {
    const editor = document.querySelector('.rich-editor') as HTMLElement;
    if (editor) {
      editor.focus();
      const imgHtml = `<img src="${gifUrl}" style="max-width: 150px; border-radius: 4px; display: block; margin-top: 0.5rem;" />`;
      document.execCommand('insertHTML', false, imgHtml);
    }
    this.gifPickerOpen.set(false);
  }

  triggerFileInput() {
    const fileEl = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileEl) {
      fileEl.click();
    }
  }

  onFileAttached(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.attachedFileName.set(file.name);
      const editor = document.querySelector('.rich-editor') as HTMLElement;
      if (editor) {
        editor.focus();
        const fileCard = `
          <div class="file-attachment-card" style="display: inline-flex; align-items: center; gap: 0.5rem; background: #2a2a2d; border: 1px solid #3d3d3d; border-radius: 6px; padding: 0.5rem; max-width: 280px; margin-top: 0.5rem; user-select: none;" contenteditable="false">
            <i class="bi bi-file-earmark-fill" style="color: #7b69ee; font-size: 1.5rem;"></i>
            <div style="display: flex; flex-direction: column; overflow: hidden; text-align: left;">
              <span style="font-size: 0.8rem; color: #fff; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 180px;">${file.name}</span>
              <span style="font-size: 0.65rem; color: #888;">${(file.size / 1024).toFixed(1)} KB</span>
            </div>
          </div>
          <br/>
        `;
        document.execCommand('insertHTML', false, fileCard);
      }
    }
  }

  clearAttachment() {
    this.attachedFileName.set('');
  }

  clearEditor() {
    const editor = document.querySelector('.rich-editor') as HTMLElement;
    if (editor) {
      editor.innerHTML = '';
    }
  }

  insertTable() {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #3d3d3d; margin: 0.5rem 0;">
        <thead>
          <tr style="background: #2a2a2d; border-bottom: 2px solid #3d3d3d;">
            <th style="padding: 0.5rem; border: 1px solid #3d3d3d; text-align: left; font-size: 0.8rem; color: #adadad;">Col 1</th>
            <th style="padding: 0.5rem; border: 1px solid #3d3d3d; text-align: left; font-size: 0.8rem; color: #adadad;">Col 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 0.5rem; border: 1px solid #3d3d3d; font-size: 0.82rem; color: #fff;">Data 1</td>
            <td style="padding: 0.5rem; border: 1px solid #3d3d3d; font-size: 0.82rem; color: #fff;">Data 2</td>
          </tr>
        </tbody>
      </table>
      <p></p>
    `;
    const editor = document.querySelector('.rich-editor') as HTMLElement;
    if (editor) {
      editor.focus();
      document.execCommand('insertHTML', false, tableHtml);
    }
    this.moreFormattingOpen.set(false);
  }

  insertTableRow() {
    const editor = document.querySelector('.rich-editor') as HTMLElement;
    if (editor) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        let node: any = sel.anchorNode;
        while (node && node.nodeName !== 'TR' && node !== editor) {
          node = node.parentNode;
        }
        if (node && node.nodeName === 'TR') {
          const cellsCount = node.cells.length;
          const newRow = document.createElement('tr');
          for (let i = 0; i < cellsCount; i++) {
            const td = document.createElement('td');
            td.style.padding = '0.5rem';
            td.style.border = '1px solid #3d3d3d';
            td.style.fontSize = '0.82rem';
            td.style.color = '#fff';
            td.innerHTML = 'New Cell';
            newRow.appendChild(td);
          }
          node.parentNode.insertBefore(newRow, node.nextSibling);
        }
      }
    }
    this.moreFormattingOpen.set(false);
  }

  insertTableCol() {
    const editor = document.querySelector('.rich-editor') as HTMLElement;
    if (editor) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        let node: any = sel.anchorNode;
        while (node && node.nodeName !== 'TD' && node.nodeName !== 'TH' && node !== editor) {
          node = node.parentNode;
        }
        if (node && (node.nodeName === 'TD' || node.nodeName === 'TH')) {
          const colIndex = node.cellIndex;
          let trNode: any = node.parentNode;
          let tableNode = trNode.parentNode;
          if (tableNode.nodeName === 'TBODY' || tableNode.nodeName === 'THEAD') {
            tableNode = tableNode.parentNode;
          }
          Array.from(tableNode.rows).forEach((row: any) => {
            const cellType = row.parentNode.nodeName === 'THEAD' ? 'th' : 'td';
            const newCell = document.createElement(cellType);
            newCell.style.padding = '0.5rem';
            newCell.style.border = '1px solid #3d3d3d';
            newCell.style.fontSize = '0.82rem';
            newCell.style.color = colIndex === 0 ? '#adadad' : '#fff';
            newCell.innerHTML = 'New Col';
            row.insertBefore(newCell, row.cells[colIndex + 1]);
          });
        }
      }
    }
    this.moreFormattingOpen.set(false);
  }

  deleteTable() {
    const editor = document.querySelector('.rich-editor') as HTMLElement;
    if (editor) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        let node: any = sel.anchorNode;
        while (node && node.nodeName !== 'TABLE' && node !== editor) {
          node = node.parentNode;
        }
        if (node && node.nodeName === 'TABLE') {
          node.parentNode.removeChild(node);
        }
      }
    }
    this.moreFormattingOpen.set(false);
  }

  toggleFormatToolbar() {
    this.showFormatToolbar.update(v => !v);
  }

  toggleEmojiPicker() {
    this.emojiPickerOpen.update(v => !v);
    this.gifPickerOpen.set(false);
  }

  toggleGifPicker() {
    this.gifPickerOpen.update(v => !v);
    this.emojiPickerOpen.set(false);
  }

  toggleHighlightPicker() {
    this.highlightPickerOpen.update(v => !v);
    this.colorPickerOpen.set(false);
  }

  toggleColorPicker() {
    this.colorPickerOpen.update(v => !v);
    this.highlightPickerOpen.set(false);
  }

  toggleMoreFormatting() {
    this.moreFormattingOpen.update(v => !v);
  }

  isEditorEmpty(html: string): boolean {
    if (!html) return true;
    const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
    if (html.includes('<img') || html.includes('file-attachment-card') || html.includes('<table') || html.includes('<hr')) {
      return false;
    }
    return text === '';
  }

  sendRichChatMessage(editorEl: HTMLElement) {
    const content = editorEl.innerHTML.trim();
    const session = this.selectedSession();
    if (this.isEditorEmpty(content) || !session) return;

    editorEl.innerHTML = '';
    this.attachedFileName.set('');
    
    this.chatService.sendMessage(session.id, content).subscribe({
      next: (msg) => {
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

  // Placeholders/No-ops for calling compatibility
  triggerCallSimulation(user: any, type: string) {}
  stopRingingSound() {}
}

/**
 * OrbitOps Chatbot Component - Premium AI Agent & Voice Engine
 * File: chatbot.js
 */

(function () {
  'use strict';

  const getApiUrl = (path, defaultUrl) => {
    if (typeof window !== 'undefined') {
      if (window.ORBITOPS_API_URL) {
        return window.ORBITOPS_API_URL + path;
      }
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
        return defaultUrl;
      }
    }
    return path;
  };

  const BACKEND_URL = getApiUrl('/api/chat', 'http://localhost:5015/api/chat');
  const FEEDBACK_URL = getApiUrl('/api/chat/feedback', 'http://localhost:5015/api/chat/feedback');
  const STORAGE_KEY = 'orbitops_chat_static';
  const MAX_STORED = 120;
  const STREAM_SPEED = 10; // ms per char

  // --- Voice Engine ---
  class VoiceEngine {
    constructor() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.synth = window.speechSynthesis;
      this.isListening = false;
      this.isSpeaking = false;

      this.onResult = null;
      this.onStart = null;
      this.onEnd = null;

      if (!SR) {
        this.rec = null;
        return;
      }

      this.rec = new SR();
      this.rec.continuous = false;
      this.rec.interimResults = false;
      this.rec.lang = 'en-US';

      this.rec.onresult = e => {
        const t = e.results[0][0].transcript;
        if (t && this.onResult) {
          this.onResult(t);
        }
      };

      this.rec.onstart = () => {
        this.isListening = true;
        if (this.onStart) this.onStart();
      };

      this.rec.onend = () => {
        this.isListening = false;
        if (this.onEnd) this.onEnd();
      };

      this.rec.onerror = () => {
        this.isListening = false;
        if (this.onEnd) this.onEnd();
      };
    }

    get supported() {
      return !!this.rec;
    }

    listen() {
      if (this.rec && !this.isListening) {
        this.rec.start();
      }
    }

    stop() {
      if (this.rec && this.isListening) {
        this.rec.stop();
      }
    }

    speak(html, cb) {
      if (!this.synth) return;
      this.synth.cancel();

      const text = html.replace(/<[^>]+>/g, '').replace(/[^\x00-\x7F]/g, '');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      const voices = this.synth.getVoices();
      const bestVoice = voices.find(v =>
        /samantha|karen|aria|google uk english female|zira/i.test(v.name)
      ) || voices.find(v => v.lang.startsWith('en'));

      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.onend = () => {
        this.isSpeaking = false;
        if (cb) cb();
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
      };

      this.isSpeaking = true;
      this.synth.speak(utterance);
    }

    mute() {
      if (this.synth) {
        this.synth.cancel();
      }
      this.isSpeaking = false;
    }
  }

  // --- Storage Engine ---
  class ChatStorage {
    load() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      } catch {
        return [];
      }
    }
    save(msgs) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_STORED)));
      } catch {}
    }
    clear() {
      localStorage.removeItem(STORAGE_KEY);
    }
    export(msgs) {
      const lines = msgs.map(m =>
        `[${new Date(m.ts).toLocaleString()}] ${m.role === 'bot' ? 'Mia' : 'You'}: ${m.text.replace(/<[^>]+>/g, '')}`
      ).join('\n\n');
      const blob = new Blob([lines], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `orbitops-chat-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  }

  // --- Main OrbitBot UI Controller ---
  class OrbitBot {
    constructor() {
      this.voice = new VoiceEngine();
      this.storage = new ChatStorage();
      this.msgs = this.storage.load();
      this.voiceOut = false;
      this.busy = false;
      this.backendOk = false;
      
      const storedId = localStorage.getItem(STORAGE_KEY + '_id');
      this.conversationId = storedId || 'conv_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem(STORAGE_KEY + '_id', this.conversationId);

      this._render();
      this._bind();
      this._probe();
      this._restoreOrWelcome();
    }

    _render() {
      // Remove any duplicate instances
      ['ob-fab', 'ob-window', 'chatbot-fab', 'chatbot-window'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });

      document.body.insertAdjacentHTML('beforeend', `
        <button id="ob-fab" aria-label="Chat with Mia">
          <span class="ob-fab-ring"></span>
          <span class="ob-fab-ring2"></span>
          <svg class="ob-fab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="fab-icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#00F0FF" />
                <stop offset="100%" stop-color="#8b5cf6" />
              </linearGradient>
            </defs>
            <!-- Robotic chat bubble shape -->
            <path d="M21 11.5c0 4.14-3.58 7.5-8 7.5-1.12 0-2.18-.22-3.14-.62L5 20l1.43-4.28C5.54 14.53 5 13.08 5 11.5 5 7.36 8.58 4 13 4s8 3.36 8 7.5z" stroke="url(#fab-icon-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <!-- Visor light connection -->
            <path d="M9 11h6" stroke="#00F0FF" stroke-width="2" stroke-linecap="round" />
            <circle cx="12" cy="11" r="0.8" fill="#fff" />
          </svg>
          <span class="ob-fab-badge">AI</span>
          <span class="ob-fab-tooltip">Chat with Mia</span>
        </button>

        <div id="ob-window" role="dialog" aria-modal="true" aria-label="OrbitOps AI Assistant">
          <!-- Header -->
          <div class="ob-header">
            <div class="ob-header-left">
              <div class="ob-avatar">
                <div class="ob-avatar-glow"></div>
                <svg viewBox="0 0 100 100" class="mia-header-logo-svg" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="mia-avatar-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#6366f1" />
                      <stop offset="50%" stop-color="#8b5cf6" />
                      <stop offset="100%" stop-color="#06b6d4" />
                    </linearGradient>
                    <linearGradient id="visor-glow" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stop-color="#00F0FF" />
                      <stop offset="100%" stop-color="#0072FF" />
                    </linearGradient>
                    <filter id="svg-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  <!-- Outer Rotating Orbit Lines -->
                  <circle cx="50" cy="50" r="45" fill="none" stroke="url(#mia-avatar-grad)" stroke-width="2" class="mia-bg-ring" stroke-dasharray="14 10" />
                  <circle cx="50" cy="50" r="39" fill="none" stroke="rgba(6, 182, 212, 0.15)" stroke-width="1" />
                  
                  <!-- Robot Head Shield Backplate -->
                  <path d="M32,35 C32,22 68,22 68,35 C68,54 63,68 50,73 C37,68 32,54 32,35 Z" fill="#0d0e1b" stroke="url(#mia-avatar-grad)" stroke-width="2.5" />
                  
                  <!-- Side Ear Plates / Antennas -->
                  <rect x="27" y="38" width="5" height="13" rx="2" fill="#1e1b4b" stroke="#06b6d4" stroke-width="1" />
                  <rect x="68" y="38" width="5" height="13" rx="2" fill="#1e1b4b" stroke="#06b6d4" stroke-width="1" />
                  <line x1="29" y1="38" x2="25" y2="29" stroke="#06b6d4" stroke-width="1.5" stroke-linecap="round" />
                  <circle cx="25" cy="29" r="1.5" fill="#00F0FF" />
                  <line x1="71" y1="38" x2="75" y2="29" stroke="#06b6d4" stroke-width="1.5" stroke-linecap="round" />
                  <circle cx="75" cy="29" r="1.5" fill="#00F0FF" />

                  <!-- Visor Background (Dark glass) -->
                  <path d="M36,42 C36,42 50,38 64,42 C64,46 61,54 50,56 C39,54 36,46 36,42 Z" fill="#04060c" stroke="rgba(99, 102, 241, 0.4)" stroke-width="1" />

                  <!-- Glowing Cyber Visor Eye (Vibrant Cyan Lightbar) -->
                  <path d="M39,45 C43,44 57,44 61,45 C62,47 59,51 50,52 C41,51 38,47 39,45 Z" fill="url(#visor-glow)" filter="url(#svg-glow)" />
                  <line x1="42" y1="48" x2="58" y2="48" stroke="#ffffff" stroke-width="0.5" stroke-dasharray="1.5 1" opacity="0.8" />

                  <!-- Mouth LED pattern (glowing dots) -->
                  <g transform="translate(0, 4)" opacity="0.95">
                    <circle cx="45" cy="60" r="1" fill="#00F0FF" />
                    <circle cx="48" cy="61" r="1" fill="#00F0FF" />
                    <circle cx="50" cy="61.5" r="1.2" fill="#00F0FF" filter="url(#svg-glow)" />
                    <circle cx="52" cy="61" r="1" fill="#00F0FF" />
                    <circle cx="55" cy="60" r="1" fill="#00F0FF" />
                  </g>
                </svg>
                <span class="ob-status-dot" id="ob-dot"></span>
              </div>
              <div>
                <div class="ob-name">Mia <span class="ob-ai-tag">AGENT</span></div>
                <div class="ob-status-text" id="ob-status">Initializing...</div>
              </div>
            </div>
            <div class="ob-header-actions">
              <button id="ob-voice-out-btn" class="ob-icon-btn" title="Toggle voice output">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                </svg>
              </button>
              <button id="ob-export-btn" class="ob-icon-btn" title="Export conversation">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
              <button id="ob-clear-btn" class="ob-icon-btn" title="Clear chat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
              <button id="ob-close-btn" class="ob-icon-btn ob-close" title="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Messages -->
          <div id="ob-msgs" class="ob-messages" role="log" aria-live="polite"></div>

          <!-- Thinking panel -->
          <div id="ob-thinking" class="ob-thinking" aria-live="polite">
            <div class="ob-think-step" id="ob-t1">
              <span class="ob-think-icon">🔍</span>
              <span class="ob-think-label" id="ob-t1-label">Understanding query</span>
              <span class="ob-think-dots"><span></span><span></span><span></span></span>
            </div>
            <div class="ob-think-step" id="ob-t2">
              <span class="ob-think-icon">📚</span>
              <span class="ob-think-label" id="ob-t2-label">Researching knowledge base</span>
              <span class="ob-think-dots"><span></span><span></span><span></span></span>
            </div>
            <div class="ob-think-step" id="ob-t3">
              <span class="ob-think-icon">✍️</span>
              <span class="ob-think-label" id="ob-t3-label">Composing answer</span>
              <span class="ob-think-dots"><span></span><span></span><span></span></span>
            </div>
          </div>

          <!-- Quick chips -->
          <div id="ob-chips" class="ob-chips">
            <button class="ob-chip" data-q="What systems do you integrate?">🔗 Integrations</button>
            <button class="ob-chip" data-q="How does your data pipeline work?">⚡ Pipeline</button>
            <button class="ob-chip" data-q="Is OrbitOps SOC2 compliant?">🔒 Security</button>
            <button class="ob-chip" data-q="What are your pricing plans?">💰 Pricing</button>
            <button class="ob-chip" data-q="I want to book a demo">📅 Book Demo</button>
          </div>

          <!-- Input area -->
          <form id="ob-form" class="ob-input-area" autocomplete="off">
            <div class="ob-input-wrap">
              <input id="ob-input" class="ob-input" type="text"
                placeholder="Ask Mia anything..." autocomplete="off" spellcheck="true"
                aria-label="Chat message" />
              <div class="ob-voice-wave" id="ob-voice-wave" style="display:none">
                <span></span><span></span><span></span><span></span><span></span>
              </div>
              <button id="ob-mic" class="ob-mic-btn" type="button" title="Voice input" aria-label="Start voice input">
                <svg id="ob-mic-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                <svg id="ob-mic-off" viewBox="0 0 24 24" fill="currentColor" style="display:none;color:#ef4444">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
              </button>
            </div>
            <button class="ob-send-btn" type="submit" aria-label="Send">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>
      `);
    }

    _bind() {
      document.getElementById('ob-fab').onclick = () => this.open();
      document.getElementById('ob-close-btn').onclick = () => this.close();
      document.getElementById('ob-clear-btn').onclick = () => this.clearChat();
      document.getElementById('ob-export-btn').onclick = () => this.storage.export(this.msgs);
      document.getElementById('ob-voice-out-btn').onclick = () => this.toggleVoiceOut();
      document.getElementById('ob-mic').onclick = () => this.toggleMic();
      document.getElementById('ob-form').onsubmit = e => {
        e.preventDefault();
        const val = document.getElementById('ob-input').value.trim();
        if (val && !this.busy) {
          document.getElementById('ob-input').value = '';
          this.send(val);
        }
      };
      document.querySelectorAll('#ob-chips .ob-chip').forEach(c =>
        c.onclick = () => { if (!this.busy) this.send(c.dataset.q); }
      );

      if (this.voice.supported) {
        this.voice.onStart = () => this._micState(true);
        this.voice.onEnd = () => this._micState(false);
        this.voice.onResult = t => {
          document.getElementById('ob-input').value = t;
        };
      } else {
        const m = document.getElementById('ob-mic');
        m.style.opacity = '0.3';
        m.disabled = true;
        m.title = 'Voice recognition not supported';
      }
    }

    open() {
      document.getElementById('ob-window').classList.add('ob-open');
      document.getElementById('ob-fab').classList.add('ob-hidden');
      document.getElementById('ob-input').focus();
    }

    close() {
      document.getElementById('ob-window').classList.remove('ob-open');
      document.getElementById('ob-fab').classList.remove('ob-hidden');
      this.voice.stop();
      this.voice.mute();
    }

    async _probe() {
      try {
        const r = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: '__ping__' })
        });
        if (r.ok) {
          this.backendOk = true;
          this._setStatus('Active • Groq LLM Agent', true);
          return;
        }
      } catch {}
      this._setStatus('Active • OrbitOps Local AI', true);
    }

    _setStatus(txt, online = false) {
      const s = document.getElementById('ob-status');
      const d = document.getElementById('ob-dot');
      if (s) s.textContent = txt;
      if (d && online) d.classList.add('ob-online');
    }

    _restoreOrWelcome() {
      const area = document.getElementById('ob-msgs');
      area.innerHTML = '';
      if (this.msgs.length === 0) {
        this._addMsg({
          role: 'bot',
          ts: Date.now(),
          text: `Hello! I'm <strong>Mia</strong>, your OrbitOps AI assistant. 👋<br><br>I understand your questions, research our knowledge base, and compile detailed answers. You can also use the <strong>🎤 mic</strong> to speak your query!<br><br>What would you like to know about enterprise automation?`,
          model: 'Mia'
        });
      } else {
        this.msgs.slice(-30).forEach(m => this._addMsg(m, false, false));
      }
    }

    async send(text) {
      if (!text || this.busy) return;
      this.busy = true;

      // Hide chips
      document.getElementById('ob-chips').style.display = 'none';

      // Push User Msg
      const uMsg = { role: 'user', text, ts: Date.now() };
      this._addMsg(uMsg, false, false);
      this.msgs.push(uMsg);
      this.storage.save(this.msgs);

      // Show Thinking
      this._showThink();
      this._thinkStep(0, `Phase 1: Understanding query - analyzing keywords in: "${text.substring(0, Math.min(text.length, 30))}..."`);

      const stepInterval = setInterval(() => {
        if (this.currentThinkStep < 2) {
          this._thinkStep(this.currentThinkStep + 1);
        }
      }, 1200);

      // Prepare context payload
      const requestContext = this.msgs.slice(-8).filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.text.replace(/<[^>]+>/g, '')
      }));

      let replyData = null;

      try {
        const response = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            context: requestContext,
            conversationId: this.conversationId
          })
        });

        clearInterval(stepInterval);

        if (response.ok) {
          const res = await response.json();
          // Update thoughts with actual backend steps
          if (res.researchSteps && res.researchSteps.length > 0) {
            this._showActualSteps(res.researchSteps);
          }
          replyData = { text: res.response, model: res.model || 'Groq' };
        }
      } catch (err) {
        clearInterval(stepInterval);
      }

      // Fallback local classification if server fails
      if (!replyData) {
        await new Promise(r => setTimeout(r, 800));
        const cleanText = text.toLowerCase().trim();
        const kb = [
          {
            id: "greeting",
            keywords: ["hello","hi","hey","greetings","yo","sup","morning","afternoon","evening","howdy"],
            response: "Hello! I'm <strong>Mia</strong>, your OrbitOps automation assistant. I can help you with:\n• Our data pipeline architecture\n• HR, payroll & ERP integrations\n• Security & compliance details\n• Custom connector development\n• Pricing & demo scheduling\n\nWhat would you like to know?"
          },
          {
            id: "identity",
            keywords: ["name","identity","who","mia","yourself","what","called","introduce"],
            response: "I'm <strong>Mia</strong> — the AI assistant powering OrbitOps.ai. I'm trained on our full service catalogue including enterprise data pipelines, HRIS/payroll integrations, compliance frameworks, and operational automation workflows."
          },
          {
            id: "capabilities",
            keywords: ["help","can","do","capabilities","features","instructions","options","menu","assist","support","services"],
            response: "Here's what I can help with:\n• <strong>Integrations</strong> — Which platforms we connect\n• <strong>Pipeline Architecture</strong> — Our 5-stage ETL/ELT process\n• <strong>Security & Compliance</strong> — SOC2, GDPR, AES-256\n• <strong>Error Quarantine</strong> — How we handle sync failures\n• <strong>Custom Connectors</strong> — Scripted API wrappers\n• <strong>Pricing</strong> — Custom enterprise plans\n• <strong>Demo</strong> — Schedule a live walkthrough"
          },
          {
            id: "integrations",
            keywords: ["integrate","integration","integrations","connect","connector","systems","platforms","sync","hris","crm","erp","sap","netsuite","adp","workday","hibob","bamboohr","salesforce","hubspot","shopify"],
            response: "OrbitOps operates a <strong>multi-tenant API orchestration grid</strong> with native sync channels for HRIS (Workday, BambooHR, HiBob), Payroll & ERP (ADP, NetSuite, SAP, Xero), CRM & Commerce (Salesforce, HubSpot, Shopify), and Operations (Jira, Slack, Monday.com)."
          },
          {
            id: "pipeline",
            keywords: ["pipeline","data","stages","steps","architecture","flow","path","extract","transform","validate","load","monitor","etl","elt"],
            response: "Our <strong>Enterprise Data Pipeline</strong> runs through 5 high-observability stages:\n1. <strong>Extract</strong> — Listen for updates or webhook events\n2. <strong>Transform</strong> — Normalise payloads and map schemas\n3. <strong>Validate</strong> — Sanitise input data and check fields\n4. <strong>Load</strong> — Post clean payloads to downstream endpoints\n5. <strong>Monitor</strong> — Stream telemetry and trigger Slack alerts"
          },
          {
            id: "security",
            keywords: ["security","secure","soc2","soc","compliance","compliant","gdpr","encrypt","encryption","vault","quarantine"],
            response: "Security is built into every layer:\n• SOC2 Type II and GDPR compliant architectures\n• AES-256 encryption at-rest and TLS 1.3 in-transit\n• Zero-Trust role-based access controls\n• Secure credential vaulting and immutable audit logs"
          },
          {
            id: "pricing",
            keywords: ["pricing","price","cost","plans","rates","packages","subscription","quote","fee","budget"],
            response: "Our pricing is <strong>fully tailored</strong> to your organization:\n• <strong>Starter</strong> — Up to 5 integrations, standard monitoring\n• <strong>Professional</strong> — Unlimited integrations + error quarantine dashboard\n• <strong>Enterprise</strong> — Dedicated engineer, SLA guarantees, custom compliance reports\n\nContact us at <strong>cpatil7350638164@gmail.com</strong> for a custom quote."
          },
          {
            id: "demo",
            keywords: ["demo","schedule","book","call","talk","engineer","consult","contact","meeting","sales"],
            response: "I'd love to connect you with our operations engineers for a <strong>custom live demo</strong>!\n\n📧 <strong>Email:</strong> cpatil7350638164@gmail.com\n📍 <strong>Office:</strong> Studio Complex, Gota, Ahmedabad\n\nOr fill out the <strong>contact form</strong> at the bottom of this page — we respond within 24 hours."
          }
        ];

        const tokens = cleanText.split(/[^a-z0-9]/).filter(t => t.length > 1);
        const matches = [];
        
        kb.forEach(doc => {
          let score = 0;
          doc.keywords.forEach(kw => {
            if (cleanText.includes(kw)) score += 2;
            if (tokens.includes(kw)) score += 1;
          });
          if (score > 0) {
            matches.push({ id: doc.id, response: doc.response, score });
          }
        });

        matches.sort((a, b) => b.score - a.score);
        const bestMatches = matches.slice(0, 3);
        let finalAns = "";

        if (bestMatches.length > 0) {
          if (bestMatches.length === 1) {
            finalAns = bestMatches[0].response.replace(/\n/g, '<br>');
          } else {
            finalAns = "I found multiple topics related to your query in my local cache:<br><br>";
            bestMatches.forEach(m => {
              const title = m.id.toUpperCase();
              finalAns += `<strong>🔍 ${title}</strong><br>${m.response.replace(/\n/g, '<br>')}<br><br>`;
            });
            finalAns += "---<br>For more specific queries, please check our server status or email us at <strong>cpatil7350638164@gmail.com</strong>.";
          }
        } else {
          finalAns = "I specialize in <strong>enterprise operations automation</strong> — data pipelines, HRIS/payroll integrations, CRM/ERP syncs, and custom API connectors. Try asking about our integrations, pipeline stages, security, or pricing plans!";
        }
        
        replyData = { text: finalAns, model: 'OrbitOps Local AI (Offline)' };
      }

      this._hideThink();

      const botMsg = { role: 'bot', text: replyData.text, model: replyData.model, ts: Date.now() };
      this._addMsg(botMsg, true, true);
      this.msgs.push(botMsg);
      this.storage.save(this.msgs);

      if (this.voiceOut) {
        this.voice.speak(replyData.text);
      }

      setTimeout(() => {
        document.getElementById('ob-chips').style.display = 'flex';
        this.busy = false;
      }, 400);
    }

    _showThink() {
      this.currentThinkStep = 0;
      const p = document.getElementById('ob-thinking');
      p.classList.add('ob-thinking-vis');
      ['ob-t1', 'ob-t2', 'ob-t3'].forEach(id => {
        document.getElementById(id).classList.remove('ob-think-active', 'ob-think-done');
      });
      document.getElementById('ob-t1').classList.add('ob-think-active');
      
      // Reset labels
      document.getElementById('ob-t1-label').textContent = 'Understanding query...';
      document.getElementById('ob-t2-label').textContent = 'Researching knowledge base...';
      document.getElementById('ob-t3-label').textContent = 'Composing answer...';
    }

    _thinkStep(idx, label = null) {
      const ids = ['ob-t1', 'ob-t2', 'ob-t3'];
      this.currentThinkStep = idx;

      for (let i = 0; i < idx; i++) {
        const el = document.getElementById(ids[i]);
        el.classList.remove('ob-think-active');
        el.classList.add('ob-think-done');
      }

      const cur = document.getElementById(ids[idx]);
      if (cur) {
        cur.classList.add('ob-think-active');
        if (label) {
          document.getElementById(ids[idx] + '-label').textContent = label;
        }
      }
    }

    _showActualSteps(steps) {
      const ids = ['ob-t1', 'ob-t2', 'ob-t3'];
      steps.forEach((stepText, i) => {
        if (i < 3) {
          const label = document.getElementById(ids[i] + '-label');
          if (label) label.textContent = stepText;
          const el = document.getElementById(ids[i]);
          el.classList.remove('ob-think-active');
          el.classList.add('ob-think-done');
        }
      });
    }

    _hideThink() {
      document.getElementById('ob-thinking').classList.remove('ob-thinking-vis');
    }

    _addMsg(msg, stream = false, animate = true) {
      const area = document.getElementById('ob-msgs');
      const isBot = msg.role === 'bot';

      const wrap = document.createElement('div');
      wrap.className = `ob-msg ob-msg-${isBot ? 'bot' : 'user'}`;
      if (!animate) wrap.style.animationDuration = '0s';

      const bubble = document.createElement('div');
      bubble.className = 'ob-bubble';

      if (stream && isBot) {
        bubble.innerHTML = '';
        wrap.appendChild(bubble);
        area.appendChild(wrap);
        area.scrollTop = area.scrollHeight;

        let i = 0, buf = '', inTag = false;
        const chars = Array.from(msg.text);

        const timer = setInterval(() => {
          if (i >= chars.length) {
            clearInterval(timer);
            bubble.innerHTML = msg.text;
            this._appendMeta(wrap, msg);
            area.scrollTop = area.scrollHeight;
            return;
          }

          const ch = chars[i++];
          if (ch === '<') inTag = true;
          buf += ch;
          if (ch === '>') inTag = false;

          if (!inTag) {
            bubble.innerHTML = buf;
            area.scrollTop = area.scrollHeight;
          }
        }, STREAM_SPEED);
      } else {
        bubble.innerHTML = msg.text;
        wrap.appendChild(bubble);
        if (isBot) {
          this._appendMeta(wrap, msg);
        } else {
          const t = document.createElement('div');
          t.className = 'ob-user-time';
          t.textContent = new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          wrap.appendChild(t);
        }
        area.appendChild(wrap);
        area.scrollTop = area.scrollHeight;
      }
    }

    _appendMeta(wrap, msg) {
      const row = document.createElement('div');
      row.className = 'ob-meta-row';

      const meta = document.createElement('div');
      meta.className = 'ob-msg-meta';
      const timeStr = new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      meta.innerHTML = `<span class="ob-msg-model">🤖 ${msg.model || 'Mia'}</span><span class="ob-msg-time">${timeStr}</span>`;

      const actions = document.createElement('div');
      actions.className = 'ob-msg-actions';

      // Copy
      const copy = document.createElement('button');
      copy.className = 'ob-action-btn';
      copy.title = 'Copy response';
      copy.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
      copy.onclick = () => {
        navigator.clipboard.writeText(msg.text.replace(/<[^>]+>/g, ''));
        copy.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
        setTimeout(() => {
          copy.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"/></svg>`;
        }, 2000);
      };

      // Speak
      const speak = document.createElement('button');
      speak.className = 'ob-action-btn';
      speak.title = 'Read aloud';
      speak.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>`;
      speak.onclick = () => this.voice.speak(msg.text);

      // Thumbs Up
      const thumbUp = document.createElement('button');
      thumbUp.className = 'ob-action-btn ob-thumb-up';
      if (msg.feedback === 1) thumbUp.classList.add('active');
      thumbUp.title = 'Helpful';
      thumbUp.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`;
      thumbUp.onclick = () => this._submitFeedback(msg, 1, thumbUp, thumbDown);

      // Thumbs Down
      const thumbDown = document.createElement('button');
      thumbDown.className = 'ob-action-btn ob-thumb-down';
      if (msg.feedback === -1) thumbDown.classList.add('active');
      thumbDown.title = 'Unhelpful';
      thumbDown.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm12-3h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/></svg>`;
      thumbDown.onclick = () => this._submitFeedback(msg, -1, thumbUp, thumbDown);

      actions.appendChild(copy);
      actions.appendChild(speak);
      actions.appendChild(thumbUp);
      actions.appendChild(thumbDown);

      row.appendChild(meta);
      row.appendChild(actions);
      wrap.appendChild(row);
    }

    _submitFeedback(msg, rating, btnUp, btnDown) {
      // Find query leading to this response
      let userQuery = '';
      const msgIdx = this.msgs.indexOf(msg);
      if (msgIdx !== -1) {
        for (let j = msgIdx - 1; j >= 0; j--) {
          if (this.msgs[j].role === 'user') {
            userQuery = this.msgs[j].text;
            break;
          }
        }
      }

      const prev = msg.feedback;
      const targetRating = prev === rating ? 0 : rating;
      msg.feedback = targetRating;
      this.storage.save(this.msgs);

      btnUp.classList.remove('active');
      btnDown.classList.remove('active');
      if (targetRating === 1) btnUp.classList.add('active');
      if (targetRating === -1) btnDown.classList.add('active');

      fetch(FEEDBACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: this.conversationId,
          userMessage: userQuery,
          agentResponse: msg.text,
          rating: targetRating
        })
      }).catch(() => {});
    }

    toggleVoiceOut() {
      this.voiceOut = !this.voiceOut;
      const btn = document.getElementById('ob-voice-out-btn');
      if (this.voiceOut) {
        btn.classList.add('ob-active');
      } else {
        btn.classList.remove('ob-active');
        this.voice.mute();
      }
    }

    toggleMic() {
      if (this.voice.isListening) {
        this.voice.stop();
      } else {
        this.voice.mute();
        this.voice.listen();
      }
    }

    _micState(active) {
      const btn = document.getElementById('ob-mic');
      const wave = document.getElementById('ob-voice-wave');
      const micOn = document.getElementById('ob-mic-on');
      const micOff = document.getElementById('ob-mic-off');

      if (active) {
        btn.classList.add('ob-mic-active');
        wave.style.display = 'flex';
        micOn.style.display = 'none';
        micOff.style.display = 'block';
      } else {
        btn.classList.remove('ob-mic-active');
        wave.style.display = 'none';
        micOn.style.display = 'block';
        micOff.style.display = 'none';
      }
    }

    clearChat() {
      this.voice.mute();
      this.storage.clear();
      this.msgs = [];
      this._restoreOrWelcome();
    }
  }

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new OrbitBot());
  } else {
    new OrbitBot();
  }
})();

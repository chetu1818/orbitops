import { Component, OnInit, OnDestroy, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { resolveApiUrl } from '../../utils/api';

interface ChatMessage {
  role: string;
  text: string;
  model?: string;
  ts: number;
  feedback?: number; // 1 = Thumbs Up, -1 = Thumbs Down, 0/undefined = None
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css'
})
export class ChatbotComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  private readonly BACKEND_URL = resolveApiUrl('/api/chat', 'http://localhost:5015/api/chat');
  private readonly FEEDBACK_URL = resolveApiUrl('/api/chat/feedback', 'http://localhost:5015/api/chat/feedback');
  private readonly STORAGE_KEY = 'orbitops_chat_angular';
  private readonly MAX_STORED = 120;
  private readonly STREAM_SPEED = 10; // ms per char

  isOpen = false;
  inputText = '';
  isListening = false;
  isSpeaking = false;
  voiceOut = false;
  isThinking = false;
  thinkingSteps: string[] = [];
  currentStepIndex = 0; // 0=Understand, 1=Research, 2=Compose

  messages: ChatMessage[] = [];
  conversationId = '';
  backendOk = false;

  // Web Speech API references
  private recognition: any = null;
  private synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  constructor(private http: HttpClient, private ngZone: NgZone) {}

  ngOnInit() {
    this.initVoice();
    this.restoreOrWelcome();
    this.probeBackend();
  }

  ngOnDestroy() {
    this.stopSpeaking();
    if (this.recognition) {
      this.recognition.abort();
    }
  }

  // --- Initialize Web Speech API ---
  private initVoice() {
    if (typeof window !== 'undefined') {
      const SpeechReg = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechReg) {
        this.recognition = new SpeechReg();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
          this.isListening = true;
        };

        this.recognition.onend = () => {
          this.isListening = false;
        };

        this.recognition.onerror = () => {
          this.isListening = false;
        };

        this.recognition.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          if (resultText && resultText.trim()) {
            this.ngZone.run(() => {
              this.inputText = resultText;
            });
          }
        };
      }
    }
  }

  // --- Probe Backend Uptime ---
  private probeBackend() {
    this.http.post<any>(this.BACKEND_URL, { message: '__ping__' }).subscribe({
      next: (res) => {
        this.backendOk = true;
      },
      error: () => {
        this.backendOk = false;
      }
    });
  }

  // --- Restore Conversation ---
  private restoreOrWelcome() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        const storedId = localStorage.getItem(this.STORAGE_KEY + '_id');
        this.conversationId = storedId || 'conv_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem(this.STORAGE_KEY + '_id', this.conversationId);

        if (stored) {
          this.messages = JSON.parse(stored);
        } else {
          this.messages = [
            {
              role: 'bot',
              ts: Date.now(),
              text: `Hello! I'm <strong>Mia</strong>, your OrbitOps AI assistant. 👋<br><br>I understand your questions, research our knowledge base, and compile detailed answers. You can also use the <strong>🎤 mic</strong> to speak your query!<br><br>What would you like to know about enterprise automation?`,
              model: 'Mia'
            }
          ];
          this.saveHistory();
        }
      } catch (err) {
        this.conversationId = 'conv_' + Math.random().toString(36).substring(2, 11);
      }
    }
    this.scrollToBottom();
  }

  private saveHistory() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.messages.slice(-this.MAX_STORED)));
      } catch (e) {}
    }
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 50);
    } else {
      this.stopSpeaking();
      if (this.recognition) {
        this.recognition.abort();
      }
    }
  }

  toggleMic() {
    if (!this.recognition) return;
    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.stopSpeaking();
      this.recognition.start();
    }
  }

  toggleVoiceOut() {
    this.voiceOut = !this.voiceOut;
    if (!this.voiceOut) {
      this.stopSpeaking();
    }
  }

  onSubmit(e: Event) {
    e.preventDefault();
    const text = this.inputText.trim();
    if (text && !this.isThinking) {
      this.inputText = '';
      this.send(text);
    }
  }

  onChipClick(q: string) {
    if (!this.isThinking) {
      this.send(q);
    }
  }

  // --- Send Message and Pipeline Workflow ---
  private send(text: string) {
    if (this.isThinking) return;

    // Push User Message
    this.messages.push({
      role: 'user',
      text,
      ts: Date.now()
    });
    this.saveHistory();
    this.scrollToBottom();

    // Start 3-Phase Thinking state
    this.isThinking = true;
    this.currentStepIndex = 0;
    this.thinkingSteps = [
      `Phase 1: Understanding query - analyzing keywords in: "${text.substring(0, Math.min(text.length, 30))}..."`,
      'Phase 2: Researching - waiting for knowledge base search results...',
      'Phase 3: Composing - generating natural language response...'
    ];

    // Build context
    const contextLimit = this.messages.slice(-8).filter(m => m.role !== 'system');
    const requestContext = contextLimit.map(m => ({
      role: m.role === 'bot' ? 'assistant' : 'user',
      content: this.cleanHtml(m.text)
    }));

    const payload = {
      message: text,
      context: requestContext,
      conversationId: this.conversationId
    };

    // Simulate thinking phase progression
    const stepInterval = setInterval(() => {
      if (this.currentStepIndex < 2) {
        this.currentStepIndex++;
      }
    }, 1200);

    // Call backend API
    this.http.post<any>(this.BACKEND_URL, payload).subscribe({
      next: (res) => {
        clearInterval(stepInterval);
        this.currentStepIndex = 2; // Transition directly to Done/Composed

        // Replace simulated steps with actual backend reasoning steps
        if (res.researchSteps && res.researchSteps.length > 0) {
          this.thinkingSteps = res.researchSteps;
          this.currentStepIndex = this.thinkingSteps.length - 1;
        }

        setTimeout(() => {
          this.isThinking = false;
          this.streamBotResponse(res.response, res.model || 'Groq API');
        }, 600);
      },
      error: () => {
        // Fallback local classification if server goes down
        clearInterval(stepInterval);
        setTimeout(() => {
          this.isThinking = false;
          const fallbackResponse = this.localFallbackResponse(text);
          this.streamBotResponse(fallbackResponse.text, fallbackResponse.model);
        }, 1500);
      }
    });
  }

  // --- Text Streaming Effect ---
  private streamBotResponse(fullText: string, model: string) {
    const botMsg: ChatMessage = {
      role: 'bot',
      text: '',
      model,
      ts: Date.now()
    };
    this.messages.push(botMsg);
    this.scrollToBottom();

    let i = 0;
    let currentHtml = '';
    let inTag = false;
    const chars = Array.from(fullText);

    const timer = setInterval(() => {
      if (i >= chars.length) {
        clearInterval(timer);
        botMsg.text = fullText;
        this.saveHistory();
        this.scrollToBottom();
        
        if (this.voiceOut) {
          this.speak(fullText);
        }
        return;
      }

      const ch = chars[i++];
      if (ch === '<') inTag = true;
      currentHtml += ch;
      if (ch === '>') inTag = false;

      if (!inTag) {
        botMsg.text = currentHtml;
        this.scrollToBottom();
      }
    }, this.STREAM_SPEED);
  }

  // --- Voice Output Reader ---
  speak(text: string) {
    if (!this.synth) return;
    this.synth.cancel();

    const clean = this.cleanHtml(text);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    const voices = this.synth.getVoices();
    const bestVoice = voices.find(v => 
      /samantha|karen|aria|google uk english female|zira/i.test(v.name)
    ) || voices.find(v => v.lang.startsWith('en'));

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
    };
    utterance.onend = () => {
      this.isSpeaking = false;
    };
    utterance.onerror = () => {
      this.isSpeaking = false;
    };

    this.synth.speak(utterance);
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
  }

  // --- Thumbs Up / Down Feedback ---
  submitFeedback(msgIndex: number, rating: number) {
    const msg = this.messages[msgIndex];
    if (!msg || msg.role !== 'bot') return;

    // If already rated same, toggle off
    const prevRating = msg.feedback;
    msg.feedback = prevRating === rating ? 0 : rating;
    this.saveHistory();

    // Find User Query leading to this bot message
    let userQuery = '';
    for (let idx = msgIndex - 1; idx >= 0; idx--) {
      if (this.messages[idx].role === 'user') {
        userQuery = this.messages[idx].text;
        break;
      }
    }

    const payload = {
      conversationId: this.conversationId,
      userMessage: userQuery,
      agentResponse: msg.text,
      rating: msg.feedback
    };

    this.http.post(this.FEEDBACK_URL, payload).subscribe({
      next: () => {
        // Successfully saved feedback on backend
      },
      error: (err) => {
        console.error('Error logging feedback rating to backend:', err);
      }
    });
  }

  clearChat() {
    this.stopSpeaking();
    this.messages = [
      {
        role: 'bot',
        ts: Date.now(),
        text: `Chat cleared. Hello! I'm <strong>Mia</strong>, how can I help optimize your automation workflows?`,
        model: 'Mia'
      }
    ];
    this.saveHistory();
    this.scrollToBottom();
  }

  exportChat() {
    const textLines = this.messages.map(m => {
      const sender = m.role === 'bot' ? 'Mia' : 'You';
      const cleanText = this.cleanHtml(m.text);
      return `[${new Date(m.ts).toLocaleString()}] ${sender}: ${cleanText}`;
    }).join('\n\n');

    const blob = new Blob([textLines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbitops-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  copyText(text: string) {
    const clean = this.cleanHtml(text);
    navigator.clipboard.writeText(clean);
  }

  formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private cleanHtml(html: string): string {
    return html.replace(/<[^>]+>/g, '').replace(/[^\x00-\x7F]/g, '').trim();
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 20);
  }

  // --- Local Fallback System ---
  private localFallbackResponse(text: string): { text: string, model: string } {
    const lower = text.toLowerCase().trim();
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

    const tokens = lower.split(/[^a-z0-9]/).filter(t => t.length > 1);
    const matches: any[] = [];
    
    kb.forEach(doc => {
      let score = 0;
      doc.keywords.forEach(kw => {
        if (lower.includes(kw)) score += 2;
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

    return {
      text: finalAns,
      model: "OrbitOps Local AI (Offline Fallback)"
    };
  }
}

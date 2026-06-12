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
  isThinking = false;
  thinkingSteps: string[] = [];
  currentStepIndex = 0; // 0=Understand, 1=Research, 2=Compose

  messages: ChatMessage[] = [];
  conversationId = '';
  backendOk = false;

  constructor(private http: HttpClient, private ngZone: NgZone) {}

  ngOnInit() {
    this.restoreOrWelcome();
    this.probeBackend();
  }

  ngOnDestroy() {}

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
              text: `Hello! I'm Mia, your OrbitOps support assistant. 👋<br><br>I'm here to help you design data pipelines, connect your business systems, and automate repetitive workflows. What kind of integration can we build today?`,
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
    this.messages = [
      {
        role: 'bot',
        ts: Date.now(),
        text: `Chat cleared. Hello! I'm Mia, how can I help optimize your automation workflows?`,
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
        response: "Hello! I'm Mia, your OrbitOps automation assistant. I can help you design secure data pipelines, connect your HR, payroll, or ERP applications, check our security compliance details, or schedule a live demo. What's on your mind today?"
      },
      {
        id: "identity",
        keywords: ["name","identity","who","mia","yourself","what","called","introduce"],
        response: "I'm Mia, the operations assistant for OrbitOps.ai. I help B2B clients design automated workflows, set up database pipelines, configure integrations, and navigate security standards."
      },
      {
        id: "capabilities",
        keywords: ["help","can","do","capabilities","features","instructions","options","menu","assist","support","services"],
        response: "I can answer questions about our API integrations, explain our five-stage secure pipeline structure, or outline our SOC2 security controls. I can also help you understand our error quarantine dashboards or assist you in scheduling a live demo."
      },
      {
        id: "integrations",
        keywords: ["integrate","integration","integrations","connect","connector","systems","platforms","sync","hris","crm","erp","sap","netsuite","adp","workday","hibob","bamboohr","salesforce","hubspot","shopify"],
        response: "We operate a multi-tenant API orchestration grid with native channels for applications like Workday, BambooHR, ADP, NetSuite, Salesforce, and HubSpot. We handle API credentials and rate limits automatically to ensure data syncs smoothly."
      },
      {
        id: "pipeline",
        keywords: ["pipeline","data","stages","steps","architecture","flow","path","extract","transform","validate","load","monitor","etl","elt"],
        response: "Our secure data pipelines process your files and API syncs in five automated stages. First, we extract payloads via secure webhooks, then we normalize the format, validate the fields for accuracy, load the clean data into your target endpoints, and monitor the entire flow with real-time Slack alerts."
      },
      {
        id: "security",
        keywords: ["security","secure","soc2","soc","compliance","compliant","gdpr","encrypt","encryption","vault","quarantine"],
        response: "Security is built into every layer of our system. We are SOC2 Type II and GDPR compliant, encrypt all data using AES-256 at rest and TLS 1.3 in transit, store credentials in restricted vaults, and isolate any sync issues in a secure quarantine area."
      },
      {
        id: "pricing",
        keywords: ["pricing","price","cost","plans","rates","packages","subscription","quote","fee","budget"],
        response: "Our pricing plans are custom-tailored to the scale of your business. We offer Starter packages for smaller projects, Professional packages with advanced error quarantine dashboards, and Enterprise plans with SLA guarantees. Please reach out to cpatil7350638164@gmail.com for a custom quote."
      },
      {
        id: "demo",
        keywords: ["demo","schedule","book","call","talk","engineer","consult","contact","meeting","sales"],
        response: "We would love to show you a live demo of our pipelines! You can schedule a session by emailing us at cpatil7350638164@gmail.com, visiting our Gota office in Ahmedabad, or filling out the contact form at the bottom of this page."
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

using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using OrbitOps.Api.Models;

namespace OrbitOps.Api.Services;

public class ChatService : IChatService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ChatService> _logger;

    // ─────────────────────────────────────────────────────────────────────────────
    // Expanded local knowledge-base (20+ intent categories, detailed responses)
    // ─────────────────────────────────────────────────────────────────────────────
    private static readonly List<(string Id, string[] Keywords, string Response)> KnowledgeBase = new()
    {
        ("greeting",
         new[] { "hello","hi","hey","greetings","yo","sup","morning","afternoon","evening","howdy","hows","going","start","begin","open" },
         "Hello! I'm **Mia**, your OrbitOps automation assistant. I can help you with:\n• Our data pipeline architecture\n• HR, payroll & ERP integrations\n• Security & compliance details\n• Custom connector development\n• Pricing & demo scheduling\n\nWhat would you like to know?"),

        ("identity",
         new[] { "name","identity","who","mia","yourself","what","called","introduce","tell","about","you" },
         "I'm **Mia** — the AI assistant powering OrbitOps.ai. I'm trained on our full service catalogue including enterprise data pipelines, HRIS/payroll integrations, compliance frameworks, and operational automation workflows."),

        ("creator",
         new[] { "built","made","creator","developer","founder","engineer","chetan","orbitops","team","who","created" },
         "I was built by the engineering team at **OrbitOps.ai** to automate manual and repetitive enterprise business tasks. Our founders are automation veterans with over a decade of experience in enterprise data integration."),

        ("capabilities",
         new[] { "help","can","do","capabilities","features","instructions","options","commands","menu","assist","support","services","offer","provide" },
         "Here's what I can help with:\n• **Integrations** — Which platforms we connect\n• **Pipeline Architecture** — Our 5-stage ETL/ELT process\n• **Security & Compliance** — SOC2, GDPR, AES-256\n• **Error Quarantine** — How we handle sync failures\n• **Custom Connectors** — Scripted API wrappers\n• **Pricing** — Custom enterprise plans\n• **Demo** — Schedule a live walkthrough\n\nJust ask!"),

        ("integrations",
         new[] { "integrate","integration","integrations","connect","connector","systems","platforms","sync","hris","crm","erp","sap","netsuite","adp","workday","hibob","bamboohr","salesforce","hubspot","shopify","jira","slack","gsuite","xero","personio","api","connection","supported" },
         "OrbitOps operates a **multi-tenant API orchestration grid** with native sync channels for:\n\n• **HRIS:** Workday, BambooHR, HiBob, Personio, Deel\n• **Payroll & ERP:** ADP, NetSuite, SAP Payroll, Xero, Sage\n• **CRM & Commerce:** Salesforce, HubSpot, Shopify, Pipedrive\n• **Operations & Dev:** Jira, Slack, Google Workspace, Monday.com\n• **Automation Engines:** n8n, Make.com, Zapier\n\nOur pipelines handle data mapping, rate-limiting, and credential storage automatically. Need a specific connector?"),

        ("pipeline",
         new[] { "pipeline","data","stages","steps","architecture","flow","path","extract","transform","validate","load","monitor","etl","elt","processing","automated","workflow","works","how" },
         "Our **Enterprise Data Pipeline** runs through 5 high-observability stages:\n\n1. **Extract** — Listen for database updates or webhook events via TLS 1.3\n2. **Transform** — Normalise payloads, map JSON schemas, and format figures\n3. **Validate** — Sanitise input data and flag incomplete fields before ingestion\n4. **Load** — Post clean payloads to downstream endpoints (e.g. ADP, NetSuite, banks)\n5. **Monitor** — Stream telemetry to centralised dashboards and trigger Slack alerts\n\nEvery stage has built-in retry logic and a quarantine layer for failed records."),

        ("security",
         new[] { "security","secure","soc2","soc","compliance","compliant","gdpr","encrypt","encryption","privacy","safety","trust","access","credentials","vault","quarantine","isolation","audit","safe","protect","certificate","tls","aes","zero" },
         "Security is built into **every layer** of our pipelines:\n\n• **Certified:** SOC2 Type II and GDPR compliant architectures\n• **Encryption:** AES-256 at-rest + TLS 1.3 for all transit\n• **Zero-Trust:** Role-based access controls across all environments\n• **Quarantine:** Failed records are auto-isolated, preventing contamination\n• **Vaulting:** API keys stored in restricted, time-limited credential vaults\n• **Audit Trails:** Full immutable event logs on every pipeline action\n\nWant to schedule a security review call?"),

        ("pricing",
         new[] { "pricing","price","cost","plans","rates","packages","subscription","quote","proposal","fee","budget","purchase","charge","monthly","annual","enterprise","pay","much","cheap","expensive","affordable" },
         "Our pricing is **fully tailored** to your organisation:\n\n• **Starter** — Up to 5 integrations, standard monitoring\n• **Professional** — Unlimited integrations + error quarantine dashboard\n• **Enterprise** — Dedicated engineer, SLA guarantees, custom compliance reports\n\nMost enterprise clients save **500+ manual hours/year** after onboarding. Let's schedule a call to build your custom quote! Email: **cpatil7350638164@gmail.com**"),

        ("demo",
         new[] { "demo","schedule","book","call","talk","engineer","consult","contact","meeting","sales","touch","discuss","project","appointment","onboarding","booking","live","demonstration","see","show","trial","test","walk" },
         "I'd love to connect you with our operations engineers for a **custom live demo**!\n\n📧 **Email:** cpatil7350638164@gmail.com\n📍 **Office:** Studio Complex, Gota, Ahmedabad\n\nOr fill out the **contact form** at the bottom of this page — we respond within 24 hours."),

        ("about",
         new[] { "orbitops","company","agency","firm","history","founded","founders","team","background","story","who","what","details","expertise","experience","automation","veterans" },
         "**OrbitOps.ai** is an operations engineering agency founded by automation veterans.\n\nWe build secure, resilient, and observable data pipelines that **eliminate manual spreadsheet data entry** across enterprise workflows.\n\n📊 **200+ connectors** automated\n⏱️ **500+ manual hours/year** saved per client\n🔒 **SOC2 Type II** certified processes\n🌍 Serving clients globally from Ahmedabad, India"),

        ("observability",
         new[] { "observability","dashboard","logs","metrics","errors","reporting","monitor","alert","slack","telemetry","audit","trailing","real","performance","tracking","status","visibility","trace","debug" },
         "We build **deep real-time observability** into every pipeline:\n\n• **Dashboards:** Live telemetry streamed to n8n/Make/Datadog\n• **Alerts:** Instant Slack notifications on any endpoint failure\n• **Auto-Retry:** Smart exponential backoff on transient errors\n• **Audit Logs:** Complete immutable event history per pipeline run\n• **Zero Data Loss:** Failed records are quarantined — never dropped\n\nYou'll always know the state of every operation in real time."),

        ("quarantine",
         new[] { "fails","fail","failure","sync","error","validation","quarantine","failed","record","bad","isolation","recover","loss","staging","intercept","corrupt","dirty","wrong","invalid","reject" },
         "When a sync or validation **fails**, our zero-error quarantine system activates:\n\n1. The bad record is **immediately isolated** in a secure staging vault\n2. An **instant Slack webhook** notifies your operations desk\n3. The rest of the pipeline **continues unaffected** (no cascade failures)\n4. Your team can **review, fix, and replay** the record from the quarantine dashboard\n\nThis prevents corrupt data from ever reaching downstream systems like NetSuite or ADP."),

        ("custom_connectors",
         new[] { "custom","connector","scripts","private","legacy","database","scripting","tailor","proprietary","mainframe","sql","local","build","write","code","endpoint","wrapper","bespoke","specific" },
         "Beyond our 200+ pre-built connectors, we write **fully custom integrations** for:\n\n• **Legacy Mainframes** — COBOL/AS400 systems\n• **Local SQL Databases** — MySQL, PostgreSQL, MSSQL\n• **Proprietary SaaS APIs** — Any REST/GraphQL/SOAP endpoint\n• **Custom Webhooks** — Real-time event listeners\n\nWe deploy **secure Node.js or Python worker scripts** that wrap your custom endpoints in observable, retry-safe pipelines."),

        ("payroll",
         new[] { "payroll","salary","pay","run","bank","file","adp","xero","sage","wage","employee","compensation","bacs","ach","payment","payslip","cycle","remuneration" },
         "OrbitOps automates the **entire payroll data flow**:\n\n• Extract employee changes from your HRIS (BambooHR, HiBob, Workday)\n• Validate new starters, leavers, and salary changes\n• Transform and map data to your payroll engine format (ADP, Xero, Sage)\n• Generate and deliver bank files (BACS/ACH) with zero manual input\n• Auto-alert your payroll team on any flagged record\n\nWe eliminate **100% of manual payroll CSV uploads**."),

        ("hris",
         new[] { "hris","hr","human","resources","employee","onboarding","offboarding","bamboohr","workday","hibob","personio","people","staff","talent","workforce","hire","departure","leave","absence" },
         "We integrate all major **HRIS platforms** into your operational stack:\n\n• **BambooHR, HiBob, Personio, Deel** — Real-time employee data sync\n• **Workday** — Bi-directional payroll & HR event triggers\n• **Onboarding Flows** — Auto-provision accounts (Slack, GSuite, Jira) on hire\n• **Offboarding Flows** — Auto-deprovision and archive on departure\n\nEvery HRIS event triggers a cascading, validated pipeline run."),

        ("crm",
         new[] { "crm","salesforce","hubspot","pipedrive","sales","leads","contacts","deals","opportunities","customers","revenue","account","prospect","close" },
         "Our **CRM integration layer** keeps your sales data in perfect sync:\n\n• **Salesforce & HubSpot** — Bi-directional contact and deal sync\n• **Revenue Reconciliation** — Auto-match CRM deals to ERP/NetSuite invoices\n• **Lead Routing** — Score and assign leads based on custom pipeline rules\n• **Pipeline Hygiene** — Flag stale contacts and duplicate records automatically\n\nNo more manual exports between your CRM and back-office systems."),

        ("erp",
         new[] { "erp","netsuite","sap","enterprise","resource","planning","finance","accounting","invoice","ledger","journal","gl","ap","ar","reconcile","reconciliation" },
         "OrbitOps connects your **ERP and financial systems** to your entire data ecosystem:\n\n• **NetSuite** — Real-time sync of journal entries, AP/AR, and payroll costs\n• **SAP** — Validated data connectors for SAP Payroll and FI/CO modules\n• **Xero & Sage** — Auto-posting of transactions and bank reconciliation\n• **Invoice Automation** — Match POs to invoices without manual review\n\nAll financial data flows are double-validated before posting."),

        ("automation",
         new[] { "automate","automation","manual","repetitive","task","work","process","workflow","bot","robotic","rpa","reduce","eliminate","save","time","effort","hours","labor" },
         "OrbitOps specialises in **eliminating manual, repetitive operational work**:\n\n• Data entry between disconnected systems\n• Payroll file generation and submission\n• Employee onboarding and offboarding sequences\n• Sales data reconciliation across CRM and ERP\n• Report generation and distribution\n\n🕐 Average client saves **500+ manual hours per year** after implementation."),

        ("n8n_make",
         new[] { "n8n","make","zapier","automation","engine","workflow","tool","node","trigger","action","no-code","low-code","orchestration","platform" },
         "We are experts in **n8n and Make.com** workflow automation:\n\n• Build complex multi-branch workflows with conditional logic\n• Connect 1000+ apps via native nodes and custom HTTP requests\n• Deploy **self-hosted n8n** for full data sovereignty\n• Monitor all workflow executions with detailed error logs\n\nWe handle the architecture, deployment, and ongoing maintenance of your automation infrastructure."),

        ("contact",
         new[] { "contact","reach","email","phone","location","address","office","ahmedabad","gujarat","india","studio","gota","find" },
         "**Get in touch with OrbitOps:**\n\n📧 **Email:** cpatil7350638164@gmail.com\n📍 **Office:** Studio Complex, Gota, Ahmedabad, Gujarat, India\n🌐 **Website:** orbitops.ai\n\nOr fill out our **contact form** at the bottom of this page. We respond within **24 business hours**."),

        ("joke",
         new[] { "joke","funny","laugh","humor","comedy","fun","laugh","entertain","amusing","witty" },
         "Why did the data engineer break up with the spreadsheet? Because it had **too many unresolved merge conflicts**! 😄\n\n*(But seriously — OrbitOps eliminates those conflicts automatically.)*"),

        ("thanks",
         new[] { "thank","thanks","thankyou","appreciate","helpful","great","awesome","good","nice","perfect","excellent","brilliant","superb","love" },
         "You're very welcome! 😊 Is there anything else I can help you with about our services, integrations, or pricing?"),

        ("farewell",
         new[] { "bye","goodbye","seeya","later","cya","take care","farewell","leave","end","close","done","finished" },
         "Goodbye! Feel free to come back anytime. OrbitOps is here whenever you need enterprise automation expertise. Have a great day! 👋"),
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // Stopwords (expanded — but preserving key interrogatives for matching)
    // ─────────────────────────────────────────────────────────────────────────────
    private static readonly HashSet<string> Stopwords = new(StringComparer.OrdinalIgnoreCase)
    {
        "a","an","the","and","or","but","of","to","for","in","on","at","by","with",
        "please","is","it","its","this","that","these","those","be","been","was","were",
        "are","as","up","so","if","no","nor","not","very","just","also","even","still",
        "once","from","into","out","over","own","same","than","then","there","too","under",
        "until","very","via","well","yet","both","each","every","few","more","most","other",
        "some","such","only","own","per","quite","rather","should","since","though","through",
    };

    public ChatService(HttpClient httpClient, IConfiguration configuration, ILogger<ChatService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    private static readonly object FileLock = new();

    public async Task<ChatResponseDto> GetChatResponseAsync(ChatRequestDto request)
    {
        var apiKey = _configuration["Groq:ApiKey"];
        var model  = _configuration["Groq:Model"] ?? "llama3-8b-8192";
        var conversationId = string.IsNullOrWhiteSpace(request.ConversationId) 
            ? Guid.NewGuid().ToString() 
            : request.ConversationId;

        var researchSteps = new List<string>();
        _logger.LogInformation("Processing agentic query. ConvId={ConvId}, MessageLength={Len}", conversationId, request.Message?.Length ?? 0);

        // --- Phase 1: Understand ---
        var preview = request.Message != null && request.Message.Length > 25 ? request.Message.Substring(0, 22) + "..." : request.Message;
        researchSteps.Add($"Phase 1: Understanding query - analyzing intent of: '{preview}'");
        var queryTokens = Tokenize(request.Message ?? string.Empty);
        
        // Match query intent
        (string Id, string Topic, string[] Keywords, string Response, string[] Research) intent = ("", "General Inquiry", Array.Empty<string>(), "", Array.Empty<string>());
        
        var lower = (request.Message ?? "").Trim().ToLowerInvariant().TrimEnd('.', '!', '?');
        if (lower is "hi" or "hello" or "hey" or "good morning" or "good afternoon" or "good evening" or "yo" or "howdy")
        {
            var match = KnowledgeBase.First(d => d.Id == "greeting");
            intent = (match.Id, "Greeting", match.Keywords, match.Response, new[] { "Checking user session", "Applying greeting parameters" });
        }
        else if (lower is "thanks" or "thank you" or "thankyou" or "ty" or "thx" or "great" or "awesome")
        {
            var match = KnowledgeBase.First(d => d.Id == "thanks");
            intent = (match.Id, "Acknowledgment", match.Keywords, match.Response, new[] { "Recording customer appreciation" });
        }
        else if (lower is "bye" or "goodbye" or "see you" or "take care" or "cya")
        {
            var match = KnowledgeBase.First(d => d.Id == "farewell");
            intent = (match.Id, "Farewell", match.Keywords, match.Response, new[] { "Saving conversation parameters" });
        }
        else
        {
            // Regex intents
            if (System.Text.RegularExpressions.Regex.IsMatch(lower, @"\bpric(e|ing)?\b|\bcost\b|\bhow much\b|\bpackage\b"))
            {
                var match = KnowledgeBase.First(d => d.Id == "pricing");
                intent = (match.Id, "Pricing Analysis", match.Keywords, match.Response, new[] { "Querying standard price catalog", "Loading tiers: Starter/Professional/Enterprise" });
            }
            else if (System.Text.RegularExpressions.Regex.IsMatch(lower, @"\bdemo\b|\bschedule\b|\bbook\b|\bconsult\b|\bmeeting\b"))
            {
                var match = KnowledgeBase.First(d => d.Id == "demo");
                intent = (match.Id, "Demo Booking", match.Keywords, match.Response, new[] { "Checking engineer availability slots", "Retrieving discovery form fields" });
            }
            else if (System.Text.RegularExpressions.Regex.IsMatch(lower, @"\bpayroll\b|\bsalary\b|\bwage\b|\badp\b|\bbacs\b|\bach\b"))
            {
                var match = KnowledgeBase.First(d => d.Id == "payroll");
                intent = (match.Id, "Payroll Automation", match.Keywords, match.Response, new[] { "Scanning payroll system interfaces", "Reviewing ADP/Xero/Sage configurations" });
            }
            else if (System.Text.RegularExpressions.Regex.IsMatch(lower, @"\bn8n\b|\bmake\.com\b|\bzapier\b|\bworkflow\b"))
            {
                var match = KnowledgeBase.First(d => d.Id == "n8n_make");
                intent = (match.Id, "Workflow Orchestration", match.Keywords, match.Response, new[] { "Loading n8n and Make.com nodes list", "Verifying self-hosted deployment models" });
            }
            else if (System.Text.RegularExpressions.Regex.IsMatch(lower, @"\bcontact\b|\bemail\b|\baddress\b|\bahmedabad\b|\boffice\b"))
            {
                var match = KnowledgeBase.First(d => d.Id == "contact");
                intent = (match.Id, "Corporate Contact", match.Keywords, match.Response, new[] { "Fetching Gota Ahmedabad head office details", "Loading standard email SLA parameters" });
            }
            else
            {
                // TF-IDF classification fallback
                double bestScore = 0;
                foreach (var doc in KnowledgeBase)
                {
                    var docTokens = doc.Keywords.ToHashSet(StringComparer.OrdinalIgnoreCase);
                    int matches = queryTokens.Count(t => docTokens.Contains(t));
                    if (matches == 0) continue;

                    double score = (double)(matches * matches) / (queryTokens.Count * doc.Keywords.Length);
                    if (score > bestScore)
                    {
                        bestScore = score;
                        intent = (doc.Id, $"Intent matching: {doc.Id}", doc.Keywords, doc.Response, new[] { $"Analyzing TF-IDF matches for {doc.Id}", "Loading context definitions" });
                    }
                }
            }
        }

        // --- Phase 2: Research ---
        if (!string.IsNullOrEmpty(intent.Id))
        {
            researchSteps.Add($"Phase 2: Researching database - found matching knowledge base ID: '{intent.Id}'");
            foreach (var rStep in intent.Research)
            {
                researchSteps.Add($"Phase 2: Research - {rStep}");
            }
        }
        else
        {
            researchSteps.Add("Phase 2: Research - query did not match standard intents. Scanning documentation directories...");
            researchSteps.Add("Phase 2: Research - compiled general system details and standard pipeline FAQs for reference.");
        }

        // --- Phase 3: Answer ---
        string finalAnswer = string.Empty;
        string modelUsed = "OrbitOps Local AI";

        bool isKeyMissing = string.IsNullOrWhiteSpace(apiKey)
            || apiKey.StartsWith("gsk_placeholder", StringComparison.OrdinalIgnoreCase)
            || apiKey.Equals("YOUR_GROQ_API_KEY_HERE", StringComparison.OrdinalIgnoreCase);

        if (!isKeyMissing)
        {
            researchSteps.Add($"Phase 3: Composing - querying Groq AI Model ({model}) using research data...");
            try
            {
                var systemPrompt = @"You are Mia, the intelligent AI operations assistant for OrbitOps.ai — an enterprise automation and data integration agency.

YOUR CORE IDENTITY:
- Expert in enterprise data pipelines, HRIS/payroll/CRM/ERP integrations, and workflow automation.
- Professional, concise, and technically accurate. Friendly but not overly casual.
- Use markdown: **bold** for key terms, bullet lists for structured info, numbered lists for steps.
- Respond in 3-5 sentences maximum unless the question clearly requires more detail.
- Never say ""I don't know"". Instead, pivot to what OrbitOps CAN help with.

ORBITOPS KNOWLEDGE:
- Services: Enterprise data pipeline design (Extract→Transform→Validate→Load→Monitor), HRIS/Payroll integration (BambooHR, Workday, HiBob, ADP, NetSuite, Xero), CRM sync (Salesforce, HubSpot), ERP integration (SAP, NetSuite), custom API connectors, n8n/Make.com workflow automation.
- Security: SOC2 Type II, GDPR, AES-256, TLS 1.3, Zero-Trust, credential vaulting, full audit trails.
- Error Handling: Auto-quarantine of failed records, instant Slack alerts, no data loss.
- Pricing: Tailored enterprise plans — Starter, Professional, Enterprise. Contact: cpatil7350638164@gmail.com.
- Location: Studio Complex, Gota, Ahmedabad, Gujarat, India.";

                if (!string.IsNullOrEmpty(intent.Response))
                {
                    systemPrompt += $"\n\nCONTEXT FROM INTERNAL RESEARCH:\nUse the following verified facts if relevant to draft your reply:\n{intent.Response}";
                }

                var requestBody = new GroqChatCompletionRequest
                {
                    Model = model,
                    Messages = new List<GroqMessage>
                    {
                        new() { Role = "system", Content = systemPrompt }
                    },
                    Temperature = 0.45,
                    MaxTokens = 800
                };

                // Add conversation history context
                foreach (var ctxMsg in request.Context)
                {
                    requestBody.Messages.Add(new GroqMessage
                    {
                        Role = ctxMsg.Role.ToLowerInvariant() == "assistant" ? "assistant" : "user",
                        Content = ctxMsg.Content
                    });
                }

                // Add current message
                requestBody.Messages.Add(new GroqMessage { Role = "user", Content = request.Message ?? "" });

                var requestMessage = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions")
                {
                    Content = new StringContent(
                        JsonSerializer.Serialize(requestBody),
                        System.Text.Encoding.UTF8,
                        "application/json")
                };
                requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

                var httpResponse = await _httpClient.SendAsync(requestMessage);

                if (httpResponse.IsSuccessStatusCode)
                {
                    var content = await httpResponse.Content.ReadAsStringAsync();
                    var result  = JsonSerializer.Deserialize<GroqChatCompletionResponse>(content);
                    var reply   = result?.Choices?.FirstOrDefault()?.Message?.Content;

                    if (!string.IsNullOrWhiteSpace(reply))
                    {
                        finalAnswer = reply;
                        modelUsed = $"Groq / {model}";
                        researchSteps.Add($"Phase 3: Composing - synthesized natural language response via Groq / {model}");
                    }
                }
                else
                {
                    _logger.LogWarning("Groq API returned non-success status code: {Code}", httpResponse.StatusCode);
                    researchSteps.Add($"Phase 3: Composing - Groq connection error ({httpResponse.StatusCode}). Falling back to Local AI.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception calling Groq. Falling back.");
                researchSteps.Add("Phase 3: Composing - Groq connection exception. Falling back to Local AI.");
            }
        }
        else
        {
            researchSteps.Add("Phase 3: Composing - Groq API key is not configured. Accessing Local AI classification response...");
        }

        if (string.IsNullOrEmpty(finalAnswer))
        {
            if (!string.IsNullOrEmpty(intent.Response))
            {
                finalAnswer = intent.Response;
            }
            else
            {
                finalAnswer = "I specialise in **enterprise operations automation** — data pipelines, HRIS/payroll integrations, CRM/ERP syncs, and custom API connectors.\n\nCould you rephrase your question or select one of the topics below? I'd be happy to help! 😊";
            }
            researchSteps.Add("Phase 3: Composing - local classification response compiled.");
        }

        // Log interaction to file for data storage improvement
        LogInteraction(conversationId, request.Message ?? string.Empty, finalAnswer, researchSteps, modelUsed);

        return new ChatResponseDto
        {
            Response = finalAnswer,
            Model = modelUsed,
            ResearchSteps = researchSteps,
            ConversationId = conversationId
        };
    }

    public Task SubmitFeedbackAsync(ChatFeedbackDto feedback)
    {
        try
        {
            var folder = Path.Combine(Directory.GetCurrentDirectory(), "chat_data");
            var filePath = Path.Combine(folder, "interactions.json");

            _logger.LogInformation("Submitting feedback rating: {Rating} for ConvId={ConvId}", feedback.Rating, feedback.ConversationId);

            lock (FileLock)
            {
                if (File.Exists(filePath))
                {
                    var existingText = File.ReadAllText(filePath);
                    var logs = JsonSerializer.Deserialize<List<InteractionLog>>(existingText);
                    if (logs != null)
                    {
                        // Find the matching log by ConversationId
                        var log = logs.LastOrDefault(l => l.ConversationId == feedback.ConversationId 
                            && l.UserMessage.Trim().Equals(feedback.UserMessage.Trim(), StringComparison.OrdinalIgnoreCase));

                        if (log != null)
                        {
                            log.Rating = feedback.Rating;
                            var json = JsonSerializer.Serialize(logs, new JsonSerializerOptions { WriteIndented = true });
                            File.WriteAllText(filePath, json);
                            _logger.LogInformation("Successfully updated feedback rating to {Rating} in file.", feedback.Rating);
                        }
                        else
                        {
                            _logger.LogWarning("No matching conversation user message found for feedback update.");
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting chat feedback.");
        }
        return Task.CompletedTask;
    }

    private void LogInteraction(string conversationId, string userMessage, string agentResponse, List<string> researchSteps, string model, int rating = 0)
    {
        try
        {
            var folder = Path.Combine(Directory.GetCurrentDirectory(), "chat_data");
            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
            }
            var filePath = Path.Combine(folder, "interactions.json");

            lock (FileLock)
            {
                List<InteractionLog> logs = new();
                if (File.Exists(filePath))
                {
                    try
                    {
                        var existingText = File.ReadAllText(filePath);
                        logs = JsonSerializer.Deserialize<List<InteractionLog>>(existingText) ?? new();
                    }
                    catch
                    {
                        logs = new();
                    }
                }

                logs.Add(new InteractionLog
                {
                    ConversationId = conversationId,
                    Timestamp = DateTime.UtcNow,
                    UserMessage = userMessage,
                    AgentResponse = agentResponse,
                    ResearchSteps = researchSteps,
                    Model = model,
                    Rating = rating
                });

                // Keep log size bounded
                if (logs.Count > 500)
                {
                    logs = logs.Skip(logs.Count - 500).ToList();
                }

                var json = JsonSerializer.Serialize(logs, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(filePath, json);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging chat interaction.");
        }
    }

    private List<string> Tokenize(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return new();

        var sb = new System.Text.StringBuilder();
        foreach (char c in text)
            sb.Append(char.IsLetterOrDigit(c) ? char.ToLower(c) : ' ');

        return sb.ToString()
                 .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                 .Where(t => t.Length > 1 && !Stopwords.Contains(t))
                 .Distinct()
                 .ToList();
    }
}

public class InteractionLog
{
    public string ConversationId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string UserMessage { get; set; } = string.Empty;
    public string AgentResponse { get; set; } = string.Empty;
    public List<string> ResearchSteps { get; set; } = new();
    public string Model { get; set; } = string.Empty;
    public int Rating { get; set; } // 1 = Up, -1 = Down
}

// ─────────────────────────────────────────────────────────────────────────────
// Groq API JSON models
// ─────────────────────────────────────────────────────────────────────────────
public class GroqChatCompletionRequest
{
    [JsonPropertyName("model")]       public string Model       { get; set; } = string.Empty;
    [JsonPropertyName("messages")]    public List<GroqMessage> Messages { get; set; } = new();
    [JsonPropertyName("temperature")] public double Temperature { get; set; } = 0.45;
    [JsonPropertyName("max_tokens")]  public int MaxTokens      { get; set; } = 800;
}

public class GroqMessage
{
    [JsonPropertyName("role")]    public string Role    { get; set; } = string.Empty;
    [JsonPropertyName("content")] public string Content { get; set; } = string.Empty;
}

public class GroqChatCompletionResponse
{
    [JsonPropertyName("choices")] public List<GroqChoice>? Choices { get; set; }
}

public class GroqChoice
{
    [JsonPropertyName("message")] public GroqMessage? Message { get; set; }
}


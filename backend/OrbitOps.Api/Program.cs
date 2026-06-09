using Microsoft.EntityFrameworkCore;
using OrbitOps.Api.Data;
using OrbitOps.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Register DbContext with SQL Server Connection String
builder.Services.AddDbContext<OrbitOpsDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register Lead Ingestion Service
builder.Services.AddScoped<ILeadService, LeadService>();

// Register Portal Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Register AI Chat Assistant Service
builder.Services.AddHttpClient<IChatService, ChatService>();

// Configure CORS for Angular local development
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDev", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

var app = builder.Build();

// Automatically create database schema and seed default users on startup
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<OrbitOpsDbContext>();
    context.Database.EnsureCreated();
    var authService = scope.ServiceProvider.GetRequiredService<IAuthService>();
    authService.InitializeDatabase();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Apply CORS Policy
app.UseCors("AllowAngularDev");

app.UseAuthorization();

app.MapControllers();

app.Run();

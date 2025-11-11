using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(opt => opt.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddScoped<TokenService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<AuditService>();



var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection.GetValue<string>("Key");

if (!string.IsNullOrWhiteSpace(jwtKey))
{
    var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(opts =>
        {
            opts.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSection["Issuer"],
                ValidAudience = jwtSection["Audience"],
                IssuerSigningKey = signingKey,
                ClockSkew = TimeSpan.Zero
            };
        });
}
else
{
    
    Console.WriteLine("WARNING: Jwt:Key missing. JWT authentication not configured.");
}

builder.Services.AddAuthorization();

const string AllowUi = "_allowUi";
builder.Services.AddCors(opt =>
{
    opt.AddPolicy(AllowUi, p => p
        .WithOrigins("http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod());
});


builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddScoped<AuditService>();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}


app.UseHttpsRedirection();

app.UseCors(AllowUi);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();


await SeedService.EnsureSeedAsync(app.Services);


app.Run();

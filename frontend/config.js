// ============================================================
//  Site configuration — edit this file to customize the portfolio.
//  For deployment: update API_BASE to your production API URL.
// ============================================================
const CONFIG = {
  // Your GitHub username — used to fetch repos tagged "portfolio"
  GITHUB_USERNAME: 'DemetrioQ',

  // Personal info
  NAME: 'Demetrio Quinones',
  TITLE: '.NET Backend Developer',
  TAGLINE: `Backend Software Engineer with 3 years of experience designing and maintaining enterprise backend
architectures and RESTful APIs for banking and fintech platforms. Strong background in C#, .NET
Framework, ASP.NET Web API, SQL Server, and JWT-based authentication. Proven ability to design
reusable backend modules, standardize authentication across services, centralize shared infrastructure, and
reduce service initialization latency`,

  // Contact links
  EMAIL: 'demetriorqe@gmail.com',
  GITHUB_URL: 'https://github.com/DemetrioQ',
  LINKEDIN_URL: 'https://www.linkedin.com/in/demetrio-quinones-068a4a1ba/',

  // Tech badges shown in the hero
  BADGES: ['ASP.NET', 'C#', 'Entity Framework', 'SQL Server', 'Redis', 'Azure'],

  // Terminal prompt user (shown as "user@host:~$")
  TERMINAL_USER: 'demetrio@portfolio',

  // Typing effect commands in the hero terminal
  TERMINAL_COMMANDS: [
    'dotnet new portfolio --name DemetrioQuinones',
    'git push origin main',
    'docker compose up --build',
    'dotnet run --project Portfolio.Api',
  ],
};

// ============================================================
//  Site configuration — edit this file to customize the portfolio.
//  NOTE: index.html mirrors these values directly (title, hero,
//  badges, contact, footer) to avoid a flash of empty content on
//  load. If you change NAME/TITLE/TAGLINE/BADGES/EMAIL/socials
//  here, update the matching text in index.html too.
// ============================================================
const CONFIG = {
  // Your GitHub username — used to fetch repos tagged "portfolio"
  GITHUB_USERNAME: 'DemetrioQ',

  // Personal info
  NAME: 'Demetrio Quinones',
  TITLE: '.NET Backend Developer',
  TAGLINE: `Backend Software Engineer with 4 years of experience specializing in C# / .NET, building
scalable APIs and microservices for banking and fintech platforms. Strong background in
ASP.NET Core, .NET Framework, ASP.NET Web API, SQL Server, Clean Architecture & CQRS, and
JWT-based authentication. Backend lead for a team of 4, with a track record of improving
performance, reliability, and maintainability.`,

  // Contact links
  EMAIL: 'demetriorqe@gmail.com',
  GITHUB_URL: 'https://github.com/DemetrioQ',
  LINKEDIN_URL: 'https://www.linkedin.com/in/demetrioquinones/',

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

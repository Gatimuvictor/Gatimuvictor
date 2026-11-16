// Fetches live data from the GitHub GraphQL API and writes the profile cards to generated/.
// Runs in GitHub Actions (see .github/workflows/profile-cards.yml).
//
// Env:
//   GH_TOKEN  token for the GitHub API. A personal access token (classic) with
//             read:user and repo scopes adds private repositories to the
//             language and repository counts. The default GITHUB_TOKEN works,
//             but sees public repositories only.
//   GH_USER   GitHub username (defaults to the repository owner in Actions).
import { mkdirSync, writeFileSync } from 'node:fs';
import { THEMES } from './theme.mjs';
import { statsCard, activityCard, languagesCard, computeStreaks } from './cards.mjs';

const TOKEN = process.env.GH_TOKEN;
const LOGIN = process.env.GH_USER || process.env.GITHUB_REPOSITORY_OWNER;
const MAX_LANGUAGES = 9;

if (!TOKEN || !LOGIN) {
  console.error('GH_TOKEN and GH_USER must be set.');
  process.exit(1);
}

async function gql(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'profile-cards',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(`GitHub API error: ${JSON.stringify(json.errors || json)}`);
  }
  return json.data;
}

const CALENDAR = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks { firstDay contributionDays { date contributionCount } }
        }
      }
    }
  }`;

const REPOS = `
  query($login: String!, $cursor: String) {
    user(login: $login) {
      name
      createdAt
      repositories(ownerAffiliations: OWNER, isFork: false, first: 100, after: $cursor) {
        totalCount
        pageInfo { hasNextPage endCursor }
        nodes {
          name
          isPrivate
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name color } }
          }
        }
      }
    }
  }`;

async function main() {
  // Repositories and languages (paginated)
  let cursor = null;
  let user = null;
  const repos = [];
  do {
    const data = await gql(REPOS, { login: LOGIN, cursor });
    user = data.user;
    if (!user) throw new Error(`User ${LOGIN} not found`);
    repos.push(...user.repositories.nodes);
    cursor = user.repositories.pageInfo.hasNextPage ? user.repositories.pageInfo.endCursor : null;
  } while (cursor);

  // Last 12 months, for the activity chart and yearly totals
  const now = new Date();
  const yearAgo = new Date(now);
  yearAgo.setUTCFullYear(now.getUTCFullYear() - 1);
  const recent = (await gql(CALENDAR, { login: LOGIN, from: yearAgo.toISOString(), to: now.toISOString() })).user
    .contributionsCollection.contributionCalendar;

  // All time, one calendar year per request, for streaks
  const allDays = new Map();
  const startYear = new Date(user.createdAt).getUTCFullYear();
  for (let y = startYear; y <= now.getUTCFullYear(); y++) {
    const from = new Date(Date.UTC(y, 0, 1));
    const to = y === now.getUTCFullYear() ? now : new Date(Date.UTC(y, 11, 31, 23, 59, 59));
    const cal = (await gql(CALENDAR, { login: LOGIN, from: from.toISOString(), to: to.toISOString() })).user
      .contributionsCollection.contributionCalendar;
    for (const w of cal.weeks) for (const day of w.contributionDays) allDays.set(day.date, day.contributionCount);
  }
  const days = [...allDays.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, count]) => ({ date, count }));
  const { current, longest } = computeStreaks(days);

  const recentDays = recent.weeks.flatMap((w) => w.contributionDays);
  const weeks = recent.weeks.map((w) => ({
    start: w.firstDay,
    total: w.contributionDays.reduce((s, x) => s + x.contributionCount, 0),
  }));

  // Languages by bytes, skipping this profile repository itself
  const langTotals = new Map();
  let languageRepoCount = 0;
  for (const repo of repos) {
    if (repo.name.toLowerCase() === LOGIN.toLowerCase()) continue;
    if (repo.languages.edges.length) languageRepoCount += 1;
    for (const { size, node } of repo.languages.edges) {
      const cur = langTotals.get(node.name) || { name: node.name, color: node.color, bytes: 0 };
      cur.bytes += size;
      langTotals.set(node.name, cur);
    }
  }
  let languages = [...langTotals.values()].sort((a, b) => b.bytes - a.bytes);
  if (languages.length > MAX_LANGUAGES) {
    const rest = languages.slice(MAX_LANGUAGES - 1);
    languages = [
      ...languages.slice(0, MAX_LANGUAGES - 1),
      { name: 'Other', color: null, bytes: rest.reduce((s, l) => s + l.bytes, 0) },
    ];
  }

  const data = {
    login: LOGIN,
    name: user.name || LOGIN,
    totalYear: recent.totalContributions,
    activeDays: recentDays.filter((x) => x.contributionCount > 0).length,
    currentStreak: current,
    longestStreak: longest,
    repoCount: user.repositories.totalCount,
    privateRepoCount: repos.filter((r) => r.isPrivate).length,
    weeks,
    languages,
    languageRepoCount,
  };

  mkdirSync('generated', { recursive: true });
  for (const t of Object.values(THEMES)) {
    writeFileSync(`generated/stats-${t.name}.svg`, statsCard(data, t));
    writeFileSync(`generated/activity-${t.name}.svg`, activityCard(data, t));
    writeFileSync(`generated/languages-${t.name}.svg`, languagesCard(data, t));
  }
  console.log(
    `Cards written for ${LOGIN}: ${data.totalYear} contributions, streak ${current.length}, ` +
      `${data.repoCount} repos (${data.privateRepoCount} private), ${languages.length} languages.`,
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

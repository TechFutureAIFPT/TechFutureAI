/**
 * skillGraph.ts — Skill Graph & Transferable Skills Detection
 *
 * Hiểu transferable skills — React ≈ Next.js ≈ Vue.js (cùng họ kỹ năng).
 * Tính tỷ lệ khớp kỹ năng dựa trên graph.
 */

export interface SkillMatchResult {
  matchedSkills: string[];
  unmatchedSkills: string[];
  transferMatches: string[];
  familyClusters: string[];
  matchRate: number;
  reasoning: string;
}

const SKILL_CLUSTERS: Record<string, string[]> = {
  'frontend-react': ['react', 'reactjs', 'nextjs', 'next.js', 'react native', 'redux', 'react query', 'tanstack query'],
  'frontend-vue': ['vue', 'vuejs', 'nuxt', 'nuxtjs', 'vuex', 'pinia'],
  'frontend-general': ['html', 'css', 'sass', 'scss', 'tailwind', 'bootstrap', 'tailwindcss', 'javascript', 'typescript', 'jquery'],
  'backend-node': ['node', 'nodejs', 'express', 'expressjs', 'nestjs', 'nest.js', 'koa', 'fastify'],
  'backend-python': ['python', 'django', 'flask', 'fastapi', 'fastapi', 'pyramid'],
  'backend-java': ['java', 'spring', 'springboot', 'spring boot', 'springboot', 'spring cloud'],
  'backend-go': ['golang', 'go', 'go-lang'],
  'backend-dotnet': ['c#', 'csharp', '.net', 'dotnet', 'asp.net', 'aspnetcore'],
  'database': ['sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'mariadb', 'oracle db', 'mssql', 'dynamodb', 'cassandra', 'sqlite', 'graphql'],
  'devops': ['docker', 'kubernetes', 'k8s', 'aws', 'gcp', 'azure', 'ci/cd', 'jenkins', 'gitlab ci', 'github actions', 'terraform', 'ansible', 'prometheus', 'grafana'],
  'mobile': ['flutter', 'react native', 'swift', 'kotlin', 'android', 'ios', 'xamarin', 'ionic'],
  'ai-ml': ['machine learning', 'tensorflow', 'pytorch', 'scikit-learn', 'nlp', 'computer vision', 'deep learning', 'data science', 'statistics', 'r programming', 'keras', 'pandas', 'numpy'],
  'data': ['data analysis', 'tableau', 'power bi', 'excel', 'powerbi', 'looker', 'qlik'],
  'pm': ['scrum', 'agile', 'kanban', 'jira', 'project management', 'confluence', 'asana'],
  'design': ['figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'ui/ux', 'ui design', 'ux design', 'user research'],
  'security': ['cybersecurity', 'penetration testing', 'owasp', 'iso 27001', 'ssl', 'oauth', 'jwt'],
};

const SKILL_KEYWORDS = Object.values(SKILL_CLUSTERS).flat();

export function scoreSkillMatch(jdSkills: string[], candidateSkills: string[]): SkillMatchResult {
  const jdSet = new Set(jdSkills.map(s => s.toLowerCase()));
  const candSet = new Set(candidateSkills.map(s => s.toLowerCase()));
  const matched: string[] = [];
  const unmatched: string[] = [];
  const transferMatches: string[] = [];

  for (const jdSkill of jdSkills) {
    const jdLower = jdSkill.toLowerCase();
    if (candSet.has(jdLower)) {
      matched.push(jdSkill);
    } else {
      const cluster = Object.entries(SKILL_CLUSTERS).find(([, members]) => members.some(m => jdLower.includes(m) || m.includes(jdLower)));
      if (cluster) {
        const clusterSet = new Set(cluster[1].map(m => m.toLowerCase()));
        const found = candidateSkills.find(cs => clusterSet.has(cs.toLowerCase()));
        if (found) {
          transferMatches.push(`${jdSkill} → ${found} (cùng họ: ${cluster[0]})`);
          matched.push(jdSkill);
        } else {
          unmatched.push(jdSkill);
        }
      } else {
        unmatched.push(jdSkill);
      }
    }
  }

  const total = jdSkills.length || 1;
  const matchRate = Math.round(((matched.length + transferMatches.length) / total) * 100);
  const reasoning = matched.length > 0 || transferMatches.length > 0
    ? `Khớp trực tiếp: ${matched.length}/${jdSkills.length} skills. Chuyển đổi: ${transferMatches.length} skills (cùng họ). Tổng: ${matchRate}%.`
    : 'Không tìm thấy kỹ năng khớp.';

  return {
    matchedSkills: matched,
    unmatchedSkills: unmatched,
    transferMatches,
    familyClusters: [...new Set(transferMatches.map(t => {
      const cluster = Object.entries(SKILL_CLUSTERS).find(([, members]) => transferMatches.some(m => m.includes(members[0])));
      return cluster ? cluster[0] : '';
    })).values()].filter(Boolean),
    matchRate,
    reasoning,
  };
}

export { SKILL_KEYWORDS, SKILL_CLUSTERS };

const fs = require('fs');
const path = require('path');

const skillsDir = '/Users/ramajjohnson/TTE/src/lib/os/skills';
const POL_MAPPING = {
  'brand-infrastructure-builder': 'Tool (Proprietary Mechanism)',
  'rag-architect': 'Tool (Theory of Value)',
  'frontend-design': 'Expression (Immutable UI Physics)',
  'brainstorming': 'Identity (MVA & Resonance)',
  'compound-learning': 'Identity (MVA & Resonance)',
  'sovereign-asset-generator': 'Meaning (Enterprise Readiness)',
  'quality-gates': 'Governance (Autopoiesis)',
  'agent-designer': 'Governance (Autopoiesis)',
  'subagent-driven-development': 'Governance (Autopoiesis)',
  'playwright-pro': 'Governance (Autopoiesis)',
};

const folders = fs.readdirSync(skillsDir);
for (const folder of folders) {
  const stat = fs.statSync(path.join(skillsDir, folder));
  if (stat.isDirectory()) {
    const skillPath = path.join(skillsDir, folder, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
      let content = fs.readFileSync(skillPath, 'utf8');
      
      const category = POL_MAPPING[folder] || 'Uncategorized';
      
      if (content.match(/^category:.*$/m)) {
        content = content.replace(/^category:.*$/m, `category: "${category}"`);
      } else {
        const lines = content.split('\n');
        let inFrontmatter = false;
        let inserted = false;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim() === '---') {
            if (!inFrontmatter) {
              inFrontmatter = true;
            } else {
              lines.splice(i, 0, `category: "${category}"`);
              inserted = true;
              break;
            }
          }
        }
        
        if (inserted) {
          content = lines.join('\n');
        }
      }
      
      fs.writeFileSync(skillPath, content, 'utf8');
      console.log('Updated ' + folder + ' -> ' + category);
    }
  }
}

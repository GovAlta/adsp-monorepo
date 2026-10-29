import { ComponentReview, SpecialistChat, Solution } from './model';
import { HARNESS_TEMPLATE } from './harnessTemplate';

export const fmtDate = (date: string | Date): string => new Date(date).toLocaleString();

export const safeName = (solution: { name: string }): string =>
  solution.name
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'solution';

export function download(filename: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const bulletLines = (title: string, items?: string[]): string[] =>
  items?.length ? ['', `**${title}**`, '', ...items.map((item) => `- ${item}`)] : [];

const sentence = (text: string): string => {
  const trimmed = text.trim();
  return trimmed && !trimmed.endsWith('.') ? `${trimmed}.` : trimmed;
};

// Keeps AI text on one table row: escapes backslashes and pipes, and folds line breaks.
const tableCell = (text: string): string =>
  text.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');

// Indents past the item number so two-digit items keep their details and the list keeps counting.
const detailBullet = (order: number): string => `${' '.repeat(`${order}. `.length)}- `;

export const REVIEW_LABELS: Record<ComponentReview, string> = {
  'not-reviewed': 'Not reviewed',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function chatToMarkdown(chat: SpecialistChat): string {
  const out = [
    `## ${chat.title}`,
    '',
    `Specialist: ${chat.service} · Started ${fmtDate(chat.createdOn)} · Last updated ${fmtDate(chat.updatedOn)}`,
  ];
  for (const m of chat.messages) {
    out.push(
      '',
      m.role === 'user'
        ? `### You (${fmtDate(m.at)})`
        : `### ${chat.service} (${fmtDate(m.at)}${m.mode === 'rules' ? ', rule-based' : ''})`,
      '',
      m.content,
    );
    if (m.consult) {
      out.push(
        `Fit: ${m.consult.fit}`,
        ...bulletLines('Can support', m.consult.supports),
        ...bulletLines('Constraints', m.consult.constraints),
        ...bulletLines('Risks', m.consult.risks),
      );
    }
    if (m.validation) {
      out.push('', `**Verdict:** ${m.validation.verdict}`, ...bulletLines('Findings', m.validation.findings));
    }
    out.push(...bulletLines('Recommendations', m.suggestions));
    for (const s of m.samples || []) {
      out.push('', `**${s.title || 'Sample'}**`, '', '```' + s.language, s.code, '```');
    }
  }
  return out.join('\n') + '\n';
}

const versionLabel = (solution: Solution) =>
  `${solution.version}${solution.unsavedChanges ? ' (unsaved changes)' : ''}`;

export function solutionToMarkdown(solution: Solution): string {
  const st = solution.state;
  const changedSections = solution.changedSections ?? [];
  const lines: string[] = [
    `# ${solution.name}`,
    '',
    `Status: ${solution.status} · Exported ${new Date().toLocaleString()}`,
    '',
    `solution-version: ${versionLabel(solution)}`,
    `last-updated: ${fmtDate(solution.lastUpdated ?? solution.updatedOn)}`,
    '',
    "## What's changed",
    '',
    ...(solution.initial
      ? ['Initial version.']
      : changedSections.length
        ? changedSections.map((s) => `- ${s}`)
        : ['No changes since the previous version.']),
    '',
    ...(solution.blueprintOutOfDate ? ['> **Blueprint may be out of date. Regenerate it.**', ''] : []),
    '## Problem statement',
    '',
    st.problemStatement || '_None_',
    '',
  ];
  if (st.analysis) {
    lines.push(
      `_Analysis: ${st.analysis.mode === 'ai' ? 'AI' : 'rule-based'}${st.analysis.warning ? ` — ${st.analysis.warning}` : ''}_`,
      '',
    );
  }
  if (st.discovery?.messages?.length) {
    lines.push(
      '## Discovery conversation',
      '',
      ...st.discovery.messages.map(
        (m) => `- **${m.role === 'user' ? 'You' : 'Planner'}:** ${m.content.replace(/\n+/g, ' ')}`,
      ),
      '',
    );
  }
  const chosen = st.hypotheses[0];
  if (chosen) {
    lines.push('## Chosen approach', '', `### ${chosen.title}`, '', chosen.rationale, '', '**Recommended services (in order)**', '');
    [...chosen.recommendations]
      .sort((a, b) => a.order - b.order)
      .forEach((r) => lines.push(`${r.order}. **${r.service}** — ${r.reason}`));
    if (chosen.assumptions.length) lines.push('', '**Assumptions**', '', ...chosen.assumptions.map((a) => `- ${a}`));
    if (chosen.unknowns.length) lines.push('', '**Unknowns**', '', ...chosen.unknowns.map((a) => `- ${a}`));
    lines.push('');
  }
  lines.push('## Concepts', '');
  st.concepts.forEach((c) => lines.push(`- ${c.type}: ${c.name}`));
  lines.push('', '## Questions and answers', '');
  st.questions.forEach((q) =>
    lines.push(`- **${q.question}** (${q.status})${q.answer ? `\n  - Answer: ${q.answer}` : ''}`),
  );
  if (st.decisions?.length) {
    lines.push(
      '',
      '## Recorded decisions',
      '',
      ...st.decisions.map((d) => `- **${d.title}**: ${sentence(d.decision)}${d.reason ? ` _Why:_ ${d.reason}` : ''}`),
    );
  }
  lines.push('', '## Next steps', '');
  st.nextSteps.forEach((n) => lines.push(`- **${n.title}** — ${n.reason}`));
  if (st.conversation?.length) {
    lines.push('', '## Conversation', '');
    st.conversation.forEach((m) => lines.push(`- **${m.role === 'user' ? 'You' : 'Planner'}:** ${m.content}`));
  }

  const bp = st.blueprint;
  if (bp) {
    const bullets = (title: string, items?: string[]) => {
      if (items?.length) lines.push('', `**${title}**`, '', ...items.map((i) => `- ${i}`));
    };
    lines.push(
      '',
      '# Project blueprint',
      '',
      `_Generated ${bp.generatedOn} (${bp.mode === 'ai' ? 'AI' : 'rule-based'})_`,
      '',
      `## 1. ${bp.overview.title}`,
      '',
      bp.overview.summary,
    );
    bullets('Objectives', bp.overview.objectives);
    bullets('Scope', bp.overview.scope);
    bullets('Out of scope', bp.overview.outOfScope);
    bullets('Stakeholders', bp.overview.stakeholders);
    if (bp.overview.roles?.length) {
      lines.push(
        '',
        '**Roles**',
        '',
        '| Actor | App role | GoA product type |',
        '|---|---|---|',
        ...bp.overview.roles.map(
          (r) => `| ${tableCell(r.actor)} | ${tableCell(r.appRole) || '_Open_'} | ${r.productType || '_Open_'} |`,
        ),
      );
    }
    bullets('Success measures', bp.overview.successMeasures);
    bullets('Key risks', bp.overview.risks);
    lines.push(
      '',
      '## 2. Technical architecture',
      '',
      bp.architecture.summary,
      '',
      ...bp.architecture.layers.map((l) => `- **${l.name}** — ${l.description} (${l.components.join(', ')})`),
      '',
      '```',
      bp.architecture.diagram,
      '```',
    );
    bullets('Integrations', bp.architecture.integrations);
    bullets('Security', bp.architecture.security);
    lines.push(
      '',
      '## 3. ADSP service mapping',
      '',
      ...bp.serviceMapping.flatMap((s) => [
        `${s.order}. **${s.service}** — ${sentence(s.role)} _Why:_ ${s.reason}${s.dependsOn.length ? ` _Depends on:_ ${s.dependsOn.join(', ')}` : ''}`,
        ...s.capabilities.map((c) => `${detailBullet(s.order)}${c}`),
      ]),
    );
    if (bp.notCoveredByAdsp !== undefined) {
      lines.push('', '## 4. Not covered by ADSP', '');
      if (bp.notCoveredByAdsp.length === 0) {
        lines.push('_All requirements map to ADSP services._');
      } else {
        bp.notCoveredByAdsp.forEach((n) =>
          lines.push(`- **${n.requirement}** — ${n.reason} _Suggested approach:_ ${n.suggestedApproach}`),
        );
      }
    }
    lines.push(
      '',
      '## 5. Components to set up',
      '',
      ...(bp.components ?? []).filter((c) => c.review !== 'rejected').flatMap((c) => {
        const detail = detailBullet(c.order);
        return [
          `${c.order}. **${c.name}** (${c.type}, ${c.service}): ${REVIEW_LABELS[c.review ?? 'not-reviewed']}. ${c.purpose}${c.dependsOn.length ? ` _Depends on:_ ${c.dependsOn.join(', ')}` : ''}`,
          `${detail}Where: ${c.setup.where}`,
          `${detail}How: ${c.setup.how}`,
          `${detail}Docs: ${c.setup.docs}`,
          ...c.openDecisions.map((d) => `${detail}Open decision: ${d}`),
        ];
      }),
    );
    lines.push('', '## 6. Specialist consultation notes');
    bp.specialistNotes.forEach((n) => {
      lines.push('', `### ${n.displayName} (${n.fit}, ${n.source})`, '', n.summary);
      bullets('Can support', n.supports);
      bullets('Constraints', n.constraints);
      bullets('Questions to resolve', n.questions);
      bullets('Risks', n.risks);
      if (n.validation) bullets(`Validation: ${n.validation.verdict}`, n.validation.findings);
      bullets('From saved chats', n.chatHighlights);
    });
    lines.push('', '## 7. Core workflows');
    bp.workflows.forEach((w) =>
      lines.push(
        '',
        `### ${w.name}`,
        '',
        ...(w.actors.length ? [`Actors: ${w.actors.join(', ')}`, ''] : []),
        ...w.steps.map((s, i) => `${i + 1}. ${s}`),
      ),
    );
    lines.push('', '## 8. Data & governance');
    const g = bp.dataGovernance;
    bullets('Data entities', g.dataEntities);
    bullets('Access control', g.accessControl);
    bullets('Retention', g.retention);
    bullets('Privacy', g.privacy);
    bullets('Audit', g.audit);
    bullets('Compliance', g.compliance);
    lines.push('', '## 9. Delivery plan & other considerations');
    bp.delivery.phases.forEach((p) => bullets(p.name, p.items));
    bullets('Non-functional requirements', bp.delivery.nonFunctional);
    bullets('Open questions', bp.delivery.openQuestions);
  }
  return lines.join('\n') + '\n';
}

export function harnessToMarkdown(solution: Solution, file = `planner-${safeName(solution)}`): string {
  const components = (solution.state.blueprint?.components ?? []).filter((c) => c.review !== 'rejected');
  const componentList = components.length
    ? components
        .map((c) => `${c.order}. **${c.name}** (${c.type}, ${c.service}): ${REVIEW_LABELS[c.review ?? 'not-reviewed']}`)
        .join('\n')
    : '_No components._';
  const values: Record<string, string> = {
    name: solution.name,
    slug: safeName(solution),
    file,
    n: versionLabel(solution),
    'component list': componentList,
  };
  return HARNESS_TEMPLATE.replace(/\{(name|slug|file|n|component list)\}/g, (_, key: string) => values[key]);
}

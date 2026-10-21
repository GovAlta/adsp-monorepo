import { SpecialistChat, Solution } from './model';

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

// Appends a period only when the text doesn't already end with one, so sentences don't double up.
const sentence = (text: string): string => (text.endsWith('.') ? text : `${text}.`);

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

export function solutionToMarkdown(solution: Solution): string {
  const st = solution.state;
  const latestChange = solution.versionHistory[solution.versionHistory.length - 1];
  const changedSections = solution.changedSections ?? latestChange?.changedSections ?? [];
  const lastUpdated = solution.lastUpdated ?? latestChange?.changedAt ?? solution.updatedOn;
  const lines: string[] = [
    `# ${solution.name}`,
    '',
    `Status: ${solution.status} · Exported ${new Date().toLocaleString()}`,
    '',
    `solution-version: ${solution.version}`,
    `last-updated: ${fmtDate(lastUpdated)}`,
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
  if (st.confidence) {
    lines.push(
      `## Confidence: ${st.confidence.score}% (threshold ${st.confidence.threshold}%)`,
      '',
      ...st.confidence.factors.map((f) => `- ${f.label}: ${f.score}%${f.note ? ` — ${f.note}` : ''}`),
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
  lines.push('## Pattern matches', '');
  (st.patternMatches || []).forEach((m) =>
    lines.push(`- **${m.patternName}** — ${m.level} (score ${m.score}). ${m.explanation}`),
  );
  lines.push('', '## Hypotheses', '');
  st.hypotheses.forEach((h) => {
    lines.push(
      `### ${h.title} (${h.confidence} confidence)`,
      '',
      h.rationale,
      '',
      '**Recommended services (in order)**',
      '',
    );
    [...h.recommendations]
      .sort((a, b) => a.order - b.order)
      .forEach((r) => lines.push(`${r.order}. **${r.service}** — ${r.reason}`));
    if (h.assumptions.length) lines.push('', '**Assumptions**', '', ...h.assumptions.map((a) => `- ${a}`));
    if (h.unknowns.length) lines.push('', '**Unknowns**', '', ...h.unknowns.map((a) => `- ${a}`));
    lines.push('');
  });
  lines.push('## Concepts', '');
  st.concepts.forEach((c) => lines.push(`- ${c.type}: ${c.name}`));
  lines.push('', '## Questions and answers', '');
  st.questions.forEach((q) =>
    lines.push(`- **${q.question}** (${q.status})${q.answer ? `\n  - Answer: ${q.answer}` : ''}`),
  );
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
    let sectionNumber = 1;
    const heading = (title: string) => `## ${sectionNumber++}. ${title}`;
    lines.push(
      '',
      '# Project blueprint',
      '',
      `_Generated ${bp.generatedOn} (${bp.mode === 'ai' ? 'AI' : 'rule-based'})_`,
      '',
      heading(bp.overview.title),
      '',
      bp.overview.summary,
    );
    bullets('Objectives', bp.overview.objectives);
    bullets('Scope', bp.overview.scope);
    bullets('Out of scope', bp.overview.outOfScope);
    bullets('Stakeholders', bp.overview.stakeholders);
    bullets('Success measures', bp.overview.successMeasures);
    bullets('Key risks', bp.overview.risks);
    lines.push(
      '',
      heading('Technical architecture'),
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
      heading('ADSP service mapping'),
      '',
      ...bp.serviceMapping.map(
        (s) =>
          `${s.order}. **${s.service}** — ${sentence(s.role)} _Why:_ ${s.reason}${s.dependsOn.length ? ` _Depends on:_ ${s.dependsOn.join(', ')}` : ''}`,
      ),
    );
    if (bp.notCoveredByAdsp !== undefined) {
      lines.push('', heading('Not covered by ADSP'), '');
      if (bp.notCoveredByAdsp.length) {
        bp.notCoveredByAdsp.forEach((n) =>
          lines.push(`- **${n.requirement}** — ${sentence(n.reason)} _Suggested approach:_ ${n.suggestedApproach}`),
        );
      } else {
        lines.push('_All requirements map to ADSP services._');
      }
    }
    lines.push('', heading('Specialist consultation notes'));
    bp.specialistNotes.forEach((n) => {
      lines.push('', `### ${n.displayName} (${n.fit}, ${n.source})`, '', n.summary);
      bullets('Can support', n.supports);
      bullets('Constraints', n.constraints);
      bullets('Questions to resolve', n.questions);
      bullets('Risks', n.risks);
      if (n.validation) bullets(`Validation: ${n.validation.verdict}`, n.validation.findings);
      bullets('From the chat history', n.chatHighlights);
    });
    lines.push('', heading('Core workflows'));
    bp.workflows.forEach((w) =>
      lines.push(
        '',
        `### ${w.name}`,
        '',
        ...(w.actors.length ? [`Actors: ${w.actors.join(', ')}`, ''] : []),
        ...w.steps.map((s, i) => `${i + 1}. ${s}`),
      ),
    );
    lines.push('', heading('Data & governance'));
    const g = bp.dataGovernance;
    bullets('Data entities', g.dataEntities);
    bullets('Access control', g.accessControl);
    bullets('Retention', g.retention);
    bullets('Privacy', g.privacy);
    bullets('Audit', g.audit);
    bullets('Compliance', g.compliance);
    lines.push('', heading('Delivery plan & other considerations'));
    bp.delivery.phases.forEach((p) => bullets(p.name, p.items));
    bullets('Non-functional requirements', bp.delivery.nonFunctional);
    bullets('Open questions', bp.delivery.openQuestions);
  }
  return lines.join('\n') + '\n';
}

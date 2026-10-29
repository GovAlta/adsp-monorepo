export function htmlReport(violations, logToConsole = false, reportName) {
  const axeHtmlReporterOptions = {
    outputDirPath: '../../dist/cypress/apps/audit-service-e2e',
    outputDir: 'axe-reports',
    reportFileName: reportName + '.html',
  };
  cy.task('htmlReport', { violations, axeHtmlReporterOptions });

  if (logToConsole) {
    cy.task(
      'log',
      `\nProcessing Acccessibility (Axe)\n${violations.length} accessibility violation${violations.length === 1 ? '' : 's'} ${violations.length === 1 ? 'was' : 'were'} detected`
    );
    const violationData = violations.map(({ id, impact, description, nodes }) => ({ id, impact, description, nodes: nodes.length }));
    cy.task('table', violationData);
  }
}

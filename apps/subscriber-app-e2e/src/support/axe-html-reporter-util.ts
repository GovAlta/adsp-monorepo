// function to generate the axe-html-report
export function htmlReport(violations, logToConsole = false, reportName) {
  // write the report to filesystem
  const axeHtmlReporterOptions = {
    outputDirPath: '../../dist/cypress/apps/subscriber-app-e2e', // output directory base path
    outputDir: 'axe-reports', // directory for the report output files
    reportFileName: reportName + '.html', // name of the report file
  };
  cy.task('htmlReport', { violations, axeHtmlReporterOptions });

  // log report to console
  if (logToConsole) {
    cy.task(
      'log',
      `\nProcessing Acccessibility (Axe)\n${violations.length} accessibility violation${
        violations.length === 1 ? '' : 's'
      } ${violations.length === 1 ? 'was' : 'were'} detected`
    );
    // pluck specific keys to keep the table readable
    const violationData = violations.map(({ id, impact, description, nodes }) => ({
      id,
      impact,
      description,
      nodes: nodes.length,
    }));

    cy.task('table', violationData);
  }
}

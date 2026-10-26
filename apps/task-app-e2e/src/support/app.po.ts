export const injectAxe = (): void => {
  cy.readFile('../../node_modules/axe-core/axe.min.js').then((source) => {
    return cy.window({ log: false }).then((window) => {
      window.eval(source);
    });
  });
};

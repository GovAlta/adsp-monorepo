class TaskAppPage {
  // Public landing page selectors
  landingPageHeading() {
    return cy.get('h1');
  }

  // Keycloak login form selectors
  loginButton() {
    return cy.get('#kc-login');
  }

  usernameField() {
    return cy.get('[name=username]');
  }

  passwordField() {
    return cy.get('[name=password]');
  }

  // Authenticated app header (GoA app header with service name)
  appHeader() {
    return cy.get('goa-app-header');
  }

  // Task queues list — the QueuesHeader renders a heading and QueueList renders queue items
  queuesPageHeading() {
    return cy.xpath('//main//h2 | //main//h1 | //*[@heading]').first();
  }

  // Queue list items — each queue renders as a clickable row/card
  firstQueueLink() {
    return cy.xpath('//main//*[@role="button" or @role="link" or self::a or self::button][1]').first();
  }

  // Task queue detail — TaskHeader shows the queue name as a heading
  taskQueueDetailHeading() {
    return cy.get('h2').first();
  }
}

export default TaskAppPage;

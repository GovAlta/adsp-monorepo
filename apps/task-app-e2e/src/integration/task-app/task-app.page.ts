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

  firstQueueOpenButton() {
    return cy.xpath('//goa-icon-button[@title="Open"]').first();
  }

  // Task queue detail — match the stable breadcrumb prefix; the queue name is dynamic.
  tasksQueueBreadcrumb() {
    return cy.xpath("//a[normalize-space(.)='Queues']/parent::span");
  }
}

export default TaskAppPage;

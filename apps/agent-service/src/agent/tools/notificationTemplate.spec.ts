import type { ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import type { Logger } from 'winston';
import {
  createNotificationTemplateTools,
  describeProposalOutput,
  isSavedProposalOutput,
  NOTIFICATION_PROPOSAL_TOOL,
} from './notificationTemplate';

describe('describeProposalOutput', () => {
  it('names the saved fields without repeating their content', () => {
    // Act
    const output = describeProposalOutput({ subject: 'Form received', body: '<p>Long body</p>', saved: true });

    // Assert
    expect(output).toEqual({ type: 'text', value: 'Saved and applied in the editor: subject, body.' });
  });

  it('gives the reason a proposal was not saved', () => {
    // Act
    const output = describeProposalOutput({ title: 'Form received', saved: false, reason: 'Event not found.' });

    // Assert
    expect(output.value).toBe(
      'Not saved: Event not found. The proposal (title) is in the editor, but the template is not stored.',
    );
  });

  it('passes anything else on as JSON so the model can correct its call', () => {
    // Arrange
    const validationError = { error: true, message: 'Expected string, received number' };

    // Act
    const output = describeProposalOutput(validationError);

    // Assert
    expect(output).toEqual({ type: 'text', value: JSON.stringify(validationError) });
  });
});

describe('isSavedProposalOutput', () => {
  it('recognises a saved proposal as the tool returns it and as the model sees it', () => {
    expect(isSavedProposalOutput({ body: '<p/>', saved: true })).toBe(true);
    expect(isSavedProposalOutput(describeProposalOutput({ body: '<p/>', saved: true }))).toBe(true);
    expect(isSavedProposalOutput({ type: 'json', value: { body: '<p/>', saved: true } })).toBe(true);
  });

  it('rejects proposals that were not saved and other values', () => {
    expect(isSavedProposalOutput({ body: '<p/>', saved: false })).toBe(false);
    expect(isSavedProposalOutput(describeProposalOutput({ body: '<p/>', saved: false, reason: 'x' }))).toBe(false);
    expect(isSavedProposalOutput({ type: 'text', value: 'Hello' })).toBe(false);
    expect(isSavedProposalOutput(undefined)).toBe(false);
  });
});

describe('createNotificationTemplateTools', () => {
  it('gives the model the short description of its result', async () => {
    // Arrange
    const directory = {
      getServiceUrl: jest.fn().mockResolvedValue(new URL('https://configuration-service/configuration/v2/')),
    } as unknown as ServiceDirectory;
    const tokenProvider = { getAccessToken: jest.fn() } as unknown as TokenProvider;
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;

    // Act
    const { emailNotificationGenerateTool } = await createNotificationTemplateTools({
      directory,
      tokenProvider,
      logger,
    });

    // Assert
    expect(NOTIFICATION_PROPOSAL_TOOL).toBe('emailNotificationGenerateTool');
    expect(emailNotificationGenerateTool.toModelOutput).toBe(describeProposalOutput);
  });
});

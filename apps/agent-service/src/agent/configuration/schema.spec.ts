import { AjvValidationService } from '@core-services/core-common';
import { Logger } from 'winston';
import { configurationSchema } from './schema';

describe('configuration', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  it('is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('configuration', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'configuration', configurationSchema);
  });

  describe('outputSchema validation', () => {
    const service = new AjvValidationService(logger as unknown as Logger);

    beforeAll(() => {
      service.setSchema('configuration', configurationSchema);
    });

    it('accepts null outputSchema', () => {
      const config = {
        'test-agent': {
          name: 'Test Agent',
          instructions: 'Test instructions',
          outputSchema: null,
        },
      };
      expect(() => service.validate('test', 'configuration', config)).not.toThrow();
    });

    it('accepts valid JSON Schema object as outputSchema', () => {
      const config = {
        'test-agent': {
          name: 'Test Agent',
          instructions: 'Test instructions',
          outputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'number' },
            },
            required: ['name'],
          },
        },
      };
      expect(() => service.validate('test', 'configuration', config)).not.toThrow();
    });

    it('accepts complex JSON Schema with nested properties', () => {
      const config = {
        'test-agent': {
          name: 'Test Agent',
          instructions: 'Test instructions',
          outputSchema: {
            type: 'object',
            properties: {
              result: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['success', 'error'] },
                  data: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
      };
      expect(() => service.validate('test', 'configuration', config)).not.toThrow();
    });

    it('allows agent configuration without outputSchema', () => {
      const config = {
        'test-agent': {
          name: 'Test Agent',
          instructions: 'Test instructions',
        },
      };
      expect(() => service.validate('test', 'configuration', config)).not.toThrow();
    });

    it('accepts workspace configuration when enabled', () => {
      const config = {
        'test-agent': {
          name: 'Test Agent',
          instructions: 'Test instructions',
          workspace: {
            enabled: true,
          },
        },
      };

      expect(() => service.validate('test', 'configuration', config)).not.toThrow();
    });

    it('accepts workspace configuration when disabled', () => {
      const config = {
        'test-agent': {
          name: 'Test Agent',
          instructions: 'Test instructions',
          workspace: {
            enabled: false,
          },
        },
      };

      expect(() => service.validate('test', 'configuration', config)).not.toThrow();
    });

    it('rejects workspace configuration with unexpected properties', () => {
      const config = {
        'test-agent': {
          name: 'Test Agent',
          instructions: 'Test instructions',
          workspace: {
            enabled: true,
            scope: 'session-private',
          },
        },
      };

      expect(() => service.validate('test', 'configuration', config)).toThrow();
    });

    it('accepts MCP server configuration with capability filters', () => {
      const config = {
        'test-agent': {
          name: 'Test Agent',
          instructions: 'Test instructions',
          mcp: {
            servers: [
              {
                url: 'https://example.com/mcp',
                headers: {
                  Authorization: 'Bearer token',
                },
                capabilities: ['getComponent', 'searchTokens'],
              },
            ],
          },
        },
      };

      expect(() => service.validate('test', 'configuration', config)).not.toThrow();
    });

    it('rejects MCP server configuration with explicit id property', () => {
      const config = {
        'test-agent': {
          name: 'Test Agent',
          instructions: 'Test instructions',
          mcp: {
            servers: [
              {
                id: 'goa-design-system',
                url: 'https://example.com/mcp',
              },
            ],
          },
        },
      };

      expect(() => service.validate('test', 'configuration', config)).toThrow();
    });

    it('accepts MCP server configuration without explicit id', () => {
      const config = {
        'test-agent': {
          name: 'Test Agent',
          instructions: 'Test instructions',
          mcp: {
            servers: [
              {
                url: 'https://example.com/mcp',
                capabilities: ['getComponent'],
              },
            ],
          },
        },
      };

      expect(() => service.validate('test', 'configuration', config)).not.toThrow();
    });

    it('rejects MCP server configuration with unexpected properties', () => {
      const config = {
        'test-agent': {
          name: 'Test Agent',
          instructions: 'Test instructions',
          mcp: {
            servers: [
              {
                url: 'https://example.com/mcp',
                token: 'not-allowed',
              },
            ],
          },
        },
      };

      expect(() => service.validate('test', 'configuration', config)).toThrow();
    });

    it('accepts JSON Schema with additionalProperties and patternProperties', () => {
      const config = {
        'test-agent': {
          name: 'Test Agent',
          instructions: 'Test instructions',
          outputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            additionalProperties: { type: 'string' },
            patternProperties: {
              '^x-': { type: 'string' },
            },
          },
        },
      };
      expect(() => service.validate('test', 'configuration', config)).not.toThrow();
    });
  });
});

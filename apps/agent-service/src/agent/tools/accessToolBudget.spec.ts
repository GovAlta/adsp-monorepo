import z from 'zod';
import { createAccessClientCheckTools } from './accessClientChecks';
import { createAccessClientTools } from './accessClients';
import { createAccessDiscoveryTools } from './accessDiscovery';
import { createAccessRoleTools } from './accessRoles';
import { createAccessUserTools } from './accessUsers';
import { createTestDirectory, createTestLogger, DEV_HOST } from '../../test/accessToolTestSupport';

/**
 * Every model call carries the definitions of all Access tools, so their size is budgeted: about 10% above the
 * 9,260 characters of descriptions and input JSON schemas they took when the budget was set (down from 21,344).
 * Rules that apply to every tool belong in the supervisor prompt, not in each description.
 */
const ACCESS_TOOL_DEFINITION_BUDGET = 10_200;

const ACCESS_TOOL_IDS = [
  'listAccessEnvironments',
  'listAccessRealms',
  'getAccessRealmInfo',
  'listAccessClients',
  'getAccessClient',
  'checkAccessClientSetup',
  'checkAccessClientUrl',
  'previewAccessToken',
  'getAccessServiceAccount',
  'findAccessUser',
  'getAccessUserRoles',
  'getAccessUserSignInStatus',
  'checkAccessUserForService',
  'compareAccessUsers',
  'listAccessServiceRoles',
  'getAccessRole',
  'listAccessRoleMembers',
];

const props = {
  logger: createTestLogger() as never,
  directory: createTestDirectory() as never,
  accessServiceUrl: new URL(DEV_HOST),
};

const accessTools = {
  ...createAccessDiscoveryTools(props),
  ...createAccessClientTools(props),
  ...createAccessClientCheckTools(props),
  ...createAccessUserTools(props),
  ...createAccessRoleTools(props),
};

interface ToolDefinition {
  description: string;
  inputSchema?: unknown;
}

function definitionLength({ description, inputSchema }: ToolDefinition): number {
  return JSON.stringify({ description, inputSchema: z.toJSONSchema(inputSchema as z.ZodType) }).length;
}

describe('Access tool definitions', () => {
  it('builds all 17 Access tools', () => {
    const tools = accessTools;

    const ids = Object.values(tools).map((tool) => tool.id);

    expect(ids).toEqual(ACCESS_TOOL_IDS);
  });

  it('stay within the budget of characters every model call carries', () => {
    const tools: ToolDefinition[] = Object.values(accessTools);

    const total = tools.map(definitionLength).reduce((sum, length) => sum + length, 0);

    expect(total).toBeLessThanOrEqual(ACCESS_TOOL_DEFINITION_BUDGET);
  });

  it.each(ACCESS_TOOL_IDS)('gives the model a compact view of every %s result', (id) => {
    const tool: { toModelOutput?: unknown } = accessTools[id as keyof typeof accessTools];

    const { toModelOutput } = tool;

    expect(toModelOutput).toEqual(expect.any(Function));
  });
});

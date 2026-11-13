import { createTool } from '@mastra/core/tools';
import z from 'zod';
import { ACCESS_GUIDE_TOPIC_IDS, describeAccessGuideTopics, getAccessGuideSection } from '../agents/access/guide';

const guideOutputSchema = z.object({
  topic: z.enum(ACCESS_GUIDE_TOPIC_IDS),
  title: z.string(),
  markdown: z.string(),
});

/**
 * Documented Access Service guidance by topic. Static and AI-free, so it needs no Keycloak access.
 */
export function createAccessGuideTools() {
  const getAccessGuide = createTool({
    id: 'getAccessGuide',
    description:
      'Read documented ADSP Access Service guidance on one topic before answering a how-to or concept question. ' +
      `Topics: ${describeAccessGuideTopics()}.`,
    inputSchema: z.object({ topic: z.enum(ACCESS_GUIDE_TOPIC_IDS) }),
    outputSchema: guideOutputSchema,
    execute: async ({ topic }) => getAccessGuideSection(topic),
  });

  return { getAccessGuide };
}

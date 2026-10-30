import { CommentListResponse, CommentTopic, FindTopicCriteria, GetCommentsOptions, IConversationClient } from './types';

interface ConversationClientOptions {
  baseUrl: string;
  getAccessToken: () => Promise<string>;
}

class ConversationClient implements IConversationClient {
  constructor(
    private baseUrl: string,
    private getAccessToken: () => Promise<string>,
  ) {}

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async get<T>(url: string): Promise<T> {
    const response = await fetch(url, { headers: await this.getHeaders() });
    if (!response.ok) {
      throw new Error(`Conversation request failed (${response.status}).`);
    }

    return (await response.json()) as T;
  }

  public async findTopic(criteria: FindTopicCriteria): Promise<CommentTopic | null> {
    const url = new URL('/comment/v1/topics', this.baseUrl);
    url.searchParams.set('criteria', JSON.stringify(criteria));

    const data = await this.get<{ results?: CommentTopic[] }>(url.href);
    return data.results?.[0] || null;
  }

  public async getComments(topicId: number | string, options?: GetCommentsOptions): Promise<CommentListResponse> {
    const url = new URL(`/comment/v1/topics/${topicId}/comments`, this.baseUrl);
    url.searchParams.set('top', `${Math.max(1, options?.top ?? 10)}`);
    if (options?.after) {
      url.searchParams.set('after', options.after);
    }

    return await this.get<CommentListResponse>(url.href);
  }

  public async addComment(topicId: number | string, content: string): Promise<void> {
    const url = new URL(`/comment/v1/topics/${topicId}/comments`, this.baseUrl);
    const response = await fetch(url.href, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify({ content, requiresAttention: false }),
    });

    if (!response.ok) {
      throw new Error(`Unable to add comment (${response.status}).`);
    }
  }

  public async deleteComment(topicId: number | string, commentId: number | string): Promise<void> {
    const url = new URL(`/comment/v1/topics/${topicId}/comments/${commentId}`, this.baseUrl);
    const response = await fetch(url.href, {
      method: 'DELETE',
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Unable to delete comment (${response.status}).`);
    }
  }
}

export function createConversationClient(options: ConversationClientOptions): IConversationClient {
  return new ConversationClient(options.baseUrl, options.getAccessToken);
}

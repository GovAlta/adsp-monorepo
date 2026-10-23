import { CommentItem, ConversationMessage } from './types';

export function mapCommentToMessage(
  comment: CommentItem,
  currentUserId?: string,
  canDelete = true,
): ConversationMessage {
  const sentByCurrentUser = !!currentUserId && comment.createdBy?.id === currentUserId;

  return {
    id: comment.id,
    direction: sentByCurrentUser ? 'sent' : 'received',
    sender: comment.createdBy?.name || 'Commenter',
    timestamp: comment.createdOn,
    content: comment.content,
    canDelete: canDelete && sentByCurrentUser,
  };
}

export function mapCommentsToMessages(
  comments: CommentItem[],
  currentUserId?: string,
  canDelete = true,
): ConversationMessage[] {
  return comments.map((comment) => mapCommentToMessage(comment, currentUserId, canDelete));
}

export function mergeConversationMessages(
  existing: ConversationMessage[],
  incoming: ConversationMessage[],
): ConversationMessage[] {
  const merged = new Map<string, ConversationMessage>();

  existing.forEach((message) => merged.set(String(message.id), message));
  incoming.forEach((message) => merged.set(String(message.id), message));

  return Array.from(merged.values());
}

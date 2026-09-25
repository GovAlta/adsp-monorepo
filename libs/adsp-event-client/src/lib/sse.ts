export interface SseFrame {
  id?: string;
  event: string;
  data: string;
}

/**
 * Incremental parser for the text/event-stream format.
 *
 * Used with fetch instead of the native EventSource, since EventSource can't send an Authorization header.
 */
export class SseParser {
  private buffer = '';
  private data: string[] = [];
  private event = '';
  private id: string | undefined;

  /**
   * Parses a chunk of the stream.
   * @returns frames completed by the chunk.
   */
  push(chunk: string): SseFrame[] {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop();

    const frames: SseFrame[] = [];
    for (const rawLine of lines) {
      const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
      if (line === '') {
        if (this.data.length) {
          frames.push({ id: this.id, event: this.event || 'message', data: this.data.join('\n') });
        }
        this.data = [];
        this.event = '';
        this.id = undefined;
      } else if (!line.startsWith(':')) {
        this.processField(line);
      }
    }

    return frames;
  }

  private processField(line: string) {
    const separator = line.indexOf(':');
    const field = separator < 0 ? line : line.substring(0, separator);
    const value = separator < 0 ? '' : line.substring(separator + 1).replace(/^ /, '');

    switch (field) {
      case 'data':
        this.data.push(value);
        break;
      case 'event':
        this.event = value;
        break;
      case 'id':
        this.id = value;
        break;
    }
  }
}

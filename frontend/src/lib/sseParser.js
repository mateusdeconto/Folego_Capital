export class SSEParser {
  constructor() {
    this._buf = '';
  }

  /**
   * Feed a raw decoded string chunk.
   * Returns an array of complete `data:` payloads (prefix stripped, trimmed).
   * Incomplete lines stay buffered until the next feed() call.
   */
  feed(chunk) {
    this._buf += chunk;
    const lines = this._buf.split('\n');
    // Last element may be an incomplete line — keep it in the buffer.
    this._buf = lines.pop() ?? '';
    return lines
      .filter(l => l.startsWith('data: '))
      .map(l => l.slice(6).trim());
  }
}

/**
 * Astro Blog「试验田 Lab」沙盒 postMessage 安全解析与规范化器
 */
import {
  type SandboxToHostMessage,
  verifySandboxMessage,
} from '../lab-sandbox-protocol';

export interface ParseMessageOptions {
  expectedSource: Window | null;
  expectedSessionId: string;
  strictOrigins?: string[];
  allowedOrigins?: string[];
  allowBridgeInitSession?: boolean;
}

export interface ParseMessageResult {
  valid: boolean;
  message?: SandboxToHostMessage;
  reason?: string;
}

export class SandboxMessageParser {
  /**
   * 严格解析并规范化来自沙盒的 postMessage 事件
   */
  static parse(event: MessageEvent, options: ParseMessageOptions): ParseMessageResult {
    return verifySandboxMessage(event, options);
  }
}

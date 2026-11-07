(function () {
  'use strict';
  var PROTOCOL = 'LAB_SANDBOX_PROTOCOL_V1';
  var MAX_SRCDOC_CHARS = 384 * 1024;
  var MAX_FORWARDED_MESSAGES = 360;
  var MAX_MESSAGE_BYTES = 64 * 1024; // 64 KB
  var MAX_CONSOLE_ARGS = 12;
  var MAX_STRING_LENGTH = 2048;

  var activeHostOrigin = null;
  var activeSessionId = null;
  var forwardedCount = 0;
  var mountEl = document.getElementById('frame-mount');
  var innerFrame = document.getElementById('inner-runner');

  var ALLOWED_INNER_MESSAGE_TYPES = {
    'SANDBOX_READY': true,
    'CONSOLE_EVENT': true,
    'RUNTIME_ERROR': true,
    'EXECUTION_COMPLETE': true,
    'EXECUTION_ABORTED': true,
    'HEARTBEAT': true
  };

  var ALLOWED_CONSOLE_LEVELS = {
    'log': true,
    'info': true,
    'warn': true,
    'error': true
  };

  function isStagingSandboxRuntime() {
    var envAttr = document.documentElement.getAttribute('data-sandbox-env');
    var hostName = window.location.hostname;
    return (
      envAttr === 'staging' &&
      (hostName === 'epocanvas-lab-sandbox-staging.pages.dev' ||
        /^[a-z0-9-]+\.epocanvas-lab-sandbox-staging\.pages\.dev$/.test(hostName))
    );
  }

  function isAllowedHostOrigin(origin) {
    if (typeof origin !== 'string' || !origin) return false;
    if (origin === window.location.origin) return false;
    if (window.location.protocol === 'https:') {
      if (origin === 'https://blog.epocanvas.com') {
        return true;
      }
      if (isStagingSandboxRuntime()) {
        return (
          origin === 'https://shijianus-blog.pages.dev' ||
          /^https:\/\/[a-z0-9-]+\.shijianus-blog\.pages\.dev$/.test(origin)
        );
      }
      return false;
    }
    var hostName = window.location.hostname;
    if (window.location.protocol === 'http:' && (hostName === 'localhost' || hostName === '127.0.0.1')) {
      return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    }
    return false;
  }

  function recreateInnerFrame(nextSrcDoc) {
    if (!mountEl) return;
    if (innerFrame && innerFrame.parentNode) {
      innerFrame.parentNode.removeChild(innerFrame);
    }
    var fresh = document.createElement('iframe');
    fresh.id = 'inner-runner';
    fresh.setAttribute('sandbox', 'allow-scripts');
    fresh.setAttribute('referrerpolicy', 'no-referrer');
    fresh.setAttribute('title', 'Inner Opaque Execution Frame');
    if (typeof nextSrcDoc === 'string' && nextSrcDoc.length > 0) {
      fresh.srcdoc = nextSrcDoc;
    }
    mountEl.appendChild(fresh);
    innerFrame = fresh;
  }

  function safeString(val, maxLen) {
    if (typeof val === 'string') {
      return val.slice(0, maxLen || MAX_STRING_LENGTH);
    }
    try {
      return String(val == null ? '' : val).slice(0, maxLen || MAX_STRING_LENGTH);
    } catch (_err) {
      return '';
    }
  }

  function sanitizeInnerMessage(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return null;
    }
    if (raw.protocol !== PROTOCOL) {
      return null;
    }
    if (typeof raw.sessionId !== 'string' || raw.sessionId !== activeSessionId) {
      return null;
    }
    if (!ALLOWED_INNER_MESSAGE_TYPES[raw.type]) {
      return null;
    }

    var cleanPayload = {};
    var rawPayload = raw.payload && typeof raw.payload === 'object' && !Array.isArray(raw.payload) ? raw.payload : {};

    if (raw.type === 'CONSOLE_EVENT') {
      var level = ALLOWED_CONSOLE_LEVELS[rawPayload.level] ? rawPayload.level : 'log';
      var cleanArgs = [];
      if (Array.isArray(rawPayload.args)) {
        if (rawPayload.args.length > 64) {
          return null;
        }
        var count = Math.min(rawPayload.args.length, MAX_CONSOLE_ARGS);
        for (var i = 0; i < count; i++) {
          cleanArgs.push(safeString(rawPayload.args[i], MAX_STRING_LENGTH));
        }
      }
      cleanPayload = {
        level: level,
        args: cleanArgs
      };
    } else if (raw.type === 'RUNTIME_ERROR') {
      var err = rawPayload.error && typeof rawPayload.error === 'object' && !Array.isArray(rawPayload.error)
        ? rawPayload.error
        : {};
      var msg = safeString(err.message || 'Unknown runtime error', MAX_STRING_LENGTH);
      var line = typeof err.line === 'number' && isFinite(err.line) ? err.line : null;
      var col = typeof err.column === 'number' && isFinite(err.column) ? err.column : null;
      var stack = typeof err.stack === 'string' ? safeString(err.stack, MAX_STRING_LENGTH) : undefined;
      cleanPayload = {
        error: {
          message: msg,
          line: line,
          column: col,
          stack: stack
        }
      };
    } else if (raw.type === 'EXECUTION_COMPLETE') {
      var dur = typeof rawPayload.durationMs === 'number' && isFinite(rawPayload.durationMs)
        ? Math.max(0, Math.round(rawPayload.durationMs))
        : 0;
      cleanPayload = {
        durationMs: dur,
        truncated: Boolean(rawPayload.truncated)
      };
    } else if (raw.type === 'EXECUTION_ABORTED') {
      cleanPayload = {
        reason: safeString(rawPayload.reason || 'Execution aborted by runner', MAX_STRING_LENGTH)
      };
    } else if (raw.type === 'SANDBOX_READY') {
      cleanPayload = {};
    } else if (raw.type === 'HEARTBEAT') {
      cleanPayload = {};
    }

    var cleanMsg = {
      protocol: PROTOCOL,
      sessionId: activeSessionId,
      type: raw.type,
      payload: cleanPayload
    };

    if (typeof raw.seq === 'number' && isFinite(raw.seq) && raw.seq >= 0) {
      cleanMsg.seq = Math.floor(raw.seq);
    }

    try {
      var jsonStr = JSON.stringify(cleanMsg);
      if (jsonStr.length > MAX_MESSAGE_BYTES) {
        return null;
      }
    } catch (_err) {
      return null;
    }

    return cleanMsg;
  }

  window.addEventListener('message', function (event) {
    if (!event) return;

    // 1. 来自内部 Opaque Sandbox (event.origin === "null") 的运行事件
    if (innerFrame && event.source === innerFrame.contentWindow) {
      if (event.origin !== 'null') return;
      if (
        activeHostOrigin &&
        window.parent &&
        window.parent !== window &&
        activeSessionId
      ) {
        if (forwardedCount >= MAX_FORWARDED_MESSAGES) {
          recreateInnerFrame('');
          return;
        }

        var sanitized = sanitizeInnerMessage(event.data);
        if (!sanitized) {
          recreateInnerFrame('');
          return;
        }

        forwardedCount++;
        window.parent.postMessage(sanitized, activeHostOrigin);
      }
      return;
    }

    // 2. 来自外部父窗口的主站控制指令
    if (event.source === window.parent && window.parent !== window && isAllowedHostOrigin(event.origin)) {
      var data = event.data;
      if (!data || typeof data !== 'object' || Array.isArray(data)) return;
      if (data.protocol !== PROTOCOL) return;

      var cmdType = data.type;
      var reqSessionId = typeof data.sessionId === 'string' ? data.sessionId.slice(0, 128) : '';
      if (!reqSessionId) return;

      if (cmdType === 'PING') {
        window.parent.postMessage(
          {
            protocol: PROTOCOL,
            sessionId: reqSessionId,
            type: 'SANDBOX_BRIDGE_READY',
            payload: {}
          },
          event.origin
        );
        return;
      }

      if (cmdType === 'TERMINATE_SESSION') {
        if (activeSessionId && activeSessionId === reqSessionId && activeHostOrigin === event.origin) {
          activeSessionId = null;
          activeHostOrigin = null;
          forwardedCount = 0;
          recreateInnerFrame('');
        }
        return;
      }

      if (cmdType === 'SET_THEME') {
        if (
          activeSessionId &&
          activeSessionId === reqSessionId &&
          activeHostOrigin === event.origin &&
          innerFrame &&
          innerFrame.contentWindow &&
          data.payload
        ) {
          innerFrame.contentWindow.postMessage(
            {
              protocol: PROTOCOL,
              sessionId: activeSessionId,
              type: 'SET_THEME',
              payload: { theme: data.payload.theme === 'dark' ? 'dark' : 'light' }
            },
            '*'
          );
        }
        return;
      }

      if (
        cmdType === 'EXECUTE_CODE' &&
        data.payload &&
        typeof data.payload.srcDoc === 'string' &&
        data.payload.srcDoc.length <= MAX_SRCDOC_CHARS
      ) {
        activeHostOrigin = event.origin;
        activeSessionId = reqSessionId;
        forwardedCount = 0;
        recreateInnerFrame(data.payload.srcDoc);
      }
    }
  });

  if (window.parent && window.parent !== window) {
    try {
      window.parent.postMessage(
        {
          protocol: PROTOCOL,
          sessionId: '__bridge_init__',
          type: 'SANDBOX_BRIDGE_READY',
          payload: {}
        },
        '*'
      );
    } catch (_err) {}
  }
})();

import { getCurrentHub } from '@sentry/core';
import { Event, Integration, Severity } from '@sentry/types';
import {
  addExceptionMechanism,
  addExceptionTypeValue,
  extractExceptionKeysForMessage,
  getGlobalObject,
  getLocationHref,
  isErrorEvent,
  isPrimitive,
  isString,
  logger,
  normalizeToSize,
  truncate,
} from '@sentry/utils';

import { eventFromUnknownInput } from '../eventbuilder';
import { shouldIgnoreOnError } from '../helpers';
import { computeStackTrace } from '../tracekit';

/** JSDoc */
interface GlobalHandlersIntegrations {
  onerror: boolean;
  onunhandledrejection: boolean;
}

/** Global handlers */
export class GlobalHandlers implements Integration {
  /**
   * @inheritDoc
   */
  public name: string = GlobalHandlers.id;

  /**
   * @inheritDoc
   */
  public static id: string = 'GlobalHandlers';

  /** JSDoc */
  private readonly _options: GlobalHandlersIntegrations;

  /** JSDoc */
  private readonly _global: Window = getGlobalObject();

  /** JSDoc */
  private _oldOnErrorHandler: OnErrorEventHandler = null;

  /** JSDoc */
  private _oldOnUnhandledRejectionHandler: ((e: any) => void) | null = null;

  /** JSDoc */
  private _onErrorHandlerInstalled: boolean = false;

  /** JSDoc */
  private _onUnhandledRejectionHandlerInstalled: boolean = false;

  /** JSDoc */
  public constructor(options?: GlobalHandlersIntegrations) {
    this._options = {
      onerror: true,
      onunhandledrejection: true,
      ...options,
    };
  }
  /**
   * @inheritDoc
   */
  public setupOnce(): void {
    Error.stackTraceLimit = 50;

    if (this._options.onerror) {
      logger.log('Global Handler attached: onerror');
      this._installGlobalOnErrorHandler();
    }

    if (this._options.onunhandledrejection) {
      logger.log('Global Handler attached: onunhandledrejection');
      this._installGlobalOnUnhandledRejectionHandler();
    }
  }

  /** JSDoc */
  private _installGlobalOnErrorHandler(): void {
    if (this._onErrorHandlerInstalled) {
      return;
    }

    const self = this; // tslint:disable-line:no-this-assignment
    this._oldOnErrorHandler = this._global.onerror;

    this._global.onerror = function(msg: any, url: any, line: any, column: any, error: any): boolean {
      const hasIntegration = getCurrentHub().getIntegration(GlobalHandlers);
      const isFailedOwnDelivery = error && error.__sentry_own_request__ === true;

      if (!hasIntegration || shouldIgnoreOnError() || isFailedOwnDelivery) {
        if (self._oldOnErrorHandler) {
          return self._oldOnErrorHandler.apply(this, arguments);
        }
        return false;
      }

      const event = isPrimitive(error)
        ? self._eventFromIncompleteOnError(msg, url, line, column)
        : self._enhanceEventWithInitialFrame(eventFromUnknownInput(error), url, line, column);

      const client = getCurrentHub().getClient();
      const maxValueLength = (client && client.getOptions().maxValueLength) || 250;
      const fallbackValue = truncate(`${error || msg}`, maxValueLength) || '';

      addExceptionTypeValue(event, fallbackValue, 'Error');
      addExceptionMechanism(event, {
        handled: false,
        type: 'onerror',
      });

      getCurrentHub().captureEvent(event, {
        originalException: error,
      });

      if (self._oldOnErrorHandler) {
        return self._oldOnErrorHandler.apply(this, arguments);
      }

      return false;
    };

    this._onErrorHandlerInstalled = true;
  }

  /** JSDoc */
  private _installGlobalOnUnhandledRejectionHandler(): void {
    if (this._onUnhandledRejectionHandlerInstalled) {
      return;
    }

    const self = this; // tslint:disable-line:no-this-assignment
    this._oldOnUnhandledRejectionHandler = this._global.onunhandledrejection;

    this._global.onunhandledrejection = function(e: any): boolean {
      let error = e;
      try {
        error = e && 'reason' in e ? e.reason : e;
      } catch (_oO) {
        // no-empty
      }

      const hasIntegration = getCurrentHub().getIntegration(GlobalHandlers);
      const isFailedOwnDelivery = error && error.__sentry_own_request__ === true;

      if (!hasIntegration || shouldIgnoreOnError() || isFailedOwnDelivery) {
        if (self._oldOnUnhandledRejectionHandler) {
          return self._oldOnUnhandledRejectionHandler.apply(this, arguments);
        }
        return false;
      }

      const stack = computeStackTrace(error);
      const event = stack.failed ? self._eventFromIncompleteRejection(error) : eventFromUnknownInput(error);

      const client = getCurrentHub().getClient();
      const maxValueLength = (client && client.getOptions().maxValueLength) || 250;
      const fallbackValue = truncate(`${error}`, maxValueLength) || '';

      addExceptionTypeValue(event, fallbackValue, 'UnhandledRejection');
      addExceptionMechanism(event, {
        handled: false,
        type: 'onunhandledrejection',
      });

      getCurrentHub().captureEvent(event, {
        originalException: error,
      });

      if (self._oldOnUnhandledRejectionHandler) {
        return self._oldOnUnhandledRejectionHandler.apply(this, arguments);
      }

      return false;
    };

    this._onUnhandledRejectionHandlerInstalled = true;
  }

  /**
   * This function creates a stack from an old, error-less onerror handler.
   */
  private _eventFromIncompleteOnError(msg: any, url: any, line: any, column: any): Event {
    const ERROR_TYPES_RE = /^(?:[Uu]ncaught (?:exception: )?)?(?:((?:Eval|Internal|Range|Reference|Syntax|Type|URI|)Error): )?(.*)$/;

    // If 'message' is ErrorEvent, get real message from inside
    let message = isErrorEvent(msg) ? msg.message : msg;
    let name;

    if (isString(message)) {
      const groups = message.match(ERROR_TYPES_RE);
      if (groups) {
        name = groups[1];
        message = groups[2];
      }
    }

    const event = {
      exception: {
        values: [
          {
            value: message,
            ...(name && { type: name }),
          },
        ],
      },
    };

    return this._enhanceEventWithInitialFrame(event, url, line, column);
  }

  /** JSDoc */
  private _enhanceEventWithInitialFrame(event: Event, url: any, line: any, column: any): Event {
    event.exception = event.exception || {};
    event.exception.values = event.exception.values || [];
    event.exception.values[0] = event.exception.values[0] || {};
    event.exception.values[0].stacktrace = event.exception.values[0].stacktrace || {};
    event.exception.values[0].stacktrace.frames = event.exception.values[0].stacktrace.frames || [];

    if (event.exception.values[0].stacktrace.frames.length === 0) {
      event.exception.values[0].stacktrace.frames.push({
        colno: column,
        filename: url || getLocationHref(),
        function: '?',
        in_app: true,
        lineno: line,
      });
    }

    return event;
  }

  /**
   * This function creates an Event from an TraceKitStackTrace that has part of it missing.
   */
  private _eventFromIncompleteRejection(error: any): Event {
    const event: Event = {
      level: Severity.Error,
    };

    if (isPrimitive(error)) {
      event.exception = {
        values: [
          {
            type: 'UnhandledRejection',
            value: `Non-Error promise rejection captured with value: ${error}`,
          },
        ],
      };
    } else {
      event.exception = {
        values: [
          {
            type: 'UnhandledRejection',
            value: `Non-Error promise rejection captured with keys: ${extractExceptionKeysForMessage(error)}`,
          },
        ],
      };
      event.extra = {
        __serialized__: normalizeToSize(error),
      };
    }

    return event;
  }
}

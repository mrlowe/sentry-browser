import { Integration, WrappedFunction } from '@sentry/types';
import { fill, getFunctionName, getGlobalObject } from '@sentry/utils';

import { wrap } from '../helpers';

type XMLHttpRequestProp = 'onload' | 'onerror' | 'onprogress';

/** Wrap timer functions and event targets to catch errors and provide better meta data */
export class TryCatch implements Integration {
  /** JSDoc */
  private _ignoreOnError: number = 0;

  /**
   * @inheritDoc
   */
  public name: string = TryCatch.id;

  /**
   * @inheritDoc
   */
  public static id: string = 'TryCatch';

  /** JSDoc */
  private _wrapTimeFunction(original: () => void): () => number {
    return function(this: any, ...args: any[]): number {
      const originalCallback = args[0];
      args[0] = wrap(originalCallback, {
        mechanism: {
          data: { function: getFunctionName(original) },
          handled: true,
          type: 'instrument',
        },
      });
      return original.apply(this, args);
    };
  }

  /** JSDoc */
  private _wrapRAF(original: any): (callback: () => void) => any {
    return function(this: any, callback: () => void): () => void {
      return original(
        wrap(callback, {
          mechanism: {
            data: {
              function: 'requestAnimationFrame',
              handler: getFunctionName(original),
            },
            handled: true,
            type: 'instrument',
          },
        }),
      );
    };
  }

  /** JSDoc */
  private _wrapEventTarget(target: string): void {
    const global = getGlobalObject() as { [key: string]: any };
    const proto = global[target] && global[target].prototype;

    if (!proto || !proto.hasOwnProperty || !proto.hasOwnProperty('addEventListener')) {
      return;
    }

    fill(proto, 'addEventListener', function(
      original: () => void,
    ): (eventName: string, fn: EventListenerObject, options?: boolean | AddEventListenerOptions) => void {
      return function(
        this: any,
        eventName: string,
        fn: EventListenerObject,
        options?: boolean | AddEventListenerOptions,
      ): (eventName: string, fn: EventListenerObject, capture?: boolean, secure?: boolean) => void {
        try {
          // tslint:disable-next-line:no-unbound-method strict-type-predicates
          if (typeof fn.handleEvent === 'function') {
            fn.handleEvent = wrap(fn.handleEvent.bind(fn), {
              mechanism: {
                data: {
                  function: 'handleEvent',
                  handler: getFunctionName(fn),
                  target,
                },
                handled: true,
                type: 'instrument',
              },
            });
          }
        } catch (err) {
          // can sometimes get 'Permission denied to access property "handle Event'
        }

        return original.call(
          this,
          eventName,
          wrap((fn as any) as WrappedFunction, {
            mechanism: {
              data: {
                function: 'addEventListener',
                handler: getFunctionName(fn),
                target,
              },
              handled: true,
              type: 'instrument',
            },
          }),
          options,
        );
      };
    });

    fill(proto, 'removeEventListener', function(
      original: () => void,
    ): (this: any, eventName: string, fn: EventListenerObject, options?: boolean | EventListenerOptions) => () => void {
      return function(
        this: any,
        eventName: string,
        fn: EventListenerObject,
        options?: boolean | EventListenerOptions,
      ): () => void {
        let callback = (fn as any) as WrappedFunction;
        try {
          callback = callback && (callback.__sentry_wrapped__ || callback);
        } catch (e) {
          // ignore, accessing __sentry_wrapped__ will throw in some Selenium environments
        }
        return original.call(this, eventName, callback, options);
      };
    });
  }

  /** JSDoc */
  private _wrapXHR(originalSend: () => void): () => void {
    return function(this: XMLHttpRequest, ...args: any[]): void {
      const xhr = this; // tslint:disable-line:no-this-assignment
      const xmlHttpRequestProps: XMLHttpRequestProp[] = ['onload', 'onerror', 'onprogress'];

      xmlHttpRequestProps.forEach(prop => {
        if (prop in this && typeof this[prop] === 'function') {
          fill(this, prop, original =>
            wrap(original, {
              mechanism: {
                data: {
                  function: prop,
                  handler: getFunctionName(original),
                },
                handled: true,
                type: 'instrument',
              },
            }),
          );
        }
      });

      if ('onreadystatechange' in xhr && typeof xhr.onreadystatechange === 'function') {
        fill(xhr, 'onreadystatechange', function(original: WrappedFunction): Function {
          const wrapOptions = {
            mechanism: {
              data: {
                function: 'onreadystatechange',
                handler: getFunctionName(original),
              },
              handled: true,
              type: 'instrument',
            },
          };

          // If Instrument integration has been called before TryCatch, get the name of original function
          if (original.__sentry_original__) {
            wrapOptions.mechanism.data.handler = getFunctionName(original.__sentry_original__);
          }

          // Otherwise wrap directly
          return wrap(original, wrapOptions);
        });
      }

      return originalSend.apply(this, args);
    };
  }

  /**
   * Wrap timer functions and event targets to catch errors
   * and provide better metadata.
   */
  public setupOnce(): void {
    this._ignoreOnError = this._ignoreOnError;

    const global = getGlobalObject();

    fill(global, 'setTimeout', this._wrapTimeFunction.bind(this));
    fill(global, 'setInterval', this._wrapTimeFunction.bind(this));
    fill(global, 'requestAnimationFrame', this._wrapRAF.bind(this));

    if ('XMLHttpRequest' in global) {
      fill(XMLHttpRequest.prototype, 'send', this._wrapXHR.bind(this));
    }

    [
      'EventTarget',
      'Window',
      'Node',
      'ApplicationCache',
      'AudioTrackList',
      'ChannelMergerNode',
      'CryptoOperation',
      'EventSource',
      'FileReader',
      'HTMLUnknownElement',
      'IDBDatabase',
      'IDBRequest',
      'IDBTransaction',
      'KeyOperation',
      'MediaController',
      'MessagePort',
      'ModalWindow',
      'Notification',
      'SVGElementInstance',
      'Screen',
      'TextTrack',
      'TextTrackCue',
      'TextTrackList',
      'WebSocket',
      'WebSocketWorker',
      'Worker',
      'XMLHttpRequest',
      'XMLHttpRequestEventTarget',
      'XMLHttpRequestUpload',
    ].forEach(this._wrapEventTarget.bind(this));
  }
}

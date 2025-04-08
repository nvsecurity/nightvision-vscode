import { v4 } from 'uuid';
import { MessageData, Messenger } from '@utils/Messenger';
import { API_ERROR_TYPES, HEALTH_CHECK_INTERVAL } from '@constants/GlobalConstants';
import { CHECK_HEALTH, UNAUTHORIZED_ACCESS } from '@commands/CommandConstants';

interface MessageHandlerApiProps {
  method: RequestInit['method'],
  url: string,
  body?: any,
  setIsLoggedIn?: (val: boolean) => void,
}

class MessageHandler {
  private static instance: MessageHandler;
  private static listeners: { [commandId: string]: Function } = {};
  private callback: (message: MessageEvent<MessageData>) => void;
  private lastTimeHealthCheck: number = 0;

  private constructor() {
    this.callback = (message: MessageEvent<MessageData>) => {
      const { command, requestId, payload, error, isFinal } = message.data;

      if (requestId && MessageHandler.listeners[requestId]) {
        MessageHandler.listeners[requestId](command, payload, error, isFinal);
        if (isFinal) {
          delete MessageHandler.listeners[requestId];
        }
      }
    };
    Messenger.listen(this.callback);
  }

  public static getInstance() {
    if (!MessageHandler.instance) {
      MessageHandler.instance = new MessageHandler();
    }

    return MessageHandler.instance;
  }

  public api({
    method,
    url,
    body,
    setIsLoggedIn,
  }: MessageHandlerApiProps): Promise<any> {
    const requestId = v4();

    return new Promise(async (resolve, reject) => {
      MessageHandler.listeners[requestId] = (
        command: string,
        payload: any,
        error: string,
        isFinal: boolean
      ) => {
        if (error) {
          try {
            const err = JSON.parse(error);
            // catch common errors
            if (API_ERROR_TYPES.includes(err?.type)) {
              for (const error of err.errors) {
                switch (error.code) {
                  case 'not_authenticated':
                  case 'authentication_failed': {
                    setIsLoggedIn?.(false);
                  }
                }
              }
            } else {
              reject(error);
            }
          }
          catch {
            reject(error);
          }
        } else {
          resolve(payload);
        }

        if (MessageHandler.listeners[requestId]) {
          delete MessageHandler.listeners[requestId];
        }
      };

      const timeNow = new Date().getTime();
      if (timeNow - this.lastTimeHealthCheck > HEALTH_CHECK_INTERVAL) {
        // Check if CLI is alive
        const result = messageHandler.requestGenerator(
          CHECK_HEALTH,
          v4(),
        );
        for await (const response of result) {
          switch (response.command) {
            case UNAUTHORIZED_ACCESS: {
              setIsLoggedIn?.(false);
              break;
            }
          }
        }
      }
      this.lastTimeHealthCheck = timeNow;

      const vscode = Messenger.getVsCodeAPI();
      vscode.postMessage({ url, method, body, requestId });
    });
  }

  public request(message: string, payload?: any): Promise<any> {
    const requestId = v4();

    return new Promise((resolve, reject) => {
      MessageHandler.listeners[requestId] = (
        command: string,
        payload: any,
        error: string,
        isFinal: boolean
      ) => {
        if (error) {
          reject(error);
        } else {
          resolve(payload);
        }

        if (MessageHandler.listeners[requestId]) {
          delete MessageHandler.listeners[requestId];
        }
      };

      Messenger.send(message, requestId, payload);
    });
  }

  // Async generator - allows us to await until isFinal or error
  public async *requestGenerator<T>(
    message: string,
    reqId?: string,
    payload?: T
  ): AsyncGenerator<MessageData, void, unknown> {
    const requestId = reqId || v4();
    const iterator = new Promise<AsyncGenerator<any, void, unknown>>(
      (resolve, reject) => {
        const queue: MessageData[] = [];
        let done = false;
        let errorOccurred = false;
        let errorMessage = '';

        const pushToQueue = (
          command: string,
          payload: any,
          error: string,
          isFinal: boolean
        ) => {
          if (error) {
            done = true;
            errorOccurred = true;
            errorMessage = error;
          } else {
            queue.push({
              command,
              payload,
              error,
              isFinal,
            } as MessageData);
            if (isFinal) {
              done = true;
            }
          }
        };

        MessageHandler.listeners[requestId] = (
          command: string,
          payload: any,
          error: any,
          isFinal: boolean
        ) => {
          pushToQueue(command, payload, error, isFinal);
        };

        resolve(
          (async function* () {
            while (!done || queue.length > 0) {
              if (queue.length > 0) {
                const item = queue.shift();
                if (item) {
                  yield {
                    command: item.command,
                    payload: item.payload,
                  } as MessageData;
                }
                if (item?.isFinal) {
                  break;
                }
              } else {
                await new Promise((r) => setTimeout(r, 100));
              }
            }
            if (errorOccurred) {
              throw new Error(errorMessage);
            }
          })()
        );

        Messenger.send(message, requestId, payload);
      }
    );

    try {
      yield* await iterator;
    } finally {
      // Prevent memory leaks by removing the listener when the generator is done
      delete MessageHandler.listeners[requestId];
    }
    
  }
}

export const messageHandler = MessageHandler.getInstance();

import { WebviewApi } from 'vscode-webview';

export interface MessageData {
  command: string;
  payload?: any;
  requestId?: string;
  error?: string;
  isFinal?: boolean;
}

export class Messenger {
  private static vscode: any;

  public static getVsCodeAPI<T>(): WebviewApi<T> {
    if (!Messenger.vscode) {
      Messenger.vscode = vscodeApi;
    }
    return Messenger.vscode as WebviewApi<T>;
  }

  public static listen(
    callback: (event: MessageEvent<MessageData>) => void
  ): void {
    window.addEventListener('message', callback);
  }

  public static unlisten(
    callback: (event: MessageEvent<MessageData>) => void
  ): void {
    window.removeEventListener('message', callback);
  }

  public static send(command: string, requestId: string, payload?: any): void {
    const vscode = Messenger.getVsCodeAPI();
    vscode.postMessage({ command, requestId, payload });
  }

  public static getState = () => {
    const vscode = Messenger.getVsCodeAPI();
    return vscode.getState();
  };

  public static setState = (data: any) => {
    const vscode = Messenger.getVsCodeAPI();
    vscode.setState({
      ...data,
    });
  };
}

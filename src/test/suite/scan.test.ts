import * as assert from 'assert';
import Scan from '../../commands/Scan';
import { Target } from '../../types/target';
import { Project } from '../../types/project';

const project: Project = { id: 'project-uuid', name: 'my-project' };
const target: Target = {
  id: 'target-uuid',
  name: 'juice-shop',
  location: 'https://juice-shop.example.com',
  type: 'URL',
};

function makeScan(overrides: { target?: Target; authentication?: any } = {}) {
  const messages: any[] = [];
  const webview = {
    postMessage: (message: any) => {
      messages.push(message);
      return Promise.resolve(true);
    },
    html: '',
    options: {},
    onDidReceiveMessage: () => ({ dispose: () => {} }),
    cspSource: '',
    asWebviewUri: (uri: any) => uri,
  } as any;

  const cmd = new Scan(webview, 'test-request-id', {
    project,
    target: overrides.target ?? target,
    authentication: overrides.authentication ?? null,
  });

  return { cmd, messages, instance: cmd as any };
}

// Mirrors how Command.execute turns the command string and flags into argv.
function argv(instance: any): string[] {
  const flags = instance.flags.reduce((acc: string[], item: any) => {
    acc.push(item.flag);
    if (item.value != null) {
      acc.push(item.value.trim());
    }
    return acc;
  }, []);
  const [, ...args] = instance.command.split(' ');
  return [...args, ...flags];
}

suite('Scan', () => {
  test('passes the target name as a positional argument', () => {
    const { instance } = makeScan();

    assert.deepStrictEqual(argv(instance), [
      'scan',
      'juice-shop',
      '-P',
      'project-uuid',
    ]);
  });

  test('keeps a target name with spaces as a single argument', () => {
    const { instance } = makeScan({
      target: { ...target, name: 'My Juice Shop' },
    });

    assert.deepStrictEqual(argv(instance), [
      'scan',
      'My Juice Shop',
      '-P',
      'project-uuid',
    ]);
  });

  test('omits the credential flag when no authentication is selected', () => {
    const { instance } = makeScan();

    assert.ok(!instance.flags.some((f: any) => f.flag === '-C'));
  });

  test('passes the credential id when an authentication is selected', () => {
    const { instance } = makeScan({
      authentication: { id: 'auth-uuid', name: 'login', type: 'COOKIE' },
    });

    assert.ok(
      instance.flags.some((f: any) => f.flag === '-C' && f.value === 'auth-uuid')
    );
  });
});

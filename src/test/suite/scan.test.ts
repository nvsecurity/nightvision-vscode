import * as assert from 'assert';
import Scan from '../../commands/Scan';
import {
  EXIT,
  SCAN_FINISHED,
  SCAN_ID,
  UNAUTHORIZED_ACCESS,
} from '../../commands/CommandConstants';
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

// The shape the CLI actually emits on a non-TTY stream: a charmbracelet
// multi-line value, each line prefixed with a box-drawing gutter.
const scanDetails = [
  '[2026-08-17 17:53:14] INFO Scan Details:',
  '  info=',
  '  │ Scan ID: 11111111-2222-3333-4444-555555555555',
  '  │ Target ID: 66666666-7777-8888-9999-000000000000',
  '  │ Login Status: N/A',
  '  │ Status: RUNNING',
  '',
].join('\n');

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

  test('reports the scan id from the CLI details block', () => {
    const { cmd, messages } = makeScan();

    cmd.handleOutput(scanDetails);

    const scanId = messages.find((m) => m.command === SCAN_ID);
    assert.strictEqual(
      scanId?.payload,
      '11111111-2222-3333-4444-555555555555'
    );
  });

  test('does not throw when the details block carries no scan id', () => {
    const { cmd, messages } = makeScan();

    assert.doesNotThrow(() =>
      cmd.handleOutput('[2026-08-17 17:53:14] INFO Scan Details:\n')
    );
    assert.ok(!messages.some((m) => m.command === SCAN_ID));
  });

  test('does not throw when the finished block carries no status', () => {
    const { cmd, messages } = makeScan();

    assert.doesNotThrow(() =>
      cmd.handleOutput('[2026-08-17 17:53:14] INFO Scan Finished:\n')
    );
    assert.ok(!messages.some((m) => m.command === SCAN_FINISHED));
  });

  test('reports CLI output when the process exits before a scan starts', () => {
    const { cmd, messages } = makeScan();

    // What the CLI prints on stdout when the target is not in the project.
    cmd.handleOutput('Target juice-shop does not exist within project my-project.\n');
    cmd.handleClose(1, null);

    const final = messages[messages.length - 1];
    assert.ok(final.error, 'expected an error to be reported');
    assert.ok(final.error.includes('exited with code 1'));
    assert.ok(final.error.includes('does not exist within project my-project'));
    assert.strictEqual(final.isFinal, true);
  });

  test('reports a failure even when the CLI produced no output', () => {
    const { cmd, messages } = makeScan();

    cmd.handleClose(1, null);

    const final = messages[messages.length - 1];
    assert.ok(final.error.includes('exited with code 1'));
  });

  test('names the signal when the CLI is terminated', () => {
    const { cmd, messages } = makeScan();

    cmd.handleClose(null, 'SIGTERM');

    const final = messages[messages.length - 1];
    assert.ok(final.error.includes('SIGTERM'));
  });

  test('closes normally once a scan id has been reported', () => {
    const { cmd, messages } = makeScan();

    cmd.handleOutput(scanDetails);
    cmd.handleClose(0, null);

    const final = messages[messages.length - 1];
    assert.strictEqual(final.command, EXIT);
    assert.ok(!final.error);
  });

  test('reports a scan that never starts', () => {
    const { cmd, messages } = makeScan();

    // The CLI reached the relay step and then hung, producing no scan id.
    cmd.handleOutput('[2026-08-06 18:07:36] INFO Performing a Web Scan\n');
    (cmd as any).handleTimeout();

    const final = messages[messages.length - 1];
    assert.ok(final.error, 'expected an error to be reported');
    assert.ok(final.error.includes('did not start a scan within'));
    assert.ok(final.error.includes('Performing a Web Scan'));
    assert.strictEqual(final.isFinal, true);
  });

  test('applies a startup deadline', () => {
    const { instance } = makeScan();

    assert.ok(instance.timeoutMs > 0, 'expected a startup deadline');
  });

  test('cancels the startup deadline once the scan is running', () => {
    const { cmd, instance } = makeScan();
    let cancelled = false;
    instance.cancelTimeout = () => { cancelled = true; };

    cmd.handleOutput(scanDetails);

    assert.ok(cancelled, 'deadline should not limit the scan itself');
  });

  test('cancels the deadline even when the scan id cannot be read', () => {
    const { cmd, instance } = makeScan();
    let cancelled = false;
    instance.cancelTimeout = () => { cancelled = true; };

    // Killing the CLI here would cancel the scan server-side, so an
    // unparseable record must not leave the deadline armed.
    cmd.handleOutput('[2026-08-18 12:00:00] INFO Scan Details:\n');

    assert.ok(cancelled, 'a started scan should never be killed by the deadline');
  });

  // These two spawn a real process, because the point is whether the timer
  // actually fires against a live child, not whether a stub was called.
  //
  // The stand-in is node, which keeps the test off any platform-specific
  // shell. It is named rather than given as a path because Command splits its
  // command on spaces, and every candidate absolute path here contains one.
  function runStandIn(instance: any, script: string) {
    instance.command = 'node';
    instance.flags = [{ flag: '-e' }, { flag: script }];
    instance.timeoutMs = 300;
  }

  const settle = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  test('does not kill a scan that is running past the deadline', async function () {
    this.timeout(10_000);

    const { cmd, instance } = makeScan();
    runStandIn(
      instance,
      "process.stdout.write('INFO Scan Details:\\n  Scan ID: abc-123\\n'); setTimeout(() => {}, 3000);"
    );

    const child = cmd.execute()!;
    await settle(1500);

    assert.strictEqual(child.killed, false, 'a running scan must survive the deadline');
    assert.strictEqual(child.exitCode, null, 'child should still be running');
    child.kill();
  });

  test('kills a CLI that never starts a scan', async function () {
    this.timeout(10_000);

    const { cmd, instance, messages } = makeScan();
    runStandIn(instance, 'setTimeout(() => {}, 3000);');

    const child = cmd.execute()!;
    await settle(1500);

    assert.strictEqual(child.killed, true, 'a stalled CLI should be stopped');
    assert.ok(
      messages.some((m) => m.error?.includes('did not start a scan within')),
      'the timeout should be reported'
    );
  });

  test('does not add a generic failure after an expired login', () => {
    const { cmd, messages } = makeScan();

    cmd.handleOutput(
      '[2026-08-17 17:56:24] ERROR It seems your login authentication token has expired. ' +
        'Please try to log in again by running `nightvision login`.\n'
    );
    cmd.handleClose(1, null);

    assert.ok(messages.some((m) => m.command === UNAUTHORIZED_ACCESS));
    assert.ok(!messages.some((m) => m.error));
  });
});

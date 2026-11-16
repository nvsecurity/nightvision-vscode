import * as assert from 'assert';
import { appUrlForApi, DEFAULT_APP_URL } from '../../utils/nightvisionHosts';

suite('appUrlForApi', () => {
  test('should map the production API to the app on nightviz.ai', () => {
    assert.strictEqual(appUrlForApi('https://api.nightviz.ai'), 'https://app.nightviz.ai');
  });

  test('should keep a nightvision.net API on nightvision.net', () => {
    assert.strictEqual(appUrlForApi('https://api.nightvision.net'), 'https://app.nightvision.net');
  });

  test('should map an environment API to its app on nightviz.ai', () => {
    assert.strictEqual(appUrlForApi('https://api.dev.nightviz.ai'), 'https://dev.nightviz.ai');
    assert.strictEqual(appUrlForApi('https://api.test.nightviz.ai'), 'https://test.nightviz.ai');
  });

  test('should map an environment API to its app on nightvision.net', () => {
    assert.strictEqual(appUrlForApi('https://api.test.nightvision.net'), 'https://test.nightvision.net');
  });

  test('should ignore a path and port on the API URL', () => {
    assert.strictEqual(appUrlForApi('https://api.nightviz.ai:443/api/v1/'), 'https://app.nightviz.ai');
  });

  test('should match the host case-insensitively', () => {
    assert.strictEqual(appUrlForApi('https://API.NightVision.net'), 'https://app.nightvision.net');
  });

  test('should fall back to nightviz.ai for any other host', () => {
    assert.strictEqual(appUrlForApi('https://api.custom.example.com'), DEFAULT_APP_URL);
    assert.strictEqual(appUrlForApi('http://localhost:8000'), DEFAULT_APP_URL);
    assert.strictEqual(appUrlForApi('https://api.nightvision.net.example.com'), DEFAULT_APP_URL);
    assert.strictEqual(appUrlForApi('https://api.a.b.nightviz.ai'), DEFAULT_APP_URL);
  });

  test('should fall back to nightviz.ai for a value that is not a URL', () => {
    assert.strictEqual(appUrlForApi('not a url'), DEFAULT_APP_URL);
    assert.strictEqual(DEFAULT_APP_URL, 'https://app.nightviz.ai');
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_GAME_URL,
  getGameUrl,
  isAllowedNavigation,
} from './webviewPolicy.mjs';

test('uses the production game URL when no override is provided', () => {
  assert.equal(getGameUrl(), DEFAULT_GAME_URL);
});

test('accepts an http or https development URL override', () => {
  assert.equal(getGameUrl('http://192.168.0.10:4173'), 'http://192.168.0.10:4173/');
  assert.equal(getGameUrl('https://preview.example.com/game'), 'https://preview.example.com/game');
});

test('falls back to production for an invalid or unsafe URL override', () => {
  assert.equal(getGameUrl('javascript:alert(1)'), DEFAULT_GAME_URL);
  assert.equal(getGameUrl('not a url'), DEFAULT_GAME_URL);
});

test('allows only the game origin and the initial blank document in the WebView', () => {
  const gameUrl = 'https://sangsahit.kro.kr/';

  assert.equal(isAllowedNavigation('about:blank', gameUrl), true);
  assert.equal(isAllowedNavigation('https://sangsahit.kro.kr/shop', gameUrl), true);
  assert.equal(isAllowedNavigation('https://example.com/', gameUrl), false);
  assert.equal(isAllowedNavigation('javascript:alert(1)', gameUrl), false);
});

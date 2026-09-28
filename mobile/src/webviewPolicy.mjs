export const DEFAULT_GAME_URL = 'https://sangsahit.kro.kr/';

/**
 * @param {string | undefined} override
 * @returns {string}
 */
export function getGameUrl(override) {
  if (!override) return DEFAULT_GAME_URL;

  try {
    const url = new URL(override.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return DEFAULT_GAME_URL;
    }

    url.hash = '';
    return url.toString();
  } catch {
    return DEFAULT_GAME_URL;
  }
}

/**
 * @param {string} requestUrl
 * @param {string} gameUrl
 * @returns {boolean}
 */
export function isAllowedNavigation(requestUrl, gameUrl) {
  if (requestUrl === 'about:blank') return true;

  try {
    const request = new URL(requestUrl);
    const game = new URL(gameUrl);
    return (
      (request.protocol === 'http:' || request.protocol === 'https:') &&
      request.origin === game.origin
    );
  } catch {
    return false;
  }
}

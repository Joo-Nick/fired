import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import splashArt from './assets/splash-art.png';
import { getGameUrl, isAllowedNavigation } from './src/webviewPolicy.mjs';

export default function App() {
  const gameUrl = useMemo(() => getGameUrl(process.env.EXPO_PUBLIC_GAME_URL), []);
  const source = useMemo(() => ({ uri: gameUrl }), [gameUrl]);
  const [loadKey, setLoadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  const handleNavigation = useCallback(
    /** @param {{ url: string }} request */
    (request) => {
      if (isAllowedNavigation(request.url, gameUrl)) return true;

      if (request.url.startsWith('http://') || request.url.startsWith('https://')) {
        Linking.openURL(request.url).catch(() => {});
      }
      return false;
    },
    [gameUrl],
  );

  const retry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setLoadKey((current) => current + 1);
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {error ? (
          <View style={styles.feedback}>
            <Image
              source={splashArt}
              style={styles.feedbackArt}
              contentFit="contain"
            />
            <Text style={styles.feedbackTitle}>게임을 불러오지 못했어요</Text>
            <Text style={styles.feedbackBody}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="게임 다시 불러오기"
              onPress={retry}
              style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
            >
              <Text style={styles.retryLabel}>다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.gameFrame}>
            <WebView
              key={loadKey}
              source={source}
              style={styles.webView}
              originWhitelist={['http://*', 'https://*']}
              onShouldStartLoadWithRequest={handleNavigation}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              onError={(event) => setError(event.nativeEvent.description || '네트워크 연결을 확인해 주세요.')}
              onHttpError={(event) => setError(`서버 응답 오류 (${event.nativeEvent.statusCode})`)}
              allowsInlineMediaPlayback
              cacheEnabled
              domStorageEnabled
              javaScriptEnabled
              mediaPlaybackRequiresUserAction={false}
              mixedContentMode="never"
              setSupportMultipleWindows={false}
            />
            {isLoading && (
              <View pointerEvents="none" style={styles.loading}>
                <Image
                  source={splashArt}
                  style={styles.loadingArt}
                  contentFit="contain"
                />
                <ActivityIndicator color="#ffd83d" size="small" />
              </View>
            )}
          </View>
        )}
        <StatusBar style="light" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14161f',
  },
  gameFrame: {
    flex: 1,
    backgroundColor: '#14161f',
  },
  webView: {
    flex: 1,
    backgroundColor: '#14161f',
  },
  loading: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    backgroundColor: '#14161f',
  },
  loadingArt: {
    width: 240,
    height: 240,
  },
  feedback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 28,
    backgroundColor: '#14161f',
  },
  feedbackArt: {
    width: 180,
    height: 180,
  },
  feedbackTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  feedbackBody: {
    color: '#9aa0c0',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: '#ff4757',
  },
  retryButtonPressed: {
    opacity: 0.78,
  },
  retryLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});

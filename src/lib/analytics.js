import posthog from 'posthog-js';

const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
const enableSessionReplay = import.meta.env.VITE_POSTHOG_ENABLE_SESSION_REPLAY === 'true';

let analyticsReady = false;

export function initAnalytics() {
  if (!posthogKey || analyticsReady) {
    return;
  }

  posthog.init(posthogKey, {
    api_host: posthogHost,
    autocapture: true,
    capture_pageview: false,
    disable_session_recording: !enableSessionReplay,
  });

  analyticsReady = true;
}

export function capturePageView(path) {
  if (!analyticsReady) {
    return;
  }

  posthog.capture('$pageview', {
    path,
  });
}

export function captureEvent(name, properties = {}) {
  if (!analyticsReady) {
    return;
  }

  posthog.capture(name, properties);
}

export function identifyUser(userId, properties = {}) {
  if (!analyticsReady || !userId) {
    return;
  }

  posthog.identify(userId, properties);
}

export function resetAnalytics() {
  if (!analyticsReady) {
    return;
  }

  posthog.reset();
}

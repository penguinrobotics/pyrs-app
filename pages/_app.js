import '@radix-ui/themes/styles.css';
import '../styles/globals.css';
import { Theme } from '@radix-ui/themes';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

// Initialize TimeAgo
if (typeof window !== 'undefined') {
  try {
    TimeAgo.addDefaultLocale(en);
  } catch (e) {
    // Locale already added
  }
}

export default function App({ Component, pageProps }) {
  return (
    <Theme>
      <Component {...pageProps} />
    </Theme>
  );
}

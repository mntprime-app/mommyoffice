import Script from 'next/script';

/**
 * Google Analytics 4 — loaded after interactive, non-blocking.
 * Set NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX in Vercel environment variables.
 */
export default function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', { page_path: window.location.pathname });
        `}
      </Script>
    </>
  );
}

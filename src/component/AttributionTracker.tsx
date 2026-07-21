"use client";

import { useEffect } from "react";

export default function AttributionTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const attribution = {
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
      utmContent: params.get("utm_content"),
      utmTerm: params.get("utm_term"),

      gclid: params.get("gclid"),
      fbclid: params.get("fbclid"),

      landingPage: {
        url: window.location.href,
        path: window.location.pathname,
      },

      referrer: document.referrer,
    };

    sessionStorage.setItem(
      "marketing_attribution",
      JSON.stringify(attribution)
    );
  }, []);

  return null;
}
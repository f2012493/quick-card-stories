
declare global {
  interface Window {
    adsbygoogle: any[];
    gtag: (...args: any[]) => void;
  }
}

export {};

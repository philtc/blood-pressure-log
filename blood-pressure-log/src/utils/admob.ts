import { Capacitor } from '@capacitor/core';

// Dynamic AdMob import to avoid build errors and reduce web bundle size
let AdMob: any;

try {
  // Dynamically import to avoid impacting web bundle
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const admobModule = require('@capacitor-community/admob') as any;
  AdMob = admobModule.AdMob || admobModule;
} catch {
  AdMob = undefined;
}

class AdMobService {
  private static instance: AdMobService;
  private adHeight: number = 0;
  private bannerListener: { remove: () => void } | null = null;
  private heightResolve: ((height: number) => void) | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): AdMobService {
    if (!AdMobService.instance) {
      AdMobService.instance = new AdMobService();
    }
    return AdMobService.instance;
  }

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('AdMob: Not on native platform, skipping initialization');
      return;
    }
    
    if (!AdMob) {
      console.warn('AdMob: AdMob module not available');
      return;
    }
    
    try {
      // Only initialize once
      if (this.isInitialized) {
        console.log('AdMob already initialized');
        return;
      }
      
      console.log('AdMob: Initializing...');
      const result = await AdMob.initialize?.();
      console.log('AdMob initialized successfully', result);
      this.isInitialized = true;
    } catch (error) {
      console.error('AdMob initialization failed:', error);
      throw error;
    }
  }

  async showBanner(): Promise<number> {
    if (!Capacitor.isNativePlatform()) {
      console.log('AdMob: Not on native platform, returning 0 height');
      return 0;
    }
    
    if (!AdMob) {
      console.warn('AdMob: AdMob module not available, returning 0 height');
      return 0;
    }
    
    // Ensure AdMob is initialized first
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Create a promise that will resolve when we get the banner height
      const heightPromise = new Promise<number>((resolve) => {
        this.heightResolve = resolve;
        
        // Set a timeout to resolve with default height if no event received
        setTimeout(() => {
          if (this.heightResolve) {
            this.heightResolve(this.adHeight || 60);
            this.heightResolve = null;
          }
        }, 2000); // Increased timeout to 2 seconds
      });

      // Listen for adaptive banner height to avoid covering content
      if (AdMob.addListener) {
        // Remove previous listener if exists
        if (this.bannerListener && typeof this.bannerListener.remove === 'function') {
          this.bannerListener.remove();
        }
        
        this.bannerListener = await AdMob.addListener('bannerSizeChanged', (info: { height: number }) => {
          if (info && typeof info.height === 'number') {
            this.adHeight = info.height;
            // Resolve the promise with the actual height
            if (this.heightResolve) {
              this.heightResolve(this.adHeight);
              this.heightResolve = null;
            }
          }
        });
      }

      // Show bottom adaptive banner with improved error handling
      // Use test ad unit ID for development (replace with your real ad unit ID for production)
      const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
      const adId = isDev ? 'ca-app-pub-3940256099942544/6300978111' : 'ca-app-pub-2130614856218928/8934846232';
      
      console.log('AdMob: Attempting to show banner with ad ID:', adId, 'isDev:', isDev);
      
      const bannerResult = await AdMob.showBanner?.({
        adId,
        adSize: 'ADAPTIVE_BANNER',
        position: 'BOTTOM_CENTER',
        margin: 0,
      });

      console.log('AdMob banner show result:', bannerResult);

      // Wait for the actual height or timeout
      const height = await heightPromise;
      this.adHeight = height;
      
      console.log('AdMob banner shown with height:', height);
      return height;
    } catch (error) {
      console.warn('AdMob banner failed to show:', error);
      this.adHeight = 0;
      return 0;
    }
  }

  async hideBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform() || !AdMob) return;
    
    try {
      if (AdMob.hideBanner) await AdMob.hideBanner();
      if (this.bannerListener && typeof this.bannerListener.remove === 'function') {
        this.bannerListener.remove();
        this.bannerListener = null;
      }
      // Clear any pending height resolve
      if (this.heightResolve) {
        this.heightResolve(0);
        this.heightResolve = null;
      }
      this.adHeight = 0;
      console.log('AdMob banner hidden');
    } catch (error) {
      console.warn('AdMob banner failed to hide:', error);
    }
  }

  getAdHeight(): number {
    return this.adHeight;
  }
}

export const admobService = AdMobService.getInstance();
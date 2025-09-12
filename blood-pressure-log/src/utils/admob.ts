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
      
      console.log('AdMob: Initializing with app ID:', 'ca-app-pub-2130614856218928~1343119067');
      const result = await AdMob.initialize?.({
        appId: 'ca-app-pub-2130614856218928~1343119067'
      });
      console.log('AdMob initialized successfully', result);
      this.isInitialized = true;
    } catch (error) {
      console.error('AdMob initialization failed:', error);
      // Try without appId parameter as fallback
      try {
        console.log('AdMob: Trying initialization without appId parameter');
        const result = await AdMob.initialize?.();
        console.log('AdMob initialized successfully (fallback)', result);
        this.isInitialized = true;
      } catch (fallbackError) {
        console.error('AdMob initialization failed (fallback):', fallbackError);
        throw fallbackError;
      }
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
      console.log('AdMob: Initializing before showing banner');
      await this.initialize();
    }
    
    try {
      // Create a promise that will resolve when we get the banner height
      const heightPromise = new Promise<number>((resolve) => {
        this.heightResolve = resolve;
        
        // Set a timeout to resolve with default height if no event received
        setTimeout(() => {
          if (this.heightResolve) {
            console.log('AdMob: Banner height timeout, using default height');
            this.heightResolve(this.adHeight || 60);
            this.heightResolve = null;
          }
        }, 3000); // Increased timeout to 3 seconds
      });

      // Listen for adaptive banner height to avoid covering content
      if (AdMob.addListener) {
        // Remove previous listener if exists
        if (this.bannerListener && typeof this.bannerListener.remove === 'function') {
          this.bannerListener.remove();
        }
        
        this.bannerListener = await AdMob.addListener('bannerSizeChanged', (info: { height: number }) => {
          console.log('AdMob: Banner size changed event received', info);
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
      // Use your real production ad unit ID
      const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
      const adId = isDev ? 'ca-app-pub-3940256099942544/6300978111' : 'ca-app-pub-2130614856218928/8934846232';
      
      console.log('AdMob: Attempting to show banner with ad ID:', adId, 'isDev:', isDev);
      
      const bannerOptions = {
        adId,
        adSize: 'ADAPTIVE_BANNER',
        position: 'BOTTOM_CENTER',
        margin: 0,
      };
      
      console.log('AdMob: Banner options', bannerOptions);
      
      const bannerResult = await AdMob.showBanner?.(bannerOptions);

      console.log('AdMob banner show result:', bannerResult);

      // Wait for the actual height or timeout
      const height = await heightPromise;
      this.adHeight = height;
      
      console.log('AdMob banner shown with height:', height);
      return height;
    } catch (error) {
      console.warn('AdMob banner failed to show:', error);
      // Try with test ad unit as fallback if not already using it
      const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
      const currentAdId = isDev ? 'ca-app-pub-3940256099942544/6300978111' : 'ca-app-pub-2130614856218928/8934846232';
      
      if (currentAdId !== 'ca-app-pub-3940256099942544/6300978111') {
        console.log('AdMob: Trying with test ad unit as fallback');
        try {
          const testBannerResult = await AdMob.showBanner?.({
            adId: 'ca-app-pub-3940256099942544/6300978111',
            adSize: 'ADAPTIVE_BANNER',
            position: 'BOTTOM_CENTER',
            margin: 0,
          });
          console.log('AdMob test banner show result:', testBannerResult);
          
          // Wait for the actual height or timeout
          const height = await new Promise<number>((resolve) => {
            setTimeout(() => resolve(60), 2000);
          });
          this.adHeight = height;
          
          console.log('AdMob test banner shown with height:', height);
          return height;
        } catch (testError) {
          console.warn('AdMob test banner also failed:', testError);
        }
      }
      
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
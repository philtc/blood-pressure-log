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
    if (!Capacitor.isNativePlatform() || !AdMob) return;
    
    try {
      // Only initialize once
      if (this.isInitialized) {
        console.log('AdMob already initialized');
        return;
      }
      
      const result = await AdMob.initialize?.();
      console.log('AdMob initialized successfully', result);
      this.isInitialized = true;
    } catch (error) {
      console.warn('AdMob initialization failed:', error);
    }
  }

  async showBanner(): Promise<number> {
    if (!Capacitor.isNativePlatform() || !AdMob) return 0;
    
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
      const bannerResult = await AdMob.showBanner?.({
        adId: 'ca-app-pub-2130614856218928/8934846232',
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
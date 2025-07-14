"use client";

import { useState, useEffect, useRef, type FC } from 'react';
import { Settings, Maximize, Minimize, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const BlackVoidPage: FC = () => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);
  const wakeLockSentinel = useRef<WakeLockSentinel | null>(null);
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  const handleFullscreenToggle = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (error) {
        console.error("Fullscreen request failed:", error);
      }
    } else {
      if (document.exitFullscreen) {
        try {
          await document.exitFullscreen();
        } catch (error) {
          console.error("Exiting fullscreen failed:", error);
        }
      }
    }
  };
  
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleWakeLockToggle = async (checked: boolean) => {
    if (checked) {
      if ('wakeLock' in navigator) {
        try {
          wakeLockSentinel.current = await navigator.wakeLock.request('screen');
          setIsWakeLockActive(true);
          wakeLockSentinel.current.addEventListener('release', () => {
            setIsWakeLockActive(false);
            wakeLockSentinel.current = null;
          });
        } catch (err) {
          console.error(`Wake Lock request failed: ${(err as Error).message}`);
          setIsWakeLockActive(false);
        }
      } else {
        console.warn('Screen Wake Lock API not supported.');
      }
    } else {
      if (wakeLockSentinel.current) {
        await wakeLockSentinel.current.release();
      }
    }
  };

  if (!isClient) {
    return <div className="flex-1 w-full bg-black" aria-label="Loading a black void..."></div>;
  }

  return (
    <div className="flex-1 w-full bg-background flex items-center justify-center transition-colors duration-500">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground/50 hover:text-foreground hover:bg-white/10 rounded-full transition-all duration-300 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 data-[state=open]:bg-white/10 data-[state=open]:text-foreground"
            aria-label="Open settings"
          >
            <Settings className="h-6 w-6 animate-spin-slow" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="center">
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <h4 className="font-semibold leading-none">Black Void</h4>
              <p className="text-sm text-muted-foreground">
                Settings for your personal void.
              </p>
            </div>
            <Separator />
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="fullscreen-btn" className="flex items-center gap-3 font-normal cursor-pointer">
                  {isFullscreen ? (
                    <Minimize className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Maximize className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>Fullscreen</span>
                </Label>
                <Button id="fullscreen-btn" variant="outline" size="sm" onClick={handleFullscreenToggle}>
                  {isFullscreen ? 'Exit' : 'Enter'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="keep-screen-on" className="flex items-center gap-3 font-normal cursor-pointer">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span>Keep Screen On</span>
                </Label>
                <Switch
                  id="keep-screen-on"
                  checked={isWakeLockActive}
                  onCheckedChange={handleWakeLockToggle}
                  aria-label="Toggle keep screen on"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default BlackVoidPage;

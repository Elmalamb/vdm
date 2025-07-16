"use client";

import { useState, useEffect, useRef } from "react";
import { Maximize, Minimize, Power, PowerOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isScreenOn, setIsScreenOn] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);
  
  const resetHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setShowSettings(true);
    hideTimeoutRef.current = setTimeout(() => {
      setShowSettings(false);
    }, 3000);
  };

  useEffect(() => {
    resetHideTimeout();
    window.addEventListener('mousemove', resetHideTimeout);
    return () => {
      window.removeEventListener('mousemove', resetHideTimeout);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const toggleKeepScreenOn = async () => {
    if (!isScreenOn) {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
          setIsScreenOn(true);
          console.log("Screen Wake Lock is active.");
        } else {
           console.error("Wake Lock API not supported.");
        }
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
      }
    } else {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsScreenOn(false);
        console.log("Screen Wake Lock released.");
      }
    }
  };

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center bg-black transition-colors duration-300">
      <div
        className={cn(
          "transition-opacity duration-500",
          showSettings ? "opacity-100" : "opacity-0"
        )}
      >
        <Card className="w-64 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center text-card-foreground">Settings</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6">
            <Button
              variant="outline"
              onClick={toggleFullscreen}
              className="w-full"
            >
              {isFullscreen ? <Minimize className="mr-2 h-4 w-4" /> : <Maximize className="mr-2 h-4 w-4" />}
              {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            </Button>
            <div className="flex w-full items-center justify-between space-x-2">
              <Label htmlFor="keep-screen-on" className="flex items-center">
                {isScreenOn ? <Power className="mr-2 h-4 w-4 text-green-500" /> : <PowerOff className="mr-2 h-4 w-4" />}
                Keep Screen On
              </Label>
              <Switch
                id="keep-screen-on"
                checked={isScreenOn}
                onCheckedChange={toggleKeepScreenOn}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

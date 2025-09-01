"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "../../lib/utils";

interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  large: number;
}

interface ScreenConfig {
  columns: number;
  scale: number;
  height: number;
  gap: number;
  topOffset: number;
}

const breakpoints: ResponsiveBreakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  large: 1440,
};

const screenConfigs: Record<string, ScreenConfig> = {
  mobile: {
    columns: 2,
    scale: 0.25,
    height: 300,
    gap: 4,
    topOffset: 48,
  },
  tablet: {
    columns: 3,
    scale: 0.4,
    height: 400,
    gap: 6,
    topOffset: 64,
  },
  desktop: {
    columns: 4,
    scale: 0.6,
    height: 500,
    gap: 8,
    topOffset: 80,
  },
  large: {
    columns: 4,
    scale: 0.8,
    height: 600,
    gap: 8,
    topOffset: 96,
  },
};

export const ResponsiveThreeDMarquee = ({
  images,
  className,
}: {
  images: string[];
  className?: string;
}) => {
  const [screenSize, setScreenSize] = useState<string>('desktop');
  const [isClient, setIsClient] = useState(false);

  const getScreenSize = useCallback((width: number): string => {
    if (width < breakpoints.mobile) return 'mobile';
    if (width < breakpoints.tablet) return 'tablet';
    if (width < breakpoints.desktop) return 'desktop';
    return 'large';
  }, []);

  const updateScreenSize = useCallback(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      const size = getScreenSize(width);
      setScreenSize(size);
    }
  }, [getScreenSize]);

  useEffect(() => {
    setIsClient(true);
    updateScreenSize();

    const handleResize = () => {
      updateScreenSize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateScreenSize]);

  if (!isClient) {
    return <div className={cn("h-[600px] w-full", className)} />;
  }

  const config = screenConfigs[screenSize];
  const chunkSize = Math.ceil(images.length / config.columns);
  const chunks = Array.from({ length: config.columns }, (_, colIndex) => {
    const start = colIndex * chunkSize;
    return images.slice(start, start + chunkSize);
  });

  return (
    <div
      className={cn(
        "mx-auto block overflow-hidden rounded-2xl w-full",
        className,
      )}
      style={{ height: `${config.height}px` }}
    >
      <div className="flex size-full items-center justify-center">
        <div 
          className="size-[1720px] shrink-0" 
          style={{ 
            transform: `scale(${config.scale})`,
            transformOrigin: 'center center'
          }}
        >
          <div
            className="relative grid size-full origin-top-left"
            style={{
              transform: "rotateX(55deg) rotateY(0deg) rotateZ(-45deg)",
              transformStyle: "preserve-3d",
              top: `${config.topOffset * 4}px`,
              right: '50%',
              gridTemplateColumns: `repeat(${config.columns}, minmax(0, 1fr))`,
              gap: `${config.gap * 8}px`,
            }}
          >
            {chunks.map((subarray, colIndex) => (
              <div
                key={colIndex + "marquee"}
                className="flex flex-col items-start animate-marquee-vertical"
                style={{
                  animationDelay: `${colIndex * 0.5}s`,
                  animationDirection: colIndex % 2 === 0 ? 'normal' : 'reverse',
                  gap: `${config.gap * 8}px`,
                }}
              >
                <GridLineVertical className="-left-4" offset="80px" />
                {subarray.map((image, imageIndex) => (
                  <div className="relative" key={imageIndex + image}>
                    <GridLineHorizontal className="-top-4" offset="20px" />
                    <img
                      key={imageIndex + image}
                      src={image}
                      alt={`U-Download ${imageIndex + 1}`}
                      className="aspect-[970/700] rounded-lg object-cover ring ring-gray-950/5 hover:shadow-2xl transition-shadow duration-300"
                      width={970}
                      height={700}
                      loading="lazy"
                      style={{
                        maxWidth: screenSize === 'mobile' ? '180px' : screenSize === 'tablet' ? '220px' : '270px',
                        height: 'auto',
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const GridLineHorizontal = ({
  className,
  offset,
}: {
  className?: string;
  offset?: string;
}) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(0, 0, 0, 0.2)",
          "--height": "1px",
          "--width": "5px",
          "--fade-stop": "90%",
          "--offset": offset || "200px",
          "--color-dark": "rgba(255, 255, 255, 0.2)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute left-[calc(var(--offset)/2*-1)] h-[var(--height)] w-[calc(100%+var(--offset))]",
        "bg-[linear-gradient(to_right,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_left,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_right,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        "dark:bg-[linear-gradient(to_right,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className,
      )}
    ></div>
  );
};

const GridLineVertical = ({
  className,
  offset,
}: {
  className?: string;
  offset?: string;
}) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(0, 0, 0, 0.2)",
          "--height": "5px",
          "--width": "1px",
          "--fade-stop": "90%",
          "--offset": offset || "150px",
          "--color-dark": "rgba(255, 255, 255, 0.2)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute top-[calc(var(--offset)/2*-1)] h-[calc(100%+var(--offset))] w-[var(--width)]",
        "bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        "dark:bg-[linear-gradient(to_bottom,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className,
      )}
    ></div>
  );
};
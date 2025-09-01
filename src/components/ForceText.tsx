import React from 'react';

interface ForceTextProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ForceText: React.FC<ForceTextProps> = ({ children, className = "", style = {} }) => {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const forcedStyle = {
    ...style,
    color: isDark ? '#ffffff' : '#000000',
  };

  return (
    <span className={className} style={forcedStyle}>
      {children}
    </span>
  );
};
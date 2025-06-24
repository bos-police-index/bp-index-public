import { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  endValue: number;
  duration?: number; // in milliseconds
  className?: string;
  prefix?: string;
  suffix?: string;
  delay?: number; // optional delay before animation starts
  decimals?: number; // number of decimal places to show
  animation?: 'linear' | 'easeOut' | 'easeInOut'; // animation type
  formatter?: (value: number) => string; // custom formatter
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  endValue, 
  duration = 2000, 
  className = '',
  prefix = '',
  suffix = '',
  delay = 0,
  decimals = 0,
  animation = 'easeOut',
  formatter
}) => {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (endValue > 0) {
      startTimeRef.current = null;
      setCount(0);
      
      if (delay > 0) {
        delayTimeoutRef.current = setTimeout(() => {
          startAnimation();
        }, delay);
      } else {
        startAnimation();
      }
    }
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
    };
  }, [endValue, delay]);

  const startAnimation = () => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsedTime = timestamp - startTimeRef.current;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Apply easing based on animation type
      let easedProgress: number;
      
      switch (animation) {
        case 'linear':
          easedProgress = progress;
          break;
        case 'easeInOut':
          // Ease in and out (cubic)
          easedProgress = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          break;
        case 'easeOut':
        default:
          // Ease out (cubic)
          easedProgress = 1 - Math.pow(1 - progress, 3);
          break;
      }
      
      // Calculate the current count value
      const rawCount = easedProgress * endValue;
      const currentCount = decimals > 0 
        ? parseFloat(rawCount.toFixed(decimals)) 
        : Math.floor(rawCount);
      setCount(currentCount);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(endValue); // Ensure we end exactly at the target value
      }
    };

    frameRef.current = requestAnimationFrame(animate);
  };

  // Format the count value
  const formattedCount = formatter 
    ? formatter(count) 
    : count.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });

  return (
    <span className={className}>
      {prefix}{formattedCount}{suffix}
    </span>
  );
};

export default AnimatedCounter;

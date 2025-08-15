import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { chevronUp, chevronDown } from 'ionicons/icons';
import './ScrollPicker.css';

interface ScrollPickerProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  label: string;
  unit?: string;
  step?: number;
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'light' | 'medium' | 'dark';
}

const ScrollPicker: React.FC<ScrollPickerProps> = ({
  min,
  max,
  value,
  onChange,
  label,
  unit = '',
  step = 1,
  color = 'primary',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentValue, setCurrentValue] = useState(value);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Update local state when value prop changes
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = Math.sign(e.deltaY);
    updateValue(currentValue + (delta > 0 ? -step : step));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    
    const touchY = e.touches[0].clientY;
    const deltaY = startY - touchY;
    
    if (Math.abs(deltaY) > 15) { // Threshold to prevent too many updates
      const steps = Math.floor(Math.abs(deltaY) / 15);
      const direction = deltaY > 0 ? 1 : -1;
      updateValue(currentValue + (direction * step * steps));
      setStartY(touchY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const updateValue = (newValue: number) => {
    const clampedValue = Math.min(Math.max(newValue, min), max);
    setCurrentValue(clampedValue);
    onChange(clampedValue);
  };

  const increment = () => updateValue(currentValue + step);
  const decrement = () => updateValue(currentValue - step);

  // Generate visible numbers (current value and adjacent values)
  const visibleNumbers = [];
  const visibleCount = 3; // Number of visible items (odd number works best)
  const start = Math.max(min, currentValue - Math.floor(visibleCount / 2) * step);
  const end = Math.min(max, start + (visibleCount - 1) * step);
  
  for (let i = start; i <= end; i += step) {
    visibleNumbers.push(i);
  }

  return (
    <div className="scroll-picker">
      <div className="picker-label">{label}</div>
      <div 
        className={`picker-container ${color ? 'color-' + color : ''}`}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        ref={pickerRef}
      >
        <button 
          type="button" 
          className="picker-button increment" 
          onClick={increment}
          aria-label={`Increase ${label}`}
        >
          <IonIcon icon={chevronUp} />
        </button>
        
        <div className="picker-values">
          {visibleNumbers.map((num) => (
            <div 
              key={num}
              className={`picker-value ${num === currentValue ? 'selected' : ''}`}
              onClick={() => updateValue(num)}
            >
              {num}
            </div>
          ))}
        </div>
        
        <div className="picker-unit">{unit}</div>
        
        <button 
          type="button" 
          className="picker-button decrement" 
          onClick={decrement}
          aria-label={`Decrease ${label}`}
        >
          <IonIcon icon={chevronDown} />
        </button>
      </div>
    </div>
  );
};

export default ScrollPicker;

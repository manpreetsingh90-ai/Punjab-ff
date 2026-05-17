import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';

interface JoystickData {
  x: number;
  y: number;
  active: boolean;
}

interface MobileControlsProps {
  onMove: (data: JoystickData) => void;
  onAim: (data: JoystickData) => void;
}

export default function MobileControls({ onMove, onAim }: MobileControlsProps) {
  const moveJoystickRef = useRef<HTMLDivElement>(null);
  const aimJoystickRef = useRef<HTMLDivElement>(null);

  const [moveJoystick, setMoveJoystick] = useState({ x: 0, y: 0, active: false });
  const [aimJoystick, setAimJoystick] = useState({ x: 0, y: 0, active: false });

  const handleTouch = (
    e: React.TouchEvent, 
    ref: React.RefObject<HTMLDivElement | null>, 
    setter: React.Dispatch<React.SetStateAction<JoystickData>>,
    callback: (data: JoystickData) => void
  ) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Find the touch associated with this joystick partition
    let touch: React.Touch | undefined;
    for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        const isLeft = t.clientX < window.innerWidth / 2;
        if (ref === moveJoystickRef && isLeft) { touch = t; break; }
        if (ref === aimJoystickRef && !isLeft) { touch = t; break; }
    }

    if (!touch) {
        const reset = { x: 0, y: 0, active: false };
        setter(reset);
        callback(reset);
        return;
    }

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const maxRadius = rect.width / 2;
    
    const limitedX = (dx / (distance || 1)) * Math.min(distance, maxRadius);
    const limitedY = (dy / (distance || 1)) * Math.min(distance, maxRadius);
    
    const normalized = {
        x: limitedX / maxRadius,
        y: limitedY / maxRadius,
        active: true
    };
    
    setter(normalized);
    callback(normalized);
  };

  const handleEnd = (setter: (data: JoystickData) => void, callback: (data: JoystickData) => void) => {
    const reset = { x: 0, y: 0, active: false };
    setter(reset);
    callback(reset);
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex justify-between items-end p-8 md:p-12">
      {/* Move Joystick */}
      <div 
        ref={moveJoystickRef}
        className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center pointer-events-auto touch-none"
        onTouchStart={(e) => handleTouch(e, moveJoystickRef, setMoveJoystick, onMove)}
        onTouchMove={(e) => handleTouch(e, moveJoystickRef, setMoveJoystick, onMove)}
        onTouchEnd={() => handleEnd(setMoveJoystick, onMove)}
        onTouchCancel={() => handleEnd(setMoveJoystick, onMove)}
      >
        <motion.div 
          animate={{ x: moveJoystick.x * 40, y: moveJoystick.y * 40 }}
          className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 border-2 border-white/30 shadow-lg"
        />
      </div>

      {/* Aim/Shoot Joystick */}
      <div 
        ref={aimJoystickRef}
        className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-orange-500/5 border-2 border-orange-500/20 flex items-center justify-center pointer-events-auto touch-none"
        onTouchStart={(e) => handleTouch(e, aimJoystickRef, setAimJoystick, onAim)}
        onTouchMove={(e) => handleTouch(e, aimJoystickRef, setAimJoystick, onAim)}
        onTouchEnd={() => handleEnd(setAimJoystick, onAim)}
        onTouchCancel={() => handleEnd(setAimJoystick, onAim)}
      >
        <motion.div 
          animate={{ x: aimJoystick.x * 40, y: aimJoystick.y * 40 }}
          className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-orange-500/40 border-2 border-orange-500/60 shadow-lg flex items-center justify-center"
        >
            <div className="w-2 h-2 rounded-full bg-white animate-ping" />
        </motion.div>
      </div>
    </div>
  );
}

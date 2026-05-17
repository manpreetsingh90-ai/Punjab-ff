/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Heart, Activity, Play, RotateCcw, Crosshair, Shield, Zap, Share2 } from 'lucide-react';
import GameCanvas from './components/GameCanvas';
import MobileControls from './components/MobileControls';
import { WeaponType } from './game/GameEngine';

export type GameState = 'START' | 'PLAYING' | 'GAMEOVER';

interface JoystickData {
  x: number;
  y: number;
  active: boolean;
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [armor, setArmor] = useState(0);
  const [weapon, setWeapon] = useState<WeaponType>(WeaponType.PISTOL);
  const [isOutsideZone, setIsOutsideZone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [mobileMove, setMobileMove] = useState<JoystickData>({ x: 0, y: 0, active: false });
  const [mobileAim, setMobileAim] = useState<JoystickData>({ x: 0, y: 0, active: false });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleStartGame = () => {
    setScore(0);
    setHealth(100);
    setArmor(0);
    setWeapon(WeaponType.PISTOL);
    setGameState('PLAYING');
  };

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    setGameState('GAMEOVER');
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Free Fire Punjab',
      text: 'Check out this epic survival shooter!',
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 text-slate-50 font-sans select-none touch-none">
      {/* HUD Layer */}
      {gameState === 'PLAYING' && (
        <div className="absolute inset-0 pointer-events-none z-10 p-4 md:p-6 flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-white/10 shadow-xl"
            >
              <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
              <div className="flex flex-col">
                <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Eliminations</span>
                <span className="text-xl md:text-2xl font-black text-yellow-400">{score}</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-white/10 shadow-xl"
            >
              <Heart className={`w-4 h-4 md:w-5 md:h-5 ${health < 30 ? 'text-red-500 animate-pulse' : 'text-green-500'}`} />
              <div className="flex flex-col flex-1">
                <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Biometrics</span>
                <div className="flex items-center gap-2 md:gap-4">
                  <span className={`text-xl md:text-2xl font-black min-w-[3ch] ${health < 30 ? 'text-red-500' : 'text-green-400'}`}>{Math.floor(health)}</span>
                  <div className="flex-1 w-20 md:w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: '100%' }}
                      animate={{ width: `${health}%` }}
                      className={`h-full ${health < 30 ? 'bg-red-500' : 'bg-green-500'}`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-white/10 shadow-xl"
            >
              <Shield className={`w-4 h-4 md:w-5 md:h-5 ${armor > 0 ? 'text-blue-400' : 'text-slate-600'}`} />
              <div className="flex flex-col flex-1">
                <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Tactical Vest</span>
                <div className="flex items-center gap-2 md:gap-4 min-w-[120px]">
                  <span className={`text-xl md:text-2xl font-black min-w-[3ch] ${armor > 0 ? 'text-blue-400' : 'text-slate-600'}`}>{Math.floor(armor)}</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: `${armor}%` }}
                      className="h-full bg-blue-500"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
            <AnimatePresence>
              {isOutsideZone && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 bg-red-600/20 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-red-500/50 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                >
                  <Activity className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
                  <span className="font-bold uppercase tracking-tighter italic text-[10px] md:text-base">Warning: Radiation Detected</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              layout
              className="bg-black/60 backdrop-blur-md px-3 py-2 md:px-5 md:py-3 rounded-xl border border-orange-500/30 flex items-center gap-3 md:gap-4 shadow-xl mb-2 md:mb-4"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-500/20 rounded-lg flex items-center justify-center border border-orange-500/30">
                <Zap className="w-5 h-5 md:w-6 md:h-6 text-orange-500 fill-orange-500/20" />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-1">Active Armament</span>
                <span className="text-sm md:text-xl font-black tracking-tight text-white italic">{weapon}</span>
              </div>
            </motion.div>
            
            {!isMobile && (
              <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-[10px] md:text-xs text-slate-400 font-mono leading-tight">
                PROTO: GRID-X4000<br />
                W-A-S-D: ENGAGE<br />
                M1: NEUTRALIZE
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Menu Overlay */}
      <AnimatePresence mode="wait">
        {(gameState === 'START' || gameState === 'GAMEOVER') && (
          <motion.div 
            key={gameState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md mx-4 bg-slate-900/90 p-8 md:p-10 rounded-3xl border-2 border-orange-500/50 shadow-[0_0_60px_rgba(249,115,22,0.3)] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-yellow-500 to-red-600 animate-pulse" />
              
              <div className="absolute top-4 right-4 z-30">
                <button 
                  onClick={handleShare}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                  title="Share Game"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-red-600 uppercase leading-none">
                {gameState === 'START' ? 'FREE FIRE PUNJAB' : 'ELIMINATED'}
              </h1>
              
              <p className="text-slate-400 font-medium tracking-wide mb-8 mt-4 uppercase text-[10px] md:text-sm">
                {gameState === 'START' ? 'The ultimate battle royale simulator' : 'Better luck next time, survivor.'}
              </p>

              {gameState === 'GAMEOVER' && (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="mb-8 p-4 md:p-6 bg-white/5 rounded-2xl border border-white/10"
                >
                  <div className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-slate-500 font-bold mb-2">Combat Record</div>
                  <div className="text-4xl md:text-5xl font-black text-orange-500">{score} KILLS</div>
                </motion.div>
              )}

              <button 
                onClick={handleStartGame}
                className="group relative w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-black py-4 md:py-5 px-8 rounded-2xl text-xl md:text-2xl transition-all hover:scale-[1.03] active:scale-[0.97] shadow-xl shadow-orange-500/30"
              >
                {gameState === 'START' ? (
                  <>
                    <Play className="w-6 h-6 md:w-7 md:h-7 fill-current" />
                    BATTLE START
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-6 h-6 md:w-7 md:h-7" />
                    REDEPLOY
                  </>
                )}
              </button>
              
              <div className="mt-8 flex justify-center gap-6 md:gap-8 text-slate-500">
                {isMobile ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] md:text-xs uppercase font-black tracking-widest text-orange-500/60">Touch Controls Enabled</span>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center gap-1 md:gap-2">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg border border-white/20 flex items-center justify-center font-black text-[10px] md:text-sm">WASD</div>
                      <span className="text-[8px] md:text-[10px] uppercase font-bold tracking-widest text-slate-600">Movement</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 md:gap-2">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg border border-white/20 flex items-center justify-center font-black text-[10px] md:text-sm"><Crosshair className="w-4 h-4 md:w-5 md:h-5 text-orange-500" /></div>
                      <span className="text-[8px] md:text-[10px] uppercase font-bold tracking-widest text-slate-600">Fire</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 md:gap-2 text-center">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg border-2 border-orange-500/40 flex items-center justify-center font-black text-[10px] md:text-sm animate-pulse">!</div>
                      <span className="text-[8px] md:text-[10px] uppercase font-bold tracking-widest text-slate-600">Loot</span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {gameState === 'PLAYING' && isMobile && (
        <MobileControls onMove={setMobileMove} onAim={setMobileAim} />
      )}

      <GameCanvas 
        gameState={gameState} 
        onGameOver={handleGameOver} 
        onScoreUpdate={setScore}
        onHealthUpdate={setHealth}
        onArmorUpdate={setArmor}
        onWeaponUpdate={setWeapon}
        onZoneStatusUpdate={setIsOutsideZone}
        mobileMove={mobileMove}
        mobileAim={mobileAim}
      />
    </div>
  );
}

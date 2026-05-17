/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { 
  Player, 
  Projectile, 
  Enemy, 
  Particle, 
  Loot,
  WeaponType,
  WEAPON_DATA,
  WORLD_SIZE, 
  PLAYER_SPEED,
  ENEMY_SPAWN_RATE, 
  ZONE_SHRINK_INTERVAL 
} from '../game/GameEngine';

interface JoystickData {
  x: number;
  y: number;
  active: boolean;
}

interface GameCanvasProps {
  gameState: 'START' | 'PLAYING' | 'GAMEOVER';
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  onHealthUpdate: (health: number) => void;
  onArmorUpdate: (armor: number) => void;
  onWeaponUpdate: (type: WeaponType) => void;
  onZoneStatusUpdate: (isOutside: boolean) => void;
  mobileMove?: JoystickData;
  mobileAim?: JoystickData;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  onGameOver, 
  onScoreUpdate, 
  onHealthUpdate,
  onArmorUpdate,
  onWeaponUpdate,
  onZoneStatusUpdate,
  mobileMove,
  mobileAim
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const gameRef = useRef<{
    player: Player;
    projectiles: Projectile[];
    enemies: Enemy[];
    particles: Particle[];
    loots: Loot[];
    safeZone: { x: number; y: number; radius: number; targetRadius: number; shrinkTimer: number };
    score: number;
    frames: number;
    keys: Record<string, boolean>;
    mouse: { x: number; y: number };
    isMouseDown: boolean;
    isRightMouseDown: boolean;
    shake: number;
    notifications: { x: number; y: number; text: string; alpha: number; color?: string }[];
  }>({
    player: new Player(WORLD_SIZE / 2, WORLD_SIZE / 2),
    projectiles: [],
    enemies: [],
    particles: [],
    loots: [],
    safeZone: { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2, radius: WORLD_SIZE, targetRadius: WORLD_SIZE * 0.8, shrinkTimer: ZONE_SHRINK_INTERVAL },
    score: 0,
    frames: 0,
    keys: {},
    mouse: { x: 0, y: 0 },
    isMouseDown: false,
    isRightMouseDown: false,
    shake: 0,
    notifications: []
  });

  const initGame = useCallback(() => {
    const startX = WORLD_SIZE / 2;
    const startY = WORLD_SIZE / 2;
    gameRef.current = {
      player: new Player(startX, startY),
      projectiles: [],
      enemies: [],
      particles: [],
      loots: Array.from({ length: 50 }, () => {
        const types: Array<'WEAPON' | 'ARMOR' | 'MEDKIT'> = ['WEAPON', 'ARMOR', 'MEDKIT'];
        const type = types[Math.floor(Math.random() * types.length)];
        const weaponTypes = [WeaponType.SMG, WeaponType.SNIPER, WeaponType.SHOTGUN];
        const wType = type === 'WEAPON' ? weaponTypes[Math.floor(Math.random() * weaponTypes.length)] : undefined;
        return new Loot(Math.random() * WORLD_SIZE, Math.random() * WORLD_SIZE, type, wType);
      }),
      safeZone: { 
        x: WORLD_SIZE / 2, 
        y: WORLD_SIZE / 2, 
        radius: WORLD_SIZE, 
        targetRadius: WORLD_SIZE * 0.6, 
        shrinkTimer: ZONE_SHRINK_INTERVAL 
      },
      score: 0,
      frames: 0,
      keys: {},
      mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      isMouseDown: false,
      isRightMouseDown: false,
      shake: 0,
      notifications: []
    };
    onWeaponUpdate(WeaponType.PISTOL);
    onArmorUpdate(0);
  }, [onArmorUpdate, onWeaponUpdate]);

  const shoot = useCallback(() => {
    const game = gameRef.current;
    const { player, mouse, projectiles } = game;
    const now = Date.now();
    const config = WEAPON_DATA[player.weapon];

    if (now - player.lastFired < config.fireRate) return;
    
    player.lastFired = now;
    game.shake = player.weapon === WeaponType.SNIPER ? 15 : 5;

    let angle: number;
    if (mobileAim?.active) {
        angle = Math.atan2(mobileAim.y, mobileAim.x);
    } else {
        angle = Math.atan2(mouse.y - window.innerHeight / 2, mouse.x - window.innerWidth / 2);
    }
    
    for (let i = 0; i < config.projectileCount; i++) {
        const spreadOffset = (Math.random() - 0.5) * config.spread;
        const p = new Projectile(player.x, player.y, angle + spreadOffset);
        p.life = config.range; // Range limit
        p.color = config.color;
        projectiles.push(p);
    }
    
    // Recoil
    player.x -= Math.cos(angle) * (player.weapon === WeaponType.SNIPER ? 10 : 2);
    player.y -= Math.sin(angle) * (player.weapon === WeaponType.SNIPER ? 10 : 2);
  }, [mobileAim]);

  const spawnEnemy = () => {
    const { frames, player, enemies } = gameRef.current;
    if (frames % ENEMY_SPAWN_RATE === 0) {
      const distance = Math.max(window.innerWidth, window.innerHeight) / 2 + 200;
      const angle = Math.random() * Math.PI * 2;
      let x = player.x + Math.cos(angle) * distance;
      let y = player.y + Math.sin(angle) * distance;
      x = Math.max(20, Math.min(WORLD_SIZE - 20, x));
      y = Math.max(20, Math.min(WORLD_SIZE - 20, y));
      enemies.push(new Enemy(x, y));
    }
  };

  const drawMinimap = (ctx: CanvasRenderingContext2D) => {
    const { player, safeZone, enemies } = gameRef.current;
    const size = 150;
    const padding = 20;
    const x = window.innerWidth - size - padding;
    const y = padding;

    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeRect(0, 0, size, size);

    const scale = size / WORLD_SIZE;

    // Safe zone
    ctx.beginPath();
    ctx.arc(safeZone.x * scale, safeZone.y * scale, safeZone.radius * scale, 0, Math.PI * 2);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Enemies
    ctx.fillStyle = '#ef4444';
    enemies.forEach(e => {
        ctx.beginPath();
        ctx.arc(e.x * scale, e.y * scale, 1, 0, Math.PI * 2);
        ctx.fill();
    });

    // Player
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.x * scale, player.y * scale, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawNotifications = (ctx: CanvasRenderingContext2D) => {
    const { notifications } = gameRef.current;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    for (let i = notifications.length - 1; i >= 0; i--) {
        const n = notifications[i];
        ctx.save();
        ctx.globalAlpha = n.alpha;
        ctx.fillStyle = n.color || '#fff';
        ctx.fillText(n.text, n.x, n.y);
        ctx.restore();
        n.y -= 1;
        n.alpha -= 0.02;
        if (n.alpha <= 0) notifications.splice(i, 1);
    }
  };

  const drawSniperScope = (ctx: CanvasRenderingContext2D) => {
    const { player, isRightMouseDown } = gameRef.current;
    if (player.weapon !== WeaponType.SNIPER || !isRightMouseDown) return;

    const canvas = ctx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scopeRadius = Math.min(canvas.width, canvas.height) * 0.4;

    ctx.save();
    
    // Obscure background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.arc(centerX, centerY, scopeRadius, 0, Math.PI * 2, true);
    ctx.fill();

    // Scope border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(centerX, centerY, scopeRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, scopeRadius + 5, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.5)';
    ctx.lineWidth = 1;
    // Horizontal
    ctx.beginPath();
    ctx.moveTo(centerX - scopeRadius, centerY);
    ctx.lineTo(centerX + scopeRadius, centerY);
    ctx.stroke();
    // Vertical
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - scopeRadius);
    ctx.lineTo(centerX, centerY + scopeRadius);
    ctx.stroke();

    // Inner markings
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#f87171';
    ctx.fill();

    ctx.restore();
  };

  const drawEnvironment = (ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number) => {
    const { safeZone, loots } = gameRef.current;
    const canvas = ctx.canvas;

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 200;
    const startX = Math.floor(cameraX / gridSize) * gridSize;
    const startY = Math.floor(cameraY / gridSize) * gridSize;

    for (let x = startX; x < cameraX + canvas.width + gridSize; x += gridSize) {
        if (x >= 0 && x <= WORLD_SIZE) {
            ctx.beginPath(); ctx.moveTo(x, Math.max(0, cameraY)); ctx.lineTo(x, Math.min(WORLD_SIZE, cameraY + canvas.height)); ctx.stroke();
        }
    }
    for (let y = startY; y < cameraY + canvas.height + gridSize; y += gridSize) {
        if (y >= 0 && y <= WORLD_SIZE) {
            ctx.beginPath(); ctx.moveTo(Math.max(0, cameraX), y); ctx.lineTo(Math.min(WORLD_SIZE, cameraX + canvas.width), y); ctx.stroke();
        }
    }

    // World Border
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    loots.forEach(l => l.draw(ctx));

    // Safe Zone
    ctx.save();
    ctx.fillStyle = 'rgba(0, 50, 255, 0.15)';
    ctx.fillRect(cameraX, cameraY, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(safeZone.x, safeZone.y, safeZone.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  };

  const update = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || gameState !== 'PLAYING') return;

    const game = gameRef.current;
    const { player, projectiles, enemies, particles, safeZone, loots } = game;

    if (game.isMouseDown || (mobileAim?.active)) {
        shoot();
    }

    // Shake
    if (game.shake > 0) game.shake *= 0.9;
    else game.shake = 0;

    const cameraX = player.x - canvas.width / 2 + (Math.random() - 0.5) * game.shake;
    const cameraY = player.y - canvas.height / 2 + (Math.random() - 0.5) * game.shake;

    // Clear
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-cameraX, -cameraY);

    drawEnvironment(ctx, cameraX, cameraY);
    drawNotifications(ctx);

    // Zone Logic
    safeZone.shrinkTimer--;
    if (safeZone.shrinkTimer <= 0) {
      safeZone.targetRadius *= 0.7;
      safeZone.x += (Math.random() - 0.5) * 400;
      safeZone.shrinkTimer = ZONE_SHRINK_INTERVAL;
    }
    if (safeZone.radius > safeZone.targetRadius) safeZone.radius -= 0.3;

    const distToZone = Math.hypot(player.x - safeZone.x, player.y - safeZone.y);
    const isOutside = distToZone > safeZone.radius;
    onZoneStatusUpdate(isOutside);
    if (isOutside && game.frames % 60 === 0) {
      player.health -= 5;
      onHealthUpdate(player.health);
    }

    // Loot processing
    for (let i = loots.length - 1; i >= 0; i--) {
        const l = loots[i];
        if (Math.hypot(player.x - l.x, player.y - l.y) < player.radius + l.radius) {
            let msg = '';
            if (l.type === 'WEAPON' && l.weaponType) {
                player.weapon = l.weaponType;
                onWeaponUpdate(l.weaponType);
                msg = `Equipped ${l.weaponType}`;
            } else if (l.type === 'ARMOR') {
                player.armor = 100;
                onArmorUpdate(player.armor);
                msg = 'Armor Restored';
            } else if (l.type === 'MEDKIT') {
                player.health = Math.min(100, player.health + 40);
                onHealthUpdate(player.health);
                msg = 'Health Restored';
            }
            game.notifications.push({ x: l.x, y: l.y - 20, text: msg, alpha: 1 });
            loots.splice(i, 1);
        }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw(ctx);
      if (particles[i].alpha <= 0) particles.splice(i, 1);
    }

    // Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      projectiles[i].update();
      projectiles[i].draw(ctx);
      if (projectiles[i].life <= 0 || projectiles[i].x < 0 || projectiles[i].x > WORLD_SIZE || projectiles[i].y < 0 || projectiles[i].y > WORLD_SIZE) {
        projectiles.splice(i, 1);
      }
    }

    // Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      enemy.update(player);
      enemy.draw(ctx);

      // Collisions: Bullet vs Enemy
      for (let j = projectiles.length - 1; j >= 0; j--) {
        const proj = projectiles[j];
        if (Math.hypot(proj.x - enemy.x, proj.y - enemy.y) < enemy.radius + proj.radius) {
          for (let p = 0; p < 5; p++) particles.push(new Particle(proj.x, proj.y, '#facc15'));
          const dmg = WEAPON_DATA[player.weapon].damage;
          projectiles.splice(j, 1);
          enemy.health -= dmg;

          game.notifications.push({ 
            x: enemy.x + (Math.random() - 0.5) * 30, 
            y: enemy.y - 20, 
            text: Math.floor(dmg).toString(), 
            alpha: 1, 
            color: player.weapon === WeaponType.SNIPER ? '#f87171' : '#fbbf24' 
          });

          if (enemy.health <= 0) {
            for (let p = 0; p < 15; p++) particles.push(new Particle(enemy.x, enemy.y, enemy.color));
            if (Math.random() < 0.2) {
                loots.push(new Loot(enemy.x, enemy.y, 'MEDKIT'));
            }
            enemies.splice(i, 1);
            game.score++;
            onScoreUpdate(game.score);
          }
          break;
        }
      }

      // Collision: Enemy vs Player
      if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.radius + enemy.radius) {
        let dmg = 0.4;
        if (player.armor > 0) {
            player.armor -= dmg;
            onArmorUpdate(player.armor);
            if (player.armor < 0) player.armor = 0;
        } else {
            player.health -= dmg;
            onHealthUpdate(player.health);
        }
        if (game.frames % 10 === 0) particles.push(new Particle(player.x, player.y, '#ef4444'));
      }
    }

    if (mobileMove?.active) {
        player.x += mobileMove.x * PLAYER_SPEED;
        player.y += mobileMove.y * PLAYER_SPEED;
        player.x = Math.max(player.radius, Math.min(WORLD_SIZE - player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(WORLD_SIZE - player.radius, player.y));
    } else {
        player.update(game.keys);
    }

    // Update aim visualization for player draw
    const aimX = mobileAim?.active ? window.innerWidth/2 + mobileAim.x * 100 : game.mouse.x;
    const aimY = mobileAim?.active ? window.innerHeight/2 + mobileAim.y * 100 : game.mouse.y;
    player.draw(ctx, aimX, aimY, canvas.width, canvas.height);

    ctx.restore();

    drawMinimap(ctx);
    drawSniperScope(ctx);

    spawnEnemy();
    if (player.health <= 0) onGameOver(game.score);

    game.frames++;
    requestRef.current = requestAnimationFrame(update);
  }, [gameState, onGameOver, onScoreUpdate, onHealthUpdate, onArmorUpdate, onWeaponUpdate, onZoneStatusUpdate]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      initGame();
      requestRef.current = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, initGame, update]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const handleKeyDown = (e: KeyboardEvent) => { gameRef.current.keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { gameRef.current.keys[e.key.toLowerCase()] = false; };
    const handleMouseMove = (e: MouseEvent) => { gameRef.current.mouse = { x: e.clientX, y: e.clientY }; };
    const handleMouseDown = (e: MouseEvent) => {
      if (gameState !== 'PLAYING') return;
      if (e.button === 0) gameRef.current.isMouseDown = true;
      if (e.button === 2) gameRef.current.isRightMouseDown = true;
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) gameRef.current.isMouseDown = false;
      if (e.button === 2) gameRef.current.isRightMouseDown = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', e => e.preventDefault());

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gameState, shoot]);

  return <canvas ref={canvasRef} className="block w-full h-full" />;
};

export default GameCanvas;

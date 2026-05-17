/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const WORLD_SIZE = 4000; // Larger map
export const PLAYER_SPEED = 5;
export const PROJECTILE_SPEED = 18;
export const ENEMY_SPAWN_RATE = 75; 
export const ZONE_SHRINK_INTERVAL = 1200; 

export enum WeaponType {
  PISTOL = 'PISTOL',
  SMG = 'SMG',
  SNIPER = 'SNIPER',
  SHOTGUN = 'SHOTGUN'
}

export interface WeaponConfig {
  damage: number;
  fireRate: number; // ms
  spread: number;
  projectileCount: number;
  range: number;
  color: string;
}

export interface Velocity {
  x: number;
  y: number;
}

export const WEAPON_DATA: Record<WeaponType, WeaponConfig> = {
  [WeaponType.PISTOL]: { damage: 15, fireRate: 400, spread: 0.05, projectileCount: 1, range: 60, color: '#fbbf24' },
  [WeaponType.SMG]: { damage: 10, fireRate: 100, spread: 0.15, projectileCount: 1, range: 50, color: '#60a5fa' },
  [WeaponType.SNIPER]: { damage: 100, fireRate: 1500, spread: 0, projectileCount: 1, range: 180, color: '#f87171' },
  [WeaponType.SHOTGUN]: { damage: 12, fireRate: 800, spread: 0.4, projectileCount: 6, range: 35, color: '#fb923c' }
};

export class Player {
  x: number;
  y: number;
  radius: number = 20;
  health: number = 100;
  armor: number = 0; // 0 to 100
  color: string = '#3b82f6';
  weapon: WeaponType = WeaponType.PISTOL;
  lastFired: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D, mouseX: number, mouseY: number, canvasWidth: number, canvasHeight: number) {
    // Body
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = this.armor > 0 ? '#fbbf24' : '#2563eb'; // Gold border if armored
    ctx.stroke();

    // Aiming line
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    const aimAngle = Math.atan2(mouseY - canvasHeight / 2, mouseX - canvasWidth / 2);
    const lineLen = this.weapon === WeaponType.SNIPER ? 60 : 40;
    ctx.lineTo(this.x + Math.cos(aimAngle) * lineLen, this.y + Math.sin(aimAngle) * lineLen);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  update(keys: Record<string, boolean>) {
    let dx = 0;
    let dy = 0;
    if (keys.w || keys.arrowup) dy -= 1;
    if (keys.s || keys.arrowdown) dy += 1;
    if (keys.a || keys.arrowleft) dx -= 1;
    if (keys.d || keys.arrowright) dx += 1;

    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
    }

    this.x += dx * PLAYER_SPEED;
    this.y += dy * PLAYER_SPEED;

    this.x = Math.max(this.radius, Math.min(WORLD_SIZE - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(WORLD_SIZE - this.radius, this.y));
  }
}

export class Loot {
  x: number;
  y: number;
  type: 'WEAPON' | 'ARMOR' | 'MEDKIT';
  weaponType?: WeaponType;
  radius: number = 15;
  id: string;

  constructor(x: number, y: number, type: 'WEAPON' | 'ARMOR' | 'MEDKIT', weaponType?: WeaponType) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.weaponType = weaponType;
    this.id = Math.random().toString(36).substr(2, 9);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.rect(this.x - 10, this.y - 10, 20, 20);
    if (this.type === 'WEAPON') ctx.fillStyle = '#fb923c';
    else if (this.type === 'ARMOR') ctx.fillStyle = '#fbbf24';
    else ctx.fillStyle = '#4ade80';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export class Projectile {
  x: number;
  y: number;
  velocity: Velocity;
  radius: number = 5;
  life: number = 100;
  color: string = '#facc15';

  constructor(x: number, y: number, angle: number) {
    this.x = x;
    this.y = y;
    this.velocity = {
      x: Math.cos(angle) * PROJECTILE_SPEED,
      y: Math.sin(angle) * PROJECTILE_SPEED
    };
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update() {
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.life--;
  }
}

export class Enemy {
  x: number;
  y: number;
  radius: number = 18;
  health: number = 30;
  speed: number;
  color: string = '#ef4444';

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.speed = Math.random() * 2 + 1.5;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#991b1b';
    ctx.stroke();
  }

  update(target: Player) {
    const angle = Math.atan2(target.y - this.y, target.x - this.x);
    this.x += Math.cos(angle) * this.speed;
    this.y += Math.sin(angle) * this.speed;
  }
}

export class Particle {
  x: number;
  y: number;
  velocity: Velocity;
  radius: number;
  color: string;
  alpha: number = 1;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random() * 3 + 1;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;
    this.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    };
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  update() {
    this.velocity.x *= 0.95;
    this.velocity.y *= 0.95;
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.alpha -= 0.02;
  }
}

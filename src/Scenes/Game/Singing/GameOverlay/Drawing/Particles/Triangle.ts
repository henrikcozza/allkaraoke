import triangle from 'Scenes/Game/Singing/GameOverlay/Drawing/Elements/triangle';
import Particle from '../interfaces';
import spreadValue from './spreadValue';

const baseTtl = (50 / 60) * 1000;
const ttlSpread = (25 / 60) * 1000;

const velocityModifier = 1.65;

export default class TriangleParticle implements Particle {
    public finished = false;

    private ttl;
    private startingTtl;
    private velocityX;
    private velocityY;
    private width;
    private initialAngle;
    private heightModifier;

    constructor(private x: number, private y: number, private color: string, private delay: number) {
        this.startingTtl = this.ttl = spreadValue(baseTtl, ttlSpread);
        this.velocityX = velocityModifier * Math.random() - velocityModifier / 2;
        this.velocityY = velocityModifier * Math.random() - velocityModifier / 2;
        this.width = 25;
        this.initialAngle = 180 - Math.random() * 360;
        this.heightModifier = 0.5 + Math.random() / 2;
    }
    public tick = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, delta: number) => {
        if (this.delay-- > 0) return;

        const percentage = this.ttl / this.startingTtl;
        const elapsedTicks = this.startingTtl - this.ttl;

        const width = this.width * percentage;
        const height = this.width * this.heightModifier * percentage;

        const x = this.x - width / 2 + elapsedTicks * this.velocityX;
        const y = this.y - height / 2 + elapsedTicks * this.velocityY;

        triangle(ctx, x, y, width, height, this.initialAngle + elapsedTicks, this.color, 0.8 * percentage);

        this.ttl = this.ttl - delta;
        this.finished = this.ttl <= 0;
    };
}

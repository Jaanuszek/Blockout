export class GameState {
    private score: number = 0;
    private isRunning: boolean = false;
    private movingEnabled: boolean = true;
    private canGenerateNext: boolean = false;
    private readonly moveTime: number = 0.5;
    private currentStep: number = 0;
    private stepTimer: number = 0.0;

    public getScore(): number {
        return this.score;
    }

    public addScore(points: number): void {
        this.score += points;
    }

    public resetScore(): void {
        this.score = 0;
    }

    public isGameRunning(): boolean {
        return this.isRunning;
    }

    public startGame(): void {
        this.isRunning = true;
    }

    public stopGame(): void {
        this.isRunning = false;
    }

    public isMovingEnabled(): boolean {
        return this.movingEnabled;
    }

    public enableMoving(): void {
        this.movingEnabled = true;
    }

    public disableMoving(): void {
        this.movingEnabled = false;
    }

    public canGenerate(): boolean {
        return this.canGenerateNext;
    }

    public setCanGenerate(value: boolean): void {
        this.canGenerateNext = value;
    }

    public getMoveTime(): number {
        return this.moveTime;
    }

    public getCurrentStep(): number {
        return this.currentStep;
    }

    public incrementStep(): void {
        this.currentStep++;
    }

    public resetStep(): void {
        this.currentStep = 0;
    }

    public getStepTimer(): number {
        return this.stepTimer;
    }

    public addStepTime(delta: number): void {
        this.stepTimer += delta;
    }

    public resetStepTimer(): void {
        this.stepTimer = 0;
    }

    public subtractStepTime(time: number): void {
        this.stepTimer -= time;
    }

    public reset(): void {
        this.score = 0;
        this.isRunning = false;
        this.movingEnabled = true;
        this.canGenerateNext = false;
        this.currentStep = 0;
        this.stepTimer = 0;
    }
}

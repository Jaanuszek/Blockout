export class ScoreUI {
    private scoreElement: HTMLElement | null = null;

    public initialize(): void {
        const scoreDiv = document.createElement('div');
        scoreDiv.id = 'score-display';
        scoreDiv.style.position = 'absolute';
        scoreDiv.style.top = '20px';
        scoreDiv.style.left = '20px';
        scoreDiv.style.color = 'white';
        scoreDiv.style.fontFamily = 'Arial, sans-serif';
        scoreDiv.style.fontSize = '24px';
        scoreDiv.style.fontWeight = 'bold';
        scoreDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        scoreDiv.style.zIndex = '1000';
        scoreDiv.textContent = 'Score: 0';

        document.body.appendChild(scoreDiv);
        this.scoreElement = scoreDiv;
    }

    public updateScore(score: number): void {
        if (this.scoreElement) {
            this.scoreElement.textContent = `Score: ${score}`;
        }
    }

    public destroy(): void {
        if (this.scoreElement && this.scoreElement.parentNode) {
            this.scoreElement.parentNode.removeChild(this.scoreElement);
            this.scoreElement = null;
        }
    }
}

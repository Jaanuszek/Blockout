export class SettingsUI {
    private settingContainer: HTMLElement | null = null;
    private widthSlider: HTMLInputElement | null = null;
    private heightSlider: HTMLInputElement | null = null
    private depthSlider: HTMLInputElement | null = null
    private speedSlider: HTMLInputElement | null = null;

    public reloadNeeded: boolean = false;

    public initialize(): void {
        const container = document.createElement('div');
        container.id = 'settings-container';
        container.style.position = 'absolute';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.padding = '10px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        container.style.color = 'white';
        container.style.fontFamily = 'Arial, sans-serif';
        container.style.fontSize = '14px';
        container.style.zIndex = '1000';

        // Width Slider
        const widthLabel = document.createElement('label');
        widthLabel.textContent = 'Width: ';
        this.widthSlider = document.createElement('input');
        this.widthSlider.type = 'range';
        this.widthSlider.min = '5';
        this.widthSlider.max = '10';
        this.widthSlider.value = localStorage.getItem('game_width') ?? '5';
        widthLabel.appendChild(this.widthSlider);
        container.appendChild(widthLabel);
        container.appendChild(document.createElement('br'));

        // Height Slider
        const heightLabel = document.createElement('label');
        heightLabel.textContent = 'Height: ';
        this.heightSlider = document.createElement('input');
        this.heightSlider.type = 'range';
        this.heightSlider.min = '5';
        this.heightSlider.max = '10';
        this.heightSlider.value = localStorage.getItem('game_height') ?? '5';
        heightLabel.appendChild(this.heightSlider);
        container.appendChild(heightLabel);
        container.appendChild(document.createElement('br'));

        // Depth Slider
        const depthLabel = document.createElement('label');
        depthLabel.textContent = 'Depth: ';
        this.depthSlider = document.createElement('input');
        this.depthSlider.type = 'range';
        this.depthSlider.min = '5';
        this.depthSlider.max = '10';
        this.depthSlider.value = localStorage.getItem('game_depth') ?? '10';
        depthLabel.appendChild(this.depthSlider);
        container.appendChild(depthLabel);
        container.appendChild(document.createElement('br'));

        // Speed Slider

        const speedLabel = document.createElement('label');
        speedLabel.textContent = 'Speed: ';
        this.speedSlider = document.createElement('input');
        this.speedSlider.type = 'range';
        this.speedSlider.min = '0.01';
        this.speedSlider.max = '1';
        this.speedSlider.step = '0.01';
        this.speedSlider.value = localStorage.getItem('game_speed') ?? '0.5';
        speedLabel.appendChild(this.speedSlider);
        container.appendChild(speedLabel);
        container.appendChild(document.createElement('br'));

        document.body.appendChild(container);
        this.settingContainer = container;

        const persistAndReload = () => {
            if (this.widthSlider) localStorage.setItem('game_width', this.widthSlider.value);
            if (this.heightSlider) localStorage.setItem('game_height', this.heightSlider.value);
            if (this.depthSlider) localStorage.setItem('game_depth', this.depthSlider.value);
            if (this.speedSlider) localStorage.setItem('game_speed', this.speedSlider.value);
            this.reloadNeeded = true;
        };

        this.depthSlider.addEventListener('input', persistAndReload);
        this.heightSlider.addEventListener('input', persistAndReload);
        this.widthSlider.addEventListener('input', persistAndReload);
        this.speedSlider.addEventListener('input', persistAndReload);
    }

    public getWidth(): number {
        return this.widthSlider ? parseInt(this.widthSlider.value) : 10;
    }
    public getHeight(): number {
        return this.heightSlider ? parseInt(this.heightSlider.value) : 10;
    }
    public getDepth(): number {
        return this.depthSlider ? parseInt(this.depthSlider.value) : 10;
    }
    public getSpeed(): number {
        return this.speedSlider ? parseFloat(this.speedSlider.value) : 0.5;
    }
}
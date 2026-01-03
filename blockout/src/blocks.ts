import * as THREE from 'three';

export function create3DArray<T>(x: number, y: number, z: number, initial: T): T[][][]
{
    return Array.from({ length: x }, () =>
        Array.from({ length: y }, () =>
            Array.from({ length: z }, () => initial)
        )
    );
}

export default class block {
    private data: number[][][];
    private listOfAvailableBlocks: { [key: number] : number[][][]} = {};

    constructor(width: number, height: number, depth: number)
    {
        this.data = create3DArray<number>(width, height, depth, 0);

        for (let i =1; i <= 21; i++)
        {
            this.listOfAvailableBlocks[i] = create3DArray<number>(width, height, depth, 0);
        }
        // this.getBlockArray();
    }

    public getBlockArray(idx: number): number[][][]
    {
        this.createHardcodedBlocks();
        return this.listOfAvailableBlocks[idx];
    }

    public getRandomBlockArray(): number[][][]
    {
        const keysLen = Object.keys(this.listOfAvailableBlocks).length;
        // const randIdx = Math.floor(Math.random() * keysLen) + 1;
        const randIdx = 17;

        return this.listOfAvailableBlocks[randIdx];
    }

    private createHardcodedBlocks()
    {
        // block1
        this.listOfAvailableBlocks[1][0][0][0] = 1;
        this.listOfAvailableBlocks[1][1][0][0] = 1;
        this.listOfAvailableBlocks[1][0][1][0] = 1;
        this.listOfAvailableBlocks[1][0][2][0] = 1;
        // block 2
        this.listOfAvailableBlocks[2][0][0][0] = 1;
        this.listOfAvailableBlocks[2][0][1][0] = 1;
        this.listOfAvailableBlocks[2][0][2][0] = 1;
        this.listOfAvailableBlocks[2][1][1][0] = 1;
        // block 3
        this.listOfAvailableBlocks[3][0][0][0] = 1;
        this.listOfAvailableBlocks[3][0][1][0] = 1;
        this.listOfAvailableBlocks[3][0][0][1] = 1;
        this.listOfAvailableBlocks[3][1][0][1] = 1;
        // block 4 TODO
        this.listOfAvailableBlocks[4][0][0][0] = 1;
        this.listOfAvailableBlocks[4][0][0][1] = 1;
        this.listOfAvailableBlocks[4][0][1][1] = 1;
        this.listOfAvailableBlocks[4][1][0][1] = 1;
        // block 5
        this.listOfAvailableBlocks[5][0][0][0] = 1;
        this.listOfAvailableBlocks[5][1][0][0] = 1;
        this.listOfAvailableBlocks[5][1][1][0] = 1;
        this.listOfAvailableBlocks[5][2][1][0] = 1;
        // block 6
        this.listOfAvailableBlocks[6][0][0][0] = 1;
        this.listOfAvailableBlocks[6][1][0][0] = 1;
        this.listOfAvailableBlocks[6][0][1][0] = 1;
        // block 7
        this.listOfAvailableBlocks[7][0][0][0] = 1;
        this.listOfAvailableBlocks[7][1][0][0] = 1;
        this.listOfAvailableBlocks[7][0][0][1] = 1;
        this.listOfAvailableBlocks[7][0][1][1] = 1;
        // block 8
        this.listOfAvailableBlocks[8][0][0][0] = 1;
        this.listOfAvailableBlocks[8][0][0][1] = 1;
        this.listOfAvailableBlocks[8][0][1][1] = 1;
        this.listOfAvailableBlocks[8][1][1][1] = 1;
        this.listOfAvailableBlocks[8][1][0][1] = 1;
        // block 9
        this.listOfAvailableBlocks[9][0][0][0] = 1;
        // block 10
        this.listOfAvailableBlocks[10][0][0][0] = 1;
        this.listOfAvailableBlocks[10][1][0][0] = 1;
        this.listOfAvailableBlocks[10][2][0][0] = 1;
        // block 11
        this.listOfAvailableBlocks[11][0][0][0] = 1;
        this.listOfAvailableBlocks[11][1][0][0] = 1;
        this.listOfAvailableBlocks[11][1][1][0] = 1;
        this.listOfAvailableBlocks[11][1][2][0] = 1;
        this.listOfAvailableBlocks[11][2][2][0] = 1;
        // block 12
        this.listOfAvailableBlocks[12][0][0][0] = 1;
        this.listOfAvailableBlocks[12][1][0][0] = 1;
        this.listOfAvailableBlocks[12][1][0][1] = 1;
        this.listOfAvailableBlocks[12][1][1][1] = 1;
        this.listOfAvailableBlocks[12][2][0][1] = 1;
        // block 13
        this.listOfAvailableBlocks[13][0][0][0] = 1;
        this.listOfAvailableBlocks[13][1][0][0] = 1;
        this.listOfAvailableBlocks[13][0][1][0] = 1;
        this.listOfAvailableBlocks[13][1][1][0] = 1;
        // block 14
        this.listOfAvailableBlocks[14][0][0][0] = 1;
        this.listOfAvailableBlocks[14][1][0][0] = 1;
        // block 15
        this.listOfAvailableBlocks[15][0][0][0] = 1;
        this.listOfAvailableBlocks[15][1][0][0] = 1;
        this.listOfAvailableBlocks[15][1][0][1] = 1;
        this.listOfAvailableBlocks[15][1][1][1] = 1;
        this.listOfAvailableBlocks[15][2][1][1] = 1;
        // block 16
        this.listOfAvailableBlocks[16][0][0][1] = 1;
        this.listOfAvailableBlocks[16][0][1][1] = 1;
        this.listOfAvailableBlocks[16][1][0][1] = 1;
        this.listOfAvailableBlocks[16][2][0][1] = 1;
        this.listOfAvailableBlocks[16][2][0][0] = 1;
        // block 17
        this.listOfAvailableBlocks[17][0][0][0] = 1;
        this.listOfAvailableBlocks[17][1][0][0] = 1;
        this.listOfAvailableBlocks[17][2][0][0] = 1;
        this.listOfAvailableBlocks[17][3][0][0] = 1;
        this.listOfAvailableBlocks[17][4][0][0] = 1;
        // block 18
        this.listOfAvailableBlocks[18][0][0][0] = 1;
        this.listOfAvailableBlocks[18][1][0][0] = 1;
        this.listOfAvailableBlocks[18][2][0][0] = 1;
        this.listOfAvailableBlocks[18][3][0][0] = 1;
        this.listOfAvailableBlocks[18][0][1][0] = 1;
        // block 19
        this.listOfAvailableBlocks[19][0][0][0] = 1;
        this.listOfAvailableBlocks[19][1][0][0] = 1;
        this.listOfAvailableBlocks[19][2][0][0] = 1;
        this.listOfAvailableBlocks[19][1][1][0] = 1;
        this.listOfAvailableBlocks[19][1][2][0] = 1;
        // block 20
        this.listOfAvailableBlocks[20][0][0][0] = 1;
        this.listOfAvailableBlocks[20][0][1][0] = 1;
        this.listOfAvailableBlocks[20][0][2][0] = 1;
        this.listOfAvailableBlocks[20][0][0][1] = 1;
        this.listOfAvailableBlocks[20][1][0][1] = 1;
        // block 21
        this.listOfAvailableBlocks[21][0][0][0] = 1;
        this.listOfAvailableBlocks[21][1][0][0] = 1;
        this.listOfAvailableBlocks[21][0][0][1] = 1;
        this.listOfAvailableBlocks[21][0][1][1] = 1;
        this.listOfAvailableBlocks[21][0][2][1] = 1;
    }
    

}
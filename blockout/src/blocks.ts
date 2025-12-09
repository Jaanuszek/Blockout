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
        this.getBlockArray();
    }

    public getBlockArray(): number[][][]
    {
        // const keysLen = Object.keys(this.listOfAvailableBlocks).length;
        // const idx = Math.floor(Math.random() * keysLen) + 1;
        // console.log(idx);
        // return undefined as any;
        this.createHardcodedBlocks();
        return this.listOfAvailableBlocks[1];
    }

    private createHardcodedBlocks()
    {
        this.listOfAvailableBlocks[1][0][0][0] = 1;
        this.listOfAvailableBlocks[1][1][0][0] = 1;
        this.listOfAvailableBlocks[1][0][1][0] = 1;
        this.listOfAvailableBlocks[1][0][2][0] = 1;
    }
    

}
export interface INameCount {
    Name: string;
    Count: number;
}

export function parsePackedString(packed: string): INameCount[] {
    if (packed == null) {
        return [];
    }

    const array: INameCount[] = [];

    const parts = packed.split(";");

    if (parts.length < 2) {
        // Not enough parts
        return [];
    }

    for (let i = 0; i < parts.length; i += 2) {
        array.push({
                       Name:  parts[i],
                       Count: parseInt(parts[i + 1], 10),
                   });
    }

    return array;
}

export function packString(array: INameCount[]): string {
    if (array == null) {
        return "";
    }

    return array.map((nc) => nc.Name + ";" + nc.Count).join(";");
}

export function getTimeMilliseconds(): number {
    return Date.now() % 2147483647; // Make sure it stays in range for signed integers
}

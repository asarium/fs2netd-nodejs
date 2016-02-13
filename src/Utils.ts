export interface NameCount {
    Name: string;
    Count: number;
}

export function parsePackedString(packed: string): Array<NameCount> {
    if (packed == null) {
        return [];
    }

    let array: NameCount[] = [];

    let parts = packed.split(";");

    if (parts.length < 2) {
        // Not enough parts
        return [];
    }

    for (let i = 0; i < parts.length; i += 2) {
        array.push({
            Name: parts[i],
            Count: parseInt(parts[i + 1])
        });
    }

    return array;
}

export function packString(array: NameCount[]): string {
    return array.map(nc => nc.Name + ";" + nc.Count).join(";");
}

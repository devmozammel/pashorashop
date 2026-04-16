
export function serialize(obj) {
    return JSON.parse(JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            // value.s, value.e, value.d are properties of Decimal.js objects sometimes
            // but safer to rely on serializePrisma logic below or check constructor name
        }
        return value;
    }));
}

// Helper to serialize Prisma data (dates, decimals) for client components
export function serializePrisma(data) {
    if (data === null || data === undefined) return data;

    if (typeof data === "object") {
        if (Array.isArray(data)) {
            return data.map(serializePrisma);
        }

        if (data instanceof Date) {
            return data.toISOString();
        }

        // Handle Decimal (Prisma/Decimal.js)
        if (
            typeof data.toNumber === "function" ||
            (data.s && data.e && data.d) || // Decimal.js internal structure
            data.constructor?.name === "Decimal" ||
            (Object.prototype.toString.call(data) === "[object Object]" && data.toFixed && data.precision) // Another check
        ) {
            return Number(data);
        }

        const newObj = {};
        for (const key in data) {
            newObj[key] = serializePrisma(data[key]);
        }
        return newObj;
    }

    return data;
}

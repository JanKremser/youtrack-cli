function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getOrDefault<T>(value: any, _default: T): T {
    if (value == null || value == undefined) {
        return _default;
    }

    return value as T;
}

export default {
    sleep,
    getOrDefault,
};

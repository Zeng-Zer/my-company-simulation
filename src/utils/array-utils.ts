export function findLastMatchingElement<T>(arr: T[], predicate: (item: T) => boolean): T | undefined {
    let lastMatchingElement: T | undefined;
    for (const item of arr) {
        if (predicate(item)) {
            lastMatchingElement = item;
        }
    }
    return lastMatchingElement;
}

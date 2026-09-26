interface IHashService {
    hash(data: string): string;
    compare(data: string, hashedData: string): boolean;
}
export declare class HashService implements IHashService {
    hash(data: string): string;
    compare(data: string, hashedData: string): boolean;
}
export {};

declare const _default: (() => {
    accessSecret: string | undefined;
    refreshSecret: string | undefined;
}) & import("@nestjs/config", { with: { "resolution-mode": "import" } }).ConfigFactoryKeyHost<{
    accessSecret: string | undefined;
    refreshSecret: string | undefined;
}>;
export default _default;

declare const _default: (() => {
    clientId: string | undefined;
    clientSecret: string | undefined;
}) & import("@nestjs/config", { with: { "resolution-mode": "import" } }).ConfigFactoryKeyHost<{
    clientId: string | undefined;
    clientSecret: string | undefined;
}>;
export default _default;

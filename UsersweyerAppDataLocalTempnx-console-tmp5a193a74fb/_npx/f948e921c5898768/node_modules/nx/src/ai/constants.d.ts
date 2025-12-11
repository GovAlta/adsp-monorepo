export declare function agentsMdPath(root: string): string;
export declare function geminiMdPath(root: string): string;
export declare function parseGeminiSettings(root: string): any | undefined;
export declare function geminiSettingsPath(root: string): string;
export declare function claudeMdPath(root: string): string;
export declare function claudeMcpPath(root: string): string;
export declare const codexConfigTomlPath: string;
export declare const nxRulesMarkerCommentStart = "<!-- nx configuration start-->";
export declare const nxRulesMarkerCommentDescription = "<!-- Leave the start & end comments to automatically receive updates. -->";
export declare const nxRulesMarkerCommentEnd = "<!-- nx configuration end-->";
export declare const rulesRegex: RegExp;
export declare const getAgentRulesWrapped: (writeNxCloudRules: boolean) => string;
export declare const nxMcpTomlHeader = "[mcp_servers.\"nx-mcp\"]";
/**
 * Get the MCP TOML configuration based on the Nx version.
 * For Nx 22+, uses 'nx mcp'
 * For Nx < 22, uses 'nx-mcp'
 */
export declare function getNxMcpTomlConfig(nxVersion: string): string;
//# sourceMappingURL=constants.d.ts.map
export const ROLE_OWNER = "owner";
export const ROLE_MEMBER = "member";

export const PERMISSION_ADMIN_ACCESS = "admin_access";
export const PERMISSION_MARKETING_AGENT_ACCESS = "marketing_agent_access";

export const WORKSPACE_MODES = ["solve", "promote", "build"] as const;
export type WorkspaceMode = (typeof WORKSPACE_MODES)[number];

export const PLANS = ["free", "pro", "business"] as const;
export type Plan = (typeof PLANS)[number];

export function isWorkspaceMode(value: string | null | undefined): value is WorkspaceMode {
  return WORKSPACE_MODES.includes((value ?? "") as WorkspaceMode);
}

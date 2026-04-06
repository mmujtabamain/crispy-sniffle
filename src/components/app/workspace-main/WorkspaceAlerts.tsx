import { AlertTriangle } from "lucide-react";
import { formatBytes } from "../../../lib/formatters";
import type { WorkspaceAlertsProps } from "./types";

export default function WorkspaceAlerts({
  quotaStatus,
  errorMessage,
}: WorkspaceAlertsProps) {
  return (
    <>
      {quotaStatus.warning && (
        <div
          className="rounded-[0.76rem] border border-[color-mix(in_oklch,var(--warning)_62%,var(--line))] bg-[color-mix(in_oklch,var(--warning)_14%,var(--surface))] p-2.5 flex items-center gap-2"
          role="status"
        >
          <AlertTriangle size={17} />
          <span>
            Storage warning: {formatBytes(quotaStatus.usedBytes)} used of about{" "}
            {formatBytes(quotaStatus.quotaBytes)}.
          </span>
        </div>
      )}

      {errorMessage && (
        <div
          className="rounded-[0.76rem] border border-[color-mix(in_oklch,var(--error)_58%,var(--line))] bg-[color-mix(in_oklch,var(--error)_15%,var(--surface))] p-2.5 flex items-center gap-2"
          role="alert"
        >
          <AlertTriangle size={17} />
          <span>{errorMessage}</span>
        </div>
      )}
    </>
  );
}

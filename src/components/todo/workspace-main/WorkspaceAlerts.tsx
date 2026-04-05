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
        <div className="warning-banner" role="status">
          <AlertTriangle size={17} />
          <span>
            Storage warning: {formatBytes(quotaStatus.usedBytes)} used of about{" "}
            {formatBytes(quotaStatus.quotaBytes)}.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="error-banner" role="alert">
          <AlertTriangle size={17} />
          <span>{errorMessage}</span>
        </div>
      )}
    </>
  );
}

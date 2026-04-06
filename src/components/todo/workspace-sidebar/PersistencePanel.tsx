import { FileDown, FileUp, LoaderCircle, Save } from "lucide-react";
import PanelSection from "../PanelSection";
import type { PersistencePanelProps } from "./types";

export default function PersistencePanel({
  busyAction,
  onOpen,
  onSave,
  onSaveAs,
}: PersistencePanelProps) {
  return (
    <PanelSection title="Persistence">
      <div className="grid gap-2">
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
          onClick={() => void onOpen()}
        >
          {busyAction === "open" ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <FileUp size={16} />
          )}{" "}
          Open
        </button>
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
          onClick={() => void onSave()}
        >
          {busyAction === "save" ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}{" "}
          Save
        </button>
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 font-semibold border border-[var(--line)] bg-[var(--surface)] cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-0"
          onClick={() => void onSaveAs()}
        >
          {busyAction === "saveAs" ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <FileDown size={16} />
          )}{" "}
          Save As
        </button>
      </div>
    </PanelSection>
  );
}

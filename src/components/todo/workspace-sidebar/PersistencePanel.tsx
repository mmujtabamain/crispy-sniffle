import {
  FileDown,
  FileUp,
  LoaderCircle,
  Save,
} from "lucide-react";
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
      <div className="button-stack">
        <button
          type="button"
          className="secondary-button"
          onClick={() => void onOpen()}
        >
          {busyAction === "open" ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <FileUp size={16} />
          )}{" "}
          Open
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => void onSave()}
        >
          {busyAction === "save" ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <Save size={16} />
          )}{" "}
          Save
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => void onSaveAs()}
        >
          {busyAction === "saveAs" ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <FileDown size={16} />
          )}{" "}
          Save As
        </button>
      </div>
    </PanelSection>
  );
}

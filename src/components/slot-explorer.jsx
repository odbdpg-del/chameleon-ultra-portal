import { useEffect, useState } from "react";
import {
  Archive,
  CopyPlus,
  PencilLine,
  Play,
  Save,
  Upload,
} from "lucide-react";

const paletteOptions = ["amber", "blue", "mint", "rose", "violet", "cyan", "gold", "slate"];

function humanizeType(type) {
  return String(type || "UNDEFINED").replaceAll("_", " ");
}

function slotBadgeClass(color) {
  return `slot-color slot-color--${color || "slate"}`;
}

function slotStateClass(slot) {
  if (slot.hf.type === "UNDEFINED" && slot.lf.type === "UNDEFINED") {
    return "slot-card--empty";
  }
  if (slot.archived) {
    return "slot-card--archived";
  }
  return "";
}

export function SlotExplorer({
  slots,
  viewMode,
  activeSlot,
  busyAction,
  compactMode,
  onActivate,
  onSave,
  onDuplicate,
  onExport,
  onArchive,
}) {
  return (
    <div className={`slot-deck slot-deck--${viewMode} ${compactMode ? "slot-deck--compact" : ""}`.trim()}>
      {slots.map((slot) => (
        <SlotCard
          key={slot.slot}
          slot={slot}
          active={activeSlot === slot.slot}
          busyAction={busyAction}
          compactMode={compactMode}
          onActivate={onActivate}
          onSave={onSave}
          onDuplicate={onDuplicate}
          onExport={onExport}
          onArchive={onArchive}
        />
      ))}
    </div>
  );
}

function SlotCard({ slot, active, busyAction, compactMode, onActivate, onSave, onDuplicate, onExport, onArchive }) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [draftName, setDraftName] = useState(slot.displayName || slot.nick || "");
  const [draftCategory, setDraftCategory] = useState(slot.category || "");
  const [draftTags, setDraftTags] = useState((slot.tags || []).join(", "));

  useEffect(() => {
    setDraftName(slot.displayName || slot.nick || "");
    setDraftCategory(slot.category || "");
    setDraftTags((slot.tags || []).join(", "));
  }, [slot.displayName, slot.nick, slot.category, slot.tags]);

  const actionBusy = Boolean(busyAction);
  const slotTone = slotStateClass(slot);

  return (
    <article className={`inventory-slot ${active ? "inventory-slot--active" : ""} ${compactMode ? "inventory-slot--compact" : ""} ${slotTone}`.trim()}>
      <div className="inventory-slot__top">
        <div className="inventory-slot__meta">
          <span className={slotBadgeClass(slot.color)} />
          <span className="inventory-slot__id">Slot {slot.slot}</span>
          {active ? <span className="inventory-pill inventory-pill--active">Active</span> : null}
        </div>
        <button className="inventory-icon" onClick={() => onActivate(slot.slot)} disabled={actionBusy}>
          <Play size={14} />
        </button>
      </div>

      <h3>{slot.displayName || slot.nick || `Slot ${slot.slot}`}</h3>

      <div className="inventory-slot__types">
        <div>
          <span>HF</span>
          <strong>{slot.hf.type === "UNDEFINED" ? "Undefined" : humanizeType(slot.hf.type)}</strong>
        </div>
        <div>
          <span>LF</span>
          <strong>{slot.lf.type === "UNDEFINED" ? "Empty" : humanizeType(slot.lf.type)}</strong>
        </div>
      </div>

      <div className="inventory-slot__uid">
        <span>UID</span>
        <code>{slot.hf.uid || "--"}</code>
      </div>

      <div className="inventory-slot__tags">
        {(slot.tags || []).length ? (
          slot.tags.map((tag) => (
            <span key={tag} className="inventory-pill">
              {tag}
            </span>
          ))
        ) : (
          <span className="inventory-pill">{slot.category || "uncategorized"}</span>
        )}
      </div>

      <div className="inventory-slot__actions">
        <button className="inventory-icon" onClick={() => setEditorOpen((current) => !current)}>
          <PencilLine size={14} />
        </button>
        <button className="inventory-icon" onClick={() => onExport(slot.slot)} disabled={actionBusy}>
          <Upload size={14} />
        </button>
        <button className="inventory-icon" onClick={() => onDuplicate(slot.slot)} disabled={actionBusy}>
          <CopyPlus size={14} />
        </button>
        <button className="inventory-icon" onClick={() => onArchive(slot.slot, !slot.archived)} disabled={actionBusy}>
          <Archive size={14} />
        </button>
      </div>

      {editorOpen ? (
        <div className="inventory-editor">
          <label>
            <span>Nickname</span>
            <input value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="Lab Reader Test" />
          </label>
          <label>
            <span>Category</span>
            <select value={draftCategory} onChange={(event) => setDraftCategory(event.target.value)}>
              <option value="">Uncategorized</option>
              <option value="Lab">Lab</option>
              <option value="Demo">Demo</option>
              <option value="Research">Research</option>
              <option value="Inventory">Inventory</option>
              <option value="Access">Access</option>
            </select>
          </label>
          <label>
            <span>Tags</span>
            <input value={draftTags} onChange={(event) => setDraftTags(event.target.value)} placeholder="reader, lab, hf" />
          </label>
          <label>
            <span>Color</span>
            <select value={slot.color || "slate"} onChange={(event) => onSave(slot.slot, { color: event.target.value })}>
              {paletteOptions.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </label>
          <button
            className="inventory-save"
            disabled={actionBusy}
            onClick={() =>
              onSave(slot.slot, {
                displayName: draftName,
                category: draftCategory,
                tags: draftTags
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
          >
            <Save size={14} />
            <span>Save changes</span>
          </button>
        </div>
      ) : null}
    </article>
  );
}

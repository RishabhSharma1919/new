import { useEffect, useMemo, useRef, useState } from "react";
import type { Attachment, Board, Card } from "../types";
import { formatDueDate, getChecklistStats } from "../lib/utils";

const MAX_FILE_SIZE_BYTES = 6 * 1024 * 1024;

type CardDockView = "powerups" | "automations" | "comments";

type CardModalProps = {
  board: Board;
  card: Card | null;
  onAddAttachment: (
    cardId: string,
    payload: {
      name: string;
      fileUrl: string;
      mimeType: string;
      sizeBytes: number;
      setAsCover?: boolean;
    },
  ) => Promise<void>;
  onAddChecklist: (cardId: string, title: string) => Promise<void>;
  onAddChecklistItem: (checklistId: string, title: string) => Promise<void>;
  onAddComment: (cardId: string, message: string) => Promise<void>;
  onArchiveCard: (cardId: string) => Promise<void>;
  onClose: () => void;
  onDeleteAttachment: (attachmentId: string) => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  onDeleteChecklist: (checklistId: string) => Promise<void>;
  onDeleteChecklistItem: (itemId: string) => Promise<void>;
  onSetCardCover: (cardId: string, coverImage: string | null) => Promise<void>;
  onUpdateCard: (
    cardId: string,
    payload: {
      title: string;
      description: string;
      dueDate: string | null;
      labelIds: string[];
      memberIds: string[];
    },
  ) => Promise<void>;
  onUpdateChecklist: (checklistId: string, title: string) => Promise<void>;
  onUpdateChecklistItem: (itemId: string, payload: { title?: string; isComplete?: boolean }) => Promise<void>;
  onCreateLabel?: (payload: { name: string; color: string }) => Promise<void>;
  onUpdateLabel?: (labelId: string, payload: { name?: string; color?: string }) => Promise<void>;
  onDeleteLabel?: (labelId: string) => Promise<void>;
};

export function CardModal({
  board,
  card,
  onAddAttachment,
  onAddChecklist,
  onAddChecklistItem,
  onAddComment,
  onArchiveCard,
  onClose,
  onDeleteAttachment,
  onDeleteCard,
  onDeleteChecklist,
  onDeleteChecklistItem,
  onSetCardCover,
  onUpdateCard,
  onUpdateChecklist,
  onUpdateChecklistItem,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
}: CardModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newItemTitles, setNewItemTitles] = useState<Record<string, string>>({});
  const [newComment, setNewComment] = useState("");
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [coverAttachmentId, setCoverAttachmentId] = useState<string | null>(null);
  const [isRemovingCover, setIsRemovingCover] = useState(false);
  const [activeDockView, setActiveDockView] = useState<CardDockView>("comments");
  const [showActivityDetails, setShowActivityDetails] = useState(true);
  const [labelSearch, setLabelSearch] = useState("");
  const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | "new" | null>(null);
  const [editLabelName, setEditLabelName] = useState("");
  const [editLabelColor, setEditLabelColor] = useState("");
  const [isSavingLabel, setIsSavingLabel] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const dueDateInputRef = useRef<HTMLInputElement | null>(null);
  const checklistSectionRef = useRef<HTMLDivElement | null>(null);
  const newChecklistInputRef = useRef<HTMLInputElement | null>(null);
  const commentComposerRef = useRef<HTMLTextAreaElement | null>(null);
  const labelsSectionRef = useRef<HTMLDivElement | null>(null);
  const membersSectionRef = useRef<HTMLDivElement | null>(null);
  const coverSectionRef = useRef<HTMLDivElement | null>(null);
  const activitySectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!card) {
      return;
    }

    setTitle(card.title);
    setDescription(card.description);
    setDueDate(card.dueDate ? card.dueDate.slice(0, 10) : "");
    setSelectedLabelIds(card.labels.map((label) => label.id));
    setSelectedMemberIds(card.members.map((member) => member.id));
    setNewChecklistTitle("");
    setNewItemTitles({});
    setNewComment("");
    setAttachmentError(null);
    setCommentError(null);
    setCoverAttachmentId(null);
    setIsRemovingCover(false);
    setActiveDockView("comments");
    setShowActivityDetails(true);
    setLabelSearch("");
    setIsLabelPopoverOpen(false);
    setEditingLabelId(null);
  }, [card?.id]);

  const checklistStats = useMemo(() => (card ? getChecklistStats(card) : { completed: 0, total: 0 }), [card]);

  if (!card) {
    return null;
  }

  const activeCard = card;
  const currentListTitle =
    board.lists.find((list) => list.cards.some((listCard) => listCard.id === activeCard.id))?.title ?? "Board";

  async function handleSave() {
    setIsSaving(true);

    try {
      await onUpdateCard(activeCard.id, {
        title: title.trim() || activeCard.title,
        description,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        labelIds: selectedLabelIds,
        memberIds: selectedMemberIds,
      });
    } finally {
      setIsSaving(false);
    }
  }

  function toggleSelection(value: string, currentValues: string[], setter: (values: string[]) => void) {
    if (currentValues.includes(value)) {
      setter(currentValues.filter((item) => item !== value));
      return;
    }

    setter([...currentValues, value]);
  }

  async function handleFileUpload(fileList: FileList | null, options: { setAsCover: boolean }) {
    if (!fileList) {
      return;
    }

    const files = Array.from(fileList);

    if (files.length === 0) {
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE_BYTES);

    if (oversizedFile) {
      setAttachmentError(`"${oversizedFile.name}" is too large. Keep files under ${formatBytes(MAX_FILE_SIZE_BYTES)}.`);
      resetFileInputs();
      return;
    }

    setAttachmentError(null);

    if (options.setAsCover) {
      setIsUploadingCover(true);
    } else {
      setIsUploadingAttachment(true);
    }

    try {
      for (const file of files) {
        const fileUrl = await readFileAsDataUrl(file);
        await onAddAttachment(activeCard.id, {
          name: file.name,
          fileUrl,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          setAsCover: options.setAsCover && file.type.startsWith("image/"),
        });
      }
    } catch (error) {
      setAttachmentError(getErrorMessage(error));
    } finally {
      setIsUploadingAttachment(false);
      setIsUploadingCover(false);
      resetFileInputs();
    }
  }

  async function handleAddComment() {
    const trimmedComment = newComment.trim();

    if (!trimmedComment) {
      setCommentError("Write a comment before posting.");
      return;
    }

    setIsSubmittingComment(true);
    setCommentError(null);

    try {
      await onAddComment(activeCard.id, trimmedComment);
      setNewComment("");
    } catch (error) {
      setCommentError(getErrorMessage(error));
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleSetCover(attachment: Attachment) {
    setCoverAttachmentId(attachment.id);

    try {
      await onSetCardCover(activeCard.id, attachment.fileUrl);
    } finally {
      setCoverAttachmentId(null);
    }
  }

  async function handleRemoveCover() {
    setIsRemovingCover(true);

    try {
      await onSetCardCover(activeCard.id, null);
    } finally {
      setIsRemovingCover(false);
    }
  }

  async function handleSaveLabel() {
    if (!editLabelColor) return;
    setIsSavingLabel(true);
    try {
      if (editingLabelId === "new") {
        await onCreateLabel?.({ name: editLabelName.trim(), color: editLabelColor });
      } else if (editingLabelId) {
        await onUpdateLabel?.(editingLabelId, { name: editLabelName.trim(), color: editLabelColor });
      }
      setEditingLabelId(null);
    } finally {
      setIsSavingLabel(false);
    }
  }

  async function handleDeleteLabelAction() {
    if (!editingLabelId || editingLabelId === "new") return;
    if (!window.confirm("Are you sure you want to delete this label? This will remove it from all cards.")) return;
    setIsSavingLabel(true);
    try {
      await onDeleteLabel?.(editingLabelId);
      setEditingLabelId(null);
      setSelectedLabelIds((current) => current.filter((id) => id !== editingLabelId));
    } finally {
      setIsSavingLabel(false);
    }
  }

  const LABEL_COLORS = [
    "#4bce97", "#e2b203", "#f87462", "#9f8fef",
    "#579dff", "#60c6d2", "#e774bb", "#8590a2"
  ];

  function resetFileInputs() {
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }

    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  }

  function focusElement(element: HTMLElement | null, options?: { focus?: boolean }) {
    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "start" });

    if (options?.focus !== false && "focus" in element) {
      window.setTimeout(() => {
        element.focus({ preventScroll: true });
      }, 120);
    }
  }

  function openDock(view: CardDockView) {
    setActiveDockView(view);

    if (view === "comments") {
      focusElement(commentComposerRef.current);
      return;
    }

    if (view === "automations") {
      setShowActivityDetails(true);
      focusElement(activitySectionRef.current, { focus: false });
      return;
    }

    focusElement(coverSectionRef.current, { focus: false });
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal-shell" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <input
          ref={attachmentInputRef}
          className="visually-hidden"
          multiple
          type="file"
          onChange={(event) => void handleFileUpload(event.target.files, { setAsCover: false })}
        />
        <input
          ref={coverInputRef}
          accept="image/*"
          className="visually-hidden"
          type="file"
          onChange={(event) => void handleFileUpload(event.target.files, { setAsCover: true })}
        />

        <div className="modal-shell__header">
          <div className="modal-shell__header-left">
            <button className="list-dropdown-button" type="button">
              {currentListTitle}
              <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
                <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="modal-shell__header-right">
            <button className="icon-button" type="button" aria-label="Maximize">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
                <path d="M4 4h16v16H4V4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 8h16M8 20V8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="icon-button" type="button" aria-label="More">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
                <circle cx="5" cy="12" r="2" fill="currentColor" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
                <circle cx="19" cy="12" r="2" fill="currentColor" />
              </svg>
            </button>
            <button className="icon-button modal-close-button" onClick={onClose} type="button" aria-label="Close card">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
                <path
                  d="m7 7 10 10M17 7 7 17"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="modal-shell__content">
          <section className="modal-column modal-column--main">
            {card.coverImage ? (
              <div className="modal-cover">
                <img className="modal-cover__image" src={card.coverImage} alt={`${card.title} cover`} />
              </div>
            ) : null}

            <div className="card-title-group">
              <div className="card-title-icon">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <label className="field field--main-title">
                <input 
                  maxLength={200}
                  value={title} 
                  onChange={(event) => setTitle(event.target.value)} 
                  onBlur={() => {
                    const nextTitle = title.trim();
                    if (nextTitle && nextTitle !== card.title) {
                      void onUpdateCard(card.id, {
                        ...card,
                        labelIds: card.labels.map(l => l.id),
                        memberIds: card.members.map(m => m.id),
                        title: nextTitle
                      });
                    }
                  }}
                />
              </label>
            </div>

            <div className="quick-actions-row">
              <button className="pill-button" onClick={() => attachmentInputRef.current?.click()} type="button">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Add
              </button>
              <button className="pill-button" onClick={() => focusElement(dueDateInputRef.current)} type="button">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Dates
              </button>
              <button
                className="pill-button"
                onClick={() => focusElement(newChecklistInputRef.current ?? checklistSectionRef.current)}
                type="button"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                Checklist
              </button>
              <button
                className="pill-button"
                onClick={() => focusElement(membersSectionRef.current, { focus: false })}
                type="button"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                Members
              </button>
              <button className="pill-button" onClick={() => focusElement(attachmentInputRef.current)} type="button">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                Attachment
              </button>
            </div>

            <div className="modal-quick-actions">
              <button className="modal-quick-action" onClick={() => attachmentInputRef.current?.click()} type="button">
                Add
              </button>
              <button
                className="modal-quick-action"
                onClick={() => focusElement(labelsSectionRef.current, { focus: false })}
                type="button"
              >
                Labels
              </button>
              <button className="modal-quick-action" onClick={() => focusElement(dueDateInputRef.current)} type="button">
                Dates
              </button>
              <button
                className="modal-quick-action"
                onClick={() => focusElement(newChecklistInputRef.current ?? checklistSectionRef.current)}
                type="button"
              >
                Checklist
              </button>
              <button
                className="modal-quick-action"
                onClick={() => focusElement(membersSectionRef.current, { focus: false })}
                type="button"
              >
                Members
              </button>
            </div>

            <div className="card-inline-labels" ref={labelsSectionRef}>
              <h5>Labels</h5>
              <div className="card-inline-labels__list">
                {card.labels.map((label) => (
                  <span key={label.id} className="card-label" style={{ backgroundColor: label.color }} title={`Color: ${label.color}, title: ${label.name || "none"}`}>
                    {label.name}
                  </span>
                ))}
                <div className="label-popover-wrapper">
                  <button 
                    className="label-add-button" 
                    type="button" 
                    onClick={() => setIsLabelPopoverOpen((open) => !open)}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  {isLabelPopoverOpen ? (
                    <div className="label-popover">
                      {editingLabelId ? (
                        <div className="label-editor">
                          <div className="label-editor__header">
                            <button className="icon-button" type="button" onClick={() => setEditingLabelId(null)} aria-label="Back">
                              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                            <h5>{editingLabelId === "new" ? "Create label" : "Edit label"}</h5>
                          </div>
                          <div className="label-editor__preview" style={{ backgroundColor: editLabelColor || "#091e420f" }}>
                            {editLabelName || "Label title"}
                          </div>
                          <label className="field">
                            <span>Title</span>
                            <input autoFocus value={editLabelName} onChange={(e) => setEditLabelName(e.target.value)} />
                          </label>
                          <div className="field">
                            <span>Select a color</span>
                            <div className="color-grid">
                              {LABEL_COLORS.map(color => (
                                <button
                                  key={color}
                                  type="button"
                                  className={`color-swatch ${editLabelColor === color ? "is-selected" : ""}`}
                                  style={{ backgroundColor: color }}
                                  onClick={() => setEditLabelColor(color)}
                                />
                              ))}
                              <button 
                                type="button" 
                                className={`color-swatch color-swatch--none ${!editLabelColor ? "is-selected" : ""}`} 
                                onClick={() => setEditLabelColor("")}
                              >
                                <span className="visually-hidden">No color</span>
                              </button>
                            </div>
                          </div>
                          <div className="label-editor__actions">
                            <button className="primary-button" disabled={!editLabelColor || isSavingLabel} onClick={handleSaveLabel} type="button">
                              {isSavingLabel ? "Saving..." : "Save"}
                            </button>
                            {editingLabelId !== "new" && (
                              <button className="danger-button" disabled={isSavingLabel} onClick={handleDeleteLabelAction} type="button">
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="label-selector">
                          <div className="label-editor__header">
                            <h5>Labels</h5>
                            <button className="icon-button" type="button" onClick={() => setIsLabelPopoverOpen(false)}>
                              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          </div>
                          <input
                            className="inline-input search-input"
                            placeholder="Search labels..."
                            value={labelSearch}
                            onChange={(e) => setLabelSearch(e.target.value)}
                          />
                          <div className="label-selector__list">
                            {board.labels
                              .filter((l) => l.name.toLowerCase().includes(labelSearch.toLowerCase()))
                              .map((label) => (
                                <div key={label.id} className="label-selector__item">
                                  <label className="label-checkbox" style={{ backgroundColor: label.color }}>
                                    <input
                                      type="checkbox"
                                      checked={selectedLabelIds.includes(label.id)}
                                      onChange={() => {
                                        const nextIds = selectedLabelIds.includes(label.id)
                                          ? selectedLabelIds.filter((id) => id !== label.id)
                                          : [...selectedLabelIds, label.id];
                                        setSelectedLabelIds(nextIds);
                                        void onUpdateCard(activeCard.id, {
                                          ...card,
                                          title: title.trim() || activeCard.title,
                                          labelIds: nextIds,
                                          memberIds: selectedMemberIds,
                                        });
                                      }}
                                    />
                                    <span>{label.name}</span>
                                  </label>
                                  <button
                                    type="button"
                                    className="icon-button"
                                    aria-label={`Edit label ${label.name}`}
                                    onClick={() => {
                                      setEditingLabelId(label.id);
                                      setEditLabelName(label.name);
                                      setEditLabelColor(label.color);
                                    }}
                                  >
                                    <svg viewBox="0 0 24 24" width="16" height="16"><path d="M16 4l4 4-10 10H6v-4L16 4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  </button>
                                </div>
                            ))}
                          </div>
                          <button
                            className="ghost-button full-width-button"
                            type="button"
                            onClick={() => {
                              setEditingLabelId("new");
                              setEditLabelName("");
                              setEditLabelColor(LABEL_COLORS[0]);
                            }}
                          >
                            Create a new label
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <label className="field inline-description">
              <div className="inline-description-header">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
                <h5>Description</h5>
              </div>
              <textarea
                ref={descriptionRef}
                placeholder="Add a more detailed description..."
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                onBlur={() => {
                  if (description !== card.description) {
                    void handleSave();
                  }
                }}
              />
            </label>

            <div className="modal-inline-fields">
              <label className="field">
                <span>Due date</span>
                <input ref={dueDateInputRef} type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </label>
            </div>

            <div className="modal-card">
              <div className="modal-card__header">
                <h4>Attachments</h4>
                <span>{card.attachments.length}</span>
              </div>

              <div className="attachment-toolbar">
                <button
                  className="ghost-button"
                  disabled={isUploadingAttachment}
                  onClick={() => attachmentInputRef.current?.click()}
                  type="button"
                >
                  {isUploadingAttachment ? "Uploading..." : "Attach file"}
                </button>
                <button
                  className="ghost-button"
                  disabled={isUploadingCover}
                  onClick={() => coverInputRef.current?.click()}
                  type="button"
                >
                  {isUploadingCover ? "Uploading..." : "Upload cover image"}
                </button>
                <span className="support-copy">Max size {formatBytes(MAX_FILE_SIZE_BYTES)}</span>
              </div>

              {attachmentError ? <p className="inline-error">{attachmentError}</p> : null}

              <div className="attachment-list">
                {card.attachments.length > 0 ? (
                  card.attachments.map((attachment) => {
                    const isCover = card.coverImage === attachment.fileUrl;
                    const isImage = isImageAttachment(attachment.mimeType);

                    return (
                      <div className="attachment-item" key={attachment.id}>
                        {isImage ? (
                          <img className="attachment-item__preview" src={attachment.fileUrl} alt={attachment.name} />
                        ) : (
                          <div className="attachment-item__preview attachment-item__preview--file">
                            {attachment.name.split(".").pop()?.toUpperCase() ?? "FILE"}
                          </div>
                        )}

                        <div className="attachment-item__content">
                          <strong>{attachment.name}</strong>
                          <p>
                            {formatBytes(attachment.sizeBytes)} • {attachment.actorName ?? "Someone"} •{" "}
                            {new Date(attachment.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="attachment-item__actions">
                          <a className="ghost-button" download={attachment.name} href={attachment.fileUrl}>
                            Download
                          </a>
                          {isImage ? (
                            <button
                              className="ghost-button"
                              disabled={isCover || coverAttachmentId === attachment.id}
                              onClick={() => void handleSetCover(attachment)}
                              type="button"
                            >
                              {isCover ? "Cover image" : coverAttachmentId === attachment.id ? "Saving..." : "Use as cover"}
                            </button>
                          ) : null}
                          <button
                            className="icon-button"
                            onClick={() => void onDeleteAttachment(attachment.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="empty-inline">No files attached yet.</p>
                )}
              </div>
            </div>

            <div className="modal-card" ref={checklistSectionRef}>
              <div className="modal-card__header">
                <h4>Checklists</h4>
                <span>
                  {checklistStats.completed}/{checklistStats.total} complete
                </span>
              </div>

              <div className="checklist-collection">
                {card.checklists.map((checklist) => (
                  <div className="checklist-panel" key={checklist.id}>
                    <div className="checklist-panel__header">
                      <input
                        className="inline-input"
                        defaultValue={checklist.title}
                        onBlur={(event) => {
                          const nextTitle = event.target.value.trim();
                          if (nextTitle && nextTitle !== checklist.title) {
                            void onUpdateChecklist(checklist.id, nextTitle);
                          }
                        }}
                      />
                      <button className="ghost-button" onClick={() => void onDeleteChecklist(checklist.id)} type="button">
                        Remove
                      </button>
                    </div>

                    <div className="checklist-items">
                      {checklist.items.map((item) => (
                        <label className="checklist-item" key={item.id}>
                          <input
                            checked={item.isComplete}
                            type="checkbox"
                            onChange={(event) =>
                              void onUpdateChecklistItem(item.id, {
                                isComplete: event.target.checked,
                              })
                            }
                          />
                          <input
                            className={`inline-input ${item.isComplete ? "is-complete" : ""}`}
                            defaultValue={item.title}
                            onBlur={(event) => {
                              const nextTitle = event.target.value.trim();
                              if (nextTitle && nextTitle !== item.title) {
                                void onUpdateChecklistItem(item.id, { title: nextTitle });
                              }
                            }}
                          />
                          <button
                            aria-label={`Delete ${item.title}`}
                            className="icon-button checklist-item__delete"
                            onClick={() => void onDeleteChecklistItem(item.id)}
                            type="button"
                          >
                            x
                          </button>
                        </label>
                      ))}
                    </div>

                    <div className="subtle-form">
                      <input
                        placeholder="Add a checklist item..."
                        value={newItemTitles[checklist.id] ?? ""}
                        onChange={(event) =>
                          setNewItemTitles((current) => ({
                            ...current,
                            [checklist.id]: event.target.value,
                          }))
                        }
                      />
                      <button
                        className="ghost-button"
                        onClick={() => {
                          const nextTitle = (newItemTitles[checklist.id] ?? "").trim();
                          if (!nextTitle) {
                            return;
                          }

                          void onAddChecklistItem(checklist.id, nextTitle);
                          setNewItemTitles((current) => ({
                            ...current,
                            [checklist.id]: "",
                          }));
                        }}
                        type="button"
                      >
                        Add item
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="subtle-form">
                <input
                  ref={newChecklistInputRef}
                  placeholder="Add a checklist..."
                  value={newChecklistTitle}
                  onChange={(event) => setNewChecklistTitle(event.target.value)}
                />
                <button
                  className="ghost-button"
                  onClick={() => {
                    const nextTitle = newChecklistTitle.trim();
                    if (!nextTitle) {
                      return;
                    }

                    void onAddChecklist(card.id, nextTitle);
                    setNewChecklistTitle("");
                  }}
                  type="button"
                >
                  Add checklist
                </button>
              </div>
            </div>
          
            <div className="modal-card" ref={membersSectionRef}>
              <div className="modal-card__header">
                <h4>Members</h4>
                <span>{selectedMemberIds.length}</span>
              </div>
              <div className="selector-stack">
                {board.members.map((member) => (
                  <button
                    key={member.id}
                    className={`selector-button ${selectedMemberIds.includes(member.id) ? "is-selected" : ""}`}
                    onClick={() => {
                      const nextIds = selectedMemberIds.includes(member.id)
                        ? selectedMemberIds.filter((id) => id !== member.id)
                        : [...selectedMemberIds, member.id];
                      setSelectedMemberIds(nextIds);
                      void onUpdateCard(activeCard.id, {
                        title: title.trim() || activeCard.title,
                        description,
                        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
                        labelIds: selectedLabelIds,
                        memberIds: nextIds,
                      });
                    }}
                    type="button"
                  >
                    <span className="avatar-chip" style={{ backgroundColor: member.color }}>
                      {member.avatar}
                    </span>
                    <span>
                      {member.name}
                      <small>{member.role ?? "member"}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-card" ref={coverSectionRef}>
              <div className="modal-card__header">
                <h4>Cover</h4>
                <span>{card.coverImage ? "Enabled" : "None"}</span>
              </div>
              <div className="stacked-actions">
                <button
                  className="ghost-button"
                  disabled={isUploadingCover}
                  onClick={() => coverInputRef.current?.click()}
                  type="button"
                >
                  {isUploadingCover ? "Uploading..." : "Upload new cover"}
                </button>
                <button
                  className="ghost-button"
                  disabled={!card.coverImage || isRemovingCover}
                  onClick={() => void handleRemoveCover()}
                  type="button"
                >
                  {isRemovingCover ? "Removing..." : "Remove cover"}
                </button>
              </div>
            </div>

            <div className="modal-card">
              <div className="modal-card__header">
                <h4>Snapshot</h4>
                <span>{formatDueDate(card.dueDate)}</span>
              </div>
              <dl className="snapshot-grid">
                <div>
                  <dt>Assigned</dt>
                  <dd>{card.members.length}</dd>
                </div>
                <div>
                  <dt>Labels</dt>
                  <dd>{card.labels.length}</dd>
                </div>
                <div>
                  <dt>Files</dt>
                  <dd>{card.attachments.length}</dd>
                </div>
                <div>
                  <dt>Comments</dt>
                  <dd>{card.comments.length}</dd>
                </div>
                <div>
                  <dt>Checklists</dt>
                  <dd>{card.checklists.length}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{new Date(card.updatedAt).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>

            <div className="stacked-actions">
              <button className="primary-button" disabled={isSaving} onClick={() => void handleSave()} type="button">
                {isSaving ? "Saving..." : "Save changes"}
              </button>
              <button className="ghost-button" onClick={() => void onArchiveCard(card.id)} type="button">
                Archive card
              </button>
              <button className="danger-button" onClick={() => void onDeleteCard(card.id)} type="button">
                Delete permanently
              </button>
            </div>
          
          </section>

          <aside className="modal-column modal-column--side">
            <div className="modal-card modal-card--activity" ref={activitySectionRef}>
              <div className="modal-card__header">
                <h4>Comments and activity</h4>
                <button className="ghost-button" onClick={() => setShowActivityDetails((current) => !current)} type="button">
                  {showActivityDetails ? "Hide details" : "Show details"}
                </button>
              </div>

              <label className="field field--comment-box">
                <textarea
                  ref={commentComposerRef}
                  placeholder="Write a comment..."
                  rows={2}
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                />
              </label>

              <div className="comment-composer">
                <button className="primary-button" disabled={isSubmittingComment} onClick={() => void handleAddComment()} type="button">
                  {isSubmittingComment ? "Posting..." : "Post comment"}
                </button>
                {commentError ? <p className="inline-error">{commentError}</p> : null}
              </div>

              <div className="comment-list">
                {card.comments.length > 0 ? (
                  card.comments.map((comment) => (
                    <div className="comment-item" key={comment.id}>
                      <div className="comment-item__header">
                        <strong>{comment.actorName ?? "Someone"}</strong>
                        <small>{new Date(comment.createdAt).toLocaleString()}</small>
                      </div>
                      <p>{comment.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="empty-inline">No comments yet.</p>
                )}
              </div>

              {showActivityDetails ? (
                <div className="activity-list">
                  {card.activity.length > 0 ? (
                    card.activity.map((activity) => (
                      <div className="activity-item" key={activity.id}>
                        <strong>{activity.actorName ?? "Someone"}</strong>
                        <p>{activity.message}</p>
                        <small>{new Date(activity.createdAt).toLocaleString()}</small>
                      </div>
                    ))
                  ) : (
                    <p className="empty-inline">No activity yet.</p>
                  )}
                </div>
              ) : null}
            </div>

                      </aside>
        </div>

        <div className="modal-footer-dock">
          <button
            className={`modal-footer-dock__button ${activeDockView === "powerups" ? "is-active" : ""}`}
            onClick={() => openDock("powerups")}
            type="button"
          >
            Power-ups
          </button>
          <button
            className={`modal-footer-dock__button ${activeDockView === "automations" ? "is-active" : ""}`}
            onClick={() => openDock("automations")}
            type="button"
          >
            Automations
          </button>
          <button
            className={`modal-footer-dock__button ${activeDockView === "comments" ? "is-active" : ""}`}
            onClick={() => openDock("comments")}
            type="button"
          >
            Comments
          </button>
        </div>
      </div>
    </div>
  );
}

function isImageAttachment(mimeType: string) {
  return mimeType.startsWith("image/");
}

function formatBytes(value: number) {
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (value >= 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${value} B`;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read this file."));
    };
    reader.onerror = () => reject(new Error("Unable to read this file."));
    reader.readAsDataURL(file);
  });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

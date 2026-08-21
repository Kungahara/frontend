"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { Clock3, FileText, Folder, HardDrive, ImagePlus, Plus, Search, Trash2, X } from "lucide-react";

import { inventoryFetch } from "@/lib/inventory-client";

type DocumentPeriod = "today" | "month" | "all";
type DocumentFolder = { id: string; name: string; documentCount: number; sizeBytes: number };
type DocumentPhoto = { id: string; folderId: string | null; description: string; imageUrl: string; fileSize: number; mimeType: string; createdAt: string };
type FolderCard = { id: string; name: string; count: string; size: string; action?: boolean; all?: boolean; previews?: string[] };

const cards = [
  { title: "Total documents", description: "Files saved in your workspace", icon: FileText, tone: "blue" },
  { title: "Folders", description: "Folders organizing your files", icon: Folder, tone: "folder" },
  { title: "Storage used", description: "Space currently in use", icon: HardDrive, tone: "storage" },
  { title: "Recently added", description: "Files uploaded this week", icon: Clock3, tone: "recent" },
];

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unit).toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

function preloadDocumentImages(urls: string[]) {
  return Promise.all(urls.map((url) => new Promise<void>((resolve) => {
    const image = new window.Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = url;
    if (image.complete) resolve();
  })));
}

export function DocumentsOverview() {
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [photos, setPhotos] = useState<DocumentPhoto[]>([]);
  const [activeFolder, setActiveFolder] = useState("all-docs");
  const [period, setPeriod] = useState<DocumentPeriod>("all");
  const [query, setQuery] = useState("");
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderBusy, setFolderBusy] = useState(false);
  const [folderError, setFolderError] = useState("");
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoDescription, setPhotoDescription] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [deletingFolder, setDeletingFolder] = useState<DocumentFolder | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [viewingPhoto, setViewingPhoto] = useState<DocumentPhoto | null>(null);
  const [viewerImageLoading, setViewerImageLoading] = useState(false);
  const [viewerImageError, setViewerImageError] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState<DocumentPhoto | null>(null);
  const [photoDeleteBusy, setPhotoDeleteBusy] = useState(false);
  const [photoDeleteError, setPhotoDeleteError] = useState("");
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [draggingPhoto, setDraggingPhoto] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [moveError, setMoveError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    Promise.all([
      inventoryFetch("/api/document-folders", { signal: controller.signal }),
      inventoryFetch("/api/document-photos", { signal: controller.signal }),
    ]).then(async ([folderResponse, photoResponse]) => {
      const [folderBody, photoBody] = await Promise.all([folderResponse.json().catch(() => ({})), photoResponse.json().catch(() => ({}))]);
      if (!folderResponse.ok) throw new Error(folderBody?.error?.message ?? "Could not load folders.");
      if (!photoResponse.ok) throw new Error(photoBody?.error?.message ?? "Could not load photos.");
      const loadedPhotos = (photoBody.photos ?? []) as DocumentPhoto[];
      await preloadDocumentImages(loadedPhotos.map((photo) => photo.imageUrl));
      if (!active) return;
      setFolders(folderBody.folders ?? []);
      setPhotos(loadedPhotos);
    }).catch((error) => { if (error?.name !== "AbortError") setFolderError(error instanceof Error ? error.message : "Could not load documents."); })
      .finally(() => { if (active) setDocumentsLoading(false); });
    return () => { active = false; controller.abort(); };
  }, []);

  async function createFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    setFolderBusy(true); setFolderError("");
    try {
      const response = await inventoryFetch("/api/document-folders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "Could not create the folder.");
      setFolders((current) => [...current, body.folder]);
      setActiveFolder(body.folder.id);
      setNewFolderName(""); setAddingFolder(false);
    } catch (error) { setFolderError(error instanceof Error ? error.message : "Could not create the folder."); }
    finally { setFolderBusy(false); }
  }

  async function createPhoto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photoFile || !photoDescription.trim()) return;
    setPhotoBusy(true); setPhotoError("");
    try {
      const formData = new FormData();
      formData.set("image", photoFile);
      formData.set("description", photoDescription.trim());
      if (activeFolder !== "all-docs") formData.set("folderId", activeFolder);
      const response = await inventoryFetch("/api/document-photos", { method: "POST", body: formData });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "Could not upload the photo.");
      const photo = body.photo as DocumentPhoto;
      await preloadDocumentImages([photo.imageUrl]);
      setPhotos((current) => [photo, ...current]);
      if (photo.folderId) setFolders((current) => current.map((folder) => folder.id === photo.folderId ? { ...folder, documentCount: folder.documentCount + 1, sizeBytes: folder.sizeBytes + photo.fileSize } : folder));
      setPhotoFile(null); setPhotoDescription(""); setAddingPhoto(false);
    } catch (error) { setPhotoError(error instanceof Error ? error.message : "Could not upload the photo."); }
    finally { setPhotoBusy(false); }
  }

  async function deleteFolder() {
    if (!deletingFolder) return;
    setDeleteBusy(true); setDeleteError("");
    try {
      const response = await inventoryFetch(`/api/document-folders/${deletingFolder.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? "Could not delete the folder.");
      }
      setFolders((current) => current.filter((folder) => folder.id !== deletingFolder.id));
      setPhotos((current) => current.filter((photo) => photo.folderId !== deletingFolder.id));
      if (activeFolder === deletingFolder.id) setActiveFolder("all-docs");
      setDeletingFolder(null);
    } catch (error) { setDeleteError(error instanceof Error ? error.message : "Could not delete the folder."); }
    finally { setDeleteBusy(false); }
  }

  async function deletePhoto() {
    if (!deletingPhoto) return;
    setPhotoDeleteBusy(true); setPhotoDeleteError("");
    try {
      const response = await inventoryFetch(`/api/document-photos/${deletingPhoto.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? "Could not delete the document.");
      }
      setPhotos((current) => current.filter((photo) => photo.id !== deletingPhoto.id));
      if (deletingPhoto.folderId) setFolders((current) => current.map((folder) => folder.id === deletingPhoto.folderId ? { ...folder, documentCount: Math.max(0, folder.documentCount - 1), sizeBytes: Math.max(0, folder.sizeBytes - deletingPhoto.fileSize) } : folder));
      if (viewingPhoto?.id === deletingPhoto.id) setViewingPhoto(null);
      setDeletingPhoto(null);
    } catch (error) { setPhotoDeleteError(error instanceof Error ? error.message : "Could not delete the document."); }
    finally { setPhotoDeleteBusy(false); }
  }

  async function movePhoto(photoId: string, destinationId: string) {
    if (destinationId === "all-docs") return;
    const photo = photos.find((item) => item.id === photoId);
    if (!photo) return;
    const nextFolderId = destinationId;
    if (photo.folderId === nextFolderId) return;
    setMoveError("");
    try {
      const response = await inventoryFetch(`/api/document-photos/${photo.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folderId: nextFolderId }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "Could not move the document.");
      setPhotos((current) => current.map((item) => item.id === photo.id ? body.photo : item));
      setFolders((current) => current.map((folder) => {
        if (folder.id === photo.folderId) return { ...folder, documentCount: Math.max(0, folder.documentCount - 1), sizeBytes: Math.max(0, folder.sizeBytes - photo.fileSize) };
        if (folder.id === nextFolderId) return { ...folder, documentCount: folder.documentCount + 1, sizeBytes: folder.sizeBytes + photo.fileSize };
        return folder;
      }));
    } catch (error) { setMoveError(error instanceof Error ? error.message : "Could not move the document."); }
  }

  if (documentsLoading) return <div className="documents-page-content"><div className="sales-page-loading" role="status" aria-live="polite"><span aria-hidden="true" /><strong>Loading documents…</strong><small>Please wait while we prepare your documents workspace.</small></div></div>;

  const folderPhotos = photos.filter((photo) => photo.folderId !== null);
  const totalBytes = folderPhotos.reduce((total, photo) => total + photo.fileSize, 0);
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const recentCount = folderPhotos.filter((photo) => new Date(photo.createdAt) >= weekAgo).length;
  const folderCards: FolderCard[] = [
    { id: "all-docs", name: "All Docs", count: `${folderPhotos.length} document${folderPhotos.length === 1 ? "" : "s"}`, size: formatBytes(totalBytes), all: true },
    { id: "add-folder", name: "Add a folder", count: "", size: "", action: true },
    ...folders.map((folder) => ({ id: folder.id, name: folder.name, count: `${folder.documentCount} document${folder.documentCount === 1 ? "" : "s"}`, size: formatBytes(folder.sizeBytes), previews: photos.filter((photo) => photo.folderId === folder.id).slice(0, 3).map((photo) => photo.imageUrl) })),
  ];
  const activeFolderName = folderCards.find((folder) => folder.id === activeFolder)?.name ?? "All Docs";
  const now = new Date();
  const visiblePhotos = folderPhotos.filter((photo) => {
    const created = new Date(photo.createdAt);
    const matchesFolder = activeFolder === "all-docs" || photo.folderId === activeFolder;
    const matchesPeriod = period === "all" || (period === "today" ? created.toDateString() === now.toDateString() : created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth());
    return matchesFolder && matchesPeriod && photo.description.toLowerCase().includes(query.trim().toLowerCase());
  });

  function summaryValue(title: string) {
    if (title === "Total documents") return `${folderPhotos.length} file${folderPhotos.length === 1 ? "" : "s"}`;
    if (title === "Folders") return `${folders.length} folder${folders.length === 1 ? "" : "s"}`;
    if (title === "Storage used") return `${formatBytes(totalBytes)} / 5 GB`;
    return `${recentCount} this week`;
  }

  return <div className="documents-page-content">
    <div className="stock-summary-grid documents-summary-grid">{cards.map(({ title, description, icon: Icon, tone }) => { const primary = tone === "blue"; const value = summaryValue(title); return <article className={`stock-summary-card documents-summary-card ${tone}${primary ? " stock-value-card" : ""}`} key={title}><span className="stock-summary-title">{title}</span><span className="stock-summary-icon documents-summary-icon"><Icon aria-hidden="true" /></span><div className={primary ? "stock-value-amount" : "stock-summary-value-row"}>{primary ? value : <strong>{value}</strong>}</div><span className={primary ? "historical-card-note" : "stock-summary-previous"}>{description}</span></article>; })}</div>
    <div className="documents-main-row">
      <section className="documents-library" aria-labelledby="documents-library-title">
        <header className="documents-library-header"><h2 id="documents-library-title">{activeFolderName}</h2><label className="documents-search"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search descriptions" aria-label="Search photos by description" /></label></header>
        <div className="documents-library-toolbar"><nav className="sales-view-tabs documents-period-tabs" aria-label="Filter documents by date">{([['all', 'All'], ['today', 'Today'], ['month', 'This month']] as const).map(([value, label]) => <button className={period === value ? "active" : ""} type="button" role="tab" aria-selected={period === value} onClick={() => setPeriod(value)} key={value}>{label}</button>)}</nav></div>
        {documentsLoading ? <div className="documents-photo-grid documents-content-loading" aria-label="Loading documents" aria-busy="true">{[0, 1, 2, 3].map((item) => <span className="documents-photo-skeleton" key={item} />)}</div> : <div className={`documents-photo-grid${visiblePhotos.length ? "" : " empty"}`}>{activeFolder !== "all-docs" && <button className="documents-add-photo-card" type="button" onClick={() => { setPhotoError(""); setAddingPhoto(true); }}><span><Plus aria-hidden="true" /></span><strong>Add document</strong></button>}{activeFolder === "all-docs" && !visiblePhotos.length && <div className="documents-all-docs-empty"><FileText aria-hidden="true" /><strong>No documents yet</strong><p>Add documents inside a folder to see them here.</p></div>}{visiblePhotos.map((photo) => <article className={`documents-photo-card${draggingPhoto === photo.id ? " dragging" : ""}`} draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/document-photo", photo.id); setDraggingPhoto(photo.id); }} onDragEnd={() => { setDraggingPhoto(null); setDragOverFolder(null); }} key={photo.id}><button className="documents-photo-open" type="button" draggable={false} aria-label={`View ${photo.description}`} onClick={() => { setViewerImageLoading(true); setViewerImageError(false); setViewingPhoto(photo); }}><Image src={photo.imageUrl} alt={photo.description} fill sizes="(max-width: 900px) 25vw, 12vw" draggable={false} /><span><p>{photo.description}</p><small>{formatBytes(photo.fileSize)}</small></span></button><button className="documents-photo-delete" type="button" aria-label={`Delete ${photo.description}`} onClick={() => { setPhotoDeleteError(""); setDeletingPhoto(photo); }}><Trash2 aria-hidden="true" /></button></article>)}</div>}
        {moveError && <p className="documents-move-error" role="alert">{moveError}</p>}
      </section>
      <aside className={`documents-folders${folderCards.length >= 5 ? " scrollable" : ""}`} aria-label="Document folders" aria-busy={documentsLoading}>{folderCards.map((folder) => <div className="documents-folder-slot" key={folder.id}><button className={`documents-folder${!folder.action && activeFolder === folder.id ? " active" : ""}${folder.all ? " all-docs" : ""}${folder.action ? " folder-action" : ""}${dragOverFolder === folder.id ? " drag-over" : ""}`} type="button" aria-pressed={!folder.action && activeFolder === folder.id} onClick={() => { if (folder.action) { setFolderError(""); setAddingFolder(true); } else setActiveFolder(folder.id); }} onDragOver={folder.action || folder.all ? undefined : (event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDragOverFolder(folder.id); }} onDragLeave={folder.action || folder.all ? undefined : () => setDragOverFolder((current) => current === folder.id ? null : current)} onDrop={folder.action || folder.all ? undefined : (event) => { event.preventDefault(); const photoId = event.dataTransfer.getData("text/document-photo"); setDragOverFolder(null); setDraggingPhoto(null); if (photoId) void movePhoto(photoId, folder.id); }}>{folder.previews?.length ? <span className="documents-folder-previews" aria-hidden="true">{folder.previews.map((preview, index) => <span className={`documents-folder-preview layer-${index}`} style={{ backgroundImage: `url(${preview})` }} key={preview} />)}</span> : <span className="documents-folder-paper" aria-hidden="true" />}<span className="documents-folder-front">{folder.action ? <><span className="documents-add-folder-icon"><Plus aria-hidden="true" /></span><strong>Add a folder</strong></> : <><strong>{folder.name}</strong><span>{folder.count}</span><small>{folder.size}</small></>}</span></button>{!folder.action && !folder.all && <button className="documents-folder-delete" type="button" aria-label={`Delete ${folder.name}`} onClick={() => { const stored = folders.find((item) => item.id === folder.id); if (stored) { setDeleteError(""); setDeletingFolder(stored); } }}><Trash2 aria-hidden="true" /></button>}</div>)}{documentsLoading && [0, 1].map((item) => <span className="documents-folder-skeleton" aria-hidden="true" key={item} />)}</aside>
    </div>
    {addingFolder && <div className="documents-folder-dialog-backdrop" role="presentation"><form className="documents-folder-dialog" onSubmit={createFolder}><h3>Create a folder</h3><p>Give your new folder a name.</p><label><span>Folder name</span><input autoFocus maxLength={120} value={newFolderName} onChange={(event) => { setNewFolderName(event.target.value); setFolderError(""); }} placeholder="Enter folder name" /></label>{folderError && <p className="documents-folder-dialog-error" role="alert">{folderError}</p>}<div><button type="button" disabled={folderBusy} onClick={() => { setAddingFolder(false); setNewFolderName(""); setFolderError(""); }}>Cancel</button><button className="primary" type="submit" disabled={folderBusy || !newFolderName.trim()}>{folderBusy ? "Creating…" : "Create folder"}</button></div></form></div>}
    {addingPhoto && <div className="documents-folder-dialog-backdrop" role="presentation"><form className="documents-folder-dialog documents-photo-dialog" onSubmit={createPhoto}><h3>Add document to {activeFolderName}</h3><p>Choose an image and add a description before uploading.</p><label><span>Photo</span><span className="documents-photo-picker"><span className="documents-photo-picker-action"><ImagePlus aria-hidden="true" />Choose photo</span><small>{photoFile?.name ?? "No photo selected"}</small><input type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => { setPhotoFile(event.target.files?.[0] ?? null); setPhotoError(""); }} /></span></label><label><span>Description</span><textarea autoFocus maxLength={500} required value={photoDescription} onChange={(event) => { setPhotoDescription(event.target.value); setPhotoError(""); }} placeholder="Describe this photo" /></label>{photoError && <p className="documents-folder-dialog-error" role="alert">{photoError}</p>}<div><button type="button" disabled={photoBusy} onClick={() => { setAddingPhoto(false); setPhotoFile(null); setPhotoDescription(""); setPhotoError(""); }}>Cancel</button><button className="primary" type="submit" disabled={photoBusy || !photoFile || !photoDescription.trim()}>{photoBusy ? "Uploading…" : "Upload document"}</button></div></form></div>}
    {deletingFolder && <div className="documents-folder-dialog-backdrop" role="presentation"><div className="documents-folder-dialog documents-delete-folder-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-folder-title"><h3 id="delete-folder-title">Delete {deletingFolder.name}?</h3><p>The folder and every photo inside it will be permanently deleted.</p>{deleteError && <p className="documents-folder-dialog-error" role="alert">{deleteError}</p>}<div><button type="button" disabled={deleteBusy} onClick={() => { setDeletingFolder(null); setDeleteError(""); }}>Cancel</button><button className="danger" type="button" disabled={deleteBusy} onClick={() => void deleteFolder()}>{deleteBusy ? "Deleting…" : "Delete folder"}</button></div></div></div>}
    {viewingPhoto && <div className="documents-photo-viewer-backdrop" role="presentation" onClick={() => setViewingPhoto(null)}><div className="documents-photo-viewer" role="dialog" aria-modal="true" aria-label={viewingPhoto.description} onClick={(event) => event.stopPropagation()}><button className="documents-photo-viewer-close" type="button" aria-label="Close document" onClick={() => setViewingPhoto(null)}><X aria-hidden="true" /></button><div className="documents-photo-viewer-image"><Image src={viewingPhoto.imageUrl} alt={viewingPhoto.description} fill sizes="90vw" onLoad={() => setViewerImageLoading(false)} onError={() => { setViewerImageLoading(false); setViewerImageError(true); }} />{viewerImageLoading && <span className="documents-photo-viewer-loading" role="status"><i aria-hidden="true" />Loading image…</span>}{viewerImageError && <span className="documents-photo-viewer-error" role="alert">The image could not be loaded.</span>}</div><div className="documents-photo-viewer-caption"><p>{viewingPhoto.description}</p><small>{formatBytes(viewingPhoto.fileSize)} · {new Date(viewingPhoto.createdAt).toLocaleDateString("en-GB")}</small></div></div></div>}
    {deletingPhoto && <div className="documents-folder-dialog-backdrop" role="presentation"><div className="documents-folder-dialog documents-delete-folder-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-document-title"><h3 id="delete-document-title">Delete this document?</h3><p>The image and its description will be permanently deleted.</p>{photoDeleteError && <p className="documents-folder-dialog-error" role="alert">{photoDeleteError}</p>}<div><button type="button" disabled={photoDeleteBusy} onClick={() => { setDeletingPhoto(null); setPhotoDeleteError(""); }}>Cancel</button><button className="danger" type="button" disabled={photoDeleteBusy} onClick={() => void deletePhoto()}>{photoDeleteBusy ? "Deleting…" : "Delete document"}</button></div></div></div>}
  </div>;
}

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getAllResources,
  addResource,
  updateResource,
  deleteResource,
} from "../../firebase/firestore";
import ConfirmDialog from "../shared/ConfirmDialog";

export default function AdminResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editCaption, setEditCaption] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllResources();
      setResources(data);
    } catch (err) {
      toast.error("Failed to load resources.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const validateUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleAdd = async () => {
    setAddError("");
    const trimmedCaption = caption.trim();
    const trimmedUrl = url.trim();

    if (!trimmedCaption) {
      setAddError("Caption/Title is required.");
      return;
    }
    if (!trimmedUrl) {
      setAddError("URL link is required.");
      return;
    }
    if (!validateUrl(trimmedUrl)) {
      setAddError("Please enter a valid absolute URL (e.g. https://google.com).");
      return;
    }

    setAdding(true);
    try {
      await addResource(trimmedCaption, trimmedUrl);
      toast.success("✅ Resource added successfully!");
      setCaption("");
      setUrl("");
      load();
    } catch (err) {
      toast.error("Failed to add resource.");
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (res) => {
    setEditingId(res.id);
    setEditCaption(res.caption);
    setEditUrl(res.url);
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCaption("");
    setEditUrl("");
    setEditError("");
  };

  const handleSaveEdit = async () => {
    setEditError("");
    const trimmedCaption = editCaption.trim();
    const trimmedUrl = editUrl.trim();

    if (!trimmedCaption) {
      setEditError("Caption/Title is required.");
      return;
    }
    if (!trimmedUrl) {
      setEditError("URL link is required.");
      return;
    }
    if (!validateUrl(trimmedUrl)) {
      setEditError("Please enter a valid absolute URL.");
      return;
    }

    setSavingEdit(true);
    try {
      await updateResource(editingId, {
        caption: trimmedCaption,
        url: trimmedUrl,
      });
      toast.success("✏️ Resource updated!");
      setEditingId(null);
      load();
    } catch (err) {
      toast.error("Failed to update resource.");
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteResource(deleteTarget.id);
      toast.success("🗑️ Resource deleted.");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error("Failed to delete resource.");
      console.error(err);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Admin Resources</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Manage resources, study blueprints, and guides dynamically rendered in the resources.html page
        </p>
      </div>

      {/* Add Resource Form */}
      <div className="card mb-6">
        <h2 className="text-base font-bold text-slate-700 mb-4">➕ Add New Resource Link</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="field-group">
              <label className="field-label" htmlFor="res-caption">
                Resource Caption / Title <span className="text-red-500">*</span>
              </label>
              <input
                id="res-caption"
                type="text"
                className="field-input"
                placeholder="e.g. BDDN Career Prospectus"
                value={caption}
                onChange={(e) => {
                  setCaption(e.target.value);
                  setAddError("");
                }}
              />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="res-url">
                Resource URL Link <span className="text-red-500">*</span>
              </label>
              <input
                id="res-url"
                type="text"
                className="field-input"
                placeholder="e.g. https://drive.google.com/..."
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setAddError("");
                }}
              />
            </div>
          </div>

          {addError && <p className="text-xs text-red-500 font-medium">{addError}</p>}

          <div className="flex justify-end">
            <button
              id="add-resource-btn"
              onClick={handleAdd}
              disabled={adding}
              className="btn-primary px-5 py-2 whitespace-nowrap"
            >
              {adding ? (
                <>
                  <div className="spinner" />
                  Adding Link...
                </>
              ) : (
                "Add Resource Link"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Resources list */}
      <div className="table-container">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">📚 Managed Resources List</h3>
          <span className="text-xs font-semibold text-slate-400">
            {resources.length} active link{resources.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner-dark" />
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-3 block">🔗</span>
            <p className="text-slate-600 font-semibold">No resource links added yet.</p>
            <p className="text-slate-400 text-sm">Add your first resources link using the form above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {resources.map((res, index) => (
              <div key={res.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {editingId === res.id ? (
                  /* Editing Mode */
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="field-group">
                        <label className="field-label text-xs">Caption / Title</label>
                        <input
                          type="text"
                          className="field-input py-1 text-sm"
                          value={editCaption}
                          onChange={(e) => setEditCaption(e.target.value)}
                        />
                      </div>
                      <div className="field-group">
                        <label className="field-label text-xs">URL Link</label>
                        <input
                          type="text"
                          className="field-input py-1 text-sm"
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                        />
                      </div>
                    </div>
                    {editError && <p className="text-xs text-red-500 font-medium">{editError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={savingEdit}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        {savingEdit ? "Saving..." : "💾 Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="btn-secondary text-xs px-3 py-1.5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard Read Mode */
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 text-xs font-mono shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm">{res.caption}</p>
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-600 hover:text-brand-700 hover:underline truncate block mt-0.5"
                          >
                            {res.url}
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(res)}
                        className="btn-secondary text-xs px-3 py-1.5"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(res)}
                        className="btn-ghost text-red-400 hover:bg-red-50 text-sm px-2 py-1.5"
                        title="Delete Resource Link"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Resource Link?"
        message={`Are you sure you want to delete the resource link "${deleteTarget?.caption}"? This will immediately remove it from resources.html.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
}

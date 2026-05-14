import React, { useState, useEffect } from "react";
import { X, Save, Loader2, Trash2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { getModuleById, updateModule } from "../../store/slices/module";

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_URL || "";

const EditModulePopup = ({ module, courseId, onClose, onModuleUpdated }) => {
    const dispatch = useDispatch();
    const moduleId = module._id || module.id;

    // ─── Fetch state ───────────────────────────────────────────────
    const [fetching, setFetching] = useState(true);
    const [fetchError, setFetchError] = useState("");

    // ─── Form state (populated after fetch) ────────────────────────
    const [form, setForm] = useState({
        title: module.title || "",
        description: module.description || "",
        order: module.order || 1,
        estimatedDuration: module.estimatedDuration ?? 60,
        isPublished: module.isPublished ?? false,
    });
    const [existingImage, setExistingImage] = useState(module.image || null);

    // ─── Image upload state ─────────────────────────────────────────
    const [newImage, setNewImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // ─── Fetch fresh module data on open ───────────────────────────
    useEffect(() => {
        if (!moduleId) {
            setFetchError("Invalid module ID");
            setFetching(false);
            return;
        }

        setFetching(true);
        setFetchError("");

        const token = localStorage.getItem("token") || "";
        dispatch(getModuleById({ moduleId, token }))
            .unwrap()
            .then((data) => {
                // data is the module object returned from the API
                const m = data?.module || data || {};
                setForm({
                    title: m.title || module.title || "",
                    description: m.description || module.description || "",
                    order: m.order || module.order || 1,
                    estimatedDuration: m.estimatedDuration ?? module.estimatedDuration ?? 60,
                    isPublished: m.isPublished ?? module.isPublished ?? false,
                });
                setExistingImage(m.image || module.image || null);
            })
            .catch(() => {
                // On fetch failure fall back to props — still allow editing
                setFetchError("Could not load latest data. Showing cached data.");
            })
            .finally(() => {
                setFetching(false);
            });
    }, [moduleId]);

    // ─── Handlers ──────────────────────────────────────────────────
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!form.title.trim()) {
            setError("Module title is required");
            return;
        }
        setSaving(true);
        setError("");
        try {
            await dispatch(updateModule({
                moduleId,
                courseId,
                title: form.title,
                description: form.description,
                order: form.order || 1,
                estimatedDuration: form.estimatedDuration,
                isPublished: form.isPublished,
                image: newImage ?? null,
            })).unwrap();
            if (onModuleUpdated) onModuleUpdated();
            onClose();
        } catch {
            setError("Failed to update module. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setSaving(true);
        setError("");
        try {
            await dispatch(updateModule({
                moduleId,
                courseId,
                title: form.title,
                description: form.description,
                order: form.order || 1,
                estimatedDuration: form.estimatedDuration,
                isPublished: false,
            })).unwrap();
            if (onModuleUpdated) onModuleUpdated();
            onClose();
        } catch {
            setError("Failed to delete module.");
        } finally {
            setSaving(false);
            setShowDeleteConfirm(false);
        }
    };

    // Resolve display image: new local preview > existing server image
    const displayImage = imagePreview || (() => {
        if (!existingImage) return null;
        if (typeof existingImage !== "string") return null;
        if (existingImage.startsWith("http")) return existingImage;
        
        // Handle absolute Windows paths (e.g. D:\...\uploads\...)
        let cleanPath = existingImage.replace(/\\/g, "/");
        if (cleanPath.includes("/uploads/")) {
            cleanPath = cleanPath.substring(cleanPath.indexOf("/uploads/"));
        } else if (cleanPath.includes("uploads/")) {
            cleanPath = "/" + cleanPath.substring(cleanPath.indexOf("uploads/"));
        }

        // Use the origin of VITE_BASE_URL as base (e.g. http://localhost:5000)
        // Static files like /uploads are usually served from the root, not /api/v1
        let base = "";
        try {
            const url = new URL(import.meta.env.VITE_BASE_URL);
            base = url.origin;
        } catch (e) {
            // Fallback: strip /api/v1 if present
            base = (import.meta.env.VITE_BASE_URL || "").replace(/\/api\/v1\/?$/, "");
        }
        
        const path = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
        return `${base}${path}`;
    })();

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">

                {/* Close */}
                <button
                    type="button"
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                    onClick={() => { setError(""); onClose(); }}
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-bold">Edit Module</h3>
                    <button
                        type="button"
                        title="Delete Module"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={saving || fetching}
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Loading overlay */}
                {fetching ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <p className="text-sm text-gray-500">Loading module data…</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Fetch warning */}
                        {fetchError && (
                            <div className="text-amber-700 text-sm bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                                {fetchError}
                            </div>
                        )}

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Title *</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={saving}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                disabled={saving}
                            />
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Estimated Duration (minutes)</label>
                            <input
                                type="number"
                                value={form.estimatedDuration}
                                onChange={e => setForm({ ...form, estimatedDuration: parseInt(e.target.value) || 60 })}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min={1}
                                disabled={saving}
                            />
                        </div>

                        {/* Order */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Module Order</label>
                            <input
                                type="number"
                                value={form.order || 1}
                                onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 1 })}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min={1}
                                disabled={saving}
                            />
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>
                        )}
                    </div>
                )}

                {/* Footer */}
                {!fetching && (
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => { setError(""); onClose(); }}
                            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 transition-colors"
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {saving ? "Saving…" : "Save"}
                        </button>
                    </div>
                )}

                {/* Delete Confirm Dialog */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/40">
                        <div className="bg-white rounded-xl shadow-lg p-6 max-w-xs w-full">
                            <h4 className="text-lg font-semibold mb-2 text-red-700">Delete Module?</h4>
                            <p className="text-sm text-gray-600 mb-4">This action cannot be undone.</p>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                                    onClick={handleDelete}
                                    disabled={saving}
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditModulePopup;

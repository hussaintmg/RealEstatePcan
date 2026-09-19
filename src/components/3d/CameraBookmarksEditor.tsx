'use client';

import React from 'react';
import { Camera, Plus, Trash2, Eye, Bookmark, CheckCircle2 } from 'lucide-react';
import { CameraBookmark } from './RealEstate3DViewer';

interface CameraBookmarksEditorProps {
  bookmarks: CameraBookmark[];
  currentCamera?: {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
  };
  defaultPosition?: [number, number, number];
  defaultTarget?: [number, number, number];
  onChangeBookmarks: (bookmarks: CameraBookmark[]) => void;
  onSetDefaultCamera: (pos: [number, number, number], target: [number, number, number]) => void;
  onPreviewBookmark: (pos: [number, number, number], target: [number, number, number], fov?: number) => void;
}

export const CameraBookmarksEditor: React.FC<CameraBookmarksEditorProps> = ({
  bookmarks,
  currentCamera,
  defaultPosition,
  defaultTarget,
  onChangeBookmarks,
  onSetDefaultCamera,
  onPreviewBookmark,
}) => {
  const addBookmarkFromCurrentView = () => {
    if (!currentCamera) return;
    const newBookmark: CameraBookmark = {
      id: `bm-${Date.now()}`,
      label: `Viewpoint ${bookmarks.length + 1}`,
      position: [
        Number(currentCamera.position[0].toFixed(2)),
        Number(currentCamera.position[1].toFixed(2)),
        Number(currentCamera.position[2].toFixed(2)),
      ],
      target: [
        Number(currentCamera.target[0].toFixed(2)),
        Number(currentCamera.target[1].toFixed(2)),
        Number(currentCamera.target[2].toFixed(2)),
      ],
      fov: currentCamera.fov || 55,
      order: bookmarks.length + 1,
    };
    onChangeBookmarks([...bookmarks, newBookmark]);
  };

  const removeBookmark = (index: number) => {
    onChangeBookmarks(bookmarks.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full space-y-4 text-xs">
      {/* Action Header */}
      <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white flex items-center space-x-1.5">
            <Camera className="w-4 h-4 text-blue-400" />
            <span>Active Camera Viewport</span>
          </span>
          <button
            onClick={() => {
              if (currentCamera) {
                onSetDefaultCamera(currentCamera.position, currentCamera.target);
              }
            }}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-semibold transition-all"
          >
            Set as Default Opening View
          </button>
        </div>

        {currentCamera && (
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 font-mono">
            <div>
              Pos: [{currentCamera.position.map((v) => v.toFixed(1)).join(', ')}]
            </div>
            <div>
              Target: [{currentCamera.target.map((v) => v.toFixed(1)).join(', ')}]
            </div>
          </div>
        )}

        <button
          onClick={addBookmarkFromCurrentView}
          className="w-full py-1.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Save Current View as Bookmark</span>
        </button>
      </div>

      {/* Bookmarks List */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-1 max-h-[380px]">
        <span className="text-slate-400 text-[11px] font-semibold block">Saved Camera Viewpoints ({bookmarks.length})</span>

        {bookmarks.length === 0 ? (
          <div className="text-center py-8 text-slate-500 italic">
            <Bookmark className="w-7 h-7 mx-auto mb-2 text-slate-600 opacity-60" />
            <p>No viewpoints saved yet.</p>
            <p className="text-[10px] text-slate-600">Rotate/zoom to desired view and click &quot;Save Current View&quot;.</p>
          </div>
        ) : (
          bookmarks.map((bm, idx) => (
            <div key={bm.id} className="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={bm.label}
                  onChange={(e) => {
                    const updated = [...bookmarks];
                    updated[idx].label = e.target.value;
                    onChangeBookmarks(updated);
                  }}
                  className="bg-transparent font-bold text-white border-b border-transparent hover:border-white/20 focus:border-blue-500 focus:outline-none w-2/3"
                />
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onPreviewBookmark(bm.position, bm.target, bm.fov)}
                    title="Jump Camera to this View"
                    className="p-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeBookmark(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono">
                <div>Pos: [{bm.position.map((v) => Number(v.toFixed(1))).join(', ')}]</div>
                <div>LookAt: [{bm.target.map((v) => Number(v.toFixed(1))).join(', ')}]</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

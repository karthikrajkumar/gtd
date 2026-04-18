import { create } from 'zustand';
import type { FileNode, OpenFile } from '../types/session.js';

interface FileStore {
  tree: FileNode[];
  openFiles: OpenFile[];
  activeFile: string | null; // path of the active file

  setTree: (tree: FileNode[]) => void;
  openFile: (file: OpenFile) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  clearFiles: () => void;
}

export const useFileStore = create<FileStore>((set) => ({
  tree: [],
  openFiles: [],
  activeFile: null,

  setTree: (tree) => set({ tree }),

  openFile: (file) =>
    set((state) => {
      const existing = state.openFiles.find((f) => f.path === file.path);
      if (existing) {
        // Update content if already open
        return {
          openFiles: state.openFiles.map((f) =>
            f.path === file.path ? { ...f, content: file.content } : f,
          ),
          activeFile: file.path,
        };
      }
      return {
        openFiles: [...state.openFiles, file],
        activeFile: file.path,
      };
    }),

  closeFile: (path) =>
    set((state) => {
      const remaining = state.openFiles.filter((f) => f.path !== path);
      return {
        openFiles: remaining,
        activeFile:
          state.activeFile === path
            ? remaining[remaining.length - 1]?.path ?? null
            : state.activeFile,
      };
    }),

  setActiveFile: (path) => set({ activeFile: path }),

  updateFileContent: (path, content) =>
    set((state) => ({
      openFiles: state.openFiles.map((f) =>
        f.path === path ? { ...f, content } : f,
      ),
    })),

  clearFiles: () => set({ tree: [], openFiles: [], activeFile: null }),
}));

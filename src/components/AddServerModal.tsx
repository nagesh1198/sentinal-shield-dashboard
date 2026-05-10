"use client";

import { useState, useEffect } from "react";
import { X, Copy, Server, AlertTriangle, Check, RefreshCw } from "lucide-react";

interface AddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOKEN = "cvs.AKm9xR7vQpL2nJsT4wBdF8cYuE6oXhZ3iGmN1rVqP5";
const INSTALL_CMD = `curl -sfL https://get.cadoc.io/install.sh | sh -s -- --token \\
  ${TOKEN} --profile honey-web`;
const REFRESH_CMD = `cadoc-cli refresh --all-nodes --force`;

export function AddServerModal({ isOpen, onClose }: AddServerModalProps) {
  const [timeLeft, setTimeLeft] = useState(298); // 4:58
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedRefresh, setCopiedRefresh] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(298);
    const t = setInterval(() => setTimeLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [isOpen]);

  if (!isOpen) return null;

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");
  const isExpiring = timeLeft < 60;

  function copy(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-[fadeUp_0.2s_ease]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">Add New Server</h2>
              <p className="text-xs text-on-surface-variant">Step 2: Deploy Tactical Sentinel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-container-high rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-on-surface-variant" />
          </button>
        </div>

        <div className="px-6 space-y-4 pb-6">
          {/* Token Row */}
          <div className="bg-surface-container-low rounded-xl px-4 py-3 flex items-center justify-between border border-outline-variant/10">
            <div>
              <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                Temporary Join Token
              </p>
              <p className="text-xs font-mono text-primary font-semibold break-all">{TOKEN}</p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Expires In</p>
              <p className={`text-base font-bold font-mono ${isExpiring ? "text-error" : "text-primary"}`}>
                {mins}:{secs}
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Deployment tokens are single-use and expire after 5 minutes. If the installation fails or times out,
              you must generate a new token to resume.
            </p>
          </div>

          {/* Automated Install */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-semibold text-on-surface">Automated Install (Recommended)</p>
              <button
                onClick={() => copy(INSTALL_CMD, setCopiedInstall)}
                className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-container transition-colors"
              >
                {copiedInstall ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedInstall ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="bg-[#0e1117] rounded-xl px-4 py-3">
              <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap break-all leading-5">{INSTALL_CMD}</pre>
            </div>
          </div>

          {/* Redeploy */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-semibold text-on-surface">Redeploy Sentinel</p>
              <button className="text-[9px] font-bold text-on-surface-variant border border-outline-variant/30 px-2.5 py-1 rounded-full hover:bg-surface-container-high transition-colors uppercase tracking-widest">
                Generate Redeploy Token
              </button>
            </div>
            <input
              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-2.5 text-xs font-mono text-on-surface-variant placeholder:text-on-surface-variant/40 outline-none focus:border-primary/30 transition-colors"
              placeholder="# Token required to run redeploy command..."
              readOnly
            />
          </div>

          {/* Refresh Canary */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-semibold text-on-surface">Refresh Canary Assets</p>
              <button
                onClick={() => copy(REFRESH_CMD, setCopiedRefresh)}
                className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-container transition-colors"
              >
                {copiedRefresh ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedRefresh ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="bg-[#0e1117] rounded-xl px-4 py-3">
              <pre className="text-xs font-mono text-emerald-400">{REFRESH_CMD}</pre>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button className="px-6 py-2.5 rounded-full text-sm font-bold bg-primary text-white hover:bg-primary-container transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Verify Deployment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

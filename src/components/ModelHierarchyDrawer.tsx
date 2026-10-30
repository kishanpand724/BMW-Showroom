import React, { useRef } from 'react';
import { CheckCircle2, FileUp, RotateCcw, X } from 'lucide-react';
import { ModelInspectionReport } from '../utils/carModelRig';

export interface ModelHierarchyDrawerProps {
  open: boolean;
  onClose: () => void;
  report: ModelInspectionReport | null;
  currentModelUrl: string;
  onSelectCustomGlbFile: (file: File) => void;
  onResetDefaultModel: () => void;
}

export const ModelHierarchyDrawer: React.FC<ModelHierarchyDrawerProps> = ({
  open,
  onClose,
  report,
  currentModelUrl,
  onSelectCustomGlbFile,
  onResetDefaultModel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const isCustomModel = currentModelUrl !== '/models/bmw_m4.glb';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="model-rig-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 p-4 md:p-6"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#0B0E14] border border-white/15 p-6 md:p-8 text-[#F5F7FA] shadow-2xl">
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <p className="font-mono text-[11px] tracking-[0.26em] uppercase text-[#1C69D4] mb-1">
              3D GLB ASSET & KINEMATIC RIG DIAGNOSTICS
            </p>
            <h2
              id="model-rig-dialog-title"
              className="text-xl md:text-2xl font-bold tracking-tight"
            >
              {report ? report.modelName : 'Inspecting Vehicle Scene Graph...'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Model Hierarchy Inspector"
            className="p-2 text-[#9BA3B0] hover:text-white border border-white/10 hover:border-white/30 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {report && (
          <div className="space-y-6 pt-5">
            {/* License & Asset Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-white/[0.03] border border-white/10">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#9BA3B0]">
                  Total Meshes
                </p>
                <p className="text-lg font-mono font-semibold tabular-nums mt-0.5">
                  {report.totalMeshes}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#9BA3B0]">
                  Total Triangles
                </p>
                <p className="text-lg font-mono font-semibold tabular-nums mt-0.5">
                  {report.totalTriangles.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#9BA3B0]">
                  PBR Materials
                </p>
                <p className="text-lg font-mono font-semibold tabular-nums mt-0.5">
                  {report.totalMaterials}
                </p>
              </div>
            </div>

            <div className="text-xs text-[#9BA3B0] space-y-1">
              <p>
                <strong className="text-white">License:</strong> {report.license}
              </p>
              <p>
                <strong className="text-white">Attribution:</strong> {report.author}
              </p>
              <p>
                <strong className="text-white">Asset Source:</strong>{' '}
                <span className="font-mono text-[#C8D0DC]">{report.sourceUrl}</span>
              </p>
            </div>

            {/* Articulated Kinematic Pivots Table */}
            <div>
              <h3 className="font-mono text-xs uppercase tracking-[0.22em] text-[#C8D0DC] mb-3">
                Articulated Physical Hinge Pivots (Meter Space)
              </h3>
              <div className="space-y-2.5">
                {report.parts.map((part) => (
                  <div
                    key={part.name}
                    className="p-3.5 bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1C69D4] shrink-0" />
                        <span className="text-xs font-medium text-white">
                          {part.name}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-[#9BA3B0] mt-1 tabular-nums">
                        Hinge Pivot: [{part.pivotCoordinates.join('m, ')}m] ·{' '}
                        {part.meshCount} material sub-meshes
                      </p>
                    </div>
                    <div className="text-right font-mono text-xs tabular-nums text-[#C8D0DC] shrink-0">
                      {part.triangleCount.toLocaleString()} tris
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Engineering Notes */}
            <div>
              <h3 className="font-mono text-xs uppercase tracking-[0.22em] text-[#C8D0DC] mb-2">
                Hierarchy Verification Notes
              </h3>
              <ul className="space-y-1.5 text-xs text-[#9BA3B0]">
                {report.notes.map((note, idx) => (
                  <li key={idx} className="leading-relaxed">
                    • {note}
                  </li>
                ))}
              </ul>
            </div>

            {/* Replaceable GLB / GLTF Model Loader */}
            <div className="pt-4 border-t border-white/10">
              <h3 className="font-mono text-xs uppercase tracking-[0.22em] text-[#C8D0DC] mb-2">
                Replaceable GLB / GLTF Vehicle Loader
              </h3>
              <p className="text-xs text-[#9BA3B0] mb-3 leading-relaxed">
                Load any custom <code className="text-white">.glb</code> or{' '}
                <code className="text-white">.gltf</code> vehicle asset to inspect its mesh
                hierarchy and test it in the scroll-controlled studio stage.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".glb,.gltf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onSelectCustomGlbFile(file);
                  }
                }}
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider bg-[#1C69D4] text-white hover:bg-[#1556B0] transition-colors cursor-pointer"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Load Custom .GLB Model</span>
                </button>

                {isCustomModel && (
                  <button
                    type="button"
                    onClick={onResetDefaultModel}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono uppercase tracking-wider bg-white/[0.06] border border-white/15 text-white hover:border-white/40 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Default BMW M4 (G82)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// import { useState } from "react";
// import { previewBulkProducts, confirmBulkProducts } from "../api/productapi";

// export default function BulkUploadProducts() {
//   const [step, setStep] = useState("upload"); // "upload" | "preview" | "done"
//   const [sheetFile, setSheetFile] = useState(null);
//   const [imageFiles, setImageFiles] = useState([]);
//   const [previewRows, setPreviewRows] = useState([]);
//   const [progress, setProgress] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [confirmResult, setConfirmResult] = useState(null);

//   const handleGeneratePreview = async () => {
//     setError("");
//     if (!sheetFile) return setError("Please select the filled template (.xlsx or .csv)");
//     if (imageFiles.length === 0) return setError("Please select the product images");

//     setLoading(true);
//     try {
//       const res = await previewBulkProducts(sheetFile, imageFiles, (e) =>
//         setProgress(Math.round((e.loaded * 100) / e.total))
//       );
//       setPreviewRows(res.data); // res = { success, data: [...] }
//       setStep("preview");
//     } catch (err) {
//       setError(err?.response?.data?.message || "Could not generate preview. Please try again.");
//     } finally {
//       setLoading(false);
//       setProgress(0);
//     }
//   };

//   const handleConfirmImport = async () => {
//     const validRows = previewRows.filter((r) => r.isValid);
//     if (validRows.length === 0) return setError("No valid rows to import");

//     setLoading(true);
//     try {
//       const res = await confirmBulkProducts(validRows);
//       setConfirmResult(res.data); // res = { success, data: { success: [], failed: [] } }
//       setStep("done");
//     } catch (err) {
//       setError(err?.response?.data?.message || "Import failed. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const validCount = previewRows.filter((r) => r.isValid).length;
//   const invalidCount = previewRows.length - validCount;

//   return (
//     <div className="p-6 max-w-5xl">
//       <h1 className="text-xl font-semibold mb-4">Bulk Upload Products</h1>

//       {step === "upload" && (
//         <>
//           <div className="mb-4">
//             <label className="block text-sm font-medium mb-1">
//               Step 1: Filled Template (.xlsx / .csv)
//             </label>
//             <input
//               type="file"
//               accept=".xlsx,.csv"
//               onChange={(e) => setSheetFile(e.target.files[0])}
//               className="border rounded-lg p-2 w-full"
//             />
//           </div>

//           <div className="mb-4">
//             <label className="block text-sm font-medium mb-1">
//               Step 2: Product Images (filenames must match the sheet)
//             </label>
//             <input
//               type="file"
//               multiple
//               accept="image/*"
//               onChange={(e) => setImageFiles([...e.target.files])}
//               className="border rounded-lg p-2 w-full"
//             />
//             {imageFiles.length > 0 && (
//               <p className="text-xs text-gray-500 mt-1">{imageFiles.length} image(s) selected</p>
//             )}
//           </div>

//           {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

//           <button
//             onClick={handleGeneratePreview}
//             disabled={loading}
//             className="bg-[#f2a93b] text-white px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50 hover:bg-[#e2992b]"
//           >
//             {loading ? `Matching... ${progress}%` : "Preview Import"}
//           </button>
//         </>
//       )}

//       {step === "preview" && (
//         <>
//           <div className="flex items-center justify-between mb-3">
//             <p className="text-sm">
//               <span className="text-[#277437] font-medium">{validCount} ready to import</span>
//               {invalidCount > 0 && (
//                 <span className="text-[#c93636] font-medium ml-3">{invalidCount} need fixing</span>
//               )}
//             </p>
//             <button onClick={() => setStep("upload")} className="text-sm text-gray-500 underline">
//               ← Re-upload
//             </button>
//           </div>

//           <div className="border border-[#eee] rounded-xl overflow-x-auto mb-4">
//             <table className="w-full text-sm">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="p-3 text-left text-[#555]">Image</th>
//                   <th className="p-3 text-left text-[#555]">Product Name</th>
//                   <th className="p-3 text-left text-[#555]">Price</th>
//                   <th className="p-3 text-left text-[#555]">Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {previewRows.map((row) => (
//                   <tr key={row.rowId} className={`border-t border-[#f5f5f5] ${!row.isValid ? "bg-red-50" : ""}`}>
//                     <td className="p-3">
//                       {row.images?.cover ? (
//                         <img
//                           src={row.images.cover}
//                           alt={row.body.productName}
//                           className="w-14 h-14 object-cover rounded-md"
//                         />
//                       ) : (
//                         <div className="w-14 h-14 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-400">
//                           No image
//                         </div>
//                       )}
//                     </td>
//                     <td className="p-3">
//                       {row.body.productName || <em className="text-gray-400">missing</em>}
//                     </td>
//                     <td className="p-3">₹{row.body.sellingPrice || "-"}</td>
//                     <td className="p-3">
//                       {row.isValid ? (
//                         <span className="text-[#277437]">✓ Ready</span>
//                       ) : (
//                         <span className="text-[#c93636]">{row.errors.join("; ")}</span>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

//           <p className="text-xs text-gray-500 mb-3">
//             Fix the flagged rows in your sheet and re-upload if needed. Confirming will only
//             import the rows marked "Ready" above.
//           </p>

//           <button
//             onClick={handleConfirmImport}
//             disabled={loading || validCount === 0}
//             className="bg-[#f2a93b] text-white px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50 hover:bg-[#e2992b]"
//           >
//             {loading ? "Importing..." : `Confirm Import (${validCount})`}
//           </button>
//         </>
//       )}

//       {step === "done" && confirmResult && (
//         <div>
//           <p className="text-[#277437] font-medium mb-2">
//             {confirmResult.success.length} product(s) imported successfully
//           </p>
//           {confirmResult.failed.length > 0 && (
//             <div>
//               <p className="text-[#c93636] font-medium">{confirmResult.failed.length} row(s) failed:</p>
//               <ul className="text-sm text-[#c93636] list-disc pl-5 mt-1">
//                 {confirmResult.failed.map((f) => (
//                   <li key={f.rowId}>
//                     Row {f.rowId}: {f.errors.join(", ")}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}
//           <button
//             onClick={() => {
//               setStep("upload");
//               setSheetFile(null);
//               setImageFiles([]);
//               setPreviewRows([]);
//               setConfirmResult(null);
//             }}
//             className="mt-4 text-sm text-gray-600 underline"
//           >
//             Import more products
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { Download, UploadCloud, X } from "lucide-react";
import { downloadBulkProductTemplate, previewBulkProducts, confirmBulkProducts } from "../../api/productapi";
import { FORM_ERROR_BANNER } from "../../constants/ui";

const PAGE_HEADER = "mb-5 flex items-center gap-3";
const BACK_BTN = "grid h-9 w-9 place-items-center rounded-lg border border-[#e5e5e5] bg-white hover:bg-[#f7f7f7]";
const PAGE_TITLE = "text-[28px] font-bold";
const CARD = "rounded-xl border border-[#eee] bg-white p-5";
const LABEL = "mb-1.5 block text-[14px] font-semibold text-[#333]";
const FILE_INPUT = "w-full rounded-lg border border-[#e5e5e5] p-2.5 text-[14px]";
const PRIMARY_BTN =
  "flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-[#f2a93b] px-5 py-2.5 font-semibold text-white hover:bg-[#e2992b] disabled:opacity-50";
const GHOST_LINK_BTN = "text-[13px] text-[#777] underline";
const TABLE_CARD = "rounded-xl border border-[#eee] bg-white overflow-x-auto";
const TABLE = "w-full border-collapse text-[14px]";
const TH = "border-b border-[#eee] px-3 py-3 text-left text-[13px] text-[#555]";
const TD = "border-b border-[#f5f5f5] px-3 py-3";

export default function BulkUploadProducts({ onClose }) {
  const [step, setStep] = useState("upload"); // "upload" | "preview" | "done"
  const [sheetFile, setSheetFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmResult, setConfirmResult] = useState(null);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const handleDownloadTemplate = async () => {
    setError("");
    try {
      const file = await downloadBulkProductTemplate();
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = "bulk-product-upload-template.xlsx";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not download the template.");
    }
  };

  const handleGeneratePreview = async () => {
    setError("");
    if (!sheetFile) return setError("Please select the filled template (.xlsx or .csv)");
    if (imageFiles.length === 0) return setError("Please select the product images");

    setLoading(true);
    try {
      const res = await previewBulkProducts(sheetFile, imageFiles, (e) =>
        setProgress(Math.round((e.loaded * 100) / e.total))
      );
      setPreviewRows(res.data);
      setStep("preview");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not generate preview. Please try again.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleConfirmImport = async () => {
    const validRows = previewRows.filter((r) => r.isValid);
    if (validRows.length === 0) return setError("No valid rows to import");

    setLoading(true);
    try {
      const res = await confirmBulkProducts(validRows, imageFiles);
      setConfirmResult(res.data);
      setStep("done");
    } catch (err) {
      setError(err?.response?.data?.message || "Import failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const validCount = previewRows.filter((r) => r.isValid).length;
  const invalidCount = previewRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="bulk-upload-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-y-auto rounded-2xl bg-[#fafafa] p-6 shadow-2xl">
        <div className={`${PAGE_HEADER} justify-between`}>
          <h1 id="bulk-upload-title" className={PAGE_TITLE}>Bulk Upload Products</h1>
          <button className={BACK_BTN} onClick={onClose} aria-label="Close bulk upload">
            <X size={19} />
          </button>
        </div>

      {step === "upload" && (
        <div className={CARD}>
          <button className={`${GHOST_LINK_BTN} mb-4 flex items-center gap-1.5`} onClick={handleDownloadTemplate} type="button">
            <Download size={16} />
            Download Template
          </button>
          <div className="mb-4">
            <label className={LABEL}>Step 1: Filled Template (.xlsx / .csv)</label>
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={(e) => setSheetFile(e.target.files[0])}
              className={FILE_INPUT}
            />
          </div>

          <div className="mb-4">
            <label className={LABEL}>Step 2: Product Images (filenames must match the sheet)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImageFiles([...e.target.files])}
              className={FILE_INPUT}
            />
            {imageFiles.length > 0 && (
              <p className="mt-1 text-[13px] text-[#777]">{imageFiles.length} image(s) selected</p>
            )}
          </div>

          {error && <div className={`${FORM_ERROR_BANNER} mb-4`}>{error}</div>}

          <button className={PRIMARY_BTN} onClick={handleGeneratePreview} disabled={loading}>
            <UploadCloud size={18} />
            {loading ? `Matching... ${progress}%` : "Preview Import"}
          </button>
        </div>
      )}

      {step === "preview" && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[14px]">
              <span className="font-semibold text-[#277437]">{validCount} ready to import</span>
              {invalidCount > 0 && (
                <span className="ml-3 font-semibold text-[#c93636]">{invalidCount} need fixing</span>
              )}
            </p>
            <button className={GHOST_LINK_BTN} onClick={() => setStep("upload")}>
              ← Re-upload
            </button>
          </div>

          <div className={`${TABLE_CARD} mb-4`}>
            <table className={TABLE}>
              <thead>
                <tr>
                  <th className={TH}>Image</th>
                  <th className={TH}>Product Name</th>
                  <th className={TH}>Price</th>
                  <th className={TH}>Status</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr key={row.rowId} className={!row.isValid ? "bg-[#fdeceb]" : ""}>
                    <td className={TD}>
                      {row.images?.cover ? (
                        <img
                          src={row.images.cover}
                          alt={row.body.productName}
                          className="h-14 w-14 rounded-md object-cover"
                        />
                      ) : (
                        <div className="grid h-14 w-14 place-items-center rounded-md bg-[#f5f5f5] text-[11px] text-[#999]">
                          No image
                        </div>
                      )}
                    </td>
                    <td className={TD}>{row.body.productName || <em className="text-[#999]">missing</em>}</td>
                    <td className={TD}>₹{row.body.sellingPrice || "-"}</td>
                    <td className={TD}>
                      {row.isValid ? (
                        <span className="font-semibold text-[#277437]">✓ Ready</span>
                      ) : (
                        <span className="text-[#c93636]">{row.errors.join("; ")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <div className={`${FORM_ERROR_BANNER} mb-4`}>{error}</div>}

          <p className="mb-3 text-[13px] text-[#777]">
            Fix the flagged rows in your sheet and re-upload if needed. Confirming will only
            import the rows marked &quot;Ready&quot; above.
          </p>

          <button className={PRIMARY_BTN} onClick={handleConfirmImport} disabled={loading || validCount === 0}>
            {loading ? "Importing..." : `Confirm Import (${validCount})`}
          </button>
        </>
      )}

      {step === "done" && confirmResult && (
        <div className={CARD}>
          <p className="mb-2 font-semibold text-[#277437]">
            {confirmResult.success.length} product(s) imported successfully
          </p>
          {confirmResult.failed.length > 0 && (
            <div>
              <p className="font-semibold text-[#c93636]">{confirmResult.failed.length} row(s) failed:</p>
              <ul className="mt-1 list-disc pl-5 text-[13px] text-[#c93636]">
                {confirmResult.failed.map((f) => (
                  <li key={f.rowId}>
                    Row {f.rowId}: {f.errors.join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            className={`${GHOST_LINK_BTN} mt-4`}
            onClick={() => {
              setStep("upload");
              setSheetFile(null);
              setImageFiles([]);
              setPreviewRows([]);
              setConfirmResult(null);
            }}
          >
            Import more products
          </button>
        </div>
      )}
      </div>
    </div>
  );
}

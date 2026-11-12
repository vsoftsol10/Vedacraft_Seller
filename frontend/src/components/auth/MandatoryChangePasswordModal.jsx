import { useState } from "react";
import { Eye, EyeOff, Lock, KeyRound, LoaderCircle, ShieldAlert, CheckCircle2 } from "lucide-react";
import { changePassword } from "../../api/authapi";
import { getSellerSession, saveSellerSession, clearSellerSession } from "../../api/productapi";
import { useNavigate } from "react-router-dom";

export default function MandatoryChangePasswordModal({ onPasswordChanged }) {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword) {
      return setError("Please enter your current temporary password.");
    }
    if (!newPassword || newPassword.length < 8) {
      return setError("New password must be at least 8 characters long.");
    }
    if (newPassword === currentPassword) {
      return setError("New password must be different from your current temporary password.");
    }
    if (newPassword !== confirmPassword) {
      return setError("New passwords do not match.");
    }

    try {
      setIsSubmitting(true);
      const res = await changePassword({ currentPassword, newPassword });
      setSuccess(res.message || "Password changed successfully! Unlocking your dashboard...");

      // Update session to clear mustChangePassword
      const session = getSellerSession();
      if (session) {
        saveSellerSession({ ...session, mustChangePassword: false });
      }

      setTimeout(() => {
        if (onPasswordChanged) onPasswordChanged();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password. Please check your current temporary password and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearSellerSession();
    navigate("/login", { replace: true });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div
        className="w-full max-w-[480px] rounded-2xl bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-600">
            <ShieldAlert size={28} />
          </div>
          <h2 id="change-password-title" className="m-0 text-xl font-bold text-gray-900">
            Set Your Permanent Password
          </h2>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            You signed in using a <strong>temporary password</strong>. For security reasons, you must set a permanent password before accessing your dashboard and managing store products.
          </p>
        </div>

        {/* Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5" htmlFor="modal-current-password">
              Current Temporary Password
            </label>
            <div className="flex h-11 items-center rounded-lg border border-gray-300 bg-gray-50 px-3 focus-within:border-[#257d2a] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#257d2a]/20">
              <KeyRound size={18} className="text-gray-400 mr-2 shrink-0" />
              <input
                id="modal-current-password"
                className="w-full border-0 bg-transparent text-sm text-gray-900 outline-none"
                type={showCurrent ? "text" : "password"}
                placeholder="Enter temporary password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isSubmitting || Boolean(success)}
              />
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 p-1"
                onClick={() => setShowCurrent(!showCurrent)}
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5" htmlFor="modal-new-password">
              New Permanent Password
            </label>
            <div className="flex h-11 items-center rounded-lg border border-gray-300 bg-gray-50 px-3 focus-within:border-[#257d2a] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#257d2a]/20">
              <Lock size={18} className="text-gray-400 mr-2 shrink-0" />
              <input
                id="modal-new-password"
                className="w-full border-0 bg-transparent text-sm text-gray-900 outline-none"
                type={showNew ? "text" : "password"}
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting || Boolean(success)}
              />
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 p-1"
                onClick={() => setShowNew(!showNew)}
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5" htmlFor="modal-confirm-password">
              Confirm New Password
            </label>
            <div className="flex h-11 items-center rounded-lg border border-gray-300 bg-gray-50 px-3 focus-within:border-[#257d2a] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#257d2a]/20">
              <Lock size={18} className="text-gray-400 mr-2 shrink-0" />
              <input
                id="modal-confirm-password"
                className="w-full border-0 bg-transparent text-sm text-gray-900 outline-none"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting || Boolean(success)}
              />
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 p-1"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800 font-semibold">
              <CheckCircle2 size={18} className="text-green-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || Boolean(success)}
            className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg border-0 bg-[#257d2a] text-sm font-bold text-white shadow-sm hover:bg-[#1f6823] transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting && <LoaderCircle size={18} className="animate-spin" />}
            {isSubmitting ? "Updating Password..." : "Update Password & Unlock Dashboard"}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 bg-transparent border-0 cursor-pointer"
            >
              Cancel and Sign Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


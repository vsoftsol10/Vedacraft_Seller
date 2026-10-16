import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/authapi";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    if (password.length < 8) return setMessage("Your password must contain at least 8 characters.");
    if (password !== confirmPassword) return setMessage("Passwords do not match.");
    try {
      setSaving(true);
      const response = await resetPassword({ token: params.get("token"), password });
      setMessage(response.message);
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to reset your password. Please try again.");
    } finally { setSaving(false); }
  };

  return <main className="grid min-h-screen place-items-center bg-[#fbfcf8] px-4"><section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_14px_42px_rgba(31,70,45,0.11)]"><h1 className="m-0 text-3xl font-normal text-[#214631]">Choose a new password</h1><p className="mt-3 text-[#718173]">Use at least 8 characters. This link can be used only once.</p><form className="mt-7 grid gap-4" onSubmit={submit}><label className="grid gap-2 font-bold text-[#214631]">New password<input className="rounded-lg border border-[#e6e4de] bg-[#faf9f6] p-3 font-normal outline-none focus:border-[#2f7d4a]" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={saving} /></label><label className="grid gap-2 font-bold text-[#214631]">Confirm new password<input className="rounded-lg border border-[#e6e4de] bg-[#faf9f6] p-3 font-normal outline-none focus:border-[#2f7d4a]" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={saving} /></label>{message && <p className="m-0 text-sm text-[#2f6b45]" role="status">{message}</p>}<button className="mt-2 h-12 rounded-lg border-0 bg-[#f6c744] font-bold text-[#1f3d2b] disabled:opacity-70" disabled={saving}>{saving ? "Resetting..." : "Reset password"}</button></form><Link className="mt-5 inline-block font-bold text-[#2f7d4a]" to="/login">Back to sign in</Link></section></main>;
}

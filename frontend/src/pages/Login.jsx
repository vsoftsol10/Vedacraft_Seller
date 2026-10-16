import { useState } from "react";
import { Eye, EyeOff, KeyRound, Lock, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { loginSeller, requestPasswordReset } from "../api/authapi";
import { saveSellerSession } from "../api/productapi";
import loginLogo from "../assets/images/logo-login.png";
import loginBackground from "../assets/images/seller-login-background.png";
import loginCharacter from "../assets/images/seller-login-character.png";

const inputWrapClass = "flex h-[3.2em] items-center gap-[.7em] rounded-[.6em] border border-[#e6e4de] bg-[#faf9f6] px-[1em] text-[#8a968c] transition-[border-color,box-shadow] duration-150 focus-within:border-brand-green focus-within:shadow-[0_0_0_3px_#e3f2e5]";
const inputClass = "min-w-0 w-full border-0 bg-transparent text-[1.05em] text-[#23372a] outline-0 font-[inherit] placeholder:text-[#9aa59d]";
const labelClass = "text-[1em] font-bold text-[#214631]";

function SpeechBubble({ className = "", children }) {
  return (
    <div className={`absolute z-30 origin-bottom-left rounded-[1.1em] bg-white px-[1.1em] py-[.6em] text-[.95em] font-medium text-[#2f6b45] shadow-[0_8px_22px_rgba(32,72,47,0.14)] motion-reduce:animate-none ${className}`}>
      {children}
      <span className="absolute -left-[.25em] bottom-[.7em] size-[.75em] rotate-45 bg-white" aria-hidden="true" />
    </div>
  );
}

function LoginLogo() {
  return <div className="inline-flex flex-col items-start">
    <img src={loginLogo} alt="VedaCrafts" width="129" height="57" className="block h-auto w-[129px] max-w-full object-contain" />
    <span className="mt-1 text-[13px] font-medium tracking-[0.02em] text-[#111111]">Connect | Collaborate | Grow</span>
  </div>;
}

export default function Login() {
  const navigate = useNavigate();
  const [sellerCode, setSellerCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!sellerCode.trim() || !password) {
      setError("Enter your seller code and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      const { seller, token } = await loginSeller({ sellerCode: sellerCode.trim(), password });
      saveSellerSession({ ...seller, token });
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordResetRequest = async (event) => {
    event.preventDefault();
    setResetMessage("");
    if (!resetEmail.trim()) return setResetMessage("Enter the email address associated with your seller account.");
    try {
      setIsResetSubmitting(true);
      const response = await requestPasswordReset(resetEmail.trim());
      setResetMessage(response.message);
    } catch (requestError) {
      setResetMessage(requestError.response?.data?.message || "Unable to request a reset link. Please try again.");
    } finally {
      setIsResetSubmitting(false);
    }
  };

  return (
    <main
      className="relative grid h-dvh grid-cols-[var(--panel)_1fr] overflow-hidden bg-[#fbfcf8] max-[800px]:h-auto max-[800px]:min-h-screen max-[800px]:overflow-y-auto max-[800px]:grid-cols-1"
      /* --panel = width of the left illustration panel. Change ONLY this value to resize it;
         the woman, props, bubbles and ground line all scale from it. */
      style={{ fontSize: "clamp(16px, 0.9vw, 36px)", "--panel": "44vw" }}
    >
      {/* LEFT: background + marketing content (static) + bubbles (animated) */}
      <aside className="relative flex min-h-screen flex-col items-start overflow-hidden bg-cover bg-bottom max-[800px]:hidden" style={{ backgroundImage: `url(${loginBackground})` }} aria-hidden="true">
        {/* Keep the marketing copy in the panel's top flow, clear of the bottom-anchored character. */}
        <div className="relative z-30 mt-[clamp(2rem,8vh,5rem)] ml-[6%] max-w-[38em]">
          <div className="mb-[1.25em]"><LoginLogo /></div>
          <span className="mb-[.9em] block h-[.3em] w-[3em] rounded-full bg-[#f6c744]" aria-hidden="true" />
          <h2 className="m-0 max-w-[13em] text-balance text-[1.7em] font-bold leading-[1.1] tracking-[-0.03em] text-[#1f4a30]">Your craft deserves a bigger stage.</h2>
          <p className="mb-0 mt-[.65em] text-[.75em] leading-relaxed text-[#617665]">Join a thoughtful marketplace built for makers, artisans, and independent sellers.</p>
        </div>

        {/* Bubble positions scale with --panel so they stay lined up with her hand and the props */}
        <SpeechBubble className="animate-login-bubble-one left-[46%] bottom-[calc(var(--panel)*0.39)]">Welcome to Vedacraft!</SpeechBubble>
        <SpeechBubble className="animate-login-bubble-two bottom-[calc(var(--panel)*0.017)] left-[41%] max-w-[18em]">Let's grow your business together.</SpeechBubble>
      </aside>

      {/* CHARACTER: lives in <main> so she can slide in from the left edge of the screen.
          Height = 56% of the panel width; feet sit on the ground line of the background. */}
      <div className="pointer-events-none absolute bottom-[calc(var(--panel)*0.015)] left-[calc(var(--panel)*0.30)] z-20 -translate-x-1/2 max-[800px]:hidden" aria-hidden="true">
        <img src={loginCharacter} alt="" className="animate-login-character block h-[calc(var(--panel)*0.55)] w-auto motion-reduce:animate-none" />
      </div>

      {/* RIGHT: login card. min-[801px]:text-[1.4em] scales everything inside it */}
      <section className="relative z-30 flex min-h-dvh flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8 min-[801px]:h-dvh" aria-labelledby="login-title">
        {/* Mobile logo remains separate because the marketing panel is hidden at this size. */}
        <div className="mb-5 flex w-full justify-center sm:hidden">
          <LoginLogo />
        </div>

        <div className="w-full max-w-[26em] rounded-[1em] bg-white px-5 py-7 shadow-[0_14px_42px_rgba(31,70,45,0.11)] sm:px-[2.1em] sm:py-[1.8em] min-[801px]:text-[.9em]">
          <div className="mb-[2em]">
            <h1 id="login-title" className="m-0 text-[2em] font-normal tracking-[-0.03em] text-[#214631]">Welcome back</h1>
            <p className="mb-0 mt-[.55em] text-[.95em] text-[#718173]">Sign in to manage your seller account</p>
          </div>

          {showForgotPassword ? <form className="grid gap-[.5em]" onSubmit={handlePasswordResetRequest} noValidate>
            <h1 id="login-title" className="m-0 text-[2em] font-normal tracking-[-0.03em] text-[#214631]">Reset password</h1>
            <p className="mb-[1em] mt-[.55em] text-[.95em] text-[#718173]">Enter your registered email and we’ll send a reset link.</p>
            <label className={labelClass} htmlFor="reset-email">Email address</label>
            <div className={inputWrapClass}>
              <KeyRound size="1.3em" aria-hidden="true" />
              <input className={inputClass} id="reset-email" type="email" autoComplete="email" placeholder="you@example.com" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} disabled={isResetSubmitting} />
            </div>
            {resetMessage && <p className="mb-0 mt-[.5em] text-[.95em] text-[#2f6b45]" role="status">{resetMessage}</p>}
            <button className="mt-[1em] inline-flex h-[3.2em] cursor-pointer items-center justify-center gap-[.5em] rounded-[.6em] border-0 bg-[#f6c744] font-[inherit] text-[1.05em] font-bold text-[#1f3d2b] disabled:cursor-wait disabled:opacity-[.72]" type="submit" disabled={isResetSubmitting}>{isResetSubmitting ? "Sending..." : "Send reset link"}</button>
            <button type="button" className="mt-[.5em] cursor-pointer border-0 bg-transparent font-[inherit] font-bold text-[#2f7d4a] hover:underline" onClick={() => { setShowForgotPassword(false); setResetMessage(""); }}>Back to sign in</button>
          </form> : <form className="grid gap-[.5em]" onSubmit={handleSubmit} noValidate>
            <label className={`mt-[.5em] ${labelClass}`} htmlFor="seller-code">Seller Code</label>
            <div className={inputWrapClass}>
              <KeyRound size="1.3em" aria-hidden="true" />
              <input className={inputClass} id="seller-code" name="sellerCode" type="text" autoComplete="username" placeholder="e.g. VSELL-001" value={sellerCode} onChange={(event) => setSellerCode(event.target.value.toUpperCase())} disabled={isSubmitting} />
            </div>

            <label className={`mt-[.9em] ${labelClass}`} htmlFor="password">Password</label>
            <div className={inputWrapClass}>
              <Lock size="1.3em" aria-hidden="true" />
              <input className={inputClass} id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={isSubmitting} />
              <button className="grid cursor-pointer place-items-center border-0 bg-transparent p-[.25em] text-[#8a968c]" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <Eye size="1.35em" /> : <EyeOff size="1.35em" />}
              </button>
            </div>

            <div className="mt-[.7em] flex items-center justify-between gap-2 text-[.875em] sm:text-[.98em]">
              <button type="button" className="ml-auto h-11 cursor-pointer whitespace-nowrap border-0 bg-transparent px-1 font-[inherit] font-bold text-[#2f7d4a] hover:underline" onClick={() => setShowForgotPassword(true)}>Forgot password?</button>
            </div>

            {error && <p className="mb-0 mt-[.25em] text-[.95em] text-danger" role="alert">{error}</p>}

            <button className="mt-[1em] inline-flex h-[3.2em] cursor-pointer items-center justify-center gap-[.5em] rounded-[.6em] border-0 bg-[#f6c744] font-[inherit] text-[1.05em] font-bold text-[#1f3d2b] transition-colors duration-150 hover:not-disabled:bg-[#efb92a] disabled:cursor-wait disabled:opacity-[.72]" type="submit" disabled={isSubmitting}>
              {isSubmitting && <LoaderCircle className="animate-login-spin" size="1.3em" aria-hidden="true" />}
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>}

          <p className="mb-0 mt-[1.6em] text-center text-[.95em] text-[#718173]">
            New to Vedacraft?{" "}
            <a href="https://test.vedacraftscommunity.in" className="font-bold text-[#2f7d4a] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f7d4a]">Become a seller</a>
          </p>
        </div>
      </section>
    </main>
  );
}

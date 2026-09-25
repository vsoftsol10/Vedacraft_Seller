import { useState } from "react";
import { Eye, EyeOff, KeyRound, Lock, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { loginSeller } from "../api/authapi";
import logo from "../assets/images/logo.png";
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

export default function Login() {
  const navigate = useNavigate();
  const [sellerCode, setSellerCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      sessionStorage.setItem("vedacraftsSeller", JSON.stringify({ ...seller, token }));
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className="relative grid h-dvh grid-cols-[var(--panel)_1fr] overflow-hidden bg-[#fbfcf8] max-[800px]:h-auto max-[800px]:min-h-screen max-[800px]:overflow-y-auto max-[800px]:grid-cols-1"
      /* --panel = width of the left illustration panel. Change ONLY this value to resize it;
         the woman, props, bubbles and ground line all scale from it. */
      style={{ fontSize: "clamp(16px, 0.9vw, 36px)", "--panel": "44vw" }}
    >
      {/* LEFT: background + logo + headline (static) + bubbles (animated) */}
      <aside className="relative min-h-screen overflow-hidden bg-cover bg-bottom max-[800px]:hidden" style={{ backgroundImage: `url(${loginBackground})` }} aria-hidden="true">
        {/* Logo in the top-left corner (the image file has empty padding, hence the negative offset).
            Border cropped off; white is lifted and blended into the panel. */}
        <img src={logo} alt="" className="absolute -left-[3.8em] top-[.8em] h-[7.5em] w-auto mix-blend-multiply [clip-path:inset(5%_3%)] [filter:brightness(1.08)_contrast(1.1)]" />

        {/* Headline block: fixed in place and always visible (no animation) */}
        <div className="absolute left-[6%] top-[20%] max-w-[38em]">
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
      <section className="relative z-30 flex h-dvh items-center justify-center px-[1.75em] py-[2em] max-[800px]:h-auto max-[800px]:min-h-screen max-[800px]:px-[1.25em]" aria-labelledby="login-title">
        <div className="w-full max-w-[26em] rounded-[1em] bg-white px-[2.1em] py-[1.4em] shadow-[0_14px_42px_rgba(31,70,45,0.11)] min-[801px]:text-[.9em] max-[800px]:px-[1.5em] max-[800px]:py-[2em]">
          <img src={logo} alt="VedaCrafts" className="mb-[1.5em] hidden h-[4em] w-auto mix-blend-multiply max-[800px]:block" />

          <div className="mb-[2em]">
            <h1 id="login-title" className="m-0 text-[2em] font-normal tracking-[-0.03em] text-[#214631]">Welcome back</h1>
            <p className="mb-0 mt-[.55em] text-[.95em] text-[#718173]">Sign in to manage your seller account</p>
          </div>

          <form className="grid gap-[.5em]" onSubmit={handleSubmit} noValidate>
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

            {/* Visual only for now: not wired to any logic */}
            <div className="mt-[.7em] flex items-center justify-between text-[.98em]">
              <label className="flex cursor-pointer items-center gap-[.6em] text-[#5d6f62]" htmlFor="remember">
                <input id="remember" type="checkbox" className="size-[1.15em] cursor-pointer accent-[#2f7d4a]" disabled={isSubmitting} />
                Remember me
              </label>
              <button type="button" className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] font-bold text-[#2f7d4a] hover:underline">Forgot password?</button>
            </div>

            {error && <p className="mb-0 mt-[.25em] text-[.95em] text-danger" role="alert">{error}</p>}

            <button className="mt-[1em] inline-flex h-[3.2em] cursor-pointer items-center justify-center gap-[.5em] rounded-[.6em] border-0 bg-[#f6c744] font-[inherit] text-[1.05em] font-bold text-[#1f3d2b] transition-colors duration-150 hover:not-disabled:bg-[#efb92a] disabled:cursor-wait disabled:opacity-[.72]" type="submit" disabled={isSubmitting}>
              {isSubmitting && <LoaderCircle className="animate-login-spin" size="1.3em" aria-hidden="true" />}
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mb-0 mt-[1.6em] text-center text-[.95em] text-[#718173]">
            New to Vedacraft?{" "}
            <button type="button" className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] font-bold text-[#2f7d4a] hover:underline">Become a seller</button>
          </p>
        </div>
      </section>
    </main>
  );
}

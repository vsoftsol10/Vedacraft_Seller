import { useState } from "react";
import { Eye, EyeOff, KeyRound, LoaderCircle, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { loginSeller } from "../api/authapi";

const INPUT_WRAP = "flex h-[51px] items-center gap-[10px] rounded-[10px] border border-[#d9e1da] bg-white px-[13px] text-[#7a8a7d] transition-[border-color,box-shadow] duration-150 focus-within:border-[#4f9d5d] focus-within:shadow-[0_0_0_3px_#e3f2e5]";
const FORM_LABEL = "mt-2.5 text-sm font-bold text-[#34463a]";

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
    <main className="grid min-h-screen grid-cols-[minmax(420px,46%)_1fr] bg-[#fffdf8] max-[800px]:grid-cols-1">
      <section className="m-auto w-full max-w-[520px] px-16 py-12 max-[800px]:min-h-screen max-[800px]:px-7 max-[800px]:py-9" aria-labelledby="login-title">
        <div className="flex items-center gap-2.5 text-[25px] font-extrabold tracking-[-0.7px] text-[#e89b21]" aria-label="VedaCrafts Sellers">
          <span className="grid h-[42px] w-[42px] place-items-center rounded-[12px_12px_12px_3px] bg-[#347b4b] text-white"><Store size={24} /></span>
          <span>Veda<span className="text-[#347b4b]">Crafts</span></span>
        </div>

        <div className="my-[58px] mb-8">
          <p className="mb-3 mt-0 text-[11px] font-extrabold tracking-[1.5px] text-[#5d936b]">SELLER PORTAL</p>
          <h1 id="login-title" className="m-0 text-[35px] tracking-[-1.2px] text-[#20372a]">Welcome back</h1>
          <p className="mb-0 mt-3 leading-normal text-[#66736a]">Sign in to manage your store, products, and orders.</p>
        </div>

        <form className="grid gap-[9px]" onSubmit={handleSubmit} noValidate>
          <label className={FORM_LABEL} htmlFor="seller-code">Seller Code</label>
          <div className={INPUT_WRAP}>
            <KeyRound size={18} aria-hidden="true" />
            <input
              className="min-w-0 w-full border-0 text-[#23372a] outline-0 [font:inherit]"
              id="seller-code"
              name="sellerCode"
              type="text"
              autoComplete="username"
              placeholder="e.g. VSELL-001"
              value={sellerCode}
              onChange={(event) => setSellerCode(event.target.value.toUpperCase())}
              disabled={isSubmitting}
            />
          </div>

          <label className={FORM_LABEL} htmlFor="password">Password</label>
          <div className={INPUT_WRAP}>
            <KeyRound size={18} aria-hidden="true" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
            />
            <button
              className="grid cursor-pointer place-items-center border-0 bg-transparent p-1 text-[#647469]"
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="mb-0 mt-1 text-[13px] text-[#b42318]" role="alert">{error}</p>}

          <button className="mt-5 inline-flex h-[51px] cursor-pointer items-center justify-center gap-2 rounded-[10px] border-0 bg-[#347b4b] font-[inherit] font-bold text-white transition-[background] duration-150 hover:not-disabled:bg-[#28673d] disabled:cursor-wait disabled:opacity-[.72]" type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="animate-[spin_.8s_linear_infinite]" size={18} aria-hidden="true" />}
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>

      <aside className="relative grid min-h-screen items-end justify-items-start overflow-hidden bg-[linear-gradient(135deg,#1d5537,#367c4b_55%,#8dab4f)] p-[72px] text-white before:absolute before:-right-[110px] before:-top-[330px] before:h-[630px] before:w-[630px] before:rounded-full before:border before:border-[rgb(255_255_255_/_20%)] before:content-[''] after:absolute after:bottom-[-350px] after:left-[15%] after:h-[480px] after:w-[480px] after:rounded-full after:border after:border-[rgb(255_255_255_/_20%)] after:content-[''] max-[800px]:hidden" aria-hidden="true">
        <div className="relative z-[1] max-w-[480px]">
          <p className="mb-[15px] mt-0 text-xs font-extrabold tracking-[1.9px] text-[#e8c66e]">SELL SMARTER. GROW FASTER.</p>
          <h2 className="m-0 text-[clamp(36px,4.2vw,59px)] leading-[1.08] tracking-[-2.2px]">Your craft deserves a thriving business.</h2>
          <span className="mt-7 block text-sm text-[#d9ebd8]">VedaCrafts Seller Portal</span>
        </div>
      </aside>
    </main>
  );
}

import { useState } from "react";
import { Eye, EyeOff, KeyRound, LoaderCircle, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { loginSeller } from "../api/authapi";
import "../styles/login.css";

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
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-brand" aria-label="VedaCrafts Sellers">
          <span className="login-brand-mark"><Store size={24} /></span>
          <span>Veda<span>Crafts</span></span>
        </div>

        <div className="login-intro">
          <p className="login-eyebrow">SELLER PORTAL</p>
          <h1 id="login-title">Welcome back</h1>
          <p>Sign in to manage your store, products, and orders.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="seller-code">Seller Code</label>
          <div className="login-input-wrap">
            <KeyRound size={18} aria-hidden="true" />
            <input
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

          <label htmlFor="password">Password</label>
          <div className="login-input-wrap">
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
              className="password-visibility"
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button className="login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="login-spinner" size={18} aria-hidden="true" />}
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>

      <aside className="login-aside" aria-hidden="true">
        <div className="login-aside-content">
          <p>SELL SMARTER. GROW FASTER.</p>
          <h2>Your craft deserves a thriving business.</h2>
          <span>VedaCrafts Seller Portal</span>
        </div>
      </aside>
    </main>
  );
}

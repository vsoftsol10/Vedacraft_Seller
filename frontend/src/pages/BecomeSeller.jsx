import { useState } from "react";
import { Link } from "react-router-dom";
import { BUSINESS_CATEGORIES } from "../constants/businessCategories";
import logo from "../assets/images/logo-transparent.png";
import loginBackground from "../assets/images/seller-login-background.png";
import loginCharacter from "../assets/images/seller-login-character.png";

const EMPTY = { fullName: "", email: "", mobileNumber: "", businessName: "", businessCategory: "", password: "", confirmPassword: "" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10}$/;
const inputClass = "h-11 w-full rounded-md border border-[#e6e4de] bg-[#faf9f6] px-3 text-sm text-[#23372a] outline-none transition focus:border-[#2f7d4a] focus:shadow-[0_0_0_3px_#e3f2e5]";

function validate(values) {
  const errors = {};
  if (values.fullName.trim().length < 2) errors.fullName = "Enter your full name.";
  if (!EMAIL_RE.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (!PHONE_RE.test(values.mobileNumber)) errors.mobileNumber = "Enter a 10-digit mobile number.";
  if (values.businessName.trim().length < 2) errors.businessName = "Enter your business or store name.";
  if (!values.businessCategory) errors.businessCategory = "Select a business category.";
  if (values.password.length < 8) errors.password = "Password must be at least 8 characters.";
  if (values.confirmPassword !== values.password) errors.confirmPassword = "Passwords do not match.";
  return errors;
}

export default function BecomeSeller() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event) => {
    const { name } = event.target;
    const value = name === "mobileNumber" ? event.target.value.replace(/\D/g, "").slice(0, 10) : event.target.value;
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    setSubmitted(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    // TODO: submit this registration payload when the seller signup API is available.
    setSubmitted(true);
  };

  const field = (label, name, type = "text") => <label className="grid gap-1 text-sm font-bold text-[#214631]" htmlFor={name}>
    {label}
    <input id={name} name={name} type={type} value={values[name]} onChange={handleChange} className={`${inputClass} ${errors[name] ? "border-red-600" : ""}`} aria-invalid={Boolean(errors[name])} />
    {errors[name] && <span className="text-xs font-normal text-red-600">{errors[name]}</span>}
  </label>;

  return <main className="relative grid min-h-screen grid-cols-[44vw_1fr] bg-[#fbfcf8] max-[800px]:grid-cols-1">
    <aside className="relative min-h-screen overflow-hidden bg-cover bg-bottom max-[800px]:hidden" style={{ backgroundImage: `url(${loginBackground})` }} aria-hidden="true">
      <div className="relative z-10 ml-[6%] mt-[clamp(2rem,8vh,5rem)] max-w-md">
        <img src={logo} alt="VedaCrafts" className="mb-6 h-auto w-[129px]" />
        <span className="mb-4 block h-1 w-12 rounded-full bg-[#f6c744]" />
        <h1 className="m-0 text-3xl font-bold leading-tight tracking-tight text-[#1f4a30]">Start selling your craft with confidence.</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#617665]">Join a thoughtful marketplace made for independent makers and artisans.</p>
      </div>
      <img src={loginCharacter} alt="" className="pointer-events-none absolute bottom-[1.5%] left-[12%] h-auto w-[55%]" />
    </aside>
    <section className="flex items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-[0_14px_42px_rgba(31,70,45,0.11)] sm:p-8">
        <h1 className="m-0 text-3xl font-normal tracking-tight text-[#214631]">Become a seller</h1>
        <p className="mb-6 mt-2 text-sm text-[#718173]">Tell us about yourself and your business.</p>
        {submitted && <p className="mb-5 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800" role="status">Thanks! Your details are ready to submit once seller registration is available.</p>}
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
          {field("Full Name", "fullName")}
          {field("Email", "email", "email")}
          {field("Mobile Number", "mobileNumber", "tel")}
          {field("Business / Store Name", "businessName")}
          <label className="grid gap-1 text-sm font-bold text-[#214631] sm:col-span-2" htmlFor="businessCategory">Business Category
            <select id="businessCategory" name="businessCategory" value={values.businessCategory} onChange={handleChange} className={`${inputClass} ${errors.businessCategory ? "border-red-600" : ""}`} aria-invalid={Boolean(errors.businessCategory)}>
              <option value="" disabled>Select business category</option>
              {BUSINESS_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            {errors.businessCategory && <span className="text-xs font-normal text-red-600">{errors.businessCategory}</span>}
          </label>
          {field("Password", "password", "password")}
          {field("Confirm Password", "confirmPassword", "password")}
          <button type="submit" className="mt-2 h-12 rounded-md border-0 bg-[#f6c744] text-base font-bold text-[#1f3d2b] transition hover:bg-[#efb92a] sm:col-span-2">Create seller application</button>
        </form>
        <p className="mb-0 mt-6 text-center text-sm text-[#718173]">Already a seller? <Link to="/login" className="font-bold text-[#2f7d4a] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f7d4a]">Sign in</Link></p>
      </div>
    </section>
  </main>;
}

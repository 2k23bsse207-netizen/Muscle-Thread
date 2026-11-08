
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { inputCls } from "./Authlayout";

type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export default function PasswordInput(props: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={show ? "text" : "password"}
        className={`${inputCls} pr-12`}
      />

      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-neutral-500 hover:text-neutral-950 dark:hover:text-white"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

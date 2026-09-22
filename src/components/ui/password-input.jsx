import * as React from "react";
import { Lock, LockOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PasswordInput = React.forwardRef(({ className, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        tabIndex={-1}
      >
        {visible ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
      </button>
      <Input
        type={visible ? "text" : "password"}
        className={cn("pl-10 h-12", className)}
        ref={ref}
        {...props}
      />
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };

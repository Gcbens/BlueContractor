import React from "react";

export default function AuthLayout({ icon: Icon, iconImage, logo, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-10">
          {logo ? (
            <img
              src={logo}
              alt="BlueContractor — Plan. Price. Profit."
              width="316"
              height="91"
              decoding="async"
              className="logo-seamless block w-full max-w-[316px] h-auto mx-auto mb-6"
            />
          ) : iconImage ? (
            <img
              src={iconImage}
              alt=""
              width="140"
              height="140"
              decoding="async"
              className="mx-auto -mb-2"
            />
          ) : (
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
              <Icon className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
            </div>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6 relative z-10">{footer}</p>
        )}
      </div>
    </div>
  );
}

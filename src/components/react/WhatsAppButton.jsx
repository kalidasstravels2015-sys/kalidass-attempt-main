import React from 'react';
import WhatsAppIcon from './WhatsAppIcon.jsx';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

export default function WhatsAppButton({
  href,
  onClick,
  children,
  text = "Book on WhatsApp",
  size = "md",
  fullWidth = false,
  className = "",
  variant = "tonal",
  ariaLabel,
  id,
  type = "button"
}) {
  const sizeClasses = {
    sm: "py-2 px-3.5 text-xs gap-2 min-h-[36px]",
    md: "py-2.5 px-5 text-xs sm:text-sm gap-2.5 min-h-[42px]",
    lg: "py-3 px-6 text-sm sm:text-base gap-2.5 min-h-[48px]",
    icon: "p-2.5 min-h-[40px] min-w-[40px] justify-center"
  }[size] || "py-2.5 px-5 text-xs sm:text-sm gap-2.5 min-h-[42px]";

  const iconSize = {
    sm: "w-4 h-4",
    md: "w-4 h-4 sm:w-5 sm:h-5",
    lg: "w-5 h-5",
    icon: "w-5 h-5"
  }[size] || "w-4 h-4 sm:w-5 sm:h-5";

  const variantClasses = {
    filled: "bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold shadow-m3-1 hover:shadow-m3-2",
    elevated: "bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold shadow-m3-1 hover:shadow-m3-2",
    tonal: "bg-m3-success-container hover:brightness-95 active:brightness-90 text-m3-on-success-container font-bold shadow-xs",
    outlined: "bg-transparent hover:bg-m3-success-container/50 text-m3-success border border-m3-success shadow-xs"
  }[variant] || "bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold shadow-m3-1";

  const iconVariant = (variant === 'filled' || variant === 'elevated') ? 'white' : 'brand';
  const label = children || text;
  const computedAria = ariaLabel || (typeof label === 'string' ? label : "Chat on WhatsApp");

  const commonClass = `inline-flex items-center justify-center font-bold font-sans rounded-m3-full transition-all duration-200 cursor-pointer select-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#128C7E] ${sizeClasses} ${variantClasses} ${className}`;

  const targetHref = href || (!onClick ? buildWhatsAppUrl(typeof label === 'string' ? label : undefined) : undefined);

  if (targetHref) {
    return (
      <a
        href={targetHref}
        id={id}
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label={computedAria}
        className={commonClass}
        onClick={onClick}
        data-direct-whatsapp="true"
      >
        <WhatsAppIcon variant={iconVariant} className={iconSize} />
        {size !== 'icon' && <span className="tracking-wide leading-none whitespace-nowrap">{label}</span>}
      </a>
    );
  }

  return (
    <button
      type={type}
      id={id}
      onClick={onClick}
      aria-label={computedAria}
      className={commonClass}
      data-direct-whatsapp="true"
    >
      <WhatsAppIcon variant={iconVariant} className={iconSize} />
      {size !== 'icon' && <span className="tracking-wide leading-none whitespace-nowrap">{label}</span>}
    </button>
  );
}

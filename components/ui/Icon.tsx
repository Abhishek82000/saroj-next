/** Every line icon in the storefront, in one place, all on a 24×24 grid. */
const paths: Record<string, React.ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  cart: <><path d="M6 7h12l-1 13H7L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" /></>,
  menu: <path d="M4 8h16M4 16h11" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  left: <path d="M15 5l-7 7 7 7" />,
  right: <path d="M9 5l7 7-7 7" />,
  down: <path d="m6 9 6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  heart: <path d="M12 20s-7-4.6-7-9.4A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.6C19 15.4 12 20 12 20Z" />,
  truck: <><path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></>,
  shield: <path d="M12 3 4 6v6c0 5 3.4 8.2 8 9 4.6-.8 8-4 8-9V6Z" />,
  lock: <><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  help: <><path d="M21 12a8 8 0 1 1-3.2-6.4" /><path d="M12 8v5M12 16h.01" /></>,
  ruler: <><path d="M3 15 15 3l6 6L9 21z" /><path d="M8 10l2 2M11 7l2 2" /></>,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.6 6.8-4M8.6 13.4l6.8 4" /></>,
  whatsapp: <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .1-1.6-.1a13 13 0 0 1-6.8-6c-.5-.8-.8-1.7-.8-2.5 0-.9.5-1.4.7-1.6.2-.2.4-.3.6-.3h.5c.2 0 .4 0 .5.4l.8 1.8c.1.2 0 .4-.1.5l-.4.5c-.1.2-.3.3-.1.6a9 9 0 0 0 3.8 3.3c.3.1.5.1.6-.1l.7-.8c.2-.2.3-.2.6-.1l1.7.8c.3.1.4.2.4.4v.9Z" />,
  pin: <><path d="M12 21s-7-6.5-7-11.5A7 7 0 0 1 19 9.5C19 14.5 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  phone: <path d="M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2a1.5 1.5 0 0 1 1.5-.4c1.3.4 2.6.6 4 .6a1.5 1.5 0 0 1 1.5 1.5V21a1.5 1.5 0 0 1-1.5 1.5C10.6 22.5 1.5 13.4 1.5 2.5A1.5 1.5 0 0 1 3 1h3.7a1.5 1.5 0 0 1 1.5 1.5c0 1.4.2 2.7.6 4a1.5 1.5 0 0 1-.4 1.5L6.6 10.8Z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
};

export default function Icon({ name, size = 17, fill = "none", strokeWidth = 1.5, className }: {
  name: keyof typeof paths | string;
  size?: number;
  fill?: string;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={fill} stroke={fill === "currentColor" && name === "whatsapp" ? "none" : "currentColor"}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths[name] ?? null}
    </svg>
  );
}

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      closeButton
      richColors
      expand
      duration={3500}
      offset={16}
      toastOptions={{
        className: "font-sans",
        classNames: {
          description: "text-slate-500 font-medium text-xs",
          actionButton: "bg-[#002A22] text-white font-bold text-xs rounded-xl px-3 py-1.5",
          cancelButton: "bg-slate-100 text-slate-700 font-bold text-xs rounded-xl px-3 py-1.5",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

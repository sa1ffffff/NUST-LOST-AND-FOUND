import { useState, useEffect } from "react";
import { X } from "lucide-react"; // Assuming you have lucide-react installed (standard in shadcn)

const WelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen the modal in this session
    const hasSeen = sessionStorage.getItem("nust-welcome-seen");
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Mark as seen so it doesn't open again until they close the tab/browser
    sessionStorage.setItem("nust-welcome-seen", "true");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-800 animate-in zoom-in-95 duration-300">
        
        {/* Header / Title */}
        <div className="bg-primary/10 p-6 pb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Welcome to the NUST Lost & Found Community
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            A centralized platform to help students and faculty reunite with their belongings.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 pt-4 space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
              Community Guidelines
            </h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <span className="mt-1 block h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                <span>
                  <strong>Stay Relevant:</strong> Please do not post anything irrelevant to lost or found items. This platform is strictly for recovery purposes.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 block h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                <span>
                  <strong>Be Responsible:</strong> We rely on the integrity of our students. Be a responsible citizen and help others honestly.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 block h-2 w-2 rounded-full bg-red-500 shrink-0" />
                <span>
                  <strong>Verification is Key:</strong> Please mark an item as "Found" <u>only</u> if you are absolutely sure you have found the exact match.
                </span>
              </li>
            </ul>
          </div>

          <p className="pt-2 text-sm italic text-gray-500 text-center">
            Thank you for following the instructions and keeping our community safe!
          </p>
        </div>

        {/* Footer / Button */}
        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 flex justify-end">
          <button
            onClick={handleClose}
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-8 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            I Understand
          </button>
        </div>

        {/* Close Icon (Optional) */}
        <button 
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-slate-100 data-[state=open]:text-slate-500 dark:ring-offset-slate-950 dark:focus:ring-slate-300 dark:data-[state=open]:bg-slate-800 dark:data-[state=open]:text-slate-400"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;

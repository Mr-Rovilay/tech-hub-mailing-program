import { useState } from "react";
import Sidebar from "./Sidebar";
import { motion } from 'framer-motion';
import { Toaster } from "./ui/sonner";

export default function AppLayout({ children }) {
    const [currentPath, setCurrentPath] = useState('/dashboard');
  
    return (
      <div className="flex h-screen">
        <Sidebar currentPath={currentPath} onNavigate={setCurrentPath} />
        <main className="flex-1 overflow-auto bg-slate-50 p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
            <Toaster />
          </motion.div>
        </main>
      </div>
    );
  } 

  
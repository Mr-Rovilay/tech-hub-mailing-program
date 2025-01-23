// src/components/Sidebar.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Users, FileText, Send,List } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: Mail, label: 'Dashboard' },
    { path: '/contacts', icon: Users, label: 'Contacts' },
    { path: '/templates', icon: FileText, label: 'Templates' },
    { path: '/campaigns/create', icon: Send, label: 'Create Campaign' },
    { path: '/campaigns-list', icon: List, label: 'Campaign List' },
    { path: '/send-email', icon: Send, label: 'Send Mail' },
  ];

  return (
    <div className="w-64 h-screen p-6 text-white bg-slate-900">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Tech Hub Africa</h1>
        <p className="text-sm text-slate-400">Mailing System</p>
      </div>
      
      <nav>
        {menuItems.map((item) => (
          <motion.button
            key={item.path}
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex items-center space-x-3 w-full p-3 rounded-lg mb-2 transition-colors",
              location.pathname === item.path
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-800/50"
            )}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </motion.button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;

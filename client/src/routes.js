// src/routes.js

import CampaignCreation from "./pages/CampaignCreation";
import ContactManagement from "./pages/ContactManagement";
import Dashboard from "./pages/Dashboard";
import TemplateManagement from "./pages/TemplateManagement";
import SendMail from "./pages/SendMail";
import CampaignList from "./pages/CampaignList";

const routes = [
  { path: '/dashboard', component: Dashboard },
  { path: '/contacts', component: ContactManagement },
  { path: '/templates', component: TemplateManagement },
  { path: '/campaigns/create', component: CampaignCreation },
  { path: '/campaigns-list', component: CampaignList },
  { path: '/send-email', component: SendMail },
];

export default routes;

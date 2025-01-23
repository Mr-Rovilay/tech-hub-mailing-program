import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RecipientDistribution } from "@/components/RecipientDistribution";
import { CampaignTable } from "@/components/CampaignTable";
import { fetchCampaigns } from "../../services/api";
import { KeyMetrics } from "@/components/KeyMetrics";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recipientStats, setRecipientStats] = useState({
    byTag: [],
    byOrganization: [],
  });

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const data = await fetchCampaigns();
        setCampaigns(data.campaigns);
        processRecipientStats(data.campaigns);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  const processRecipientStats = (campaigns) => {
    const tagCounts = {};
    const orgCounts = {};

    campaigns.forEach((campaign) => {
      campaign.recipients?.forEach((recipient) => {
        recipient.tags?.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });

        if (recipient.organization) {
          orgCounts[recipient.organization] =
            (orgCounts[recipient.organization] || 0) + 1;
        }
      });
    });

    setRecipientStats({
      byTag: Object.entries(tagCounts).map(([name, value]) => ({
        name,
        value,
      })),
      byOrganization: Object.entries(orgCounts).map(([name, value]) => ({
        name,
        value,
      })),
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Email Campaign and Recipient Overview
          </p>
        </div>
        <Button>
          <Link to={"/campaigns"}>Create Campaign</Link>
        </Button>
      </div>

      <KeyMetrics campaigns={campaigns} recipientStats={recipientStats} />
      <RecipientDistribution recipientStats={recipientStats} />
      <CampaignTable campaigns={campaigns} />
    </div>
  );
};

export default Dashboard;

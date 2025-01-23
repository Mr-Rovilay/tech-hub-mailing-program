import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import { 
  fetchCampaigns, 
  campaignApi 
} from "../../services/api";
import { 
  Loader2, 
  Filter, 
  RefreshCw 
} from "lucide-react";
import { KeyMetrics } from "@/components/KeyMetrics";
import { RecipientDistribution } from "@/components/RecipientDistribution";
import { CampaignTable } from "@/components/CampaignTable";

const Dashboard = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    sortBy: "createdAt",
    sortOrder: "desc"
  });
  const [recipientStats, setRecipientStats] = useState({
    byTag: [],
    byOrganization: [],
    totalRecipients: 0
  });

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const data = await fetchCampaigns();
      setCampaigns(data.campaigns);
      processRecipientStats(data.campaigns);
      setError(null);
    } catch (error) {
      setError("Failed to load campaigns. Please try again.");
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const processRecipientStats = (campaigns) => {
    const tagCounts = {};
    const orgCounts = {};
    let totalRecipients = 0;

    campaigns.forEach((campaign) => {
      campaign.recipients?.forEach((recipient) => {
        totalRecipients++;
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
      totalRecipients
    });
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns
      .filter((campaign) => 
        campaign.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        (filters.status ? campaign.status === filters.status : true)
      )
      .sort((a, b) => {
        const orderMultiplier = filters.sortOrder === "asc" ? 1 : -1;
        return orderMultiplier * a[filters.sortBy].localeCompare(b[filters.sortBy]);
      });
  }, [campaigns, filters]);

  const handleStatusFilter = (status) => {
    setFilters(prev => ({ ...prev, status }));
  };

  const handleSort = (sortBy) => {
    setFilters(prev => ({
      ...prev, 
      sortBy,
      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc"
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        {error}
        <Button onClick={loadCampaigns} className="ml-4">
          <RefreshCw className="mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Email Campaign and Recipient Overview
          </p>
        </div>
        <Button>
          <Link to="/campaigns/create">Create Campaign</Link>
        </Button>
      </div>

      <div className="flex mb-4 space-x-4">
        <Input
          placeholder="Search campaigns..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          className="flex-grow"
        />
        <Select onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          onClick={() => handleSort("createdAt")}
        >
          <Filter className="mr-2" /> Sort
        </Button>
      </div>

      <KeyMetrics 
        campaigns={filteredCampaigns} 
        recipientStats={recipientStats} 
      />
      <RecipientDistribution 
        recipientStats={recipientStats} 
      />
      <CampaignTable 
        campaigns={filteredCampaigns} 
        onRefresh={loadCampaigns}
      />
    </div>
  );
};

export default Dashboard;
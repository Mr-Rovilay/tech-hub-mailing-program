import { Card, CardContent } from "@/components/ui/card"
import { Users, Mail, BarChart2, Tags } from "lucide-react"

export const KeyMetrics = ({ campaigns, recipientStats }) => {
  const totalRecipients = campaigns.reduce((total, campaign) => total + (campaign.recipients?.length || 0), 0)

  const averageOpenRate = campaigns.length
    ? Math.round(campaigns.reduce((sum, c) => sum + ((c.stats.opened / c.stats.sent) * 100 || 0), 0) / campaigns.length)
    : 0

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Recipients"
        value={totalRecipients.toLocaleString()}
        description="Across all campaigns"
        icon={<Users className="w-8 h-8 text-muted-foreground" />}
      />
      <MetricCard
        title="Active Campaigns"
        value={campaigns.filter((c) => c.status === "sending").length}
        description="Currently sending"
        icon={<Mail className="w-8 h-8 text-muted-foreground" />}
      />
      <MetricCard
        title="Average Open Rate"
        value={`${averageOpenRate}%`}
        description="All campaigns"
        icon={<BarChart2 className="w-8 h-8 text-muted-foreground" />}
      />
      <MetricCard
        title="Total Tags"
        value={recipientStats.byTag.length}
        description="Recipient categories"
        icon={<Tags className="w-8 h-8 text-muted-foreground" />}
      />
    </div>
  )
}

const MetricCard = ({ title, value, description, icon }) => (
  <Card>
    <CardContent className="pt-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="mt-2 text-2xl font-bold">{value}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        {icon}
      </div>
    </CardContent>
  </Card>
)


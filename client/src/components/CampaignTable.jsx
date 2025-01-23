import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, Clock } from "lucide-react"

export const CampaignTable = ({ campaigns }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Recipients Overview</CardTitle>
        <CardDescription>Detailed view of campaign recipients and stats</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Opened</TableHead>
              <TableHead>Scheduled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign._id}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{campaign.recipients?.length || 0} total</span>
                    <span className="text-sm text-muted-foreground">
                      {campaign.recipients?.filter((r) => r.isActive).length || 0} active
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {campaign.status === "completed" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-blue-500" />
                    )}
                    <span className="capitalize">{campaign.status}</span>
                  </div>
                </TableCell>
                <TableCell>{campaign.stats.sent}</TableCell>
                <TableCell>
                  {campaign.stats.opened}({Math.round((campaign.stats.opened / campaign.stats.sent) * 100) || 0}%)
                </TableCell>
                <TableCell>
                  {campaign.scheduledDate ? new Date(campaign.scheduledDate).toLocaleDateString() : "Not scheduled"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}


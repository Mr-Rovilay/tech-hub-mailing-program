import { useEffect, useState } from "react"
import { toast } from "sonner"
import { PlayCircle, Trash2, ChevronLeft, ChevronRight, Edit,FolderX  } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { campaignApi } from "../../services/api"
import UpdateCampaignForm from "@/components/UpdateCampaignForm"
import { Link } from "react-router-dom"

const CampaignList = () => {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState(null)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [campaignToUpdate, setCampaignToUpdate] = useState(null)

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await campaignApi.getAll(page)
      setCampaigns(response.data.campaigns)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      toast.error("Failed to fetch campaigns")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [page])

  const handleExecute = async (id) => {
    if (!id) return
    try {
      await campaignApi.execute(id)
      toast.success("Campaign executed successfully")
      fetchCampaigns()
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to execute campaign"
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (id) => {
    if (!id) {
      toast.error("Invalid campaign ID")
      return
    }

    try {
      setDeleteLoading(true)
      await campaignApi.delete(id)
      toast.success("Campaign deleted successfully")
      fetchCampaigns()
      setSelectedCampaignId(null)
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to delete campaign"
      toast.error(errorMessage)

      if (error.response?.status === 400) {
        toast.error("Only draft campaigns can be deleted")
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleUpdate = (campaign) => {
    if (campaign && campaign._id) {
      setCampaignToUpdate(campaign)
      setIsUpdateModalOpen(true)
    } else {
      toast.error("Invalid campaign data")
    }
  }

  const handleUpdateSuccess = () => {
    setIsUpdateModalOpen(false)
    setCampaignToUpdate(null)
    fetchCampaigns()
    toast.success("Campaign updated successfully")
  }

  const canDeleteCampaign = (status) => status === "draft"

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Campaign Management</CardTitle>
      </CardHeader>
      <CardContent>
      {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary"></div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FolderX className="w-16 h-16 mb-4 text-gray-400" />
            <h2 className="mb-2 text-xl font-semibold text-gray-700">No Campaigns Found</h2>
            <p className="mb-4 text-gray-500">
              You haven't created any campaigns yet. Start by creating your first campaign.
            </p>
            <Button>
          <Link to={"/campaigns/create"}>Create Campaign</Link>
        </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Executed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign._id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          campaign.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(campaign.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {campaign.lastExecuted ? new Date(campaign.lastExecuted).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleExecute(campaign._id)}
                          title="Execute Campaign"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdate(campaign)}
                          title="Update Campaign"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              title="Delete Campaign"
                              disabled={!canDeleteCampaign(campaign.status)}
                              onClick={() => setSelectedCampaignId(campaign._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this campaign? This action cannot be undone.
                                {!canDeleteCampaign(campaign.status) && (
                                  <p className="mt-2 text-destructive">Note: Only draft campaigns can be deleted.</p>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setSelectedCampaignId(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(selectedCampaignId)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={deleteLoading || !canDeleteCampaign(campaign.status)}
                              >
                                {deleteLoading ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
      {isUpdateModalOpen && campaignToUpdate && (
        <UpdateCampaignForm
          campaign={campaignToUpdate}
          onClose={() => {
            setIsUpdateModalOpen(false)
            setCampaignToUpdate(null)
          }}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </Card>
  )
}

export default CampaignList


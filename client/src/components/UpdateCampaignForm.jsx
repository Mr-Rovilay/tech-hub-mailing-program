import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { campaignApi, templateApi, contactApi } from "../../services/api"
import { toast } from "sonner"

const updateCampaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  templateId: z.string().min(1, "Template is required"),
  recipientTags: z.array(z.string()).optional(),
  scheduledDate: z.string().optional(),
})

const UpdateCampaignForm = ({ campaign, onClose, onUpdateSuccess }) => {
  const [templates, setTemplates] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateCampaignSchema),
    defaultValues: {
      name: campaign?.name || "",
      templateId: campaign?.template?._id || "",
      recipientTags: campaign?.recipients?.flatMap((r) => r.tags || []) || [],
      scheduledDate: campaign?.scheduledDate ? new Date(campaign.scheduledDate).toISOString().split("T")[0] : "",
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesResponse, contactsResponse] = await Promise.all([templateApi.getAll(), contactApi.getAll()])

        setTemplates(
          Array.isArray(templatesResponse.data) ? templatesResponse.data : templatesResponse.data.templates || [],
        )

        const allTags = (
          Array.isArray(contactsResponse.data) ? contactsResponse.data : contactsResponse.data.contacts || []
        ).reduce((acc, contact) => {
          ;(contact.tags || []).forEach((tag) => {
            if (!acc.includes(tag)) acc.push(tag)
          })
          return acc
        }, [])
        setTags(allTags)
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast.error("Failed to fetch data")
      }
    }
    fetchData()
  }, [])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const payload = {
        name: data.name,
        templateId: data.templateId,
        recipientTags: data.recipientTags && data.recipientTags.length > 0 ? data.recipientTags : undefined,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate).toISOString() : undefined,
      }
      const response = await campaignApi.update(campaign._id, payload)
      toast.success("Campaign updated successfully")
      onUpdateSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating campaign:", error.response?.data || error.message)
      if (error.response?.status === 400 && error.response?.data?.error === "Can only update draft campaigns") {
        toast.error("Cannot update campaign", {
          description: "Only draft campaigns can be updated.",
        })
      } else {
        toast.error("Failed to update campaign", {
          description: error.response?.data?.error || error.message,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Campaign Name
              </label>
              <Controller name="name" control={control} render={({ field }) => <Input {...field} />} />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="templateId" className="block text-sm font-medium text-gray-700">
                Template
              </label>
              <Controller
                name="templateId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template._id} value={template._id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.templateId && <p className="mt-1 text-sm text-red-600">{errors.templateId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Recipient Tags (Optional)</label>
              <div className="mt-2 space-y-2">
                <Controller
                  name="recipientTags"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <div key={tag} className="flex items-center space-x-2">
                          <Checkbox
                            id={tag}
                            checked={field.value?.includes(tag)}
                            onCheckedChange={(checked) => {
                              const updatedTags = checked
                                ? [...(field.value || []), tag]
                                : (field.value || []).filter((value) => value !== tag)
                              field.onChange(updatedTags)
                            }}
                          />
                          <label htmlFor={tag} className="text-sm">
                            {tag}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                />
              </div>
              {errors.recipientTags && <p className="mt-1 text-sm text-red-600">{errors.recipientTags.message}</p>}
            </div>

            <div>
              <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700">
                Scheduled Date
              </label>
              <Controller
                name="scheduledDate"
                control={control}
                render={({ field }) => <Input type="date" {...field} />}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default UpdateCampaignForm


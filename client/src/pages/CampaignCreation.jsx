import { useState, useEffect, useCallback } from "react"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { useNavigate } from "react-router-dom"
import { campaignApi,contactApi, templateApi } from "../../services/api"

const campaignSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  templateId: z.string().min(1, "Please select a template"),
  recipients: z.array(z.string()).min(1, "At least one recipient is required"),
  scheduledDate: z.date().nullable(),
})

const CampaignCreation = () => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    templateId: "",
    recipients: [],
    scheduledDate: null,
  })
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [contacts, setContacts] = useState([])
  const [contactsLoading, setContactsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectAll, setSelectAll] = useState(false)

  const getDatesForMonth = useCallback(() => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 31; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }
    return dates
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesResponse, contactsResponse] = await Promise.all([templateApi.getAll(), contactApi.getAll()])

        const templatesData = templatesResponse.data.templates || templatesResponse.data
        const contactsData = contactsResponse.data.contacts || contactsResponse.data

        if (!Array.isArray(templatesData) || !Array.isArray(contactsData)) {
          throw new Error("Invalid data format")
        }

        setTemplates(templatesData)
        setContacts(contactsData)
      } catch (error) {
        console.error("Data fetching error:", error)
        toast.error("Failed to load necessary data")
      } finally {
        setTemplatesLoading(false)
        setContactsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (formData.templateId) {
      const template = templates.find((t) => t._id === formData.templateId)
      setSelectedTemplate(template)
    }
  }, [formData.templateId, templates])

  const validateStep = (currentStep) => {
    try {
      if (currentStep === 1) {
        z.object({
          name: campaignSchema.shape.name,
        }).parse({ name: formData.name })
      } else if (currentStep === 2) {
        z.object({
          templateId: campaignSchema.shape.templateId,
        }).parse({ templateId: formData.templateId })
      } else if (currentStep === 3) {
        campaignSchema.shape.recipients.parse(formData.recipients)
      }
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message)
        })
      }
      return false
    }
  }

  const handleSelectAll = useCallback(
    (checked) => {
      setSelectAll(checked)
      setFormData((prev) => ({
        ...prev,
        recipients: checked ? contacts.map((contact) => contact._id) : [],
      }))
    },
    [contacts],
  )

  const handleRecipientChange = useCallback(
    (checked, contactId) => {
      setFormData((prev) => ({
        ...prev,
        recipients: checked ? [...prev.recipients, contactId] : prev.recipients.filter((id) => id !== contactId),
      }))
      setSelectAll(checked && formData.recipients.length + (checked ? 1 : -1) === contacts.length)
    },
    [contacts.length, formData.recipients.length],
  )

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <Input
              placeholder="Campaign Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
            />
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            {templatesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No templates available. Please create a template first.
              </div>
            ) : (
              <div className="grid gap-4">
                {templates.map((template) => (
                  <div
                    key={template._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.templateId === template._id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                    }`}
                    onClick={() => setFormData({ ...formData, templateId: template._id })}
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-muted-foreground">{template.subject}</div>
                    {template.variables?.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="secondary">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            {contactsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No contacts available. Please add contacts first.
              </div>
            ) : (
              <div className="overflow-hidden border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all contacts"
                        />
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Organization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact._id}>
                        <TableCell>
                          <Checkbox
                            checked={formData.recipients.includes(contact._id)}
                            onCheckedChange={(checked) => handleRecipientChange(checked, contact._id)}
                            aria-label={`Select ${contact.name}`}
                          />
                        </TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>{contact.name}</TableCell>
                        <TableCell>{contact.organization}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2">
              {getDatesForMonth().map((date) => (
                <Button
                  key={date.toISOString()}
                  variant={formData.scheduledDate?.toDateString() === date.toDateString() ? "default" : "outline"}
                  className="flex flex-col w-full text-xs aspect-square"
                  onClick={() => setFormData({ ...formData, scheduledDate: date })}
                  disabled={loading}
                >
                  <span>{format(date, "d")}</span>
                  <span className="text-[10px]">{format(date, "MMM")}</span>
                </Button>
              ))}
            </div>
            {formData.scheduledDate && (
              <p className="text-sm text-center text-muted-foreground">
                Selected: {format(formData.scheduledDate, "PPP")}
              </p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1)
    }
  }

  const handlePreviousStep = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      campaignSchema.parse(formData)

      setLoading(true)
      await toast.promise(
        campaignApi.create(formData),
        {
          loading: "Creating campaign...",
          success: () => {
            navigate("/campaigns-list")
            return "Campaign created successfully!"
          },
          error: (err) => {
            console.error("Campaign creation error:", err)
            return err.response?.data?.error || "Failed to create campaign"
          },
        },
      )
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message)
        })
      } else {
        console.error("Campaign creation error:", error)
        toast.error(error.response?.data?.error || "An unexpected error occurred")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl p-4 mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Campaign</CardTitle>
          <CardDescription>
            Step {step} of 4:{" "}
            {step === 1
              ? "Campaign Name"
              : step === 2
                ? "Select Template"
                : step === 3
                  ? "Add Recipients"
                  : "Schedule Campaign"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <form id="campaignForm" onSubmit={handleSubmit}>
              {renderStepContent()}
            </form>

            <div className="flex justify-between mt-6">
              {step > 1 && (
                <Button variant="outline" onClick={handlePreviousStep} disabled={loading}>
                  Previous
                </Button>
              )}
              {step < 4 ? (
                <Button onClick={handleNextStep} disabled={loading}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading || formData.recipients.length === 0}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Campaign"
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CampaignCreation
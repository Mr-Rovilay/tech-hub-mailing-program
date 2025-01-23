import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from 'sonner'
import { X, Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { contactApi } from "../../services/api"

const contactSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  organization: z.string().optional(),
  tags: z.array(z.string()),
})

export function UpdateContactDialog({ contact, onContactUpdated }) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentTag, setCurrentTag] = useState("")

  const form = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: contact.email,
      name: contact.name,
      organization: contact.organization || "",
      tags: contact.tags || [],
    },
  })

  const tags = form.watch("tags")

  const handleAddTag = (e) => {
    e.preventDefault()
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      form.setValue("tags", [...tags, currentTag.trim()])
      setCurrentTag("")
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    form.setValue("tags", tags.filter(tag => tag !== tagToRemove))
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      await contactApi.update(contact._id, data)
      toast.success('Contact updated', {
        description: 'Successfully updated contact',
      })
      onContactUpdated()
      setOpen(false)
    } catch (error) {
      toast.error('Error updating contact', {
        description: error.message || 'Something went wrong',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Contact</DialogTitle>
          <DialogDescription>Modify the contact information</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <Input 
                {...form.register("email")} 
                placeholder="Email" 
                disabled={isSubmitting}
              />
              {form.formState.errors.email && (
                <span className="text-sm text-red-500">
                  {form.formState.errors.email.message}
                </span>
              )}
            </div>
            <div className="col-span-1">
              <Input 
                {...form.register("name")} 
                placeholder="Name" 
                disabled={isSubmitting}
              />
              {form.formState.errors.name && (
                <span className="text-sm text-red-500">
                  {form.formState.errors.name.message}
                </span>
              )}
            </div>
            <Input 
              {...form.register("organization")} 
              placeholder="Organization" 
              className="col-span-2"
              disabled={isSubmitting}
            />
            <div className="col-span-2">
              <div className="flex gap-2 mb-2">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder="Add tags"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddTag(e)
                    }
                  }}
                  disabled={isSubmitting}
                />
                <Button 
                  type="button"
                  onClick={handleAddTag}
                  disabled={isSubmitting}
                >
                  Add Tag
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-600"
                      disabled={isSubmitting}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating Contact..." : "Update Contact"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
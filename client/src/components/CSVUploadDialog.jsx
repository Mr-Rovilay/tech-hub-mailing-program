import { useState } from "react"
import { toast } from "sonner"
import { Upload, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export function CSVUploadDialog({ onContactsUploaded }) {
  const [open, setOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResults, setUploadResults] = useState(null)

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      toast.error("Invalid file type", {
        description: "Please upload a CSV file",
      })
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Please upload a file smaller than 5MB",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadResults(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch('http://localhost:5000/api/contacts/upload', {
        method: 'POST',
        body: formData,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percentCompleted)
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setUploadResults(data)
      
      if (data.errors.length === 0) {
        toast.success("Contacts uploaded successfully", {
          description: `Imported: ${data.imported}, Duplicates: ${data.duplicates}`,
        })
        onContactsUploaded?.()
        setOpen(false)
        // window.location.reload()
      } else {
        toast.warning("Contacts uploaded with errors", {
          description: `Imported: ${data.imported}, Errors: ${data.errors.length}`,
        })
      }
    } catch (error) {
      toast.error("Error uploading contacts", {
        description: error.message || "Something went wrong",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Contacts CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with the following columns: email (required), name, organization, tags.
            Tags should be comma-separated.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center w-full">
          <label
            htmlFor="dropzone-file"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isUploading ? (
                <Loader2 className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
              )}
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">CSV file (MAX. 5MB)</p>
            </div>
            <input
              id="dropzone-file"
              type="file"
              className="hidden"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
        {isUploading && (
          <div className="mt-4">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-center mt-2">Uploading... {uploadProgress}%</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, CheckCircle, XCircle, AlertCircle, FileSpreadsheet } from "lucide-react"
import { contactApi } from "../../services/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = {
  "text/csv": [".csv"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
}

export default function ContactUpload() {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [currentFile, setCurrentFile] = useState(null)

  const validateFile = (file) => {
    if (!file) return "No file selected"
    if (file.size > MAX_FILE_SIZE) return "File size exceeds 5MB limit"

    const fileExtension = file.name.toLowerCase().split(".").pop()
    const isValidType = Object.values(ALLOWED_FILE_TYPES)
      .flat()
      .some((ext) => ext.toLowerCase().includes(fileExtension))

    if (!isValidType) return "Invalid file type. Please upload a CSV, XLS, or XLSX file"
    return null
  }

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setCurrentFile(file)
    setUploadStatus("uploading")
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await contactApi.upload(formData, {
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100
          setUploadProgress(Math.min(98, progress)) // Cap at 98% until server processing completes
        },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      setUploadProgress(100)
      setUploadStatus("success")
      toast.success("Upload successful", {
        description: `Successfully imported ${response.data.imported} contacts, ${response.data.duplicates} duplicates skipped, ${response.data.errors.length} errors`,
      })
    } catch (error) {
      setUploadStatus("error")
      const errorMessage = error.response?.data?.error || error.message || "Upload failed"
      toast.error("Upload failed", {
        description: errorMessage,
      })
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_FILE_TYPES,
    multiple: false,
    maxSize: MAX_FILE_SIZE,
  })

  const getStatusColor = () => {
    switch (uploadStatus) {
      case "success":
        return "text-green-500"
      case "error":
        return "text-red-500"
      case "uploading":
        return "text-blue-500"
      default:
        return "text-gray-400"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Contacts</CardTitle>
        <CardDescription>Upload your contacts using CSV, XLS, or XLSX file (max 5MB)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <motion.div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200 hover:border-primary
            ${isDragActive ? "border-primary bg-primary/5" : "border-gray-300"}
            ${uploadStatus === "uploading" ? "pointer-events-none" : ""}
          `}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <Upload className={`w-12 h-12 mx-auto ${getStatusColor()}`} />
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {isDragActive ? "Drop the file here" : "Drag & drop your file here, or click to select"}
              </p>
              <p className="text-xs text-gray-500">Supported formats: CSV, XLS, XLSX (max 5MB)</p>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {uploadStatus && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                {currentFile && (
                  <span className="flex items-center text-sm text-gray-600">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    {currentFile.name}
                  </span>
                )}
              </div>

              <Progress value={uploadProgress} className="h-2" />

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  {uploadStatus === "success" ? (
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  ) : uploadStatus === "error" ? (
                    <XCircle className="w-4 h-4 mr-2 text-red-500" />
                  ) : uploadStatus === "uploading" ? (
                    <AlertCircle className="w-4 h-4 mr-2 text-blue-500" />
                  ) : null}
                  {uploadStatus === "uploading"
                    ? "Uploading..."
                    : uploadStatus === "success"
                      ? "Upload complete"
                      : "Upload failed"}
                </span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}


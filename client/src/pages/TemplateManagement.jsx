import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { templateApi } from '../../services/api';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CreateTemplateDialog } from '@/components/CreateTemplateDialog';

export default function TemplateManagement() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedTemplate, setExpandedTemplate] = useState(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await templateApi.getAll();
      setTemplates(response.data.templates);
    } catch (error) {
      toast.error('Error fetching templates', {
        description: error.message || 'Failed to load templates'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (id) => {
    toast.promise(
      async () => {
        await templateApi.delete(id);
        setTemplates(templates.filter(template => template._id !== id));
      },
      {
        loading: 'Deleting template...',
        success: 'Template successfully deleted',
        error: (err) => err.message || 'Failed to delete template'
      }
    );
  };

  const getCategoryBadgeVariant = (category) => {
    const variants = {
      general: "default",
      newsletter: "secondary",
      promotional: "destructive",
      notification: "outline"
    };
    return variants[category] || "default";
  };

  const TemplateRow = ({ template }) => {
    const isExpanded = expandedTemplate === template._id;

    return (
      <>
        <motion.tr
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="group"
        >
          <TableCell>
            <Collapsible
              open={isExpanded}
              onOpenChange={() => setExpandedTemplate(isExpanded ? null : template._id)}
            >
              <div className="flex items-center space-x-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <span>{template.name}</span>
              </div>
            </Collapsible>
          </TableCell>
          <TableCell>{template.subject}</TableCell>
          <TableCell>
            <Badge variant={getCategoryBadgeVariant(template.category)}>
              {template.category}
            </Badge>
          </TableCell>
          <TableCell>
            {template.variables?.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {template.variables.map((variable) => (
                  <Badge key={variable} variant="secondary" className="text-xs">
                    {variable}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">No variables</span>
            )}
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end space-x-2">
              <CreateTemplateDialog 
                template={template} 
                onSuccess={fetchTemplates}
              />
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDelete(template._id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </TableCell>
        </motion.tr>
        {isExpanded && (
          <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TableCell colSpan={5} className="p-4 bg-muted/50">
              <Collapsible>
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Template Content:</h4>
                    <pre className="p-4 text-sm whitespace-pre-wrap border rounded-md bg-background">
                      {template?.content}
                    </pre>
                  </div>
                  {template.variables?.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Available Variables:</h4>
                      <div className="flex flex-wrap gap-2">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="outline">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Collapsible>
            </TableCell>
          </motion.tr>
        )}
      </>
    );
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
          <div>
            <CardTitle>Email Templates</CardTitle>
            <CardDescription>Manage your email templates and variables</CardDescription>
          </div>
          <CreateTemplateDialog onSuccess={fetchTemplates} />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No templates found. Create your first template using the button above.
            </div>
          ) : (
            <AnimatePresence>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Variables</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TemplateRow key={template._id} template={template} />
                  ))}
                </TableBody>
              </Table>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
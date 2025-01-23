import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Image, Link as LinkIcon, Bold, Italic, ListOrdered, List } from "lucide-react";
import { templateApi } from '../../services/api';

const templateSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  category: z.string(),
  variables: z.array(z.string()).default([])
});

const commonVariables = [
  { name: 'recipientName', display: 'Recipient Name' },
  { name: 'recipientEmail', display: 'Recipient Email' },
  { name: 'organization', display: 'Organization Name' },
  { name: 'senderName', display: 'Sender Name' },
  { name: 'senderTitle', display: 'Sender Title' },
];

export function CreateTemplateDialog({ template = null, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newVariable, setNewVariable] = useState("");
  const [variables, setVariables] = useState(template?.variables || commonVariables.map(v => v.name));

  const form = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name || '',
      subject: template?.subject || '',
      content: template?.content || getDefaultTemplate(),
      category: template?.category || 'general',
      variables: template?.variables || commonVariables.map(v => v.name)
    }
  });

  function getDefaultTemplate() {
    return `Dear {{recipientName}},

I hope this email finds you well. My name is {{senderName}} from {{organization}}.

[Your content here]

Best regards,
{{senderName}}
{{senderTitle}}
{{organization}}`;
  }

  const addVariable = () => {
    if (newVariable && !variables.includes(newVariable)) {
      const updatedVariables = [...variables, newVariable];
      setVariables(updatedVariables);
      form.setValue('variables', updatedVariables);
      setNewVariable("");
    }
  };

  const removeVariable = (variableToRemove) => {
    const updatedVariables = variables.filter(v => v !== variableToRemove);
    setVariables(updatedVariables);
    form.setValue('variables', updatedVariables);
  };

  const insertVariable = (variable) => {
    const textarea = document.querySelector('textarea[name="content"]');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = form.getValues('content');
      const newContent = 
        currentContent.substring(0, start) + 
        `\${${variable}}` + 
        currentContent.substring(end);
      form.setValue('content', newContent);
    }
  };

  const insertFormatting = (type) => {
    const textarea = document.querySelector('textarea[name="content"]');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = form.getValues('content');
      let newContent = currentContent;

      switch (type) {
        case 'bold':
          newContent = 
            currentContent.substring(0, start) + 
            `**${currentContent.substring(start, end) || 'bold text'}**` + 
            currentContent.substring(end);
          break;
        case 'italic':
          newContent = 
            currentContent.substring(0, start) + 
            `*${currentContent.substring(start, end) || 'italic text'}*` + 
            currentContent.substring(end);
          break;
        case 'link':
          newContent = 
            currentContent.substring(0, start) + 
            `[${currentContent.substring(start, end) || 'link text'}](url)` + 
            currentContent.substring(end);
          break;
        case 'image':
          newContent = 
            currentContent.substring(0, start) + 
            `![${currentContent.substring(start, end) || 'image alt text'}](image-url)` + 
            currentContent.substring(end);
          break;
        case 'ul':
          newContent = 
            currentContent.substring(0, start) + 
            `\n- List item 1\n- List item 2\n- List item 3\n` + 
            currentContent.substring(end);
          break;
        case 'ol':
          newContent = 
            currentContent.substring(0, start) + 
            `\n1. List item 1\n2. List item 2\n3. List item 3\n` + 
            currentContent.substring(end);
          break;
      }
      
      form.setValue('content', newContent);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Process variables to ensure proper format
      const processedContent = data.content.replace(/\${(\w+)}/g, '{{$1}}');
      
      if (template) {
        await templateApi.update(template._id, {
          ...data,
          content: processedContent,
          variables
        });
        toast.success('Template updated successfully');
      } else {
        await templateApi.create({
          ...data,
          content: processedContent,
          variables
        });
        toast.success('Template created successfully');
      }
      onSuccess();
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error(template ? 'Error updating template' : 'Error creating template', {
        description: error.message || 'Something went wrong'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{template ? 'Edit Template' : 'Create Template'}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Template' : 'Create Template'}</DialogTitle>
          <DialogDescription>
            {template ? 'Modify existing template' : 'Create a new email template'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Input
                {...form.register('name')}
                placeholder="Template Name"
                disabled={isSubmitting}
              />
              {form.formState.errors.name && (
                <span className="text-sm text-red-500">{form.formState.errors.name.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Input
                {...form.register('subject')}
                placeholder="Email Subject"
                disabled={isSubmitting}
              />
              {form.formState.errors.subject && (
                <span className="text-sm text-red-500">{form.formState.errors.subject.message}</span>
              )}
            </div>
          </div>
          
          <Select
            onValueChange={(value) => form.setValue('category', value)}
            defaultValue={form.getValues('category')}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="newsletter">Newsletter</SelectItem>
              <SelectItem value="promotional">Promotional</SelectItem>
              <SelectItem value="notification">Notification</SelectItem>
            </SelectContent>
          </Select>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add new variable"
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
              />
              <Button 
                type="button"
                onClick={addVariable}
                disabled={!newVariable}
                size="icon"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Common Variables:</label>
              <div className="flex flex-wrap gap-2">
                {commonVariables.map(({ name, display }) => (
                  <Badge 
                    key={name}
                    className="cursor-pointer"
                    onClick={() => insertVariable(name)}
                    variant="secondary"
                  >
                    {display}
                  </Badge>
                ))}
              </div>
            </div>

            {variables.filter(v => !commonVariables.map(cv => cv.name).includes(v)).length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Variables:</label>
                <div className="flex flex-wrap gap-2">
                  {variables
                    .filter(v => !commonVariables.map(cv => cv.name).includes(v))
                    .map((variable) => (
                      <div key={variable} className="flex items-center">
                        <Badge 
                          className="cursor-pointer"
                          onClick={() => insertVariable(variable)}
                        >
                          {variable}
                          <button
                            type="button"
                            className="ml-1 hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeVariable(variable);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pb-2 border-b">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => insertFormatting('bold')}
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => insertFormatting('italic')}
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => insertFormatting('link')}
                title="Insert Link"
              >
                <LinkIcon className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => insertFormatting('image')}
                title="Insert Image"
              >
                <Image className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => insertFormatting('ul')}
                title="Unordered List"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => insertFormatting('ol')}
                title="Ordered List"
              >
                <ListOrdered className="w-4 h-4" />
              </Button>
            </div>

            <Textarea
              {...form.register('content')}
              placeholder="Write your email content here... Click on variables above to insert them at cursor position."
              rows={15}
              className="font-mono"
              disabled={isSubmitting}
            />
            {form.formState.errors.content && (
              <span className="text-sm text-red-500">{form.formState.errors.content.message}</span>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 
                (template ? 'Updating...' : 'Creating...') : 
                (template ? 'Update Template' : 'Create Template')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateTemplateDialog;
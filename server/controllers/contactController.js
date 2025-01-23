import Contact from "../models/Contact.js"
import csv from "csv-parser"
import { Readable } from "stream"

export const uploadContacts = async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ error: "No file uploaded" })
  }

  const results = {
    imported: 0,
    duplicates: 0,
    errors: [],
  }

  try {
    // Create readable stream from buffer
    const bufferStream = new Readable()
    bufferStream.push(req.file.buffer)
    bufferStream.push(null)

    // Process CSV with more detailed error handling
    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(csv({
          mapValues: ({ header, value }) => value.trim() // Trim whitespace from values
        }))
        .on("data", async (row) => {
          try {
            // Check if email exists and is valid
            if (!row.email || !row.email.trim()) {
              throw new Error("Email is required")
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(row.email.trim())) {
              throw new Error("Invalid email format")
            }

            const contact = new Contact({
              email: row.email.trim(),
              name: row.name ? row.name.trim() : "",
              organization: row.organization ? row.organization.trim() : "",
              tags: row.tags ? row.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
            })

            await contact.save()
            results.imported++
          } catch (error) {
            if (error.code === 11000) {
              results.duplicates++
            } else {
              results.errors.push({
                row: results.imported + results.duplicates + results.errors.length + 1,
                email: row.email || "Unknown",
                error: error.message,
              })
            }
          }
        })
        .on("end", resolve)
        .on("error", (error) => {
          console.error("CSV parsing error:", error)
          reject(error)
        })
    })

    res.status(200).json(results)
  } catch (error) {
    console.error("Upload error:", error)
    res.status(500).json({ error: "An error occurred while processing the CSV file" })
  }
}

export const getContacts = async (req, res) => {
  try {
    const { page = 1, limit = 10, tags, search } = req.query;
    
    const query = {};
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } }
      ];
    }

    const contacts = await Contact.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Contact.countDocuments(query);

    res.json({
      contacts,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a single contact
export const addContact = async (req, res) => {
    try {
      const contact = new Contact(req.body);
      const savedContact = await contact.save();
      res.status(201).json(savedContact);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Get a single client
  export const getSingleContact = async (req, res) => {
  try {
    const client = await Contact.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a client
export const updateContact = async (req, res) => {
  try {
    const client = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a client
export const deleteSingleContact = async (req, res) => {
  try {
    const client = await Contact.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
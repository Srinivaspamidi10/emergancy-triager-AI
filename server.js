import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

let activeComplaints = [];
let archivedComplaints = [];

app.get("/api/complaints", (req, res) => {
  res.json({ active: activeComplaints, archived: archivedComplaints });
});

app.post("/api/complaints", (req, res) => {
  const { complaints } = req.body;
  if (Array.isArray(complaints)) {
    activeComplaints = [...complaints, ...activeComplaints];
  }
  res.status(201).json({ message: "Complaints added successfully", active: activeComplaints });
});

app.patch("/api/complaints/:id/stage", (req, res) => {
  const { id } = req.params;
  const { stage } = req.body;

  const targetIndex = activeComplaints.findIndex((item) => item.complaintId === id);

  if (targetIndex !== -1) {
    if (stage === "Resolved") {
      const [resolvedItem] = activeComplaints.splice(targetIndex, 1);
      resolvedItem.currentStage = "Resolved";
      archivedComplaints.unshift(resolvedItem);
    } else {
      activeComplaints[targetIndex].currentStage = stage;
    }

    return res.json({ message: "Stage updated", active: activeComplaints, archived: archivedComplaints });
  }

  res.status(404).json({ error: "Complaint not found" });
});

// DELETE/HIDE route to remove a complaint from queue
app.delete("/api/complaints/:id", (req, res) => {
  const { id } = req.params;
  activeComplaints = activeComplaints.filter((item) => item.complaintId !== id);
  res.json({ message: "Complaint hidden", active: activeComplaints });
});

app.listen(5000, () => {
  console.log("🚨 Emergency Dispatch Server running on http://localhost:5000");
});

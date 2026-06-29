import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { uploadImage, deleteImage } from "../lib/cloudinary";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// POST /api/upload/image
// Upload a single image to Cloudinary
router.post(
  "/upload/image",
  requireAuth,
  upload.single("image"),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }

    const folder = (req.body.folder as string | undefined) ?? "kartigo/general";
    const publicId = req.body.publicId as string | undefined;

    try {
      const result = await uploadImage(req.file.buffer, { folder, publicId });
      res.json({ success: true, ...result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      res.status(500).json({ error: message });
    }
  },
);

// DELETE /api/upload/image
// Delete an image from Cloudinary by publicId
router.delete(
  "/upload/image",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const { publicId } = req.body as { publicId?: string };
    if (!publicId) {
      res.status(400).json({ error: "publicId is required" });
      return;
    }

    try {
      await deleteImage(publicId);
      res.json({ success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed";
      res.status(500).json({ error: message });
    }
  },
);

export default router;

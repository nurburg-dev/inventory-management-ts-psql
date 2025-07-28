import { Router } from "express";
import { getItemById, createItem } from "../core/itemManager";

const router = Router();

router.get("/:id", getItemById);
router.post("/", createItem);

export default router;

import { Router } from "express";
import { 
  getItemById, 
  createItem, 
  temporarilyBlockInventory, 
  permanentlyBlockInventory, 
  cleanupExpiredBlocksAPI,
  getTopItemsByCategory
} from "../core/itemManager";

const router = Router();

router.get("/category/:category/top", getTopItemsByCategory);
router.get("/:id", getItemById);
router.post("/", createItem);
router.post("/block/temporary", temporarilyBlockInventory);
router.post("/block/permanent", permanentlyBlockInventory);
router.post("/cleanup/expired-blocks", cleanupExpiredBlocksAPI);

export default router;

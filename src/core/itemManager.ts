import { Request, Response } from "express";
import {
  CreateItemRequest,
  TemporarilyBlockInventoryRequest,
  PermanentlyBlockInventory,
} from "../models/Item";
import { pool } from "../db/connection";

export const getItemById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM items WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({ error: "Failed to fetch item" });
  }
};

export const createItem = async (req: Request, res: Response) => {
  const { name, description, quantity, price, category }: CreateItemRequest =
    req.body;

  if (!name || quantity === undefined || price === undefined) {
    return res
      .status(400)
      .json({ error: "Name, quantity, and price are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO items (name, description, quantity, price, category) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, description || null, quantity, price, category || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({ error: "Failed to create item" });
  }
};

export const temporarilyBlockInventory = async (
  req: Request,
  res: Response
) => {
  const { itemId, quantity }: TemporarilyBlockInventoryRequest = req.body;

  if (!itemId || quantity === undefined || quantity <= 0) {
    return res
      .status(400)
      .json({ error: "ItemId and positive quantity are required" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock the item row for update to prevent race conditions
    const itemResult = await client.query(
      "SELECT * FROM items WHERE id = $1 FOR UPDATE",
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Item not found" });
    }

    const item = itemResult.rows[0];

    // Check if there's sufficient quantity available
    if (item.quantity < quantity) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Insufficient available quantity",
        available: item.quantity,
        requested: quantity,
      });
    }

    // Decrease the item quantity
    await client.query(
      "UPDATE items SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [quantity, itemId]
    );

    // Create temporary block (expires in 1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const blockResult = await client.query(
      "INSERT INTO block_inventory (item_id, quantity, is_permanent, expires_at) VALUES ($1, $2, FALSE, $3) RETURNING id",
      [itemId, quantity, expiresAt]
    );

    await client.query("COMMIT");

    res.status(201).json({
      blockId: blockResult.rows[0].id,
      quantityBlocked: quantity,
      remainingQuantity: item.quantity - quantity,
      expiresAt: expiresAt,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error blocking inventory:", error);
    res.status(500).json({ error: "Failed to block inventory" });
  } finally {
    client.release();
  }
};

export const permanentlyBlockInventory = async (
  req: Request,
  res: Response
) => {
  const { blockId }: PermanentlyBlockInventory = req.body;

  if (!blockId) {
    return res.status(400).json({ error: "BlockId is required" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check if block exists and is not already permanent
    const blockResult = await client.query(
      "SELECT * FROM block_inventory WHERE id = $1 FOR UPDATE",
      [blockId]
    );

    if (blockResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Block not found" });
    }

    const block = blockResult.rows[0];

    if (block.is_permanent) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Block is already permanent" });
    }

    // Check if block has expired
    const currentTime = new Date();
    if (block.expires_at && new Date(block.expires_at) <= currentTime) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "Cannot make expired block permanent" });
    }

    // Make the block permanent and remove expiration
    await client.query(
      "UPDATE block_inventory SET is_permanent = TRUE, expires_at = NULL WHERE id = $1",
      [blockId]
    );

    await client.query("COMMIT");

    res.json({
      message: "Block made permanent",
      blockId,
      quantity: block.quantity,
      itemId: block.item_id,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error making block permanent:", error);
    res.status(500).json({ error: "Failed to make block permanent" });
  } finally {
    client.release();
  }
};

// Cleanup function for expired temporary blocks - restores quantity back to inventory
export const cleanupExpiredBlocks = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Find expired temporary blocks
    const expiredBlocks = await client.query(
      `SELECT bi.*, i.name as item_name 
       FROM block_inventory bi 
       JOIN items i ON bi.item_id = i.id 
       WHERE bi.is_permanent = FALSE 
       AND bi.expires_at <= $1`,
      [new Date()]
    );

    if (expiredBlocks.rows.length > 0) {
      // Restore quantities back to items
      for (const block of expiredBlocks.rows) {
        await client.query(
          "UPDATE items SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
          [block.quantity, block.item_id]
        );
      }

      // Remove expired blocks
      await client.query(
        "DELETE FROM block_inventory WHERE is_permanent = FALSE AND expires_at <= $1",
        [new Date()]
      );

      console.log(`Cleaned up ${expiredBlocks.rows.length} expired blocks`);
    }

    await client.query("COMMIT");
    return expiredBlocks.rows.length;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error cleaning up expired blocks:", error);
    throw error;
  } finally {
    client.release();
  }
};

// HTTP endpoint for cleaning up expired blocks
export const cleanupExpiredBlocksAPI = async (req: Request, res: Response) => {
  try {
    const cleanedCount = await cleanupExpiredBlocks();

    res.json({
      message: "Cleanup completed successfully",
      expiredBlocksRemoved: cleanedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in cleanup API:", error);
    res.status(500).json({
      error: "Failed to cleanup expired blocks",
      timestamp: new Date().toISOString(),
    });
  }
};

// Get top 100 items in a category ordered by quantity (highest first)
export const getTopItemsByCategory = async (req: Request, res: Response) => {
  const { category } = req.params;

  if (!category) {
    return res.status(400).json({ error: "Category is required" });
  }

  try {
    const result = await pool.query(
      `SELECT 
        id, 
        name, 
        description, 
        quantity, 
        price, 
        category, 
        created_at, 
        updated_at
       FROM items 
       WHERE category = $1 
       ORDER BY quantity DESC 
       LIMIT 5`,
      [category]
    );

    res.json({
      category,
      items: result.rows,
      count: result.rows.length,
      totalItemsInCategory: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching items by category:", error);
    res.status(500).json({ error: "Failed to fetch items by category" });
  }
};

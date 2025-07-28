import { Request, Response } from "express";
import { CreateItemRequest } from "../models/Item";
import { pool } from "../db/connection";

export const getItemById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM items WHERE id = $1',
      [id]
    );

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
      'INSERT INTO items (name, description, quantity, price, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description || null, quantity, price, category || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({ error: "Failed to create item" });
  }
};

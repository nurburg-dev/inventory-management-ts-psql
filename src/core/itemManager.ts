import { Request, Response } from 'express';
import { CreateItemRequest, UpdateItemRequest } from '../models/Item';

export const getAllItems = async (req: Request, res: Response) => {
  res.json([
    { id: 1, name: 'Sample Item 1', description: 'This is a sample item', quantity: 10, price: 99.99, category: 'Sample' },
    { id: 2, name: 'Sample Item 2', description: 'Another sample item', quantity: 5, price: 149.99, category: 'Sample' }
  ]);
};

export const getItemById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (id === '1') {
    res.json({ id: 1, name: 'Sample Item 1', description: 'This is a sample item', quantity: 10, price: 99.99, category: 'Sample' });
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
};

export const createItem = async (req: Request, res: Response) => {
  const { name, description, quantity, price, category }: CreateItemRequest = req.body;
  
  if (!name || quantity === undefined || price === undefined) {
    return res.status(400).json({ error: 'Name, quantity, and price are required' });
  }
  
  res.status(201).json({
    id: Math.floor(Math.random() * 1000),
    name,
    description,
    quantity,
    price,
    category,
    created_at: new Date(),
    updated_at: new Date()
  });
};

export const updateItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, quantity, price, category }: UpdateItemRequest = req.body;
  
  if (id === '1') {
    res.json({
      id: 1,
      name: name || 'Sample Item 1',
      description: description || 'This is a sample item',
      quantity: quantity || 10,
      price: price || 99.99,
      category: category || 'Sample',
      updated_at: new Date()
    });
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (id === '1') {
    res.json({ message: 'Item deleted successfully' });
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
};
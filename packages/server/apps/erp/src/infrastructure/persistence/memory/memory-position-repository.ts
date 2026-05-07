import type { PositionRepository } from '../../../domain/hr/repositories.ts';
import type { Position } from '../../../domain/hr/types.ts';
import { clone } from '../../../shared/clone.ts';

export class MemoryPositionRepository implements PositionRepository {
  items: Map<string, Position>;

  constructor(initialItems: Position[] = []) {
    this.items = new Map(initialItems.map((item) => [item.id, clone(item)]));
  }

  async listAll(): Promise<Position[]> {
    return clone([...this.items.values()]);
  }

  async findById(id: string): Promise<Position | null> {
    const item = this.items.get(id);
    return item ? clone(item) : null;
  }

  async findByCode(positionCode: string): Promise<Position | null> {
    for (const item of this.items.values()) {
      if (item.positionCode.toUpperCase() === positionCode.toUpperCase()) {
        return clone(item);
      }
    }

    return null;
  }

  async save(position: Position): Promise<Position> {
    this.items.set(position.id, clone(position));
    return clone(position);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

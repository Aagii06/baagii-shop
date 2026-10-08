export default class BaseModel {
  declare createdAt?: string;
  declare updatedAt?: string;

  declare createdById?: number;
  declare updatedById?: number;
  declare deletedById?: number;
}

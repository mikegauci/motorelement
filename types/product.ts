export type ProductType = "t-shirt" | "hoodie" | "poster" | "canvas" | "mug";

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  basePrice: number;
  printifyBlueprintId: string;
  active: boolean;
}

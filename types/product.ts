export type ProductType = "t-shirt" | "hoodie" | "poster" | "canvas" | "mug";

export interface Product {
  id: string;
  slug: string;
  name: string;
  type: ProductType;
  basePrice: number;
  printifyBlueprintId: string;
  active: boolean;
}

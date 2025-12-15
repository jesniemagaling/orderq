export interface MenuItem {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  image_url: string;
  homeImage: string;
  status: string;
  isPopular: boolean;
  isRecommended: boolean;
}

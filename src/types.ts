export interface Gift {
  id: string;
  participant_id: string;
  name: string;
  price: number | null;
  url: string | null;
  image_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Participant {
  id: string;
  name: string;
  order_index: number;
  avatar_color: string;
  gifts: Gift[];
}

export interface ScrapedProduct {
  success: boolean;
  url: string;
  image: string | null;
  title: string | null;
  price: number | null;
  regularPrice?: number | null;
  siteName?: string;
  error?: string;
}

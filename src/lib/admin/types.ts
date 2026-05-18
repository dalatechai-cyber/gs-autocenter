export type Banner = {
  id: string;
  title: string;
  body: string;
  link?: string;
  imageUrl?: string;
  imagePathname?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BannerInput = Omit<Banner, "id" | "createdAt" | "updatedAt">;

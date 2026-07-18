export type MediaAssetOption = {
  id: string;
  url: string;
  pathname: string;
  filename: string;
  mimeType: string;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  assetType: string;
  storageProvider: string;
  uploadedAt: string | null;
  createdAt: string;
  orphaned: boolean;
  referenceCount: number;
  references: Array<{ type: string; id: string; label: string }>;
};

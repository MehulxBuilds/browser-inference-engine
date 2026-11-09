export type ModelProgress = {
  status?: string;
  file?: string;
  name?: string;
  progress?: number;
  progress_total?: number;
  loaded?: number;
  total?: number;
};

export type ModelFileInfo = {
  name: string;
  size: number;
};

export type ModelInspection = {
  files: string[];
  availableDtypes: string[];
  cached: boolean;
  totalSize: number;
};

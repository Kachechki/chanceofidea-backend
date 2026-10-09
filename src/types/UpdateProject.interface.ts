export interface IUpdateProject {
  id: string;
  title?: string;
  readiness?: number;
  category?: string;
  tags?: string[];
  description?: string;
}

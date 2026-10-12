export interface ICreateProject {
  title: string;
  readiness: number;
  description: string;
  repositoryName: string;
  ownerId: string;
  categoryId: string;
  tags: string[];
  publish: boolean;
}

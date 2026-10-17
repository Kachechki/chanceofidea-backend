import { ProjectStatusEnum } from "../enums/ProjectStatus.enum";
import { IUpdateProject } from "./UpdateProject.interface";

export interface IProjectForceUpdate extends IUpdateProject {
  status?: ProjectStatusEnum;
  repositoryName?: string;
}

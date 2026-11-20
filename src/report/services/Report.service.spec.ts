import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProjectService } from "../../project/services/Project.service";
import { UserService } from "../../user/services/User.service";
import { ReportEntity } from "../entities/Report.entity";
import { ReportService } from "./Report.service";

describe("ReportService", () => {
  let service: ReportService;
  let repository: jest.Mocked<Pick<Repository<ReportEntity>, "save">>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: getRepositoryToken(ReportEntity),
          useValue: { save: jest.fn() },
        },
        {
          provide: ProjectService,
          useValue: {},
        },
        {
          provide: UserService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    repository = module.get(getRepositoryToken(ReportEntity));
  });

  it("creates a report with its title, body, and author", async () => {
    await service.create({
      title: "Inappropriate content",
      body: "This project contains inappropriate content.",
      projectId: "project-123",
      writtenBy: "user-123",
    });

    expect(repository.save).toHaveBeenCalledWith({
      title: "Inappropriate content",
      body: "This project contains inappropriate content.",
      writtenBy: { id: "user-123" },
    });
  });
});
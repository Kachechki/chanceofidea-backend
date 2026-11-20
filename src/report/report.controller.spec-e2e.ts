import { ReportService } from "./services/Report.service";
import { type IRequestWithRefresh } from "../types/RequestWithRefresh.interface";
import { ReportController } from "./report.controller";
import { Test, TestingModule } from "@nestjs/testing";

describe("ReportController", () => {
  let controller: ReportController;

  const reportService = {
    create: jest.fn(),
    findByUser: jest.fn(),
    findById: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const req = {
    user: { id: "user-1" },
  } as IRequestWithRefresh;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        {
          provide: ReportService,
          useValue: reportService,
        },
      ],
    }).compile();

    controller = module.get<ReportController>(ReportController);
  });

  describe("create", () => {
    it("should create a report", async () => {
      await controller.create(
        {
          title: "Bug report",
          body: "Something is broken",
          projectId: "project-1",
        },
        req,
      );

      expect(reportService.create).toHaveBeenCalledWith({
        title: "Bug report",
        body: "Something is broken",
        projectId: "project-1",
        writtenBy: "user-1",
      });
    });
  });

  describe("fetchMyReports", () => {
    it("should return the user's reports", async () => {
      reportService.findByUser.mockResolvedValue([
        {
          id: "report-1",
          title: "Bug report",
          body: "Something is broken",
          approved: false,
        },
        {
          id: "report-2",
          title: "Another report",
          body: "Another issue",
          approved: null,
        },
      ]);

      const result = await controller.fetchMyReports(req, 1);

      expect(reportService.findByUser).toHaveBeenCalledWith(
        "user-1",
        undefined,
        1,
      );

      expect(result).toEqual([
        {
          id: "report-1",
          title: "Bug report",
          body: "Something is broken",
          approved: false,
        },
        {
          id: "report-2",
          title: "Another report",
          body: "Another issue",
        },
      ]);
    });
  });

  describe("get", () => {
    it("should return a report with its project", async () => {
      const project = { id: "project-1", title: "My project" };

      reportService.findById.mockResolvedValue({
        id: "report-1",
        title: "Bug report",
        body: "Something is broken",
        approved: true,
        project,
      });

      const result = await controller.get({ id: "report-1" });

      expect(reportService.findById).toHaveBeenCalledWith("report-1", {
        project: true,
      });

      expect(result).toEqual({
        id: "report-1",
        title: "Bug report",
        body: "Something is broken",
        approved: true,
        project,
      });
    });
  });

  describe("approve", () => {
    it("should approve a report", async () => {
      await controller.approve({ id: "report-1" });

      expect(reportService.approve).toHaveBeenCalledWith("report-1");
    });
  });

  describe("reject", () => {
    it("should reject a report", async () => {
      await controller.reject({ id: "report-1" });

      expect(reportService.reject).toHaveBeenCalledWith("report-1");
    });
  });

  describe("update", () => {
    it("should update a report", async () => {
      await controller.update(
        {
          id: "report-1",
          title: "Updated title",
          body: "Updated body",
        },
        req,
      );

      expect(reportService.update).toHaveBeenCalledWith({
        id: "report-1",
        userId: "user-1",
        title: "Updated title",
        body: "Updated body",
      });
    });

    it("should pass undefined for omitted fields", async () => {
      await controller.update(
        {
          id: "report-1",
          title: "asdf",
          body: "adsfasdf",
        },
        req,
      );

      expect(reportService.update).toHaveBeenCalledWith({
        id: "report-1",
        userId: "user-1",
        title: undefined,
        body: undefined,
      });
    });
  });

  describe("delete", () => {
    it("should delete a report", async () => {
      await controller.delete({ id: "report-1" }, req);

      expect(reportService.delete).toHaveBeenCalledWith("report-1", "user-1");
    });
  });
});

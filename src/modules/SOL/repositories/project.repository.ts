import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AgreementActiveStatusEnum } from "../enums/agreement-active-status";
import { Project } from "../schemas/project.schema";
import { ProjectModel } from "../models/project.model";
import { ProjectRegisterRequestDto } from "../dtos/project-register-request.dto";
import { ProjectInterfaceWithId } from "../interfaces/project.interface";

@Injectable()
export class ProjectRepository {
  constructor(@InjectModel(Project.name) private readonly _model: Model<ProjectModel>) {}

  async findById(id: string): Promise<ProjectModel> {
    return (await (await this._model.findOne({ _id: id }).populate("project_manager").populate("viewer_list")).populate('reviewer_list'))
  }

  async findByEmail(email: string): Promise<ProjectModel> {
    return (await (await this._model.findOne({ email: email }).populate("project_manager").populate("viewer_list")).populate('reviewer_list'))
  }

  async deleteById(id: string): Promise<ProjectModel> {
    return await this._model.findOneAndUpdate(
      { _id: id },
      { $set: { activeStatus: AgreementActiveStatusEnum.inactive } }
    );
  }

  async trueDelete(id: string): Promise<ProjectModel> {
    return await this._model.findByIdAndDelete(
      { _id: id },

    );
  }

  async register(dto: ProjectRegisterRequestDto): Promise<ProjectModel> {
    const data = new this._model(dto);
    return await data.save();
  }

  async findAllProjectsByReviewerId(reviewerId: string): Promise<ProjectInterfaceWithId[]> {
    return await this._model
      .find({ reviewer_list: reviewerId, activeStatus: AgreementActiveStatusEnum.active })
      .populate("project_manager")
  }

  async findAllProjectsByViewerId(reviewerId: string): Promise<ProjectInterfaceWithId[]> {
    return await this._model
      .find({ $or: [{viewer_list: reviewerId }, {project_manager: reviewerId }, {reviewer_list: reviewerId } ] , activeStatus: AgreementActiveStatusEnum.active })
      .populate("project_manager")
   
  } // $or: [{manager: _id}, {reviewer: _id}]

  async findAllProjectsByManagerId(reviewerId: string): Promise<ProjectInterfaceWithId[]> {
    return await this._model
      .find({ project_manager: reviewerId, activeStatus: AgreementActiveStatusEnum.active  })
      .populate("project_manager")
  }

  async findAll(): Promise<ProjectModel[]> {
    return await this._model
      .find({ activeStatus: AgreementActiveStatusEnum.active })
      .populate("project_manager")
   
   
  }

}

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AgreementRegisterRequestDto } from "../dtos/agreement-register-request.dto";
import { AgreementModel } from "../models/agreement.model";
import { Agreement } from "../schemas/agreement.schema";
import { AgreementActiveStatusEnum } from "../enums/agreement-active-status";

@Injectable()
export class AgreementRepository {
  constructor(@InjectModel(Agreement.name) private readonly _model: Model<AgreementModel>) {}

  async findById(id: string): Promise<AgreementModel> {
    return (await this._model.findOne({ _id: id }).populate("workPlan").populate("association").populate("manager").populate("project"));
  }

  async findAgreementByReviewerOrManagerId(_id: string): Promise<AgreementModel[]> {
    return await this._model.find({ 
      $or: [{manager: _id}, {reviewer: _id}]
    })
  }

  async findAgreementByReviewerId(_id: string): Promise<AgreementModel[]> {
    return await this._model.find({ 
      reviewer: _id
    })
  }

  async findAgreementByManagerId(_id: string): Promise<AgreementModel[]> {
    return await this._model.find({ 
      manager: _id
    }).populate("workPlan")
  }

  async findAgreementByProjectId(_id: string): Promise<AgreementModel> {
    return await this._model.findOne({ 
      project: _id
    }).populate("workPlan")
  }

  async deleteById(id: string): Promise<AgreementModel> {
    return await this._model.findOneAndUpdate(
      { _id: id },
      { $set: { activeStatus: AgreementActiveStatusEnum.inactive } }
    );
  }

  async register(dto: AgreementRegisterRequestDto): Promise<AgreementModel> {
  
    const data = new this._model(dto);
    return await data.save();
  }

  async findAll(): Promise<AgreementModel[]> {
    return await this._model
      .find({ activeStatus: AgreementActiveStatusEnum.active })
      
      .populate("association")
      .populate({
        path: "workPlan",
        populate: {
          path: "product",
          populate: {
            path: "costItems",
            populate: {
              path: "category",
            },
          },
        },
      })
      .populate("manager")
  
  }

  async findAgreementsWithOutProject(array: string[]): Promise<AgreementModel[]> {
    return await this._model
      .find({ _id: {$nin: array }})
  
  }

  async findAgreementsWithProject(array: string[]): Promise<AgreementModel[]> {
    return await this._model
      .find({ _id: {$in: array }, 
        activeStatus: AgreementActiveStatusEnum.active })
        // .populate("reviewer")
        .populate("association")
        .populate("manager")
        .populate({
          path: "workPlan",
          populate: {
            path: "product",
            populate: {
              path: "costItems",
              populate: {
                path: "category",
              },
            },
          },
        });
  
  }

  async findForAssociation(associationId: string): Promise<AgreementModel[]> {
    return await this._model
      .find({ association: { _id: associationId } })
      // .populate("reviewer")
      .populate("association")
      .populate("manager")
      .populate({
        path: "workPlan",
        populate: {
          path: "product",
          populate: {
            path: "costItems",
            populate: {
              path: "category",
            },
          },
        },
      });
      
  }

  async findForGerenteGeralProjetos(projectManagerId: string): Promise<AgreementModel[]> {
    return await this._model
      .find({ manager: { _id: projectManagerId } })
      // .populate("reviewer")
      .populate("association")
      .populate("manager")
      .populate({
        path: "workPlan",
        populate: {
          path: "product",
          populate: {
            path: "costItems",
            populate: {
              path: "category",
            },
          },
        },
      });
      
  }
  async findByProjectId(projectId: string): Promise<AgreementModel[]> {

    return await this._model
      .find({ project: { _id: projectId } })
      // .populate("reviewer")
      .populate("association")
      .populate("project")
      .populate("manager")
      .populate({
        path: "workPlan",
        populate: {
          path: "product",
          populate: {
            path: "costItems",
            populate: {
              path: "category",
            },
          },
        },
      });
      
  }

  async addManager(id: string, dto: any): Promise<AgreementModel> {
    return await this._model.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          manager: dto
        },
      },
      { new: true }
    );
  }
  

  async update(id: string, dto: any): Promise<AgreementModel> {
    return await this._model.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          ...dto,
        },
      },
      { new: true }
    );
  }
}

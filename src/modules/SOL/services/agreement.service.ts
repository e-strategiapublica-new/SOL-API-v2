import { Injectable } from "@nestjs/common";
import { AgreementRegisterRequestDto } from "../dtos/agreement-register-request.dto";
import { AgreementRepository } from "../repositories/agreement.repository";
import { UserRepository } from "../repositories/user.repository";
import { AgreementInterface, AgreementInterfaceWithId } from "../interfaces/agreement.interface";
import { WorkPlanService } from "./work-plan.service";
import { AssociationService } from "../services/association.service";
import { ResponseEndpointAgreementDto } from "../dtos/response-endpoint-agreement.dto";
import { AgreementStatusEnum } from "../enums/agreement-status.enum";
import { CostItemsService } from "./cost-items.service";
import { ItemsModel } from "../models/database/items.model";
import { ProjectRepository } from "../repositories/project.repository";
import { AgreementModel } from "../models/agreement.model";
import { UserRolesEnum } from "../enums/user-roles.enum";
import { ProjectModel } from "../models/project.model";
import { ProjectInterfaceWithId } from "../interfaces/project.interface";

@Injectable()
export class AgreementService {
  constructor(
    private readonly _agreementRepository: AgreementRepository,
    private readonly _userRepository: UserRepository,
    private readonly _workPlanService: WorkPlanService,
    private readonly _associationService: AssociationService,
    private readonly _costItemsService: CostItemsService,
    private readonly itemsModel: ItemsModel,
    private readonly _projectRepository: ProjectRepository
  ) {}

  async findById(id: string): Promise<AgreementInterface> {
    return await this._agreementRepository.findById(id);
  }

  async findAgreementByUserId(id: string, userRole: string): Promise<AgreementInterface[]> {
    const project: ProjectInterfaceWithId[]  = []
    // if( userRole === UserRolesEnum.visualizador_projetos)  project.push(...await this._projectRepository.findAllProjectsByViewerId(id))
    // if( userRole === UserRolesEnum.revisor_projetos)  project.push(...await this._projectRepository.findAllProjectsByReviewerId(id))
    if( userRole === UserRolesEnum.gerente_geral_projetos) {
      return await this._agreementRepository.findForGerenteGeralProjetos(id)
       
    } else {
      project.push(...await this._projectRepository.findAllProjectsByViewerId(id))
    }
     

    const result: AgreementInterface[] = []
    for (let i = 0; i < project.length; i ++) {
      const item = await this._agreementRepository.findByProjectId(project[i]._id.toString())
      result.push(...item)
    }
    return result
  }

  async findAgreementByReviewerOrManagerId(id: string): Promise<AgreementModel[]> {
    return await this._agreementRepository.findAgreementByReviewerOrManagerId(id);
  }
  async findAgreementByReviewerId(id: string): Promise<AgreementModel[]> {
    return await this._agreementRepository.findAgreementByReviewerId(id);
  }

  async findAgreementByManagerId(id: string): Promise<AgreementModel[]> {
    return await this._agreementRepository.findAgreementByManagerId(id);
  }

  async findAgreementByProjectrId(id: string): Promise<AgreementModel> {
    return await this._agreementRepository.findAgreementByProjectId(id);
  }

  async deleteById(id: string): Promise<AgreementInterface> {
    return await this._agreementRepository.deleteById(id);
  }

  async register(dto: AgreementRegisterRequestDto): Promise<AgreementInterface> {
    const project = await this._projectRepository.findById(dto.projectId);
    if (!project) throw new Error("Project not found");
    dto.project = project;

    const association = await this._associationService.getById(dto.associationId);
    if (!association) throw new Error("Association not found");
    dto.association = association;
    const result = await this._agreementRepository.register(dto);

    return result;
  }

  async findAll(): Promise<AgreementInterface[]> {
    const result = await this._agreementRepository.findAll();

    return result;
  }

  async findAgreementsWithOutProject(): Promise<AgreementInterface[] | any> {
    const idList = []
    const projects = await this._projectRepository.findAll()
    for (let i = 0; i < projects.length; i++) {
      for(let j = 0; j < projects[i].agreement_list.length; j ++) {
    
        idList.push((projects[i].agreement_list[j] as AgreementInterfaceWithId)._id)
      }
    }
    
    const result = await this._agreementRepository.findAgreementsWithOutProject(idList);

    return result;
  }

  async findForAssociation(associationId: string): Promise<AgreementInterface[]> {
    // //@ts-ignore
    // const result = await this._agreementRepository.findForAssociation(user.association?._id.toString());
    // return result; 648af4488cc629b3316974f5
    const user = await this._userRepository.getById(associationId);

    //@ts-ignore
    const idList = []
    const result = await this._agreementRepository.findForAssociation(user.association?._id.toString());
    
    return result
  //   const projects = await this._projectRepository.findAll()
  //  // console.log('projects', projects)
  //   for (let i = 0; i < projects.length; i++) {
  //     for(let j = 0; j < projects[i].agreement_list.length; j ++) {
    
  //       idList.push((projects[i].agreement_list[j] as AgreementInterfaceWithId)._id)
  //     }
  //   }
  //   const newArray = idList.map(item => item.toString())

  //   const filterAgreementFromUserWithProject = result.filter(item => newArray.includes(item._id.toString())).map(ele => ele._id.toString()) 

  //   const resultWithProjects = await this._agreementRepository.findAgreementsWithProject(filterAgreementFromUserWithProject);
  //   return resultWithProjects;
  }

  
  async getAgreementsWithProjects(): Promise<AgreementInterface[] | any> {
    const idList = []
    const projects = await this._projectRepository.findAll()
    for (let i = 0; i < projects.length; i++) {
      for(let j = 0; j < projects[i].agreement_list.length; j ++) {
    
        idList.push((projects[i].agreement_list[j] as AgreementInterfaceWithId)._id)
      }
    }
    
    const result = await this._agreementRepository.findAgreementsWithProject(idList);

    return result;
  }

  async update(id: string, dto: AgreementRegisterRequestDto): Promise<AgreementInterface> {
    dto.project = await this._projectRepository.findById(dto.projectId);
    if (!dto.project) throw new Error("User not found");

    dto.association = await this._associationService.getById(dto.associationId);
    if (!dto.association) throw new Error("Association not found");

    return await this._agreementRepository.update(id, dto);
  }

  async addWorkPlan(id: string, workPlanIds: string): Promise<AgreementInterface> {
    const agreement = await this._agreementRepository.findById(id);

    if (!agreement.workPlan) agreement.workPlan = [];
    if (agreement.workPlan.some(item => item._id.toString() === workPlanIds)) return agreement;

    const works = await this._workPlanService.listByIds([
      workPlanIds,
      ...agreement.workPlan?.map(item => item._id.toString()),
    ]);
    agreement.workPlan = works;

    return await this._agreementRepository.update(agreement._id, agreement);
  }

  async removeWorkPlan(id: string, workPlanId: string): Promise<AgreementInterface> {
    const agreement = await this._agreementRepository.findById(id);
    agreement.workPlan = agreement.workPlan.filter(item => item._id.toString() !== workPlanId);
    await this._workPlanService.deleteById(workPlanId);
    return await this._agreementRepository.update(id, agreement);
  }

  async handlerJob(data: ResponseEndpointAgreementDto[]) {
    
    const costItemsAll = await this.itemsModel.list();
    
    data.forEach(async item => {
      
      const association = await this._associationService.getByCnpj(item.covenant_cnpj);            
      const reviewer = await this._projectRepository.findByEmail(item.admin.email);      
      
      if (!association || !reviewer) return;
     

      const signature_date = new Date(item.signature_date || "");
      const validity_date = new Date(item.validity_date || "");
      
      const agreement = await this._agreementRepository.register({
        association: association,
        project: reviewer,
        city: item.city_code,
        status: AgreementStatusEnum.inExecution,
        register_number: item.number,
        signature_date: signature_date,
        value: item.estimated_cost,
        register_object: item.name,
        validity_date: validity_date,
        states: "-",
        associationId: association._id.toString(),
        projectId: reviewer._id.toString(),
        manager: reviewer._id.toString(),
      });

      

      item.groups.forEach(async group => {
       
        let products: {
          quantity: number;
          unitValue: number;
          costItems: string;
        }[] = [];



        group.group_items.forEach(async produtcs => {

          /*
          const costItems = await this.itemsModel.saveItem({
            categoryId: costItemsAll[0].group._id,
            category: costItemsAll[0].group,
            name: Number(produtcs.group_id).toString(),
            code: Number(produtcs.code).toString(),
            productId: costItemsAll[0]._id.toString(),
            product: costItemsAll[0],
            //product_relation: costItemsAll[0].product_relation,
            product_relation: "-",
            unitMeasure: produtcs.unit,
            specification: produtcs.description,          
            sustainable: false,
          });
          */

          const costItems = await this.itemsModel.saveItem({
            group: {
              _id: costItemsAll[0].group._id,
              category_name: costItemsAll[0].group.category_name,
              code: costItemsAll[0].group.code,
              segment: costItemsAll[0].group.segment
            },
            class: {
              _id: costItemsAll[0].class._id,
              code: costItemsAll[0].class.code,
              description: costItemsAll[0].class.description
            },
            pdm: {
              _id: costItemsAll[0].pdm._id,
              code: costItemsAll[0].pdm.code,
              name: costItemsAll[0].pdm.name,
              unitList: [ produtcs.unit ]
            },
            code: produtcs.code,
            name: produtcs.title,
            propertyListValue: [
              { property: 'Generic', value: produtcs.quantity }             
            ]
          });

          products.push({
            quantity: produtcs.quantity,
            unitValue: produtcs.estimated_cost,
            costItems: costItems as any,
          });

        });

        const workPlan = await this._workPlanService.registerFromIntegration({
          name: group.name,
          product: products,
        });
        
        await this.addWorkPlan(agreement._id.toString(), workPlan._id.toString())
        
      });
    });
  }
}

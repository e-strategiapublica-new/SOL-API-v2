import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { BideRegisterDto } from "../dtos/bid-register-request.dto";
import { BidRepository } from "../repositories/bid.repository";
import { BidModel } from "../models/bid.model";
import { BidUpdateDto } from "../dtos/bid-update-request.dto";
import { UserRepository } from "../repositories/user.repository";
import { BidUpdateStatusRequestDto } from "../dtos/bid-update-status-request.dto";
import { BidAddProposalDto } from "../dtos/bid-add-proposal.dto";
import { AllotmentRepository } from "../repositories/allotment.repository";
import { NotificationService } from "./notification.service";
import { BidModalityEnum } from "../enums/bid-modality.enum";
import { AgreementService } from "./agreement.service";
import { FileRepository } from "../repositories/file.repository";
import { AllotmentStatusEnum } from "../enums/allotment-status.enum";
import { SupplierService } from "./supplier.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import { BidStatusEnum } from "../enums/bid-status.enum";
import { MutableObject } from "src/shared/interfaces/mutable-object.interface";
import { ProposalRepository } from "../repositories/proposal.repository";
import { SupplierRepository } from "../repositories/supplier.repository";
import { AssociationRepository } from "../repositories/association.repository";
import { ModelContractRepository } from "../repositories/model-contract.repository";
import { ContractRepository } from "../repositories/contract.repository";
import * as moment from "moment";
import { text } from "aws-sdk/clients/customerprofiles";
import { BidDateUpdateDto } from "../dtos/bid-date-update.dto";
import { PlataformRepository } from "../repositories/plataform.repository";
import { platform } from "node:process";
import { UserTypeEnum } from "../enums/user-type.enum";
import { parseISO, isAfter } from "date-fns";
import { ModelContractClassificationEnum } from "../enums/modelContract-classification.enum";
import { LanguageContractEnum } from "../enums/language-contract.enum";
import { AllotmentModel } from "../models/allotment.model";
import { CostItemsService } from "./cost-items.service";
import { ProposalModel } from "../models/proposal.model";
import { RegistryService } from "./registry.service";
import { RegistrySendRequestDto } from "../dtos/registry-send-request.dto";
import { ConfigService } from "@nestjs/config";
import { EnviromentVariablesEnum } from "../../../shared/enums/enviroment.variables.enum";
import { ProjectService } from "./project.service";
import { AgreementInterfaceWithId } from "../interfaces/agreement.interface";
import { MongoClient, ObjectId } from 'mongodb';
import { LacchainModel } from "../models/blockchain/lacchain.model";
import { MyBidModel } from "../models/database/bid.model";
import { BidHistoryModel } from "../models/database/bid_history.model";
import { ItemsModel } from "../models/database/items.model";
import { SHA256, enc } from "crypto-js";

const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

@Injectable()
export class BidService {
  private readonly _logger = new Logger(BidService.name);

  constructor(
    private readonly _bidsRepository: BidRepository,
    private readonly _userRepository: UserRepository,
    private readonly _allotmentRepository: AllotmentRepository,
    private readonly _notificationService: NotificationService,
    private readonly _agreementService: AgreementService,
    private readonly _fileRepository: FileRepository,
    private readonly _supplierService: SupplierService,
    private readonly _proposalRepository: ProposalRepository,
    private readonly _contractRepository: ContractRepository,
    private readonly _modelContractRepository: ModelContractRepository,
    private readonly _associationRepository: AssociationRepository,
    private readonly _supplierRepository: SupplierRepository,
    private readonly _plataformRepository: PlataformRepository,
    private readonly _costItemsService: CostItemsService,
    private readonly _registryService: RegistryService,
    private readonly _configService: ConfigService,
    private readonly _projectService: ProjectService,
    private _lacchainModel: LacchainModel,
    private _myBidModel: MyBidModel,
    private _bidHistoryModel: BidHistoryModel,
    private readonly itemsModel: ItemsModel
  ) { }

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this._logger.debug("rotine status bids");

    const allBids: MutableObject<BidModel>[] = await this._bidsRepository.listWithoutConcluded();

    for (let bid of allBids) {
      if (
        bid.status === BidStatusEnum.open ||
        bid.status === BidStatusEnum.reopened ||
        bid.status === BidStatusEnum.tiebreaker
      ) {
        const date = new Date(bid.end_at);
        const now = new Date();

        // date.setDate(date.getDate() + Number(bid.days_to_delivery || 0));

        if (date.getTime() < now.getTime()) {
          try {
            const proposal = await this._proposalRepository.listByBid(bid._id.toString());

            if (!proposal.length) {
              this._logger.debug("update to deserted " + bid._id);
              await this._bidsRepository.rotineStatus(bid._id, BidStatusEnum.deserted);
              await this._allotmentRepository.updateStatusByIds(
                bid.add_allotment.map(ele => ele._id.toString()),
                AllotmentStatusEnum.deserto
              );
              continue;
            }

            this._logger.debug("update to analysis " + bid._id);
            await this._bidsRepository.rotineStatus(bid._id, BidStatusEnum.analysis);
            await this._allotmentRepository.updateStatusByIds(
              bid.add_allotment.map(ele => ele._id.toString()),
              AllotmentStatusEnum.emAnalise
            );
            continue;
          } catch (error) {
            this._logger.error("error update " + "bid._id" + " " + error);
            continue;
          }
        }
      }
      if (bid.status === BidStatusEnum.released) {
        const date = new Date(bid.start_at);
        const now = new Date();
        if (date.getTime() < now.getTime()) {
          try {
            this._logger.debug("update to open " + bid._id);
            await this._bidsRepository.rotineStatus(bid._id, BidStatusEnum.open);
            await this._allotmentRepository.updateStatusByIds(
              bid.add_allotment.map(ele => ele._id.toString()),
              AllotmentStatusEnum.aberta
            );
            continue;
          } catch (error) {
            this._logger.error("error update " + "bid._id" + " " + error);
            continue;
          }
        }
        const targetDate = bid.end_at;
        const currentDate = new Date();

        const parsedTargetDate = parseISO(targetDate);

        const isTargetDateAfterCurrent = isAfter(parsedTargetDate, currentDate);

        if (!isTargetDateAfterCurrent) {
          const proposals = await this._proposalRepository.listByBid(bid._id);
          if (proposals.length === 0) {
            await this._bidsRepository.changeStatus(bid._id, { status: BidStatusEnum["deserted"] });
            await this._allotmentRepository.updateStatusByIds(
              bid.add_allotment.map(ele => ele._id.toString()),
              AllotmentStatusEnum.deserto
            );
          }
        }
      }
    }
  }

  async register(token: string, associationId: string, dto: any, files: Array<Express.Multer.File>): Promise<BidModel> {
    const count = await this._bidsRepository.count();

    if (!count) {
      const numberOfBids = await this._bidsRepository.list();
      
      dto.bid_count = (Number(numberOfBids.length) + 1)?.toString();
      
    } else {
      dto.bid_count = (Number(count) + 1)?.toString();
    }

    const association = await this._userRepository.getById(associationId);
    const agreement = await this._agreementService.findById(dto.agreementId);

    if (!agreement) throw new BadRequestException("Convênio não encontrado!");
    if (!association) throw new BadRequestException("Associação nao encontrada!");
    dto.agreement = agreement;
    dto.association = association;
      
    const now = new Date();

    if (dto.editalFile) {
      dto.editalFile = this._fileRepository.upload(
        `${dto.bid_count}-${now.getFullYear()}-edital-${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}.pdf`,
        dto.editalFile
      );
    }

    const aditionalFiles: string[] = [];

    files.forEach(file => {
      aditionalFiles.push(file.buffer.toString("base64"));
    });

    dto.additionalDocuments = [];

    aditionalFiles.forEach((item, index) => {
      dto.additionalDocuments.push(
        this._fileRepository.upload(
          `${index}-${dto.bid_count}-${now.getFullYear()}-arquivo-complementar-${now.getFullYear()}-${now.getMonth() + 1
          }-${now.getDate()}.pdf`,
          item
        )
      );
    });

    let newArray = [];
    for (let i = 0; i < dto.add_allotment.length; i++) {
      dto.add_allotment[i].files = this._fileRepository.upload(
        `product_${new Date().getTime()}.pdf`,
        dto.add_allotment[i].files
      );
      dto.add_allotment[i].status = AllotmentStatusEnum.rascunho;
      newArray.push(await this._allotmentRepository.register(dto.add_allotment[i]));
    }

    dto.add_allotment = newArray;

    let newId;

    if (!dto.add_allotment) throw new BadRequestException("Não foi possivel cadastrar essa licitação!");    
    dto._id = new ObjectId();
    const result = await this._bidsRepository.register(dto);
    if (!result) {
      throw new BadRequestException("Não foi possivel cadastrar essa licitação!");
    }

    // Lacchain
    // The Bid was registered successfully. Register on Lacchain  
      
    newId = new ObjectId();
    const bidHistoryId = newId.toHexString()    

    const data = await this.createData(dto)    
    const hash = await this.calculateHash(data);
    const txHash = await this._lacchainModel.setBidData(token, bidHistoryId, hash);    
    await this._bidHistoryModel.insert(bidHistoryId, data, txHash);

    const obj = {      
      title: `Convite para licitação de número ${dto.bid_count}`,      
      description: dto.description,      
      from_user: associationId,
      to_user: ["aaa"],
      deleted: false,
      bid_id: result._id,
    };
    await this._notificationService.registerForRealese(
      result.agreement.manager?._id.toString(),
      result.association?._id.toString(),
      result._id.toString()
    );
    
    if (dto.modality === BidModalityEnum.openClosed) {
      const listSuppliers = await this._supplierService.list();
     
      const suppliers = listSuppliers.filter(item => !item.blocked).map(ele => ele._id?.toString() as string);
      for (let j = 0; j < suppliers.length; j++) {
        await this._notificationService.registerByBidCreation(suppliers[j], obj);
      }
      return result;
    } else {
      if (result.invited_suppliers.length)
        for (let j = 0; j < result.invited_suppliers.length; j++) {
          await this._notificationService.registerByBidCreation(result.invited_suppliers[j]?._id, obj);
        }
      
      return result;
    }
  }

  async findAgreementByReviewerOrManagerId(_id: string): Promise<BidModel[]> {
    const agreements = await this._agreementService.findAgreementByReviewerOrManagerId(_id)
    const results: BidModel[] = []
    for(let i = 0; i < agreements.length; i++) {
     const bid =  await this._bidsRepository.getByAgreementId(agreements[i]._id)
     if(bid) results.push(...bid)
     
    }
    return results
  }

  async findAgreementByReviewerId(_id: string): Promise<BidModel[] | void> {
    const projects = await this._projectService.findAllProjectsByReviewerId(_id)
    const agreement_list: AgreementInterfaceWithId[] =[]
     for(let i = 0; i < projects.length; i++) {
     const agreement =  await this._agreementService.findAgreementByProjectrId(projects[i]._id.toString())
     if(agreement) agreement_list.push(agreement)
    }
    const results: BidModel[] = []
    for(let i = 0; i < agreement_list.length; i++) {
      const bid =  await this._bidsRepository.getByAgreementId(agreement_list[i]._id.toString())
      if(bid) results.push(...bid)
     }
    return results
  }

  async findAgreementByViewerId(_id: string): Promise<BidModel[] | void> {
    const projects = await this._projectService.findAllProjectsByViewerId(_id)
    const agreement_list: AgreementInterfaceWithId[] =[]
     for(let i = 0; i < projects.length; i++) {
     const agreement =  await this._agreementService.findAgreementByProjectrId(projects[i]._id.toString())
     if(agreement) agreement_list.push(agreement)
    }
    const results: BidModel[] = []
    for(let i = 0; i < agreement_list.length; i++) {
      const bid =  await this._bidsRepository.getByAgreementId(agreement_list[i]._id.toString())
      if(bid) results.push(...bid)
     }
    return results
  }
  async findAgreementByProjectManagerId(_id: string): Promise<BidModel[] | void> {
    const projects = await this._projectService.findAllProjectsByManagerId(_id)
    const agreement_list: AgreementInterfaceWithId[] =[]
     for(let i = 0; i < projects.length; i++) {
     const agreement =  await this._agreementService.findAgreementByProjectrId(projects[i]._id.toString())
     if(agreement) agreement_list.push(agreement)
    }
    const results: BidModel[] = []
    for(let i = 0; i < agreement_list.length; i++) {
      const bid =  await this._bidsRepository.getByAgreementId(agreement_list[i]._id.toString())
      
      if(bid) results.push(...bid)
     }
    return results
  }

  async findAgreementByManagerId(_id: string): Promise<BidModel[]> {
    const agreements = await this._agreementService.findAgreementByManagerId(_id)
    const bd =  await this._bidsRepository.list()
    const results: BidModel[] = []
    for(let i = 0; i < agreements.length; i++) {
     const bid =  await this._bidsRepository.getByAgreementId(agreements[i]._id.toString());
     if(bid) results.push(...bid)
     
    }
    return results
  }

 

  async list(): Promise<BidModel[]> {
    const result = await this._bidsRepository.list();

    return result;
  }

  async listAllotmentBydBidId(_id: string): Promise<any> {
    const result = await this._bidsRepository.listAllotmentByBidId(_id);
    if (!result) {
      throw new BadRequestException("Licitação não encontrada!");
    }
    return result;
  }

  async listByAssociation(userId: string): Promise<any> {
    const user = await this._userRepository.getById(userId);
    const list = await this._bidsRepository.list();
    let verify: any = [];
    for (let item of list) {
      if (item.association?.association._id.toString() === user.association?._id.toString()) {
        verify.push(item);
      }
    }
    return verify;
  }

  async update(_id: string, dto: BidUpdateDto): Promise<BidModel> {
    const item = await this._bidsRepository.getById(_id);
    if (!item) {
      throw new BadRequestException("Não foi possivel atualizar a licitação!");
    }

    const agreement = await this._agreementService.findById(dto.agreementId);
    if (!agreement) throw new BadRequestException("Convênio não encontrado!");
    dto.agreement = agreement;

    
    let newArray = [];    
    for (let i = 0; i < dto.add_allotment.length; i++) {
      if (dto.add_allotment[i]?._id) {
        const old = await this._allotmentRepository.listById(dto.add_allotment[i]?._id);
        if (old) {
          newArray.push(old);
          continue;
        }
      }
      dto.add_allotment[i].files = this._fileRepository.upload(
        `product_${new Date().getTime()}.pdf`,
        dto.add_allotment[i].files
      );
      dto.add_allotment[i].status = AllotmentStatusEnum.rascunho;
      newArray.push(await this._allotmentRepository.register(dto.add_allotment[i]));
    }
         
    if(dto.bid_type == "individualPrice"){      
      for(let i =0;i<dto.add_allotment.length;i++){       
        await this._allotmentRepository.editUpdate(dto.add_allotment[i]._id, dto.add_allotment[i])          
      }
    }

    dto.add_allotment = newArray;      

    
    const result = await this._bidsRepository.update(_id, dto);
    return result;
  }

  async addProposal(_id: string, dto: BidAddProposalDto): Promise<BidModel> {
    const item = await this._bidsRepository.getById(_id);
    if (!item) {
      throw new BadRequestException("Não foi possivel atualizar a adicionar proposta na licitação!");
    }
    const result = await this._bidsRepository.addProposal(_id, dto);
    return result;
  }

  async updateStatus(token: string, userId: string, _id: string, dto: BidUpdateStatusRequestDto): Promise<BidModel | any> {

    const user = await this._userRepository.getById(userId);

    if (!user)
      throw new BadRequestException("Usuário não encontrado!");

    if (user.type === "administrador")
      dto.proofreader = user;

    if (dto.status === "released") {
       
      const addDate = new Date();
      const nextDay = new Date(addDate.setDate(addDate.getDate() + 1)).toISOString().slice(0, 10);
      let bid = await this._bidsRepository.getBidById(_id);            
      const configs = await this._plataformRepository.findOne();

      if (!configs)
        throw new BadRequestException("Não foi possivel encontrar as configurações da plataforma!");
      
      const { start_at } = await this._bidsRepository.addStartHour(_id, `${nextDay}T${configs.start_at}`);
      const slicedData = start_at.slice(0, 10);
      const unix = new Date(slicedData);
      let unixTimeStamp = unix.setDate(unix.getDate() + Number(bid.end_at));
      let data = new Date(unixTimeStamp);
      let endDate = data.toISOString().slice(0, 10);
      
      await this._bidsRepository.addEndHour(_id, `${endDate}T${configs.end_at}`);
      const result = await this._bidsRepository.updateStatus(_id, dto);
      
      await this._allotmentRepository.updateStatusByIds(
        result.add_allotment.map(el => el._id.toString()),
        AllotmentStatusEnum.lancada
      );
      
      const registry = new RegistrySendRequestDto(
        Number(bid.bid_count),
        bid.description,
        bid.agreement,
        bid.classification,
        bid.start_at,
        bid.end_at,
        bid.days_to_tiebreaker,
        bid.days_to_delivery,
        bid.local_to_delivery,
        bid.bid_type,
        bid.modality,
        bid.aditional_site,
        bid.add_allotment,
        bid.invited_suppliers,
        bid.bid_count,
        bid.state,
        bid.city,
        bid.status,
        bid.association,
        bid.createdAt,
      );      
            
      bid.status = dto.status;
            
      // Lacchain
      const newId = new ObjectId();
      const bidHistoryId = newId.toHexString()    

      const newData = await this.createData(bid)
      const hash = await this.calculateHash(newData);        
      const txHash = await this._lacchainModel.setBidData(token, bidHistoryId, hash);    
      await this._bidHistoryModel.insert(bidHistoryId, newData, txHash); 


      /*
      const sendToBlockchain = this._configService.get<boolean>(EnviromentVariablesEnum.BLOCKCHAIN_ACTIVE);      
      if (sendToBlockchain) {
        const hash = await this._registryService.send(registry);
        this._logger.debug(`bid sended to blockchain, hash ${hash}`);
      }
      */

      return result;
    }

    if (dto.allomentStatus) {
         
      const bid = await this._bidsRepository.getById(_id);      

      await this._allotmentRepository.updateStatusByIds(
        bid.add_allotment.map(el => el._id.toString()),
        dto.allomentStatus
      );
    }

    const result = await this._bidsRepository.updateStatus(_id, dto);

    const bid = await this._bidsRepository.getBidById(_id);
    bid.status = dto.status;
    
    // Lacchain
    const newId = new ObjectId();
    const bidHistoryId = newId.toHexString()    

    const newData = await this.createData(bid)
    const hash = await this.calculateHash(newData);        
    const txHash = await this._lacchainModel.setBidData(token, bidHistoryId, hash);    
    await this._bidHistoryModel.insert(bidHistoryId, newData, txHash);

    return result;
  }

  async updateOpenDate(dto: BidDateUpdateDto): Promise<BidModel | any> {
    const awaitingBids = await this._bidsRepository.listBidByStatus(BidStatusEnum.awaiting);
    const returnArray = [];
    for (let i = 0; i < awaitingBids.length; i++) {
      // const addDate= new Date()
      // const nextDay = new Date(addDate.setDate(addDate.getDate() + 1)).toISOString().slice(0,10)
      if (awaitingBids[i].start_at) {
        await this._bidsRepository.addStartHour(awaitingBids[i]._id, `${awaitingBids[i].start_at}-T:${dto.start_at}`);
      }

      if (awaitingBids[i].end_at) {
        const unix = new Date(awaitingBids[i].start_at);
        let unixTimeStamp = unix.setDate(unix.getDate() + Number(awaitingBids[i].days_to_delivery));
        let data = new Date(unixTimeStamp);
        let endDate = data.toISOString().slice(0, 10);

        returnArray.push(await this._bidsRepository.addEndHour(awaitingBids[i]._id, `${endDate}-T:${dto.end_at}`));
      }
    }

    return returnArray;
  }

  async getById(_id: string): Promise<BidModel> {
    const result = await this._bidsRepository.getById(_id);

    for (let i = 0; i < result.add_allotment.length; i++) {
      for (let j = 0; j < result.add_allotment[i].proposals.length; j++) {
        result.add_allotment[i].proposals[j].proposal.proposedBy = await this._userRepository.getById(
          result.add_allotment[i].proposals[j].proposal.proposedBy._id
        );
        const { reviewer_accept, acceptedRevisorAt } = await this._proposalRepository.getById(
          result.add_allotment[i].proposals[j].proposal._id
        );
        result.add_allotment[i].proposals[j].proposal.reviewer_accept = reviewer_accept;
        result.add_allotment[i].proposals[j].proposal.acceptedRevisorAt = acceptedRevisorAt;
      }
    }

    if (!result) {
      throw new BadRequestException("Licitação não encontrada!");
    }
    return result;
  }

  async deleteById(_id: string) {
    const result = await this._bidsRepository.deleteById(_id);
    if (!result) {
      throw new BadRequestException("Licitação não encontrada!");
    }
    return result;
  }

  async downloadFile(id: string, type: string): Promise<any> {
    const item = await this._bidsRepository.getById(id);
    let allFiles = [];
    if (!item) {
      throw new BadRequestException("Licitação não encontrada!");
    }

    for (let file of item.additionalDocuments) {
      const result = await this._fileRepository.download(file);
      allFiles.push({ result });
      if (!result) {
        throw new BadRequestException("Arquivo não encontrado!");
      }
    }

    return allFiles;
  }

  async listForSupplier(userId: string): Promise<any> {
    const user = await this._userRepository.getByIdPopulate(userId);
    if (user.type === UserTypeEnum.associacao) {
      const list = await this._bidsRepository.listForSupplier(user.association._id);

      return list;
    } else {
      // @ts-ignore
      const supplier = await this._supplierService.listById(user.supplier._id);

      if (!supplier) {
        throw new BadRequestException("Fornecedor não encontrado!");
      }
      const list = await this._bidsRepository.listForSupplier(userId);

      return list;
    }
  }

  async listForProposalSupplier(userId: string): Promise<any> {
    const user = await this._userRepository.getByIdPopulate(userId);
    //@ts-ignore
    if (user.supplier) {
      const supplier = await this._supplierService.listById(user.supplier._id);

      if (!supplier) {
        throw new BadRequestException("Fornecedor não encontrado!");
      }
      const listProposal = await this._proposalRepository.listProposalByUserSupplier(supplier._id);

      // listProposal.filter(ele => ele.proposedBy!.supplier?._id.toString() === supplier._id.toString() && !!ele.bid);
      let filteredList: ProposalModel[] = [];

      for (let index = 0; index < listProposal.length; index++) {
        const element = listProposal[index];
        if (element.proposedBy && element.proposedBy.supplier && element.proposedBy.supplier._id.toString() && !!element.bid) {
          filteredList.push(element);
        }
      }

      const list = await this._bidsRepository.listByIds(
        filteredList.map(ele => (ele.bid?._id ? ele.bid?._id.toString() : ele.bid))
      );
      return list;
    } else {
      throw new BadRequestException("Fornecedor não tem nenhuma licitação vinculada!");
    }

  }

  async sendTieBreaker(_id: string): Promise<any> {
    const item = await this._bidsRepository.getById(_id);
    if (!item) {
      throw new BadRequestException("Licitação não encontrada!");
    }

    if (item.status !== BidStatusEnum.analysis) {
      throw new BadRequestException("Licitação não está em analise!");
    }

    const proposalTie = await this._proposalRepository.listProposalByBidTie(_id);

    if (!proposalTie.length) {
      throw new BadRequestException("Não foi encontrado propostas para desempate!");
    }

    const suppliers = [...proposalTie.map(ele => ele.proposedBy.supplier), ...item.invited_suppliers];

    const uniqueSuppliers = suppliers.filter(
      (ele, index) => suppliers.findIndex(item => item._id.toString() === ele._id.toString()) === index
    );

    return await this._bidsRepository.sendTieBreaker(_id, uniqueSuppliers);
  }

  async bidPdfDownload(_id: string, type: string): Promise<text> {
    let propostas = [];
    let convidados = [];
    let lotes = [];

    const respondseBids = await this._bidsRepository.getById(_id);

    //const contract = await this._contractRepository.getById(_id);
    //console.log(contract);
    //const result = await this._contractRepository.checkAllsignatures(_id);
    const modelResponse = await this._modelContractRepository.getByClassification(type);

    const respondeAssociation = await this._associationRepository.getById(respondseBids.association.association._id);

    const responseProposal = await this._proposalRepository.listByBid(_id);

    if (responseProposal) {
      for (let p = 0; p < responseProposal.length; p++) {
        if (p == 0) {
          propostas.push(
            " empresa " +
            responseProposal[p].proposedBy.name +
            ", inscrita no cnpj " +
            responseProposal[p].proposedBy.document +
            " "
          );
        } else {
          propostas.push(
            ", empresa " +
            responseProposal[p].proposedBy.name +
            ", inscrita no cnpj " +
            responseProposal[p].proposedBy.document +
            " "
          );
        }
      }
    }

    if (respondseBids.invited_suppliers.length > 0) {
      // console.log('modal response', respondseBids.invited_suppliers)
      for (let q = 0; q < respondseBids.invited_suppliers.length; q++) {
        const suppliers = await this._supplierRepository.listById(respondseBids.invited_suppliers[q]._id.toString());

        if (q == 0) {
          convidados.push(" empresa " + suppliers.name + ", inscrita no cnpj " + suppliers.cpf + " ");
        } else {
          convidados.push(" , empresa " + suppliers.name + ", inscrita no cnpj " + suppliers.cpf + " ");
        }
      }
    }

    for (let l = 0; l < respondseBids.add_allotment.length; l++) {
      //lotes.push('' + respondseBids.add_allotment[l].allotment_name + ' ')
      //  for(let item of respondseBids.add_allotment[l].add_item){
      //   lotes['item'].push({name: item.item, group: item.group, quantity: item.quantity});
      //  }
      if (l == 0) {
        lotes.push("lote " + respondseBids.add_allotment[l].allotment_name + " ");
        for (let item of respondseBids.add_allotment[l].add_item) {
          lotes.push("item " + item.item + " grupo " + item.group + " quantidade " + item.quantity);
        }
      } else {
        lotes.push("lote " + respondseBids.add_allotment[l].allotment_name + " ");
        for (let item of respondseBids.add_allotment[l].add_item) {
          lotes.push("item " + item.item + " grupo " + item.group + " quantidade " + item.quantity);
        }
      }
    }

    //
    //const userResponde = await this._userRepository.getById(respondseBids.add_allotment[0]['proposedBy'].toString());
    //console.log(userResponde);
    //const forcedorResponse = await this._supplierRepository.listById(userResponde.supplier._id);
    //console.log(respondeAssociation);

    //Contrato e assinaturas
    let contractFormated = modelResponse.contract
      .replace(/\[association_name\]/g, "" + respondeAssociation.name + "")

      //.replace('[signature_association]', ' ' + respondeAssociation.legalRepresentative.name + ' ')
      //.replace('[supplier_signature]', ' ' + forcedorResponse.legal_representative.name + ' ')
      //FORNECEDOR
      //.replace('[supplier_name]', ' ' + forcedorResponse.name + ' ')
      //.replace('[supplier]', ' ' + forcedorResponse.name + ' ')
      //.replace('[supplier_id]', ' ' + forcedorResponse.cpf + ' ')
      //.replace('[supplier_zip_code]', ' ' + forcedorResponse.address.zipCode + '')
      //.replace('[supplier_address]', ' ' + forcedorResponse.address.publicPlace + ' ' + forcedorResponse.address.number + ' ' + forcedorResponse.address.neighborhood + ' ' + forcedorResponse.address.complement + ' ')
      //.replace('[supplier_municipality]', ' ' + forcedorResponse.address.city + ' ')
      //.replace('[supplier_state]', ' ' + forcedorResponse.address.state + ' ')
      //
      //.replace('[supplier_legal_representative_name]', ' ' + forcedorResponse.legal_representative.name + ' ')
      //.replace('[supplier_legal_representative_id]', ' ' + forcedorResponse.legal_representative.cpf + ' ')
      //.replace('[supplier_legal_representative_address]', ' ' + forcedorResponse.legal_representative.address.publicPlace + ' ' + forcedorResponse.legal_representative.address.number + ' ' + forcedorResponse.legal_representative.address.neighborhood + ' ' + forcedorResponse.legal_representative.address.complement + ' ')
      //.replace('[supplier_legal_representative_supplier_municipality]', ' ' + forcedorResponse.legal_representative.address.city + ' ')
      //.replace('[supplier_legal_representative_supplier_state]', ' ' + forcedorResponse.legal_representative.address.state + ' ')

      //DADOS ASSOCIAÇÃO

      .replace(/\[association_name\]/g, respondeAssociation.name)
      .replace(/\[association_id\]/g, "" + respondeAssociation.cnpj + " ")
      .replace(/\[association_zip_code\]/g, "" + respondeAssociation.address.zipCode + " ")
      .replace(
        /\[association_address\]/g,
        "" +
        respondeAssociation.address.publicPlace +
        " " +
        respondeAssociation.address.number +
        " " +
        respondeAssociation.address.neighborhood +
        " " +
        respondeAssociation.address.complement +
        " "
      )
      .replace(/\[association_municipality\]/g, "" + respondeAssociation.address.city + "")
      .replace(/\[association_state\]/g, "" + respondeAssociation.address.state + " ")
      .replace(/\[association_legal_representative_name\]/g, "" + respondeAssociation.legalRepresentative.name + " ")
      .replace(/\[association_legal_representative_id\]/g, "" + respondeAssociation.legalRepresentative.cpf + " ")
      .replace(
        /\[association_legal_representative_address\]/g,
        "" +
        respondeAssociation.legalRepresentative.address.publicPlace +
        " " +
        respondeAssociation.legalRepresentative.address.number +
        " " +
        respondeAssociation.legalRepresentative.address.neighborhood +
        " " +
        respondeAssociation.legalRepresentative.address.complement +
        " "
      )
      .replace(
        /\[association_legal_representative_supplier_municipality\]/g,
        "" + respondeAssociation.legalRepresentative.address.city + " "
      )
      .replace(
        /\[association_legal_representative_supplier_state\]/g,
        "" + respondeAssociation.legalRepresentative.address.state + " "
      )
      //

      .replace("[association_name]", "" + respondeAssociation.name + "")
      .replace("[association_id]", "" + respondeAssociation.cnpj + " ")
      .replace("[association_zip_code]", "" + respondeAssociation.address.zipCode + " ")
      .replace(
        "[association_address]",
        "" +
        respondeAssociation.address.publicPlace +
        " " +
        respondeAssociation.address.number +
        " " +
        respondeAssociation.address.neighborhood +
        " " +
        respondeAssociation.address.complement +
        " "
      )
      .replace("[association_municipality]", "" + respondeAssociation.address.city + "")
      .replace("[association_state]", "" + respondeAssociation.address.state + " ")
      .replace("[association_legal_representative_name]", "" + respondeAssociation.legalRepresentative.name + " ")
      .replace("[association_legal_representative_id]", "" + respondeAssociation.legalRepresentative.cpf + " ")
      .replace(
        "[association_legal_representative_address]",
        "" +
        respondeAssociation.legalRepresentative.address.publicPlace +
        " " +
        respondeAssociation.legalRepresentative.address.number +
        " " +
        respondeAssociation.legalRepresentative.address.neighborhood +
        " " +
        respondeAssociation.legalRepresentative.address.complement +
        " "
      )
      .replace(
        "[association_legal_representative_supplier_municipality]",
        "" + respondeAssociation.legalRepresentative.address.city + " "
      )
      .replace(
        "[association_legal_representative_supplier_state]",
        "" + respondeAssociation.legalRepresentative.address.state + " "
      )
      //
      ////CONVENIO
      .replace(/\[covenant_number\]/g, " " + respondseBids.agreement.register_number.toString() + " ")
      .replace(/\[covenant_object\]/g, " " + respondseBids.agreement.register_object.toString() + " ")
      .replace(/\[municipality_execution_covenant\]/g, " " + respondseBids.local_to_delivery.toString() + " ")

      //LICITACAO
      .replace(
        "[number/year_bidding]",
        " " + respondseBids.bid_count.toString() + "/" + moment(respondseBids.start_at).format("YYYY").toString()
      )
      .replace("[guest_supplier]", "" + convidados + " ")
      .replace("[proposed_list]", " " + propostas)
      //.replace('[winning_supplier]', ' ' + forcedorResponse.legal_representative.name + ' ')
      //.replace('[document_contract_date]', ' ' + moment(contract['createdAt']).format('dd/mm/YYYY').toString() + ' ')
      .replace("[document_minutes]", " " + moment(respondseBids.start_at).format("DD/MM/YYYY").toString())
      .replace("[document_notice_ date]", " " + moment(respondseBids.start_at).format("DD/MM/YYYY").toString())
      //lote é so nome do lote
      .replace("[batch_list]", "" + lotes + " ");

    return contractFormated;
  }

  async createDocument(
    _id: string,
    lang: string = LanguageContractEnum.english,
    type: ModelContractClassificationEnum
  ): Promise<any> {
    
    const modelContract = await this._modelContractRepository.getByContractAndLanguage(lang, type);
    
    if (!modelContract) throw new Error("Modelo de documento não encontrado");

    const content = fs.readFileSync(path.resolve("src/shared/documents", modelContract.contract), "binary");

    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const bid = await this._bidsRepository.getById(_id);

    const contractArray = await this._contractRepository.getByBidId(_id);

    const proposalArray = await this._proposalRepository.listByBid(_id);    

    const contract = contractArray ? contractArray[0] : null;
      
    let allotment: AllotmentModel[] = [];

    // contract.proposal_id.forEach(proposal => {
    //   proposal.allotment.forEach(allot => {
    //     allotment.push(allot);
    //   });
    // });

    bid.add_allotment.forEach(allot => {
      allotment.push(allot);
    });

    let listOfItems: any[] = [];    

    listOfItems = await this.costItensGet(allotment, proposalArray);

    const estimatedValue =
      contract?.value ||
      bid.agreement.workPlan?.reduce(
        (a, b) => a + b.product?.reduce((acc, curr) => acc + Number(curr.quantity) * curr.unitValue, 0),
        0
      ) ||
      0;
        
    let signature = "Assinado eletronicamente pela: ";
    let yes = "Sim";
    let no = "Não";
    switch (lang) {
      case LanguageContractEnum.english:
        signature = "Electronically signed by: ";
        yes = "Yes";
        no = "No";
        break;
      case LanguageContractEnum.spanish:
        signature = "Firmado electrónicamente por: ";
        yes = "Sí";
        no = "No";
        break;
      case LanguageContractEnum.portuguese:
        signature = "Assinado eletronicamente pela: ";
        yes = "Sim";
        no = "Não";
        break;
      case LanguageContractEnum.french:
        signature = "Signé électroniquement par: ";
        yes = "Oui";
        no = "Non";
        break;
      default:
        break;
    }

    const formatDateString = lang === LanguageContractEnum.english ? "MM/DD/YYYY" : "DD/MM/YYYY";

    let listOfBidPrices: any[] = [];
    if (proposalArray)
      proposalArray
        .sort((a, b) => Number(a?.total_value || 0) - Number(b?.total_value || 0))
        .forEach(proposal => {
          listOfBidPrices.push({
            lot: proposal.allotment.map(allot => allot.allotment_name).join(", "),
            rank: listOfBidPrices.length + 1,
            bidders_name: proposal.proposedBy.supplier.name || "",
            didders_id: proposal._id.toString(),
            bid_price: proposal?.total_value || 0,
            submited_at: moment(proposal.createdAt).format(formatDateString),
            accepted: proposal.association_accept && proposal.reviewer_accept ? yes : no,
            justification_for_rejection: proposal.refusedBecaused || "",
            awarded_at:
              proposal.association_accept && proposal.reviewer_accept
                ? moment(proposal.acceptedRevisorAt).format(formatDateString)
                : "",
            number_contract: contract.contract_number + "/" + moment(contract.createdAt).format("YYYY"),
          });
        });

    doc.render({
      process_description: bid.description,
      bid_number: bid.bid_count + "/" + moment(bid.start_at).format("YYYY"),
      name_project: contract?.contract_document || "",
      name_purchaser: bid.association.association.name,
      purchaser_country: bid.association.association.address.state,
      publication_date: moment(bid.createdAt).format(formatDateString),
      list_of_items: listOfItems,
      list_of_bid_prices: listOfBidPrices,
      bid_opening_date: moment(bid.start_at).format(formatDateString),
      email_purchaser: bid.association.email,
      deadline_date: moment(bid.end_at).format(formatDateString),
      website_url: bid.aditional_site || "Sem site adicional",
      day_contract: moment(bid.createdAt).format("DD"),
      month_contract: moment(bid.createdAt).format("MM"),
      year_contract: moment(bid.createdAt).format("YYYY"),
      date_contract: moment(bid.createdAt).format(formatDateString),
      number_contract: contract?.contract_number + "/" + moment(contract?.createdAt || bid.createdAt).format("YYYY"),
      adress_purchaser:
        bid.association.association.address.publicPlace +
        ", " +
        bid.association.association.address.number +
        ", " +
        bid.association.association.address.complement +
        ", " +
        bid.association.association.address.city +
        ", " +
        bid.association.association.address.state +
        ", " +
        bid.association.association.address.zipCode,
      name_legal_representative_purchaser: bid.association.association.legalRepresentative.name,
      name_supplier: contract?.supplier_id?.name || "Don't have supplier",
      supplier_country: contract?.supplier_id?.address.state || "Don't have supplier",
      adress_supplier: contract?.supplier_id
        ? contract?.supplier_id?.address.publicPlace +
        ", " +
        contract?.supplier_id?.address.number +
        ", " +
        contract?.supplier_id?.address.complement +
        ", " +
        contract?.supplier_id?.address.city +
        ", " +
        contract?.supplier_id?.address.state +
        ", " +
        contract?.supplier_id?.address.zipCode
        : "Don't have supplier",
      name_legal_representative_supplier: contract?.supplier_id?.legal_representative.name || "Don't have supplier",
      purchaser_cnpj: bid.association.association.cnpj,
      supplier_cnpj: contract?.supplier_id?.cpf || "Don't have supplier",
      delivery_place: bid.local_to_delivery,
      supplier_email: contract?.supplier_id?.name || "Don't have supplier",
      days_to_delivery: bid.days_to_delivery,
      date_to_delivery: moment().add(bid.days_to_delivery, "days").format(formatDateString),
      role_purchaser: "",
      role_supplier: "",
      contract_value: estimatedValue,
      batch_list_name: listOfItems.map(item => item.name).toString(),
      agreement_name: bid.agreement.register_number + "/" + bid.agreement.register_object,
      bid_status: bid.status,
      bid_concluded_date: bid.concludedAt ? moment(bid.concludedAt).format(formatDateString) : "",
      guest_suppliers: bid.invited_suppliers.map(supplier => supplier.name).toString(),
      winning_supplier: listOfBidPrices.length ? listOfBidPrices[0].bidders_name : "",
      estimated_value: listOfItems?.reduce((acc, item) => acc + Number(item?.total_value || 0), 0) || 0,
    });

    const buf = doc.getZip().generate({ type: "nodebuffer" });

    await fs.writeFileSync(path.resolve("src/shared/documents", "output.docx"), buf);

    await this.callPythonFile()
      .then(async () => {
        fs.unlinkSync(path.resolve("src/shared/documents", "output.docx"));

        return;
      })
      .catch(err => {
        console.log(err);
        throw new BadRequestException(
          "Erro ao converter o arquivo, verifique se o python está instalado e se o caminho está correto"
        );
      });
  }

  private async costItensGet(allotment: AllotmentModel[], proposal?: ProposalModel[]): Promise<any[]> {
        
    let listOfItems = [];
    for (let allot of allotment) {
      let el = proposal.find(proposal => proposal.allotment.find(all => all._id.toString() === allot._id.toString()));
      let price = 0;
      let quantity = 0;
      if (el) {
        price = +el?.total_value || 0;
        quantity = +el.allotment
          .map(all => all.quantity)
          .reduce((a, b) => Number(a) + Number(b), 0)
          .toFixed(2);
        price = +Number(price / quantity).toFixed(2);
      }      
      
      for (let item of allot.add_item) {             

        const costItems = await this.itemsModel.getByName(item.item);                

        listOfItems.push({          
          code: costItems.code,
          name: item.item,          
          classification: costItems?.group.segment || "Sem classificação",
          specification: item.specification || "Sem especificação",
          quantity: item.quantity,
          unit_measure: item.unitMeasure,
          place_to_delivery: allot.place_to_delivery,
          days_to_delivery: allot.days_to_delivery,
          price_unit: price,
          total_value: price * quantity,
        });
      }
    }

    return listOfItems;
  }

  private async callPythonFile() {
    return new Promise((resolve, reject): void => {
      if (!fs.existsSync(path.resolve("src/shared/documents", "output.docx"))) {
        reject("Arquivo não encontrado");
      }
      const py = platform === "win32" ? "python" : "python3";
      const soft = platform === "win32" ? "win32" : "linux";
      const python = spawn(py, [
        path.resolve("src/shared/documents", "convertPDF.py"),
        path.resolve("src/shared/documents", "output.docx"),
        path.resolve("src/shared/documents", "output.pdf"),
        soft,
      ]);
      python.stdout.on("data", data => {
        console.log(`stdout: ${data}`);
      });

      python.stderr.on("data", data => {
        console.error(`stderr: ${data}`);
      });

      python.on("close", code => {
        console.log(`child process exited with code ${code}`);
        if (code === 0) {
          return resolve(0);
        }
        return reject(1);
      });

      python.on("error", err => {
        console.error(err);
        reject(err);
      });
    });
  }

  async report() {
    const bids = await this._bidsRepository.list();

    const bidsByStatus = bids.reduce((acc, bid) => {
      if (!acc[bid.status]) {
        acc[bid.status] = [];
      }
      acc[bid.status].push(bid);
      return acc;
    }, {});

    const bidsByStatusArray = Object.keys(bidsByStatus).map(key => {
      return {
        status: key,
        quantity: bidsByStatus[key].length || 0,
        value: 0
      };
    });

    for await (let bid of bidsByStatusArray) {
      if (
        bid.status === BidStatusEnum.open ||
        bid.status === BidStatusEnum.tiebreaker ||
        bid.status === BidStatusEnum.reopened
      ) {
        const bids = bidsByStatus[bid.status];
        const proposals = await this._proposalRepository.listBiBidsIds(bids.map((bid: BidModel) => bid._id.toString()));
        bid["value"] =
          (proposals?.reduce((acc, proposal) => acc + +proposal.total_value, 0) || 0) / (proposals?.length || 1);
        continue;
      }

      if (bid.status === BidStatusEnum.completed) {
        const bids = bidsByStatus[bid.status];
        const contracts = await this._contractRepository.listByBidIds(bids.map((bid: BidModel) => bid._id.toString()));
        bid["value"] = contracts.reduce((acc, contract) => acc + +contract.value, 0) / contracts.length;
        continue;
      }

      const bids: BidModel[] = bidsByStatus[bid.status];
      bids.forEach(x => {
        bid["value"] =
          x.agreement.workPlan?.reduce(
            (acc, curr) =>
              acc + curr.product?.reduce((acc2, curr2) => acc2 + curr2.unitValue * Number(curr2.quantity), 0),
            0
          ) || 0;
      });
    }

    return bidsByStatusArray;
  }


  createData(dto){

    const data = {
      bidId: dto._id.toHexString(),      
      description: dto.description,
      agreement: dto.agreement._id.toHexString(),
      classification: dto.classification,
      bid_type: dto.bid_type,
      state: dto.state,
      city: dto.city,
      association: dto.association._id.toHexString(),
      status: dto.status
    } 

    return data;

  }

  calculateHash(data){
    return '0x'+SHA256(JSON.stringify(data)).toString(enc.Hex);        
  }


}

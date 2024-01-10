import { Document } from "mongoose";
import { ProjectInterface } from "../interfaces/project.interface";

export interface ProjectModel extends ProjectInterface, Document{
}
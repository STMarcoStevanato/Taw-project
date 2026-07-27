import { Request, Response, NextFunction } from "express";
import * as StudentService from "../services/students.service"

export const getAllStudents = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try{
        const students = await StudentService.getAllStudents();

        return res.status(200).json({
            status: "success",
            results: students.length,
            data: {students}
        });
    }catch (err){
        next(err);
    }
};
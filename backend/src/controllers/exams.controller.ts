import { Request, Response, NextFunction } from "express";
import * as examService from "../services/exams.service"; // adjust path as needed

export const createRecognizedExam = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = (req as any).user.user_id;
        const { mapping_id, exam_date, foreign_score } = req.body;

        const newExam = await examService.createRecognizedExam(
            userId,
            mapping_id,
            exam_date,
            foreign_score
        );

        return res.status(201).json({
            status: "success",
            data: newExam,
        });

    } catch (err) {
        next(err);
    }
};
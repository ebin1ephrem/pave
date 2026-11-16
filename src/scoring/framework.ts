import questions from "../../framework/questions.v1.json";
import { questionsSchema, vpafSchema, type QuestionBank, type Vpaf } from "../../framework/schema";
import vpaf from "../../framework/vpaf.v1.json";

/** The framework version every checkpoint is scored on and stamped with. */
export const VPAF: Vpaf = vpafSchema.parse(vpaf);
export const QUESTIONS: QuestionBank = questionsSchema.parse(questions);
export const FRAMEWORK_VERSION = VPAF.version;

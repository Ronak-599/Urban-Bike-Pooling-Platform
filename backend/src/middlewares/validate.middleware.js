import { ZodError } from 'zod';
import { BadRequestError } from '../errors/app.error.js';
export const validateRequest = (schema) => {
    return async (req, _res, next) => {
        try {
            if (schema.body) {
                req.body = await schema.body.parseAsync(req.body);
            }
            if (schema.query) {
                req.query = await schema.query.parseAsync(req.query);
            }
            if (schema.params) {
                req.params = await schema.params.parseAsync(req.params);
            }
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const issues = error.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                next(new BadRequestError('Validation Error', issues));
            }
            else {
                next(error);
            }
        }
    };
};

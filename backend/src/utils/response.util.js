export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};
export const sendCreated = (res, data, message = 'Resource Created Successfully') => {
    return sendSuccess(res, data, message, 201);
};
export const sendPaginated = (res, data, total, page, limit, message = 'Data retrieved successfully') => {
    return res.status(200).json({
        success: true,
        message,
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
        },
    });
};

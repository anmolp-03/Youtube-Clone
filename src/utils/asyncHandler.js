// const var = (fn.) => { () => {} }

const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req,res,next).catch((err) => next(err)))
    }
}

export { asyncHandler }

// It's a higher-order function: It takes another function (requestHandler) as an argument.  
// This requestHandler is the actual asynchronous function that will handle a request 
// (e.g., fetching data from a database).

// return (req, res, next) => { ... }:   This is the function that will be used as the Express route handler. 
// It takes the standard req (request), res (response), and next (middleware) arguments